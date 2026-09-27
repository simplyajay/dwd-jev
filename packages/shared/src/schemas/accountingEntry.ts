import { z } from "zod";
import { EntryTypeSchema } from "../enums.js";
import {
  AmountSchema,
  CreateExternalDocumentEntryInputSchema,
  ExternalDocumentEntrySchema,
  toCents,
} from "./externalDocumentEntry.js";

export const AccountingEntrySchema = z.object({
  id: z.uuid(),
  jevId: z.uuid(),
  sortOrder: z.number().int(),
  accountCode: z.string(),
  accountName: z.string(),
  entryType: EntryTypeSchema,
  amount: z.coerce.bigint(),
  externalDocumentEntries: z.array(ExternalDocumentEntrySchema),
});
export type AccountingEntry = z.infer<typeof AccountingEntrySchema>;

export const CreateAccountingEntryInputSchema = z
  .object({
    accountCode: z.string().nonempty("Please enter account code."),
    accountName: z.string().nonempty("Please enter account name."),
    entryType: EntryTypeSchema.nullable(),
    amount: AmountSchema,
    externalDocumentEntries: z.array(CreateExternalDocumentEntryInputSchema).default([]),
  })
  .superRefine((data, ctx) => {
    const { entryType, amount, externalDocumentEntries } = data;

    if (entryType === null || amount === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Enter debit or credit.",
      });
      return;
    }

    if (amount <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Amount must be greater than 0.",
      });
      return;
    }

    if (externalDocumentEntries.length === 0) return;

    const hasIncompleteDetails = externalDocumentEntries.some(
      (ext) => !ext.documentNumber || !ext.documentName,
    );

    if (hasIncompleteDetails) {
      ctx.addIssue({
        code: "custom",
        path: ["externalDocuments"],
        message: "Enter document details.",
      });
      return;
    }

    const externalDocumentsTotalCents = externalDocumentEntries.reduce(
      (sum, ext) => sum + toCents(ext.amount ?? 0),
      0,
    );

    if (externalDocumentsTotalCents !== toCents(amount)) {
      ctx.addIssue({
        code: "custom",
        path: ["externalDocuments"],
        message: `External documents must total the account's ${entryType}.`,
      });
    }
  });
export type CreateAccountingEntryInput = z.infer<typeof CreateAccountingEntryInputSchema>;
