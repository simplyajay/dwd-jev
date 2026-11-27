import { cn } from "@/lib/utils";

interface FormAlertProps {
  message: string | null;
  /** "info" for notices that aren't failures. */
  tone?: "error" | "info";
}

/** A form-level message. Renders nothing without one. */
export function FormAlert({ message, tone = "error" }: FormAlertProps) {
  if (!message) return null;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        tone === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "bg-muted/60 text-muted-foreground",
      )}
    >
      {message}
    </div>
  );
}
