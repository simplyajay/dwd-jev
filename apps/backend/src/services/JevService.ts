import type {
  AuditAction,
  CreateJevInput,
  Jev,
  JevListItem,
  JevRevision,
  JevSnapshot,
  PaginatedResult,
} from "@dwd-jev/shared";
import { NotFoundError } from "../errors/AppError.js";
import { inTransaction, type Tx } from "../lib/transaction.js";
import type { IAuditLogRepository } from "../repositories/AuditLogRepository.js";
import type {
  DateRange,
  IJevRepository,
  JevListItemRow,
  JevWithRelations,
} from "../repositories/JevRepository.js";
import type {
  IJevRevisionRepository,
  JevRevisionRow,
} from "../repositories/JevRevisionRepository.js";
import type { UserService } from "./UserService.js";
import { toDateOnly, toDateOnlyOrNull } from "../utils/dateOnly.js";
import { buildPaginatedResult, type Pagination } from "../utils/pagination.js";
import { toUserRefWithPosition } from "../utils/userRef.js";

const formatJev = ({
  createdByUser,
  lastUpdatedByUser,
  ...jev
}: JevWithRelations): Jev => ({
  ...jev,
  createdBy: toUserRefWithPosition(createdByUser),
  lastUpdatedBy: toUserRefWithPosition(lastUpdatedByUser),
  jevDate: toDateOnly(jev.jevDate),
  dvDate: toDateOnlyOrNull(jev.dvDate),
  adaDate: toDateOnlyOrNull(jev.adaDate),
  checkDate: toDateOnlyOrNull(jev.checkDate),
  supportingDocumentEntries: jev.supportingDocumentEntries.map((doc) => ({
    ...doc,
    documentDate: toDateOnly(doc.documentDate),
  })),
});

const toJevSnapshot = ({
  id,
  createdAt,
  createdBy,
  lastUpdatedAt,
  lastUpdatedBy,
  deletedAt,
  deletedBy,
  ...snapshot
}: Jev): JevSnapshot => snapshot;

// The snapshots were written from toJevSnapshot, so they're already in this shape.
const formatJevRevision = ({
  updatedByUser,
  beforeData,
  afterData,
  ...revision
}: JevRevisionRow): JevRevision => ({
  ...revision,
  beforeData: beforeData as unknown as JevSnapshot | null,
  afterData: afterData as unknown as JevSnapshot,
  updatedBy: toUserRefWithPosition(updatedByUser),
});

const formatJevListItem = (item: JevListItemRow): JevListItem => ({
  ...item,
  jevDate: toDateOnly(item.jevDate),
});

// month=0 means the whole year; otherwise 1-indexed (1=January).
const monthDateRange = (year: number, month: number): DateRange => {
  if (month === 0) {
    return {
      startDate: new Date(Date.UTC(year, 0, 1)),
      endDate: new Date(Date.UTC(year, 11, 31)),
    };
  }
  // Day 0 of the next month is the last day of the target month.
  return {
    startDate: new Date(Date.UTC(year, month - 1, 1)),
    endDate: new Date(Date.UTC(year, month, 0)),
  };
};

const civilDateRange = (startDate: string, endDate: string): DateRange => ({
  startDate: new Date(`${startDate}T00:00:00.000Z`),
  endDate: new Date(`${endDate}T00:00:00.000Z`),
});

export class JevService {
  constructor(
    private readonly jevRepository: IJevRepository,
    private readonly jevRevisionRepository: IJevRevisionRepository,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly userService: UserService,
  ) {}

  private logJev(
    action: AuditAction,
    documentId: string,
    description: string,
    actorId: string,
    tx: Tx,
  ): Promise<void> {
    return this.auditLogRepository.create(
      { documentType: "jev", documentId, action, description, actorId },
      tx,
    );
  }

  createJev(input: CreateJevInput, createdBy: string): Promise<Jev> {
    return inTransaction(async (tx) => {
      const jev = formatJev(await this.jevRepository.create(input, createdBy, tx));
      const revision = await this.jevRevisionRepository.create(
        {
          jevId: jev.id,
          beforeData: null,
          afterData: toJevSnapshot(jev),
          updatedBy: createdBy,
        },
        tx,
      );
      await this.logJev(
        "create",
        revision.id,
        `Created JEV ${jev.jevNumber}`,
        createdBy,
        tx,
      );
      return jev;
    });
  }

  async getJevById(id: string, includeDeleted = false): Promise<Jev> {
    const jev = await this.jevRepository.findById(id, { includeDeleted });
    if (!jev) {
      throw new NotFoundError("JEV not found.");
    }
    return formatJev(jev);
  }

  async getJevRevision(id: string): Promise<JevRevision> {
    const revision = await this.jevRevisionRepository.findById(id);
    if (!revision) {
      throw new NotFoundError("JEV revision not found.");
    }
    return formatJevRevision(revision);
  }

  // The row lock serializes concurrent updates and deletes of the same JEV.
  updateJev(id: string, input: CreateJevInput, updatedBy: string): Promise<Jev> {
    return inTransaction(async (tx) => {
      const locked = await this.jevRepository.lockActive(id, tx);
      const before = locked
        ? await this.jevRepository.findById(id, { client: tx })
        : null;
      if (!before) throw new NotFoundError("JEV not found.");

      const after = formatJev(await this.jevRepository.update(id, input, updatedBy, tx));
      const revision = await this.jevRevisionRepository.create(
        {
          jevId: id,
          beforeData: toJevSnapshot(formatJev(before)),
          afterData: toJevSnapshot(after),
          updatedBy,
        },
        tx,
      );
      const description =
        before.jevNumber === after.jevNumber
          ? `Updated JEV ${after.jevNumber}`
          : `Updated JEV ${after.jevNumber} (was ${before.jevNumber})`;
      await this.logJev("update", revision.id, description, updatedBy, tx);
      return after;
    });
  }

  // Checks the password before taking the lock, so bcrypt doesn't hold it.
  async deleteJev(id: string, deletedBy: string, password: string): Promise<void> {
    await this.userService.confirmPassword(deletedBy, password);

    await inTransaction(async (tx) => {
      if (!(await this.jevRepository.lockActive(id, tx))) {
        throw new NotFoundError("JEV not found.");
      }
      const jev = await this.jevRepository.softDelete(id, deletedBy, tx);
      await this.logJev("delete", id, `Deleted JEV ${jev.jevNumber}`, deletedBy, tx);
    });
  }

  async getJevsByMonth(
    year: number,
    month: number,
    pagination: Pagination,
  ): Promise<PaginatedResult<JevListItem>> {
    const { items, total } = await this.jevRepository.findMany(
      monthDateRange(year, month),
      pagination,
    );

    return buildPaginatedResult(items.map(formatJevListItem), total, pagination);
  }

  async getJevsByDateRange(
    startDate: string,
    endDate: string,
    pagination: Pagination,
    searchKeyword?: string,
  ): Promise<PaginatedResult<JevListItem>> {
    const { items, total } = await this.jevRepository.findMany(
      civilDateRange(startDate, endDate),
      pagination,
      searchKeyword,
    );
    return buildPaginatedResult(items.map(formatJevListItem), total, pagination);
  }
}
