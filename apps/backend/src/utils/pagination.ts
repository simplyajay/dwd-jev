import type { PaginatedResult } from "@dwd-jev/shared";

export interface Pagination {
  page: number;
  pageSize: number;
}

export const buildPaginatedResult = <T>(
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
