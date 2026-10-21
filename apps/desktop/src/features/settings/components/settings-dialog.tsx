import { Tabs } from "radix-ui";
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/features/auth/auth-context";
import { ChartOfAccountsSettings } from "@/features/chart-of-accounts/components/chart-of-accounts-settings";
import { ThemeSettings } from "@/features/theme/components/theme-settings";
import { AccountSettings } from "@/features/users/components/account-settings";
import { OrganizationSettings } from "@/features/users/components/organization-settings";
import {
  DEFAULT_SETTINGS_TAB,
  SETTINGS_TABS,
  type SettingsTabId,
  SettingsTabIdSchema,
} from "../settings-tabs";
import { useSettingsDialog } from "../use-settings-dialog";
import { SettingsSection } from "./settings-section";

const PANELS: Record<SettingsTabId, () => ReactNode> = {
  account: AccountSettings,
  organization: OrganizationSettings,
  general: GeneralSettings,
  "chart-of-accounts": ChartOfAccountsSettings,
};

function GeneralSettings() {
  return (
    <SettingsSection title="Appearance" description="Choose how JEV looks on this device.">
      <ThemeSettings />
    </SettingsSection>
  );
}

export function SettingsDialog() {
  const user = useCurrentUser();
  const { activeTab, isOpen, switchTab, close } = useSettingsDialog();

  const tabs = SETTINGS_TABS.filter((tab) => tab.isAvailable(user));
  // A URL can name a tab this user can't see; fall back rather than show nothing.
  const currentTab =
    tabs.find((tab) => tab.id === activeTab) ?? tabs.find((tab) => tab.id === DEFAULT_SETTINGS_TAB);
  if (!currentTab) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="h-[80svh] w-[80vw] gap-0 overflow-hidden p-0 sm:max-w-none">
        <Tabs.Root
          orientation="vertical"
          value={currentTab.id}
          onValueChange={(value) => switchTab(SettingsTabIdSchema.parse(value))}
          className="grid h-full min-h-0 grid-cols-[14rem_1fr]"
        >
          <div className="flex flex-col gap-4 border-r bg-muted/60 p-4">
            <DialogTitle className="px-2 pt-1">Settings</DialogTitle>
            <DialogDescription className="sr-only">
              Manage your account, organization, appearance and chart of accounts.
            </DialogDescription>

            <Tabs.List aria-label="Settings sections" className="flex flex-col gap-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <Tabs.Trigger
                  key={id}
                  value={id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=active]:bg-primary data-[state=active]:font-medium data-[state=active]:text-primary-foreground [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  <Icon aria-hidden />
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>

          {tabs.map(({ id, label }) => {
            const Panel = PANELS[id];
            return (
              <Tabs.Content
                key={id}
                value={id}
                className="min-h-0 overflow-y-auto p-6 pr-12 outline-none"
              >
                <h2 className="mb-6 font-semibold text-lg">{label}</h2>
                <Panel />
              </Tabs.Content>
            );
          })}
        </Tabs.Root>
      </DialogContent>
    </Dialog>
  );
}
