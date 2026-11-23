import { Router } from "express";
import { AuditLogListInputSchema } from "@dwd-jev/shared";
import { listAuditLogs } from "../controllers/auditLogController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";

export const auditLogRouter = Router();

// Every logged-in user can read the audit log.
auditLogRouter.use(authenticate);

auditLogRouter.post("/list", validateBody(AuditLogListInputSchema), listAuditLogs);
