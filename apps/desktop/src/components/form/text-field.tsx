import { type ComponentProps, type ReactNode, useId } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface TextFieldProps extends Omit<ComponentProps<typeof Input>, "aria-invalid"> {
  label: string;
  /** Shows "(optional)" on the label; visual only. */
  optional?: boolean;
  description?: ReactNode;
  /** Shown under the input; also marks it invalid. */
  error?: { message?: string };
}

/** Label, input and error wired for accessibility. Other props go to the input. */
export function TextField({
  label,
  optional,
  description,
  error,
  id,
  className,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;
  const describedBy = [description && descriptionId, error && errorId].filter(Boolean).join(" ");

  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={inputId}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </FieldLabel>
      <Input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
      <FieldError id={errorId} errors={[error]} />
    </Field>
  );
}
