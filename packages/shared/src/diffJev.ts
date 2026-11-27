import type { AccountingEntry } from "./schemas/accountingEntry.js";
import type { Explanation } from "./schemas/explanation.js";
import type { JevSnapshot } from "./schemas/jevRevision.js";
import type { SupportingDocument } from "./schemas/supportingDocument.js";

export interface JevDiff {
  changed: string[]; // after-indices
  added: string[]; // after-indices
  removed: string[]; // before-indices
}

const JEV_SCALAR_FIELDS = [
  "journalType",
  "jevNumber",
  "jevDate",
  "dvNumber",
  "dvDate",
  "adaNumber",
  "adaDate",
  "checkNumber",
  "checkDate",
  "payeeName",
  "description",
] as const satisfies readonly (keyof JevSnapshot)[];

// Bookkeeping only, so reordering rows doesn't count as a change.
const ACCOUNTING_ENTRY_FIELDS = [
  "accountCode",
  "accountName",
  "entryType",
  "amount",
] as const satisfies readonly (keyof AccountingEntry)[];

// entryType is inherited from the parent accounting entry.
const EXPLANATION_FIELDS = [
  "reference",
  "description",
  "amount",
] as const satisfies readonly (keyof Explanation)[];

// documentName is derived from documentCode.
const SUPPORTING_DOCUMENT_FIELDS = [
  "documentCode",
  "documentNumber",
  "documentDate",
] as const satisfies readonly (keyof SupportingDocument)[];

const diffFields = <T>(
  before: T,
  after: T,
  fields: readonly (keyof T)[],
  prefix: string,
  changed: string[],
): void => {
  for (const field of fields) {
    if (before[field] !== after[field]) {
      changed.push(`${prefix}${String(field)}`);
    }
  }
};

interface MatchResult<T> {
  matched: { before: T; beforeIndex: number; after: T; afterIndex: number }[];
  added: { item: T; index: number }[];
  removed: { item: T; index: number }[];
}

// Matches by content key, not id (ids are regenerated on every update).
// Duplicate keys are paired in order.
const matchByKey = <T>(before: T[], after: T[], keyOf: (item: T) => string): MatchResult<T> => {
  const beforeQueues = new Map<string, { item: T; index: number }[]>();
  before.forEach((item, index) => {
    const key = keyOf(item);
    const queue = beforeQueues.get(key) ?? [];
    queue.push({ item, index });
    beforeQueues.set(key, queue);
  });

  const matched: MatchResult<T>["matched"] = [];
  const added: MatchResult<T>["added"] = [];

  after.forEach((item, index) => {
    const queue = beforeQueues.get(keyOf(item));
    const pair = queue?.shift();
    if (pair) {
      matched.push({ before: pair.item, beforeIndex: pair.index, after: item, afterIndex: index });
    } else {
      added.push({ item, index });
    }
  });

  const removed = Array.from(beforeQueues.values()).flat();

  return { matched, added, removed };
};

export function diffJev(before: JevSnapshot, after: JevSnapshot): JevDiff {
  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];

  diffFields(before, after, JEV_SCALAR_FIELDS, "", changed);

  const accountingMatch = matchByKey(
    before.accountingEntries ?? [],
    after.accountingEntries ?? [],
    (entry: AccountingEntry) => `${entry.accountCode}::${entry.entryType}`,
  );

  for (const { index } of accountingMatch.added) added.push(`accountingEntries[${index}]`);
  for (const { index } of accountingMatch.removed) removed.push(`accountingEntries[${index}]`);

  for (const pair of accountingMatch.matched) {
    const prefix = `accountingEntries[${pair.afterIndex}].`;
    diffFields(pair.before, pair.after, ACCOUNTING_ENTRY_FIELDS, prefix, changed);

    const explanationMatch = matchByKey(
      pair.before.explanations ?? [],
      pair.after.explanations ?? [],
      (explanation: Explanation) => explanation.reference,
    );

    for (const { index } of explanationMatch.added) {
      added.push(`${prefix}explanations[${index}]`);
    }
    for (const { index } of explanationMatch.removed) {
      removed.push(`${prefix}explanations[${index}]`);
    }
    for (const explanationPair of explanationMatch.matched) {
      diffFields(
        explanationPair.before,
        explanationPair.after,
        EXPLANATION_FIELDS,
        `${prefix}explanations[${explanationPair.afterIndex}].`,
        changed,
      );
    }
  }

  const supportingMatch = matchByKey(
    before.supportingDocuments ?? [],
    after.supportingDocuments ?? [],
    (doc: SupportingDocument) => `${doc.documentCode}::${doc.documentNumber}`,
  );

  for (const { index } of supportingMatch.added) added.push(`supportingDocuments[${index}]`);
  for (const { index } of supportingMatch.removed) removed.push(`supportingDocuments[${index}]`);
  for (const pair of supportingMatch.matched) {
    diffFields(
      pair.before,
      pair.after,
      SUPPORTING_DOCUMENT_FIELDS,
      `supportingDocuments[${pair.afterIndex}].`,
      changed,
    );
  }

  return { changed, added, removed };
}
