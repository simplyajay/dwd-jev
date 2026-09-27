import type { CreateJevInput, Jev, JevListItem, PaginatedResult } from "@dwd-jev/shared";
import { NotFoundError } from "../errors/AppError.js";
import type {
  DateRange,
  IJevRepository,
  JevListItemRow,
  JevWithRelations,
  Pagination,
} from "../repositories/JevRepository.js";
import { toDateOnly, toDateOnlyOrNull } from "../utils/dateOnly.js";

const formatJev = (jev: JevWithRelations): Jev => ({
  ...jev,
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
  constructor(private readonly jevRepository: IJevRepository) {}

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

  async updateJev(id: string, input: CreateJevInput, updatedBy: string): Promise<Jev> {
    const jev = await this.jevRepository.update(id, input, updatedBy);
    if (!jev) {
      throw new NotFoundError("JEV not found.");
    }
    return formatJev(jev);
  }

  async deleteJev(id: string, deletedBy: string): Promise<void> {
    const jev = await this.jevRepository.softDelete(id, deletedBy);
    if (!jev) {
      throw new NotFoundError("JEV not found.");
    }
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
