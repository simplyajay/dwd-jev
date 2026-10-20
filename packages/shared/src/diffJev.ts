import type { AccountingEntry } from "./schemas/accountingEntry.js";
import type { ExternalDocumentEntry } from "./schemas/externalDocumentEntry.js";
import type { Jev } from "./schemas/jev.js";
import type { SupportingDocumentEntry } from "./schemas/supportingDocumentEntry.js";

export interface JevDiff {
  changed: string[]; // after-indices
  added: string[]; // after-indices
  removed: string[]; // before-indices
}

// Excludes identity and audit fields; lastUpdatedAt/By change on every update,
// so they would always show as changed.
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
] as const satisfies readonly (keyof Jev)[];

// Bookkeeping only, so reordering rows doesn't count as a change.
const ACCOUNTING_ENTRY_FIELDS = [
  "accountCode",
  "accountName",
  "entryType",
  "amount",
] as const satisfies readonly (keyof AccountingEntry)[];

// entryType is inherited from the parent accounting entry.
const EXTERNAL_DOCUMENT_FIELDS = [
  "documentNumber",
  "documentName",
  "amount",
] as const satisfies readonly (keyof ExternalDocumentEntry)[];

// documentName is derived from documentCode.
const SUPPORTING_DOCUMENT_FIELDS = [
  "documentCode",
  "documentNumber",
  "documentDate",
] as const satisfies readonly (keyof SupportingDocumentEntry)[];

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

export function diffJev(before: Jev, after: Jev): JevDiff {
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

    const externalMatch = matchByKey(
      pair.before.externalDocumentEntries ?? [],
      pair.after.externalDocumentEntries ?? [],
      (doc: ExternalDocumentEntry) => doc.documentNumber,
    );

    for (const { index } of externalMatch.added) {
      added.push(`${prefix}externalDocumentEntries[${index}]`);
    }
    for (const { index } of externalMatch.removed) {
      removed.push(`${prefix}externalDocumentEntries[${index}]`);
    }
    for (const extPair of externalMatch.matched) {
      diffFields(
        extPair.before,
        extPair.after,
        EXTERNAL_DOCUMENT_FIELDS,
        `${prefix}externalDocumentEntries[${extPair.afterIndex}].`,
        changed,
      );
    }
  }

  const supportingMatch = matchByKey(
    before.supportingDocumentEntries ?? [],
    after.supportingDocumentEntries ?? [],
    (doc: SupportingDocumentEntry) => `${doc.documentCode}::${doc.documentNumber}`,
  );

  for (const { index } of supportingMatch.added) added.push(`supportingDocumentEntries[${index}]`);
  for (const { index } of supportingMatch.removed) removed.push(`supportingDocumentEntries[${index}]`);
  for (const pair of supportingMatch.matched) {
    diffFields(
      pair.before,
      pair.after,
      SUPPORTING_DOCUMENT_FIELDS,
      `supportingDocumentEntries[${pair.afterIndex}].`,
      changed,
    );
  }

  return { changed, added, removed };
}
