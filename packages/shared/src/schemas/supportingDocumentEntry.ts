import { z } from "zod";
import { DocumentCodeSchema } from "../enums.js";

export const SupportingDocumentEntrySchema = z.object({
  id: z.uuid(),
  jevId: z.uuid(),
  sortOrder: z.number().int(),
  documentNumber: z.string(),
  documentCode: DocumentCodeSchema,
  documentName: z.string(),
  documentDate: z.iso.date(),
});
export type SupportingDocumentEntry = z.infer<typeof SupportingDocumentEntrySchema>;

export const CreateSupportingDocumentEntryInputSchema = z.object({
  documentCode: DocumentCodeSchema,
  documentNumber: z.string().nonempty("Enter document number."),
  // Strict "YYYY-MM-DD", then converted to a Date -- Prisma requires a full
  // ISO-8601 datetime string when passing a string, not a bare date.
  documentDate: z.iso.date("Select date").transform((value) => new Date(value)),
});
export type CreateSupportingDocumentEntryInput = z.infer<
  typeof CreateSupportingDocumentEntryInputSchema
>;
