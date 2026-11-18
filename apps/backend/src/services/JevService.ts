import type {
  CreateJevInput,
  Jev,
  JevListItem,
  JevUserRef,
  PaginatedResult,
} from "@dwd-jev/shared";
import { NotFoundError } from "../errors/AppError.js";
import { inTransaction } from "../lib/transaction.js";
import type {
  DateRange,
  IJevRepository,
  JevListItemRow,
  JevWithRelations,
  Pagination,
} from "../repositories/JevRepository.js";
import type { IJevRevisionRepository } from "../repositories/JevRevisionRepository.js";
import type { UserService } from "./UserService.js";
import { toDateOnly, toDateOnlyOrNull } from "../utils/dateOnly.js";
import { toUserRef } from "../utils/userRef.js";

const toJevUserRef = (user: JevWithRelations["createdByUser"]): JevUserRef => ({
  ...toUserRef(user),
  position: user.position,
});

const formatJev = ({
  createdByUser,
  lastUpdatedByUser,
  ...jev
}: JevWithRelations): Jev => ({
  ...jev,
  createdBy: toJevUserRef(createdByUser),
  lastUpdatedBy: toJevUserRef(lastUpdatedByUser),
  jevDate: toDateOnly(jev.jevDate),
  dvDate: toDateOnlyOrNull(jev.dvDate),
  adaDate: toDateOnlyOrNull(jev.adaDate),
  checkDate: toDateOnlyOrNull(jev.checkDate),
  supportingDocumentEntries: jev.supportingDocumentEntries.map((doc) => ({
    ...doc,
    documentDate: toDateOnly(doc.documentDate),
  })),
});

const formatJevListItem = (item: JevListItemRow): JevListItem => ({
  ...item,
  jevDate: toDateOnly(item.jevDate),
});

const buildPaginatedResult = <T>(
  items: T[],
  total: number,
  pagination: Pagination,
): PaginatedResult<T> => {
  const t = Math.ceil(total / pagination.pageSize);

  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: t === 0 ? 1 : t,
  };
};

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
    private readonly userService: UserService,
  ) {}

  async createJev(input: CreateJevInput, createdBy: string): Promise<Jev> {
    const jev = await this.jevRepository.create(input, createdBy);
    return formatJev(jev);
  }

  async getJevById(id: string): Promise<Jev> {
    const jev = await this.jevRepository.findById(id);
    if (!jev) {
      throw new NotFoundError("JEV not found.");
    }
    return formatJev(jev);
  }

  // The row lock serializes concurrent updates and deletes of the same JEV.
  updateJev(id: string, input: CreateJevInput, updatedBy: string): Promise<Jev> {
    return inTransaction(async (tx) => {
      const locked = await this.jevRepository.lockActive(id, tx);
      const before = locked ? await this.jevRepository.findById(id, tx) : null;
      if (!before) throw new NotFoundError("JEV not found.");

      const after = formatJev(await this.jevRepository.update(id, input, updatedBy, tx));
      await this.jevRevisionRepository.create(
        { jevId: id, beforeData: formatJev(before), afterData: after, updatedBy },
        tx,
      );
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
      await this.jevRepository.softDelete(id, deletedBy, tx);
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
