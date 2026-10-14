import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/auth-context";
import {
  SettingsPlaceholder,
  SettingsSection,
} from "@/features/settings/components/settings-section";
import { isAdmin } from "@/features/settings/settings-tabs";

export function ChartOfAccountsSettings() {
  const canImport = isAdmin(useCurrentUser());

  return (
    <>
      <SettingsSection title="Import" description="Replace the chart of accounts from a file.">
        {/* Import isn't built yet, so the button stays disabled for everyone. */}
        <Button variant="secondary" disabled aria-describedby="coa-import-note">
          <UploadIcon />
          Import chart of accounts
        </Button>
        <p id="coa-import-note" className="text-muted-foreground text-sm">
          {canImport
            ? "Importing isn't available yet."
            : "Only administrators can import the chart of accounts."}
        </p>
      </SettingsSection>

      <SettingsSection title="Accounts" description="Account codes and names in use.">
        <SettingsPlaceholder>The chart of accounts will appear here.</SettingsPlaceholder>
      </SettingsSection>
    </>
  );
}
