import type { Request } from "express";
import type { AuditLogListInput } from "@dwd-jev/shared";
import { auditLogService } from "../container.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listAuditLogs = asyncHandler<Request<any, any, AuditLogListInput>>(
  async (req, res) => {
    const result = await auditLogService.listAuditLogs(req.body);
    res.success(result, 200);
  },
);
