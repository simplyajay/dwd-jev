import { z } from "zod";
import { AuditActionSchema, DocumentTypeSchema } from "../enums.js";
import { PaginationInputSchema } from "../pagination.js";
import { UserRefWithPositionSchema } from "./user.js";

export const AuditLogSchema = z.object({
  id: z.uuid(),
  documentType: DocumentTypeSchema,
  documentId: z.uuid(),
  action: AuditActionSchema,
  description: z.string(),
  actor: UserRefWithPositionSchema,
  createdAt: z.coerce.date(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const AuditLogListInputSchema = PaginationInputSchema.extend({
  actions: z.array(AuditActionSchema).min(1).optional(),
  actorId: z.uuid().optional(),
  // from is inclusive and to is exclusive, e.g. a day is its midnight to the next.
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  searchKeyword: z.string().trim().min(1).optional(),
});
export type AuditLogListInput = z.infer<typeof AuditLogListInputSchema>;
