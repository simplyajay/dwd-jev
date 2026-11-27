import { z } from "zod";
import { DocumentCodeSchema } from "../enums.js";

export const SupportingDocumentSchema = z.object({
  id: z.uuid(),
  jevId: z.uuid(),
  sortOrder: z.number().int(),
  documentNumber: z.string(),
  documentCode: DocumentCodeSchema,
  documentName: z.string(),
  documentDate: z.iso.date(),
});
export type SupportingDocument = z.infer<typeof SupportingDocumentSchema>;

export const CreateSupportingDocumentInputSchema = z.object({
  documentCode: DocumentCodeSchema,
  documentNumber: z.string().nonempty("Enter document number."),
  // Strict "YYYY-MM-DD", converted to a Date (Prisma rejects bare date strings).
  documentDate: z.iso.date("Select date").transform((value) => new Date(value)),
});
export type CreateSupportingDocumentInput = z.infer<
  typeof CreateSupportingDocumentInputSchema
>;
