import type { Status } from "@dwd-jev/shared";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "../user-labels";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium text-xs">
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          status === "active" ? "bg-brand-mark" : "bg-muted-foreground/50",
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
