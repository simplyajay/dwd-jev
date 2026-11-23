import type { Prisma } from "@prisma/client";
import type { AuditAction, AuditLogListInput, DocumentType } from "@dwd-jev/shared";
import { prisma } from "../lib/prisma.js";
import type { Tx } from "../lib/transaction.js";
import type { Pagination } from "../utils/pagination.js";
import { USER_REF_WITH_POSITION_SELECT } from "../utils/userRef.js";

export interface CreateAuditLogInput {
  documentType: DocumentType;
  documentId: string;
  action: AuditAction;
  description: string;
  actorId: string;
}

export type AuditLogFilters = Omit<AuditLogListInput, "page" | "pageSize">;

const AUDIT_LOG_INCLUDE = {
  actor: { select: USER_REF_WITH_POSITION_SELECT },
} satisfies Prisma.AuditLogInclude;

export type AuditLogRow = Prisma.AuditLogGetPayload<{
  include: typeof AUDIT_LOG_INCLUDE;
}>;

export interface IAuditLogRepository {
  // Takes tx so the log commits or rolls back with the write it describes.
  create(data: CreateAuditLogInput, tx: Tx): Promise<void>;
  // Newest first.
  findMany(
    filters: AuditLogFilters,
    pagination: Pagination,
  ): Promise<{ items: AuditLogRow[]; total: number }>;
}

export class PrismaAuditLogRepository implements IAuditLogRepository {
  async create(data: CreateAuditLogInput, tx: Tx): Promise<void> {
    await tx.auditLog.create({ data });
  }

  async findMany(
    { actions, actorId, from, to, searchKeyword }: AuditLogFilters,
    pagination: Pagination,
  ): Promise<{ items: AuditLogRow[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = {
      ...(actions ? { action: { in: actions } } : {}),
      ...(actorId ? { actorId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lt: new Date(to) } : {}),
            },
          }
        : {}),
      ...(searchKeyword
        ? { description: { contains: searchKeyword, mode: "insensitive" } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: AUDIT_LOG_INCLUDE,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}
