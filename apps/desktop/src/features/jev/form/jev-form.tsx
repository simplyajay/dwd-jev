import type { JournalType } from "@dwd-jev/shared";
import { type ReactNode, useId } from "react";
import { Controller, type UseFormReturn, useWatch } from "react-hook-form";
import { DatePicker } from "@/components/form/date-picker";
import { dismissOn } from "@/components/form/dismiss-on";
import { FormAlert } from "@/components/form/form-alert";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JOURNAL_LABELS } from "../labels";
import { AccountEntries } from "./account-entries";
import { type JevFormValues, JOURNAL_FIELDS, switchJournal } from "./jev-form-values";
import { SupportingDocuments } from "./supporting-documents";

const JOURNAL_ORDER: JournalType[] = ["ckdj", "cdj", "crj", "msij", "gj"];

type DateFieldName = "jevDate" | "dvDate" | "adaDate" | "checkDate";

/** The DV/ADA/Check number-and-date pairs, as they appear for each journal. */
const REFERENCE_FIELDS = [
  { number: "dvNumber", date: "dvDate", label: "DV" },
  { number: "adaNumber", date: "adaDate", label: "ADA" },
  { number: "checkNumber", date: "checkDate", label: "Check" },
] as const;

interface JevFormProps {
  form: UseFormReturn<JevFormValues>;
  onSubmit: (values: JevFormValues) => Promise<void>;
  submitLabel: string;
  submitError: string | null;
  onDismissSubmitError: () => void;
}

/** The JEV fields for the picked journal; only the journal is editable until one is picked. */
export function JevForm({
  form,
  onSubmit,
  submitLabel,
  submitError,
  onDismissSubmitError,
}: JevFormProps) {
  const { control, register, clearErrors, formState } = form;
  const { errors, isSubmitting } = formState;
  const journalType = useWatch({ control, name: "journalType" }) || undefined;
  const journalFields = journalType ? JOURNAL_FIELDS[journalType] : [];
  const hasPayee = journalFields.includes("payeeName");

  const field = (name: "jevNumber" | "payeeName" | "dvNumber" | "adaNumber" | "checkNumber") => ({
    ...register(name),
    ...dismissOn(() => clearErrors(name)),
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}
      onFocus={onDismissSubmitError}
      className="min-w-0"
    >
      {/* Everything is locked while saving. */}
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-6">
        <FormSection title="Voucher">
          <div className="grid grid-cols-3 gap-4">
            <JournalSelect form={form} />
            <TextField
              label="JEV No."
              disabled={!journalType}
              error={errors.jevNumber}
              {...field("jevNumber")}
            />
            <DateField form={form} name="jevDate" label="JEV date" disabled={!journalType} />
          </div>

          {REFERENCE_FIELDS.some((pair) => journalFields.includes(pair.number)) && (
            <div className="grid grid-cols-4 gap-4">
              {REFERENCE_FIELDS.filter((pair) => journalFields.includes(pair.number)).map(
                (pair) => (
                  <ReferencePair key={pair.label} pair={pair} form={form} field={field} />
                ),
              )}
            </div>
          )}

          <fieldset disabled={!journalType} className="grid min-w-0 grid-cols-3 gap-4">
            <DescriptionField form={form} className={hasPayee ? "col-span-2" : "col-span-3"} />
            {hasPayee && (
              <TextField
                label="Payee"
                optional={journalType === "gj"}
                error={errors.payeeName}
                {...field("payeeName")}
              />
            )}
          </fieldset>
        </FormSection>

        <FormSection title="Accounts and explanation">
          <fieldset disabled={!journalType} className="min-w-0">
            <AccountEntries form={form} />
          </fieldset>
        </FormSection>

        <FormSection title="Supporting documents">
          <fieldset disabled={!journalType} className="min-w-0">
            <SupportingDocuments form={form} journalType={journalType} />
          </fieldset>
        </FormSection>

        <div className="flex items-center justify-end gap-4">
          <FormAlert message={submitError} />
          <Button type="submit" disabled={!journalType || isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="font-medium text-base">{title}</h2>
      {children}
    </section>
  );
}

function JournalSelect({ form }: { form: UseFormReturn<JevFormValues> }) {
  const id = useId();
  const error = form.formState.errors.journalType;

  return (
    <Controller
      control={form.control}
      name="journalType"
      render={({ field }) => (
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={id}>Journal</FieldLabel>
          <Select
            value={field.value}
            onValueChange={(value) => {
              // Also clears all errors.
              form.reset(switchJournal(form.getValues(), value as JournalType), {
                keepDefaultValues: true,
              });
            }}
          >
            <SelectTrigger id={id} variant="field" aria-invalid={!!error}>
              <SelectValue placeholder="Select journal" />
            </SelectTrigger>
            <SelectContent>
              {JOURNAL_ORDER.map((journal) => (
                <SelectItem key={journal} value={journal}>
                  {JOURNAL_LABELS[journal]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[error]} />
        </Field>
      )}
    />
  );
}

interface DateFieldProps {
  form: UseFormReturn<JevFormValues>;
  name: DateFieldName;
  label: string;
  disabled?: boolean;
}

function DateField({ form, name, label, disabled }: DateFieldProps) {
  const id = useId();
  const error = form.formState.errors[name];

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <DatePicker
            id={id}
            value={field.value}
            onChange={field.onChange}
            invalid={!!error}
            disabled={disabled}
            onClick={() => form.clearErrors(name)}
          />
          <FieldError errors={[error]} />
        </Field>
      )}
    />
  );
}

function ReferencePair({
  pair,
  form,
  field,
}: {
  pair: (typeof REFERENCE_FIELDS)[number];
  form: UseFormReturn<JevFormValues>;
  field: (name: (typeof REFERENCE_FIELDS)[number]["number"]) => object;
}) {
  return (
    <>
      <TextField
        label={`${pair.label} No.`}
        error={form.formState.errors[pair.number]}
        {...field(pair.number)}
      />
      <DateField form={form} name={pair.date} label={`${pair.label} date`} />
    </>
  );
}

function DescriptionField({
  form,
  className,
}: {
  form: UseFormReturn<JevFormValues>;
  className: string;
}) {
  const id = useId();
  const error = form.formState.errors.description;

  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={id}>Description</FieldLabel>
      <Textarea
        id={id}
        rows={3}
        aria-invalid={!!error}
        className="disabled:cursor-default"
        {...form.register("description")}
        {...dismissOn(() => form.clearErrors("description"))}
      />
      <FieldError errors={[error]} />
    </Field>
  );
}

/** Brings the first invalid field or message into view after a failed submit. */
function scrollToFirstError() {
  requestAnimationFrame(() => {
    document
      .querySelector("[aria-invalid='true'], [data-form-error]")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
