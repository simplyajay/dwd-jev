import { type EntryType, toCents } from "@dwd-jev/shared";
import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  type FieldPath,
  type UseFormReturn,
  useFieldArray,
  useFormState,
  useWatch,
} from "react-hook-form";
import { AmountInput } from "@/components/form/amount-input";
import { dismissOn } from "@/components/form/dismiss-on";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPesos } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ExternalDocuments } from "./external-documents";
import { type JevFormValues, MIN_ACCOUNT_ROWS, newAccountRow } from "./jev-form-values";
import { EDITABLE_ROW, ACCOUNT_GRID as GRID, ROW_DIVIDERS, SHOW_ON_ROW_HOVER } from "./row-styles";

const SIDES: readonly EntryType[] = ["debit", "credit"];
const SIDE_LABELS: Record<EntryType, string> = { debit: "Debit", credit: "Credit" };

type ArrayError = { message?: string; root?: { message?: string } } | undefined;
const arrayMessage = (error: ArrayError) => error?.root?.message ?? error?.message;

// Where the resolver puts errors about the whole list (balance, minimum rows).
const LIST_ERROR = "accountingEntries.root" as FieldPath<JevFormValues>;

/** Account rows with their external documents, and the debit/credit totals. */
export function AccountEntries({ form }: { form: UseFormReturn<JevFormValues> }) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "accountingEntries" });
  const entries = useWatch({ control, name: "accountingEntries" });
  const { errors } = useFormState({ control, name: "accountingEntries" });

  const totals = { debit: 0, credit: 0 };
  for (const entry of entries ?? []) {
    if (entry.entryType) totals[entry.entryType] += toCents(entry.amount ?? 0);
  }
  const balanced = totals.debit === totals.credit;
  const listError = arrayMessage(errors.accountingEntries as ArrayError);

  return (
    <div>
      <div
        className={cn(
          GRID,
          "border-table-divider border-b px-1 pb-1 font-medium text-table-header text-xs uppercase tracking-wide",
        )}
      >
        <span>Account code</span>
        <span>Account name</span>
        {/* pr-2.5 matches the fields' padding, so headings line up with amounts. */}
        <span className="pr-2.5 text-right">Debit</span>
        <span className="pr-2.5 text-right">Credit</span>
      </div>

      <div className={ROW_DIVIDERS}>
        {fields.map((field, index) => (
          <AccountEntryRow
            key={field.id}
            form={form}
            index={index}
            onRemove={fields.length > MIN_ACCOUNT_ROWS ? () => remove(index) : undefined}
          />
        ))}
      </div>

      <div className={cn(GRID, "mt-2 items-center border-t px-1 pt-3 font-medium text-sm")}>
        <span className="col-span-2">Total</span>
        {SIDES.map((side) => (
          <span
            key={side}
            data-testid={`total-${side}`}
            className={cn("pr-2.5 text-right tabular-nums", !balanced && "text-destructive")}
          >
            {formatPesos(totals[side] / 100)}
          </span>
        ))}
      </div>
      {listError && (
        <p data-form-error className="mt-2 text-destructive text-sm">
          {listError}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => append(newAccountRow())}
      >
        <PlusIcon />
        Add account
      </Button>
    </div>
  );
}

interface AccountEntryRowProps {
  form: UseFormReturn<JevFormValues>;
  index: number;
  /** Absent for the first rows, which can't be removed. */
  onRemove?: () => void;
}

function AccountEntryRow({ form, index, onRemove }: AccountEntryRowProps) {
  const { control, register, setValue, clearErrors } = form;
  const path = `accountingEntries.${index}` as const;
  const row = useWatch({ control, name: path });
  const { errors } = useFormState({ control, name: path });

  const side = row?.entryType ?? null;
  const rowErrors = errors.accountingEntries?.[index];
  // The shared schema reports these at "externalDocuments", not the field's own name.
  const documentsError =
    (rowErrors as Record<string, { message?: string }> | undefined)?.externalDocuments?.message ??
    arrayMessage(rowErrors?.externalDocumentEntries as ArrayError);
  const rowNumber = index + 1;
  const dirty = { shouldDirty: true };

  const clearRowErrors = () =>
    clearErrors([`${path}.accountCode`, `${path}.accountName`, `${path}.amount`]);
  const clearDocumentErrors = () =>
    clearErrors([`${path}.externalDocuments` as FieldPath<JevFormValues>, LIST_ERROR]);

  // Typing in a column puts the row on that side; clearing it keeps the side.
  const commitAmount = (column: EntryType, amount: number | undefined) => {
    if (amount === undefined) {
      if (side === column) setValue(`${path}.amount`, undefined, dirty);
      return;
    }
    setValue(`${path}.entryType`, column, dirty);
    setValue(`${path}.amount`, amount, dirty);
  };

  const canAddDocuments = !!row?.accountCode && !!row?.accountName;

  return (
    // One row per entry: the account, its errors, its documents and the Add link.
    <div className={EDITABLE_ROW}>
      {/* Any interaction with the account's fields clears its errors. */}
      <div {...dismissOn(clearRowErrors)}>
        <div className={GRID}>
          <Input
            variant="table"
            aria-label={`Account code, row ${rowNumber}`}
            aria-invalid={!!rowErrors?.accountCode}
            {...register(`${path}.accountCode`)}
          />
          <Input
            variant="table"
            aria-label={`Account name, row ${rowNumber}`}
            aria-invalid={!!rowErrors?.accountName}
            {...register(`${path}.accountName`)}
          />
          {SIDES.map((column) => (
            <AmountInput
              variant="table"
              key={column}
              aria-label={`${SIDE_LABELS[column]}, row ${rowNumber}`}
              value={side === column ? row?.amount : undefined}
              invalid={!!rowErrors?.amount}
              onFocus={() => clearErrors(LIST_ERROR)}
              onCommit={(amount) => commitAmount(column, amount)}
            />
          ))}
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove row ${rowNumber}`}
              className={cn(
                SHOW_ON_ROW_HOVER,
                "place-self-center text-muted-foreground hover:text-destructive",
              )}
              onClick={onRemove}
            >
              <Trash2Icon />
            </Button>
          )}
        </div>

        {(rowErrors?.accountCode || rowErrors?.accountName || rowErrors?.amount) && (
          // Each message sits under its own field; the amount's spans Debit and Credit.
          <div data-form-error className={cn(GRID, "pt-1 text-destructive text-sm")}>
            <p>{rowErrors?.accountCode?.message}</p>
            <p>{rowErrors?.accountName?.message}</p>
            <p className="col-span-2">{rowErrors?.amount?.message}</p>
          </div>
        )}
      </div>

      <ExternalDocuments
        form={form}
        index={index}
        row={row}
        side={side}
        error={documentsError}
        canAdd={canAddDocuments}
        onDismissErrors={clearDocumentErrors}
      />
    </div>
  );
}
