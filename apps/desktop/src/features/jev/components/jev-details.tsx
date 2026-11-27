import type { AccountingEntry, EntryType, JevSnapshot } from "@dwd-jev/shared";
import { CornerDownRightIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { formatDateOnly } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { JOURNAL_FIELDS, REFERENCE_FIELDS } from "../form/jev-form-values";
import {
  ACCOUNT_GRID,
  ROW_DIVIDERS,
  SUPPORTING_DOCUMENT_GRID,
  TABLE_HEADING,
} from "../form/row-styles";
import { DOCUMENT_LABELS, JOURNAL_LABELS } from "../labels";
import { JevSection } from "./jev-section";

/** What a revision changed, as `diffJev` paths. */
export interface JevHighlights {
  /** Changed fields, e.g. "jevNumber" or "accountingEntries[0].amount". */
  changed: ReadonlySet<string>;
  /** Whole rows, e.g. "accountingEntries[1]", that are new or gone. */
  rows: ReadonlySet<string>;
  rowTone: "added" | "removed";
}

const SIDES: readonly EntryType[] = ["debit", "credit"];
const EMPTY = "—";

const CHANGED_VALUE = "-mx-1 rounded-sm bg-amber-400/25 px-1 ring-1 ring-amber-500/40";
const ROW_TONES = {
  added: "rounded-md bg-emerald-500/10",
  removed: "rounded-md bg-destructive/10 line-through decoration-destructive/60",
} as const;
const ROW_TONE_LABELS = { added: " (added)", removed: " (removed)" } as const;

type RowTone = JevHighlights["rowTone"];

interface Marks {
  changed: (path: string) => boolean;
  rowTone: (path: string) => RowTone | undefined;
}

/** Path lookups in the highlights; none means nothing is marked. */
function marksFor(highlights: JevHighlights | undefined): Marks {
  return {
    changed: (path) => !!highlights?.changed.has(path),
    rowTone: (path) => (highlights?.rows.has(path) ? highlights.rowTone : undefined),
  };
}

interface JevDetailsProps {
  jev: JevSnapshot;
  highlights?: JevHighlights;
}

/** A JEV, read-only, laid out like the form. */
export function JevDetails({ jev, highlights }: JevDetailsProps) {
  const marks = marksFor(highlights);

  return (
    <div className="min-w-0 space-y-6">
      <VoucherSection jev={jev} marks={marks} />
      <AccountsSection entries={jev.accountingEntries ?? []} marks={marks} />
      <SupportingDocumentsSection jev={jev} marks={marks} />
    </div>
  );
}

function Marked({ changed, children }: { changed: boolean; children: ReactNode }) {
  if (!changed) return children;
  return (
    <span className={CHANGED_VALUE}>
      {children}
      <span className="sr-only"> (changed)</span>
    </span>
  );
}

function RowToneLabel({ tone }: { tone: RowTone | undefined }) {
  return tone ? <span className="sr-only">{ROW_TONE_LABELS[tone]}</span> : null;
}

interface ItemProps {
  label: string;
  changed: boolean;
  className?: string;
  children: ReactNode;
}

function Item({ label, changed, className, children }: ItemProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 wrap-break-word">
        <Marked changed={changed}>{children}</Marked>
      </p>
    </div>
  );
}

const dateOrEmpty = (value: string | null) => (value ? formatDateOnly(value) : EMPTY);

