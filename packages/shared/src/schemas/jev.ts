import { z } from "zod";
import { DocumentCodeSchema, EntryTypeSchema, JournalTypeSchema } from "../enums.js";
import { AccountingEntrySchema } from "./accountingEntry.js";
import { SupportingDocumentEntrySchema } from "./supportingDocumentEntry.js";

export const JevSchema = z.object({
  id: z.uuid(),
  journalType: JournalTypeSchema,
  jevNumber: z.string(),
  jevDate: z.coerce.date(),
  dvNumber: z.string().nullable(),
  dvDate: z.coerce.date().nullable(),
  adaNumber: z.string().nullable(),
  adaDate: z.coerce.date().nullable(),
  checkNumber: z.string().nullable(),
  checkDate: z.coerce.date().nullable(),
  payeeName: z.string().nullable(),
  description: z.string(),
  createdAt: z.coerce.date(),
  createdBy: z.uuid(),
  lastUpdatedAt: z.coerce.date(),
  lastUpdatedBy: z.uuid(),
  deletedAt: z.coerce.date().nullable(),
  deletedBy: z.uuid().nullable(),
  accountingEntries: z.array(AccountingEntrySchema).optional(),
  supportingDocumentEntries: z.array(SupportingDocumentEntrySchema).optional(),
});
export type Jev = z.infer<typeof JevSchema>;

const MIN_ACCOUNT_ROWS = 2;

const AmountSchema = z.coerce.number().optional();

// Cents are only used internally, for float-safe sum/equality checks below.
function toCents(pesos: number): number {
  return Math.round(pesos * 100);
}

const JevExternalDocumentSchema = z.object({
  documentNumber: z.string(),
  documentName: z.string(),
  amount: AmountSchema,
});

const JevAccountingEntrySchema = z
  .object({
    accountCode: z.string().nonempty("Please enter account code."),
    accountName: z.string().nonempty("Please enter account name."),
    entryType: EntryTypeSchema.nullable(),
    amount: AmountSchema,
    externalDocuments: z.array(JevExternalDocumentSchema),
  })
  .superRefine((data, ctx) => {
    const { entryType, amount, externalDocuments } = data;

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

    if (externalDocuments.length === 0) return;

    const hasIncompleteDetails = externalDocuments.some(
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

    const externalDocumentsTotalCents = externalDocuments.reduce(
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

const JevSupportingDocumentSchema = z.object({
  documentCode: DocumentCodeSchema,
  documentNumber: z.string().nonempty("Enter document number."),
  documentDate: z.coerce.date("Select date"),
});

const CkdjSupportingDocumentSchema = JevSupportingDocumentSchema.extend({
  documentCode: z.enum(["bur", "po", "inv", "ar", "or"], { error: "Select Document" }),
});

const CdjSupportingDocumentSchema = JevSupportingDocumentSchema.extend({
  documentCode: z.enum(["bur"], { error: "Select Document" }),
});

const CrjSupportingDocumentSchema = JevSupportingDocumentSchema.extend({
  documentCode: z.enum(["rcd"], { error: "Select Document" }),
});

const MsijSupportingDocumentSchema = JevSupportingDocumentSchema.extend({
  documentCode: z.enum(["ris"], { error: "Select Document" }),
});

const GjSupportingDocumentSchema = JevSupportingDocumentSchema.extend({
  documentCode: z.enum(["lr"], { error: "Select Document" }),
});

const JevBaseSchema = z.object({
  journalType: JournalTypeSchema,
  jevNumber: z.string().nonempty("Please enter JEV Number."),
  jevDate: z.coerce.date("Select Date"),
  accountingEntries: z
    .array(JevAccountingEntrySchema)
    .min(MIN_ACCOUNT_ROWS, `Enter at least ${MIN_ACCOUNT_ROWS} accounts`),
  description: z.string().nonempty("Please enter description."),
});

const CkdjJevSchema = JevBaseSchema.extend({
  journalType: z.literal("ckdj"),
  dvNumber: z.string().nonempty("Please enter DV number."),
  dvDate: z.coerce.date("Select Date"),
  payeeName: z.string().nonempty("Please enter Payee name."),
  checkNumber: z.string().nonempty("Please enter Check number."),
  checkDate: z.coerce.date("Select Date"),
  supportingDocuments: z.array(CkdjSupportingDocumentSchema).optional(),
});

const CdjJevSchema = JevBaseSchema.extend({
  journalType: z.literal("cdj"),
  dvNumber: z.string().nonempty("Please enter DV number."),
  dvDate: z.coerce.date("Select Date"),
  payeeName: z.string().nonempty("Please enter Payee name."),
  adaNumber: z.string().nonempty("Please enter ADA number."),
  adaDate: z.coerce.date("Select Date"),
  supportingDocuments: z.array(CdjSupportingDocumentSchema).optional(),
});

const CrjJevSchema = JevBaseSchema.extend({
  journalType: z.literal("crj"),
  supportingDocuments: z.array(CrjSupportingDocumentSchema).optional(),
});

const MsijJevSchema = JevBaseSchema.extend({
  journalType: z.literal("msij"),
  supportingDocuments: z.array(MsijSupportingDocumentSchema).optional(),
});

const GjJevSchema = JevBaseSchema.extend({
  journalType: z.literal("gj"),
  payeeName: z.string().optional(),
  supportingDocuments: z.array(GjSupportingDocumentSchema).optional(),
});

export const CreateJevInputSchema = z
  .discriminatedUnion(
    "journalType",
    [CkdjJevSchema, CdjJevSchema, CrjJevSchema, MsijJevSchema, GjJevSchema],
    { error: "Select Journal" },
  )
  .superRefine((data, ctx) => {
    const totalsCents = data.accountingEntries.reduce(
      (acc, entry) => ({
        debit: acc.debit + (entry.entryType === "debit" ? toCents(entry.amount ?? 0) : 0),
        credit:
          acc.credit + (entry.entryType === "credit" ? toCents(entry.amount ?? 0) : 0),
      }),
      { debit: 0, credit: 0 },
    );

    if (totalsCents.debit !== totalsCents.credit) {
      ctx.addIssue({
        code: "custom",
        path: ["accountingEntries"],
        message: "Debit and credit must be balanced.",
      });
    }
  });
export type CreateJevInput = z.infer<typeof CreateJevInputSchema>;
