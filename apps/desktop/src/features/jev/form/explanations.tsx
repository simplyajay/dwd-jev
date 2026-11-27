import type { EntryType } from "@dwd-jev/shared";
import { CornerDownRightIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { AmountInput } from "@/components/form/amount-input";
import { dismissOn } from "@/components/form/dismiss-on";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type AccountRow, type JevFormValues, newExplanationRow } from "./jev-form-values";
import { ACCOUNT_GRID, SHOW_ON_SUB_ROW_HOVER, SUB_ROW } from "./row-styles";

const SIDES: readonly EntryType[] = ["debit", "credit"];
const SIDE_LABELS: Record<EntryType, string> = { debit: "Debit", credit: "Credit" };

// Smaller than the account's own fields, so explanations read as detail.
const SMALL_FIELD = "h-8 md:text-[0.8125rem]";

interface ExplanationsProps {
  form: UseFormReturn<JevFormValues>;
  /** The account's row index. */
  index: number;
  row: AccountRow | undefined;
  side: EntryType | null;
  error: string | undefined;
  canAdd: boolean;
  onDismissErrors: () => void;
}

/** An account's explanations and the Add link. */
export function Explanations({
  form,
  index,
  row,
  side,
  error,
  canAdd,
  onDismissErrors,
}: ExplanationsProps) {
  const path = `accountingEntries.${index}` as const;
  const explanations = useFieldArray({
    control: form.control,
    name: `${path}.explanations`,
  });
  const rowNumber = index + 1;

  // Explanations take the row's side; before it has one, the column typed in sets it.
  const commitAmount = (
    explanationIndex: number,
    column: EntryType,
    amount: number | undefined,
  ) => {
    const dirty = { shouldDirty: true };
    form.setValue(`${path}.explanations.${explanationIndex}.amount`, amount, dirty);
    if (amount !== undefined && side === null) form.setValue(`${path}.entryType`, column, dirty);
  };

  return (
    <>
      {explanations.fields.length > 0 && (
        // Starts at the account name and is dashed, so it isn't mistaken for a row divider.
        <div aria-hidden className={cn(ACCOUNT_GRID, "pt-1")}>
          <div className="col-span-4 col-start-2 border-table-divider border-t border-dashed" />
        </div>
      )}
      {explanations.fields.map((explanation, explanationIndex) => {
        const explanationPath = `${path}.explanations.${explanationIndex}` as const;
        const label = `explanation ${explanationIndex + 1}, row ${rowNumber}`;
        return (
          <div key={explanation.id} className={cn(ACCOUNT_GRID, SUB_ROW)}>
            <span />
            {/* The arrow starts where the account name field does. */}
            <div className="flex items-start gap-2">
              <CornerDownRightIcon
                aria-hidden
                className="mt-2 size-4 shrink-0 text-muted-foreground"
              />
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                <Input
                  variant="table"
                  className={SMALL_FIELD}
                  placeholder="Reference"
                  aria-label={`Reference, ${label}`}
                  aria-invalid={!!error}
                  {...form.register(`${explanationPath}.reference`)}
                  {...dismissOn(onDismissErrors)}
                />
                <Input
                  variant="table"
                  className={SMALL_FIELD}
                  placeholder="Description"
                  aria-label={`Description, ${label}`}
                  aria-invalid={!!error}
                  {...form.register(`${explanationPath}.description`)}
                  {...dismissOn(onDismissErrors)}
                />
              </div>
            </div>
            {SIDES.map((column) =>
              side === null || side === column ? (
                <AmountInput
                  variant="table"
                  key={column}
                  className={SMALL_FIELD}
                  aria-label={`${SIDE_LABELS[column]}, ${label}`}
                  value={row?.explanations[explanationIndex]?.amount}
                  invalid={!!error}
                  onFocus={onDismissErrors}
                  onCommit={(amount) => commitAmount(explanationIndex, column, amount)}
                />
              ) : (
                <span key={column} />
              ),
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${label}`}
              className={cn(
                SHOW_ON_SUB_ROW_HOVER,
                "place-self-center text-muted-foreground hover:text-destructive",
              )}
              onClick={() => {
                explanations.remove(explanationIndex);
                onDismissErrors();
              }}
            >
              <Trash2Icon />
            </Button>
          </div>
        );
      })}

      {(error || canAdd) && (
        <div className={cn(ACCOUNT_GRID, "pt-1")}>
          <div className="col-span-3 col-start-2 flex flex-col items-start gap-1">
            {error && (
              <p data-form-error className="text-destructive text-sm">
                {error}
              </p>
            )}
            {canAdd && (
              <Button
                type="button"
                variant="link"
                size="xs"
                className="px-0"
                onClick={() => explanations.append(newExplanationRow())}
              >
                <PlusIcon />
                {explanations.fields.length > 0 ? "Add another explanation" : "Add explanation"}
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
