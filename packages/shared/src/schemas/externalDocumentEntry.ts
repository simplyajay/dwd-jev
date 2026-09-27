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

// Cents are only used internally, for float-safe sum/equality checks.
export function toCents(pesos: number): number {
  return Math.round(pesos * 100);
}

export const AmountSchema = z.coerce.number().optional();

// accountingEntryId comes from the route, not the body; entryType is
// inherited from the parent accounting entry, never supplied by the client.
export const CreateExternalDocumentEntryInputSchema = z.object({
  documentNumber: z.string(),
  documentName: z.string(),
  amount: AmountSchema,
});
export type CreateExternalDocumentEntryInput = z.infer<typeof CreateExternalDocumentEntryInputSchema>;
