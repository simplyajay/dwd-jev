import type { JevByMonthInput } from "@dwd-jev/shared";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const jevQueries = {
  /** Prefix of every JEV query, for invalidation. */
  all: ["jevs"] as const,
  byMonth: (input: JevByMonthInput) =>
    queryOptions({
      queryKey: [...jevQueries.all, "by-month", input],
      queryFn: () => api.jevs.listByMonth(input),
      placeholderData: keepPreviousData,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...jevQueries.all, "detail", id],
      queryFn: () => api.jevs.get(id),
    }),
};
