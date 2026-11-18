import type { AuditAction, DocumentType } from "@dwd-jev/shared";
import type { Tx } from "../lib/transaction.js";

export interface CreateAuditLogInput {
  documentType: DocumentType;
  documentId: string;
  action: AuditAction;
  description: string;
  actorId: string;
}

export interface IAuditLogRepository {
  // Takes tx so the log commits or rolls back with the write it describes.
  create(data: CreateAuditLogInput, tx: Tx): Promise<void>;
}

export class PrismaAuditLogRepository implements IAuditLogRepository {
  async create(data: CreateAuditLogInput, tx: Tx): Promise<void> {
    await tx.auditLog.create({ data });
  }
}
