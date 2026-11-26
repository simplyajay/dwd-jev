import { AuditLogSchema } from "@dwd-jev/shared";
import { request } from "./http";
import { paginatedSchema } from "./schemas";
import type { Api } from "./types";

export const auditLogsApi: Api["auditLogs"] = {
  list: (input) =>
    request({
      method: "POST",
      path: "/api/audit-logs/list",
      body: input,
      schema: paginatedSchema(AuditLogSchema),
    }),
};
