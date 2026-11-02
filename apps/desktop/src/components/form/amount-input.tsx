import { type ClipboardEvent, type ComponentProps, type KeyboardEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatPesos, parsePesos } from "@/lib/money";
import { cn } from "@/lib/utils";

interface AmountInputProps
  extends Omit<ComponentProps<typeof Input>, "value" | "onChange" | "onBlur" | "aria-invalid"> {
  /** Pesos, or undefined for empty. */
  value: number | undefined;
  /** Called on blur with the parsed amount, so tabbing through never rewrites a value. */
  onCommit: (value: number | undefined) => void;
  invalid?: boolean;
}

/** A peso amount: free typing while focused, formatted ("1,234.50") otherwise. */
export function AmountInput({
  value,
  onCommit,
  invalid,
  className,
  onFocus,
  ...inputProps
}: AmountInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Input
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      aria-invalid={invalid}
      className={cn("text-right tabular-nums", className)}
      value={draft ?? (value === undefined ? "" : formatPesos(value))}
      onFocus={(event) => {
        setDraft(value === undefined ? "" : String(value));
        onFocus?.(event);
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft !== null) onCommit(parsePesos(draft));
        setDraft(null);
      }}
      onKeyDown={blockNonNumericKeys}
      onPaste={blockNonNumericPaste}
      {...inputProps}
    />
  );
}

function blockNonNumericKeys(event: KeyboardEvent<HTMLInputElement>) {
  // Named keys (Tab, arrows, Backspace...) and shortcuts (Ctrl+A, Ctrl+V) pass.
  if (event.key.length > 1 || event.ctrlKey || event.metaKey || event.altKey) return;
  if (/\d/.test(event.key)) return;
  if (event.key === "." && !event.currentTarget.value.includes(".")) return;
  event.preventDefault();
}

function blockNonNumericPaste(event: ClipboardEvent<HTMLInputElement>) {
  if (!/^[\d,]*\.?\d*$/.test(event.clipboardData.getData("text").trim())) event.preventDefault();
}
