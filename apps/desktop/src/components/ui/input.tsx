import { cn } from "cn";
import type * as React from "react";

export const inputClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-placeholder focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/35 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/30 dark:disabled:opacity-40 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

/** Hover for field-looking controls you click rather than type in (DatePicker, form Select). */
export const fieldHoverClassName = "hover:bg-muted/40 dark:hover:bg-input/50";

/** A field in an editable table: borderless and transparent, card colour on hover. */
export const tableFieldClassName = cn(
  inputClassName,
  "border-transparent bg-transparent hover:bg-card disabled:bg-transparent dark:bg-transparent dark:hover:bg-card dark:disabled:bg-transparent",
  // While its list or calendar is open (Select, DatePicker): ring as when focused.
  "data-[state=open]:bg-card data-[state=open]:ring-2 data-[state=open]:ring-ring/40",
);

export type FieldVariant = "default" | "table";

function Input({
  className,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & { variant?: FieldVariant }) {
  return (
    <input
      type={type}
      data-slot="input"
      autoComplete={type === "password" ? "new-password" : "off"}
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      className={cn(variant === "table" ? tableFieldClassName : inputClassName, className)}
      {...props}
    />
  );
}

export { Input };
