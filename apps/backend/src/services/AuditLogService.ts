import type {
  AuditLog,
  AuditLogListInput,
  DocumentType,
  PaginatedResult,
} from "@dwd-jev/shared";
import type {
  AuditLogRow,
  IAuditLogRepository,
} from "../repositories/AuditLogRepository.js";
import { buildPaginatedResult } from "../utils/pagination.js";
import { toUserRefWithPosition } from "../utils/userRef.js";

// documentType is a plain string column; only DocumentType values are written.
const formatAuditLog = ({
  actor,
  actorId,
  documentType,
  ...log
}: AuditLogRow): AuditLog => ({
  ...log,
  documentType: documentType as DocumentType,
  actor: toUserRefWithPosition(actor),
});

export class AuditLogService {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async listAuditLogs({
    page,
    pageSize,
    ...filters
  }: AuditLogListInput): Promise<PaginatedResult<AuditLog>> {
    const pagination = { page, pageSize };
    const { items, total } = await this.auditLogRepository.findMany(filters, pagination);
    return buildPaginatedResult(items.map(formatAuditLog), total, pagination);
  }
}
