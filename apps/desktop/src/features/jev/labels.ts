import type { DocumentCode, JournalType } from "@dwd-jev/shared";

// How the desktop shows journals and document types. Shared's *_LABELS hold the bare names.

/** With its acronym, for pickers: "[GJ] General Journal". */
export const JOURNAL_LABELS: Record<JournalType, string> = {
  ckdj: "[CKDJ] Check Disbursement Journal",
  cdj: "[CDJ] Cash Disbursement Journal",
  crj: "[CRJ] Cash Receipts Journal",
  msij: "[MSIJ] Materials and Supplies Issuance Journal",
  gj: "[GJ] General Journal",
};

/** Acronym only, for the JEV list column. */
export const JOURNAL_SHORT_LABELS: Record<JournalType, string> = {
  ckdj: "CKDJ",
  cdj: "CDJ",
  crj: "CRJ",
  msij: "MSIJ",
  gj: "GJ",
};

/** With its acronym where it has one. BUR is a Request (shared still says Report). */
export const DOCUMENT_LABELS: Record<DocumentCode, string> = {
  po: "[PO] Purchase Order",
  bur: "[BUR] Budget Utilization Request",
  ris: "[RIS] Requisition and Issue Slip",
  or: "[OR] Official Receipt",
  inv: "Invoice",
  ar: "[AR] Acknowledgement Receipt",
  rcd: "[RCD] Report on Collection and Deposits",
  lr: "[LR] Liquidation Report",
};
