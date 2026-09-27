import { z } from "zod";
import { JournalTypeSchema } from "../enums.js";
import {
  AccountingEntrySchema,
  CreateAccountingEntryInputSchema,
} from "./accountingEntry.js";
import { toCents } from "./externalDocumentEntry.js";
import {
  CreateSupportingDocumentEntryInputSchema,
  SupportingDocumentEntrySchema,
} from "./supportingDocumentEntry.js";

// ----- PAGINATION ------

const PaginationInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const JevByMonthInputSchema = PaginationInputSchema.extend({
  year: z.coerce.number().int(),
  // 1-indexed month; 0 means every month of the given year.
  month: z.coerce.number().int().min(0).max(12),
});

export const JevByDateRangeInputSchema = PaginationInputSchema.extend({
  // Plain calendar date, e.g. "2026-12-30" -- no time, no timezone offset.
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  searchKeyword: z.string().trim().min(1).optional(),
});

export type JevByMonthInput = z.infer<typeof JevByMonthInputSchema>;

export type JevByDateRangeInput = z.infer<typeof JevByDateRangeInputSchema>;

// ------- JEV -----------

export const JevSchema = z.object({
  id: z.uuid(),
  journalType: JournalTypeSchema,
  jevNumber: z.string(),
  jevDate: z.iso.date(),
  dvNumber: z.string().nullable(),
  dvDate: z.iso.date().nullable(),
  adaNumber: z.string().nullable(),
  adaDate: z.iso.date().nullable(),
  checkNumber: z.string().nullable(),
  checkDate: z.iso.date().nullable(),
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

export const JevListItemSchema = z.object({
  id: z.uuid(),
  jevNumber: z.string(),
  journalType: JournalTypeSchema,
  jevDate: z.iso.date(),
});
export type JevListItem = z.infer<typeof JevListItemSchema>;

// ---- JEV INPUT ----

const MIN_ACCOUNT_ROWS = 2;

// z.iso.date() rejects anything but "YYYY-MM-DD"; the transform then makes
// it a Date, since Prisma requires a full ISO-8601 datetime string (not a
// bare date) when a string is passed instead of a Date object.
const dateOnlyInput = (message: string) =>
  z.iso.date(message).transform((value) => new Date(value));

const CkdjSupportingDocumentSchema = CreateSupportingDocumentEntryInputSchema.extend({
  documentCode: z.enum(["bur", "po", "inv", "ar", "or"], { error: "Select Document" }),
});

const CdjSupportingDocumentSchema = CreateSupportingDocumentEntryInputSchema.extend({
  documentCode: z.enum(["bur"], { error: "Select Document" }),
});

const CrjSupportingDocumentSchema = CreateSupportingDocumentEntryInputSchema.extend({
  documentCode: z.enum(["rcd"], { error: "Select Document" }),
});

const MsijSupportingDocumentSchema = CreateSupportingDocumentEntryInputSchema.extend({
  documentCode: z.enum(["ris"], { error: "Select Document" }),
});

const GjSupportingDocumentSchema = CreateSupportingDocumentEntryInputSchema.extend({
  documentCode: z.enum(["lr"], { error: "Select Document" }),
});

const JevBaseSchema = z.object({
  journalType: JournalTypeSchema,
  jevNumber: z.string().nonempty("Please enter JEV Number."),
  jevDate: dateOnlyInput("Select Date"),
  accountingEntries: z
    .array(CreateAccountingEntryInputSchema)
    .min(MIN_ACCOUNT_ROWS, `Enter at least ${MIN_ACCOUNT_ROWS} accounts`),
  description: z.string().nonempty("Please enter description."),
});

const CkdjJevSchema = JevBaseSchema.extend({
  journalType: z.literal("ckdj"),
  dvNumber: z.string().nonempty("Please enter DV number."),
  dvDate: dateOnlyInput("Select Date"),
  payeeName: z.string().nonempty("Please enter Payee name."),
  checkNumber: z.string().nonempty("Please enter Check number."),
  checkDate: dateOnlyInput("Select Date"),
  supportingDocuments: z.array(CkdjSupportingDocumentSchema).optional(),
});

const CdjJevSchema = JevBaseSchema.extend({
  journalType: z.literal("cdj"),
  dvNumber: z.string().nonempty("Please enter DV number."),
  dvDate: dateOnlyInput("Select Date"),
  payeeName: z.string().nonempty("Please enter Payee name."),
  adaNumber: z.string().nonempty("Please enter ADA number."),
  adaDate: dateOnlyInput("Select Date"),
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