function VoucherSection({ jev, marks }: { jev: JevSnapshot; marks: Marks }) {
  const fields = JOURNAL_FIELDS[jev.journalType];
  const references = REFERENCE_FIELDS.filter((pair) => fields.includes(pair.number));
  const hasPayee = fields.includes("payeeName");

  return (
    <JevSection title="Voucher">
      <div className="grid grid-cols-3 gap-4">
        <Item label="Journal" changed={marks.changed("journalType")}>
          {JOURNAL_LABELS[jev.journalType]}
        </Item>
        <Item label="JEV No." changed={marks.changed("jevNumber")} className="tabular-nums">
          {jev.jevNumber}
        </Item>
        <Item label="JEV date" changed={marks.changed("jevDate")}>
          {formatDateOnly(jev.jevDate)}
        </Item>
      </div>

      {references.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {references.map((pair) => (
            <Fragment key={pair.label}>
              <Item
                label={`${pair.label} No.`}
                changed={marks.changed(pair.number)}
                className="tabular-nums"
              >
                {jev[pair.number] || EMPTY}
              </Item>
              <Item label={`${pair.label} date`} changed={marks.changed(pair.date)}>
                {dateOrEmpty(jev[pair.date])}
              </Item>
            </Fragment>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Item
          label="Description"
          changed={marks.changed("description")}
          className={cn("whitespace-pre-wrap", hasPayee ? "col-span-2" : "col-span-3")}
        >
          {jev.description}
        </Item>
        {hasPayee && (
          <Item label="Payee" changed={marks.changed("payeeName")}>
            {jev.payeeName || EMPTY}
          </Item>
        )}
      </div>
    </JevSection>
  );
}

function AccountsSection({ entries, marks }: { entries: AccountingEntry[]; marks: Marks }) {
  const totals = { debit: 0n, credit: 0n };
  for (const entry of entries) totals[entry.entryType] += entry.amount;
  const balanced = totals.debit === totals.credit;

  return (
    <JevSection title="Accounts and explanation">
      <div>
        <div className={cn(ACCOUNT_GRID, TABLE_HEADING)}>
          <span>Account code</span>
          <span>Account name</span>
          <span className="pr-2.5 text-right">Debit</span>
          <span className="pr-2.5 text-right">Credit</span>
        </div>

        <div className={ROW_DIVIDERS}>
          {entries.map((entry, index) => (
            <AccountRow
              key={entry.id}
              entry={entry}
              path={`accountingEntries[${index}]`}
              marks={marks}
            />
          ))}
        </div>

        <div
          className={cn(ACCOUNT_GRID, "mt-2 items-center border-t px-1 pt-3 font-medium text-sm")}
        >
          <span className="col-span-2">Total</span>
          {SIDES.map((side) => (
            <span
              key={side}
              data-testid={`total-${side}`}
              className={cn("pr-2.5 text-right tabular-nums", !balanced && "text-destructive")}
            >
              {formatCents(totals[side])}
            </span>
          ))}
        </div>
      </div>
    </JevSection>
  );
}

function AccountRow({
  entry,
  path,
  marks,
}: {
  entry: AccountingEntry;
  path: string;
  marks: Marks;
}) {
  const tone = marks.rowTone(path);

  return (
    <div className={cn("px-1 py-2 text-sm", tone && ROW_TONES[tone])}>
      <div className={ACCOUNT_GRID}>
        <span className="min-w-0 wrap-break-word tabular-nums">
          <Marked changed={marks.changed(`${path}.accountCode`)}>{entry.accountCode}</Marked>
          <RowToneLabel tone={tone} />
        </span>
        <span className="min-w-0 wrap-break-word">
          <Marked changed={marks.changed(`${path}.accountName`)}>{entry.accountName}</Marked>
        </span>
        {SIDES.map((side) => (
          <span key={side} className="pr-2.5 text-right tabular-nums">
            {side === entry.entryType && (
              <Marked changed={marks.changed(`${path}.amount`)}>{formatCents(entry.amount)}</Marked>
            )}
          </span>
        ))}
      </div>

      {entry.explanations.map((explanation, index) => {
        const explanationPath = `${path}.explanations[${index}]`;
        const explanationTone = marks.rowTone(explanationPath);
        return (
          <div
            key={explanation.id}
            className={cn(
              ACCOUNT_GRID,
              "mt-1 py-0.5 text-[0.8125rem] text-muted-foreground",
              explanationTone && ROW_TONES[explanationTone],
            )}
          >
            <span />
            <div className="flex min-w-0 items-start gap-2">
              <CornerDownRightIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                <span className="min-w-0 wrap-break-word tabular-nums">
                  <Marked changed={marks.changed(`${explanationPath}.reference`)}>
                    {explanation.reference}
                  </Marked>
                  <RowToneLabel tone={explanationTone} />
                </span>
                <span className="min-w-0 wrap-break-word">
                  <Marked changed={marks.changed(`${explanationPath}.description`)}>
                    {explanation.description}
                  </Marked>
                </span>
              </div>
            </div>
            {SIDES.map((side) => (
              <span key={side} className="pr-2.5 text-right tabular-nums">
                {side === entry.entryType && (
                  <Marked changed={marks.changed(`${explanationPath}.amount`)}>
                    {formatCents(explanation.amount)}
                  </Marked>
                )}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function SupportingDocumentsSection({ jev, marks }: { jev: JevSnapshot; marks: Marks }) {
  const documents = jev.supportingDocuments ?? [];

  return (
    <JevSection title="Supporting documents">
      {documents.length === 0 ? (
        <p className="text-muted-foreground text-sm">No supporting documents.</p>
      ) : (
        <div>
          <div className={cn(SUPPORTING_DOCUMENT_GRID, TABLE_HEADING)}>
            <span>Document no.</span>
            <span>Type</span>
            <span>Date</span>
          </div>
          <div className={ROW_DIVIDERS}>
            {documents.map((document, index) => {
              const path = `supportingDocuments[${index}]`;
              const tone = marks.rowTone(path);
              return (
                <div
                  key={document.id}
                  className={cn(
                    SUPPORTING_DOCUMENT_GRID,
                    "px-1 py-2 text-sm",
                    tone && ROW_TONES[tone],
                  )}
                >
                  <span className="min-w-0 wrap-break-word tabular-nums">
                    <Marked changed={marks.changed(`${path}.documentNumber`)}>
                      {document.documentNumber}
                    </Marked>
                    <RowToneLabel tone={tone} />
                  </span>
                  <span className="min-w-0">
                    <Marked changed={marks.changed(`${path}.documentCode`)}>
                      {DOCUMENT_LABELS[document.documentCode]}
                    </Marked>
                  </span>
                  <span>
                    <Marked changed={marks.changed(`${path}.documentDate`)}>
                      {formatDateOnly(document.documentDate)}
                    </Marked>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </JevSection>
  );
}
