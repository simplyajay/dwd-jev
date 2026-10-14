import type { JevByMonthInput } from "@dwd-jev/shared";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const jevQueries = {
  byMonth: (input: JevByMonthInput) =>
    queryOptions({
      queryKey: ["jevs", "by-month", input],
      queryFn: () => api.jevs.listByMonth(input),
      placeholderData: keepPreviousData,
    }),
};
