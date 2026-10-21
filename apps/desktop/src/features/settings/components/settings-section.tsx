import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="space-y-4 border-b py-6 first:pt-0 last:border-b-0 last:pb-0">
      <div className="space-y-1">
        <h3 className="font-medium text-base">{title}</h3>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Stand-in body for a section whose feature isn't built yet. */
export function SettingsPlaceholder({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
      {children}
    </div>
  );
}

/** Stand-in body for a section whose data failed to load. */
export function SettingsLoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <SettingsPlaceholder>
      <p>{errorMessage(error)}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        Try again
      </Button>
    </SettingsPlaceholder>
  );
}
