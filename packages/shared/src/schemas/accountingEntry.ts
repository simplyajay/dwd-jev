import { z } from "zod";
import { EntryTypeSchema } from "../enums.js";
import { ExternalDocumentEntrySchema } from "./externalDocumentEntry.js";

export const AccountingEntrySchema = z.object({
  id: z.uuid(),
  jevId: z.uuid(),
  sortOrder: z.number().int(),
  accountCode: z.string(),
  accountName: z.string(),
  entryType: EntryTypeSchema,
  amount: z.coerce.bigint(),
  externalDocuments: z.array(ExternalDocumentEntrySchema).optional(),
});
export type AccountingEntry = z.infer<typeof AccountingEntrySchema>;

// jevId is supplied by the route (path param / parent JEV create), not the body.
export const CreateAccountingEntryInputSchema = z.object({
  sortOrder: z.number().int(),
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  entryType: EntryTypeSchema,
  amount: z.coerce.bigint().positive(),
});
export type CreateAccountingEntryInput = z.infer<typeof CreateAccountingEntryInputSchema>;
