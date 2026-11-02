import {
  CreateJevInputSchema,
  type DocumentCode,
  type EntryType,
  type JournalType,
} from "@dwd-jev/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import type { CreateJevBody } from "@/lib/api";

// The form keeps every field flat and as typed: dates as "YYYY-MM-DD" (or ""),
// amounts in pesos. The shared schema checks it; the body is built from these raw values.

export const MIN_ACCOUNT_ROWS = 2;

export type JournalField =
  | "dvNumber"
  | "dvDate"
  | "adaNumber"
  | "adaDate"
  | "checkNumber"
  | "checkDate"
  | "payeeName";

/** Each journal's own header fields; other journals clear them and don't send them. */
export const JOURNAL_FIELDS: Record<JournalType, readonly JournalField[]> = {
  ckdj: ["dvNumber", "dvDate", "checkNumber", "checkDate", "payeeName"],
  cdj: ["dvNumber", "dvDate", "adaNumber", "adaDate", "payeeName"],
  crj: [],
  msij: [],
  gj: ["payeeName"],
};

/** Supporting document types each journal accepts; the first is a new row's default. */
export const ALLOWED_DOCUMENT_CODES: Record<JournalType, readonly DocumentCode[]> = {
  ckdj: ["po", "bur", "or", "inv", "ar"],
  cdj: ["bur"],
  crj: ["rcd"],
  msij: ["ris"],
  gj: ["lr"],
};

export interface ExternalDocumentRow {
  documentNumber: string;
  documentName: string;
  amount: number | undefined;
}

export interface AccountRow {
  accountCode: string;
  accountName: string;
  /** Null until an amount is typed in the Debit or Credit column. */
  entryType: EntryType | null;
  amount: number | undefined;
  externalDocumentEntries: ExternalDocumentRow[];
}

export interface SupportingDocumentRow {
  documentCode: DocumentCode;
  documentNumber: string;
  documentDate: string;
}

export interface JevFormValues extends Record<JournalField, string> {
  journalType: JournalType | "";
  jevNumber: string;
  jevDate: string;
  description: string;
  accountingEntries: AccountRow[];
  supportingDocuments: SupportingDocumentRow[];
}

export const newAccountRow = (): AccountRow => ({
  accountCode: "",
  accountName: "",
  entryType: null,
  amount: undefined,
  externalDocumentEntries: [],
});

export const newExternalDocumentRow = (): ExternalDocumentRow => ({
  documentNumber: "",
  documentName: "",
  amount: undefined,
});

export const newSupportingDocumentRow = (journalType: JournalType): SupportingDocumentRow => ({
  documentCode: ALLOWED_DOCUMENT_CODES[journalType][0] ?? "lr",
  documentNumber: "",
  documentDate: "",
});

const EMPTY_JOURNAL_FIELDS: Record<JournalField, string> = {
  dvNumber: "",
  dvDate: "",
  adaNumber: "",
  adaDate: "",
  checkNumber: "",
  checkDate: "",
  payeeName: "",
};

export function emptyJevForm(): JevFormValues {
  return {
    journalType: "",
    jevNumber: "",
    jevDate: "",
    description: "",
    ...EMPTY_JOURNAL_FIELDS,
    accountingEntries: Array.from({ length: MIN_ACCOUNT_ROWS }, newAccountRow),
    supportingDocuments: [],
  };
}

/** Keeps the number, date, description and accounts; the journal's own fields start over. */
export function switchJournal(values: JevFormValues, journalType: JournalType): JevFormValues {
  return {
    ...values,
    ...EMPTY_JOURNAL_FIELDS,
    journalType,
    supportingDocuments: [],
  };
}

// raw: submit gets the form values as typed, not the schema's Date-converted output.
export const jevFormResolver = zodResolver(CreateJevInputSchema, undefined, {
  raw: true,
}) as unknown as Resolver<JevFormValues>;

/** The values the API takes for this journal; call after the resolver has passed. */
export function toCreateJevBody(values: JevFormValues): CreateJevBody {
  const journalType = values.journalType as JournalType;
  const journalFields = Object.fromEntries(
    JOURNAL_FIELDS[journalType]
      .map((field) => [field, values[field]] as const)
      .filter(([, value]) => value !== ""),
  );

  return {
    journalType,
    jevNumber: values.jevNumber,
    jevDate: values.jevDate,
    description: values.description,
    ...journalFields,
    accountingEntries: values.accountingEntries,
    supportingDocuments: values.supportingDocuments,
  } as CreateJevBody;
}
