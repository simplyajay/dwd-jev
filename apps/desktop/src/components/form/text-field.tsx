import { type ComponentProps, type ReactNode, useId } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface TextFieldProps extends Omit<ComponentProps<typeof Input>, "aria-invalid"> {
  label: string;
  /** Marks the label "(optional)". Purely visual -- validation lives in the schema. */
  optional?: boolean;
  description?: ReactNode;
  /** Shown under the input; also flags it invalid. Accepts a react-hook-form field error. */
  error?: { message?: string };
}

/**
 * Label + input + error, wired for accessibility. Every other prop goes to the
 * input, so it takes react-hook-form's register() and any handler directly:
 *
 *   <TextField
 *     label="Username"
 *     error={errors.username}
 *     {...form.register("username")}
 *     onFocus={() => form.clearErrors("username")}
 *   />
 */
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
