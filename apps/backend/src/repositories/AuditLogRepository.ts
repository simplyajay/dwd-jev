import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { AuditAction, DocumentType } from "@dwd-jev/shared";

export interface CreateAuditLogInput {
  documentType: DocumentType;
  documentId: string;
  action: AuditAction;
  description: string;
}

export interface IAuditLogRepository {
  // Accepts an optional transaction client so callers can log atomically
  // with the write it describes (e.g. inside JevRepository's own
  // $transaction), instead of as a separate, unguarded insert.
  create(data: CreateAuditLogInput, client?: Prisma.TransactionClient): Promise<void>;
}

export class PrismaAuditLogRepository implements IAuditLogRepository {
  async create(
    data: CreateAuditLogInput,
    client: Prisma.TransactionClient | typeof prisma = prisma,
  ): Promise<void> {
    await client.auditLog.create({ data });
  }
}
