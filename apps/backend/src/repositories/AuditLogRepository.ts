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
  // Pass tx to log in the same transaction as the write it describes.
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
