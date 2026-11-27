import { cn } from "cn";
import type * as React from "react";
import { inputClassName } from "@/components/ui/input";

/** Input's styles, grown to fit its text instead of one line high. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(inputClassName, "flex field-sizing-content h-auto min-h-16 py-2", className)}
      {...props}
    />
  );
}

export { Textarea };
