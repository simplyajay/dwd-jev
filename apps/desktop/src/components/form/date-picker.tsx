import { CalendarIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  type FieldVariant,
  fieldHoverClassName,
  inputClassName,
  tableFieldClassName,
} from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateOnly, parseDateOnly, toDateOnly } from "@/lib/dates";
import { cn } from "@/lib/utils";

const FIRST_YEAR = 2000;

interface DatePickerProps
  extends Omit<ComponentProps<"button">, "value" | "onChange" | "aria-invalid"> {
  /** A date-only string ("2026-12-30"), or "" for none. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  variant?: FieldVariant;
}

/** A text-field-looking button that opens a calendar. Other props go to the button. */
export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  invalid,
  variant = "default",
  className,
  ...buttonProps
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateOnly(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-invalid={invalid}
          className={cn(
            variant === "table" ? tableFieldClassName : [inputClassName, fieldHoverClassName],
            "flex items-center gap-2 text-left",
            !selected && "text-placeholder",
            className,
          )}
          {...buttonProps}
        >
          <CalendarIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          {selected ? formatDateOnly(value) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          startMonth={new Date(FIRST_YEAR, 0)}
          endMonth={new Date(new Date().getFullYear() + 5, 11)}
          onSelect={(date) => {
            if (date) onChange(toDateOnly(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
