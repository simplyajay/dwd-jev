import type { AuditLogListInput } from "@dwd-jev/shared";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const auditLogQueries = {
  /** Prefix of every audit log query; JEV saves and deletes invalidate it. */
  all: ["audit-logs"] as const,
  list: (input: AuditLogListInput) =>
    queryOptions({
      queryKey: [...auditLogQueries.all, "list", input],
      queryFn: () => api.auditLogs.list(input),
      placeholderData: keepPreviousData,
    }),
};
