import { z } from "zod";
import { AuditActionSchema, DocumentTypeSchema } from "../enums.js";

export const AuditLogSchema = z.object({
  id: z.uuid(),
  documentType: DocumentTypeSchema,
  documentId: z.uuid(),
  action: AuditActionSchema,
  description: z.string(),
  createdAt: z.coerce.date(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;
