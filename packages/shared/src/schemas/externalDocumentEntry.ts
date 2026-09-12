import { z } from "zod";
import { EntryTypeSchema } from "../enums.js";

export const ExternalDocumentEntrySchema = z.object({
  id: z.uuid(),
  accountingEntryId: z.uuid(),
  documentNumber: z.string(),
  documentName: z.string(),
  entryType: EntryTypeSchema,
  amount: z.coerce.bigint(),
});
export type ExternalDocumentEntry = z.infer<typeof ExternalDocumentEntrySchema>;

// accountingEntryId is supplied by the route, not the body.
export const CreateExternalDocumentEntryInputSchema = z.object({
  documentNumber: z.string().min(1),
  documentName: z.string().min(1),
  entryType: EntryTypeSchema,
  amount: z.coerce.bigint().positive(),
});
export type CreateExternalDocumentEntryInput = z.infer<typeof CreateExternalDocumentEntryInputSchema>;
