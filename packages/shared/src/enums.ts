import { z } from "zod";

export const RoleSchema = z.enum(["administrator", "user"]);
export type Role = z.infer<typeof RoleSchema>;

export const StatusSchema = z.enum(["active", "inactive"]);
export type Status = z.infer<typeof StatusSchema>;

export const EntryTypeSchema = z.enum(["debit", "credit"]);
export type EntryType = z.infer<typeof EntryTypeSchema>;

export const JournalTypeSchema = z.enum(["crj", "cdj", "gj", "ckdj", "msij"]);
export type JournalType = z.infer<typeof JournalTypeSchema>;

export const JOURNAL_TYPE_LABELS: Record<JournalType, string> = {
  crj: "Cash Receipts Journal",
  cdj: "Cash Disbursement Journal",
  gj: "General Journal",
  ckdj: "Check Disbursement Journal",
  msij: "Materials and Supplies Issuance Journal",
};

export const DocumentCodeSchema = z.enum(["po", "bur", "or", "inv", "ar", "rcd", "ris", "lr"]);
export type DocumentCode = z.infer<typeof DocumentCodeSchema>;

export const DOCUMENT_CODE_LABELS: Record<DocumentCode, string> = {
  po: "Purchase Order",
  bur: "Budget Utilization Report",
  or: "Official Receipt",
  inv: "Invoice",
  ar: "Acknowledgement Receipt",
  rcd: "Report on Collection and Deposits",
  ris: "Requisition and Issue Slip",
  lr: "Liquidation Report",
};
