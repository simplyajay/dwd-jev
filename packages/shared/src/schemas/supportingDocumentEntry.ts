import { z } from "zod";
import { DocumentCodeSchema } from "../enums.js";

export const SupportingDocumentEntrySchema = z.object({
  id: z.uuid(),
  jevId: z.uuid(),
  sortOrder: z.number().int(),
  documentNumber: z.string(),
  documentCode: DocumentCodeSchema,
  documentName: z.string(),
  documentDate: z.coerce.date(),
});
export type SupportingDocumentEntry = z.infer<typeof SupportingDocumentEntrySchema>;

// jevId is supplied by the route, not the body. documentName is omitted — it's
// derived server-side from documentCode via DOCUMENT_CODE_LABELS so the two can't
// end up mismatched.
export const CreateSupportingDocumentEntryInputSchema = z.object({
  sortOrder: z.number().int(),
  documentNumber: z.string().min(1),
  documentCode: DocumentCodeSchema,
  documentDate: z.coerce.date(),
});
export type CreateSupportingDocumentEntryInput = z.infer<typeof CreateSupportingDocumentEntryInputSchema>;
