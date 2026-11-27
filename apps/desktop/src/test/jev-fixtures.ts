import type { Jev, JevSnapshot } from "@dwd-jev/shared";

export const CLAUDE = {
  id: "00000000-0000-4000-8000-000000000001",
  fullName: "Test 1, Claude",
  isSystemAccount: false,
  position: "Test Accountant",
};

const JEV_ID = "00000000-0000-4000-8000-0000000000c1";

/** A saved check disbursement JEV: one debit with an explanation, one credit, one PO. */
export const SAVED_JEV: Jev = {
  id: JEV_ID,
  journalType: "ckdj",
  jevNumber: "claude-test-jev-2",
  jevDate: "2026-11-03",
  dvNumber: "DV-001",
  dvDate: "2026-11-02",
  adaNumber: null,
  adaDate: null,
  checkNumber: "CHK-9",
  checkDate: "2026-11-04",
  payeeName: "Claude Supplies",
  description: "Claude test purchase",
  createdAt: new Date("2026-11-03T01:00:00Z"),
  createdBy: CLAUDE,
  lastUpdatedAt: new Date("2026-11-03T01:00:00Z"),
  lastUpdatedBy: CLAUDE,
  deletedAt: null,
  deletedBy: null,
  accountingEntries: [
    {
      id: "00000000-0000-4000-8000-0000000000d1",
      jevId: JEV_ID,
      sortOrder: 0,
      accountCode: "5-02",
      accountName: "Office Supplies",
      entryType: "debit",
      amount: 150000n,
      explanations: [
        {
          id: "00000000-0000-4000-8000-0000000000e1",
          accountingEntryId: "00000000-0000-4000-8000-0000000000d1",
          reference: "INV-7",
          description: "Supplier invoice",
          entryType: "debit",
          amount: 150000n,
        },
      ],
    },
    {
      id: "00000000-0000-4000-8000-0000000000d2",
      jevId: JEV_ID,
      sortOrder: 1,
      accountCode: "1-01",
      accountName: "Cash in Bank",
      entryType: "credit",
      amount: 150000n,
      explanations: [],
    },
  ],
  supportingDocuments: [
    {
      id: "00000000-0000-4000-8000-0000000000f1",
      jevId: JEV_ID,
      sortOrder: 0,
      documentNumber: "PO-12",
      documentCode: "po",
      documentName: "Purchase Order",
      documentDate: "2026-11-01",
    },
  ],
};

/** The JEV's content, as a revision stores it. */
export function toSnapshot(jev: Jev): JevSnapshot {
  const {
    id: _id,
    createdAt: _createdAt,
    createdBy: _createdBy,
    lastUpdatedAt: _lastUpdatedAt,
    lastUpdatedBy: _lastUpdatedBy,
    deletedAt: _deletedAt,
    deletedBy: _deletedBy,
    ...snapshot
  } = jev;
  return snapshot;
}
