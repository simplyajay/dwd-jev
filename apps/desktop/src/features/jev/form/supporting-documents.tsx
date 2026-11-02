import type { DocumentCode, JournalType } from "@dwd-jev/shared";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Controller, type UseFormReturn, useFieldArray, useFormState } from "react-hook-form";
import { DatePicker } from "@/components/form/date-picker";
import { dismissOn } from "@/components/form/dismiss-on";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DOCUMENT_LABELS } from "../labels";
import {
  ALLOWED_DOCUMENT_CODES,
  type JevFormValues,
  newSupportingDocumentRow,
} from "./jev-form-values";
import {
  EDITABLE_ROW,
  SUPPORTING_DOCUMENT_GRID as GRID,
  ROW_DIVIDERS,
  SHOW_ON_ROW_HOVER,
} from "./row-styles";

interface SupportingDocumentsProps {
  form: UseFormReturn<JevFormValues>;
  /** Undefined until a journal is picked. */
  journalType: JournalType | undefined;
}

/** Documents behind the voucher, limited to the types the journal accepts. */
export function SupportingDocuments({ form, journalType }: SupportingDocumentsProps) {
  const { control, register, clearErrors } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "supportingDocuments" });
  const { errors } = useFormState({ control, name: "supportingDocuments" });
  const allowed = journalType ? ALLOWED_DOCUMENT_CODES[journalType] : [];

  return (
    <div>
      {fields.length > 0 && (
        <div
          className={cn(
            GRID,
            "border-table-divider border-b px-1 pb-1 font-medium text-table-header text-xs uppercase tracking-wide",
          )}
        >
          <span>Document no.</span>
          <span>Type</span>
          <span>Date</span>
        </div>
      )}

      <div className={ROW_DIVIDERS}>
        {fields.map((field, index) => {
          const path = `supportingDocuments.${index}` as const;
          const rowErrors = errors.supportingDocuments?.[index];
          const rowNumber = index + 1;
          const hasErrors =
            !!rowErrors?.documentNumber || !!rowErrors?.documentCode || !!rowErrors?.documentDate;

          return (
            // Any interaction in the row clears its errors.
            <div
              key={field.id}
              className={EDITABLE_ROW}
              {...dismissOn(() =>
                clearErrors([
                  `${path}.documentNumber`,
                  `${path}.documentCode`,
                  `${path}.documentDate`,
                ]),
              )}
            >
              <div className={GRID}>
                <Input
                  variant="table"
                  aria-label={`Document no., document ${rowNumber}`}
                  aria-invalid={!!rowErrors?.documentNumber}
                  {...register(`${path}.documentNumber`)}
                />
                <Controller
                  control={control}
                  name={`${path}.documentCode`}
                  render={({ field: codeField }) => (
                    <Select
                      value={codeField.value}
                      onValueChange={(value) => codeField.onChange(value as DocumentCode)}
                    >
                      <SelectTrigger
                        aria-label={`Type, document ${rowNumber}`}
                        aria-invalid={!!rowErrors?.documentCode}
                        variant="table"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allowed.map((code) => (
                          <SelectItem key={code} value={code}>
                            {DOCUMENT_LABELS[code]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Controller
                  control={control}
                  name={`${path}.documentDate`}
                  render={({ field: dateField }) => (
                    <DatePicker
                      variant="table"
                      aria-label={`Date, document ${rowNumber}`}
                      value={dateField.value}
                      onChange={dateField.onChange}
                      invalid={!!rowErrors?.documentDate}
                    />
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove document ${rowNumber}`}
                  className={cn(
                    SHOW_ON_ROW_HOVER,
                    "place-self-center text-muted-foreground hover:text-destructive",
                  )}
                  onClick={() => remove(index)}
                >
                  <Trash2Icon />
                </Button>
              </div>
              {hasErrors && (
                // Each message sits under its own field.
                <div data-form-error className={cn(GRID, "pt-1 text-destructive text-sm")}>
                  <p>{rowErrors?.documentNumber?.message}</p>
                  <p>{rowErrors?.documentCode?.message}</p>
                  <p>{rowErrors?.documentDate?.message}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!journalType}
        className={cn(fields.length > 0 && "mt-3")}
        onClick={() => journalType && append(newSupportingDocumentRow(journalType))}
      >
        <PlusIcon />
        Add document
      </Button>
    </div>
  );
}
