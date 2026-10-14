import type { SafeUserType } from "@dwd-jev/shared";
import {
  BookTextIcon,
  type LucideIcon,
  SlidersHorizontalIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { z } from "zod";

export const SettingsTabIdSchema = z.enum([
  "account",
  "organization",
  "general",
  "chart-of-accounts",
]);
export type SettingsTabId = z.infer<typeof SettingsTabIdSchema>;

export const DEFAULT_SETTINGS_TAB: SettingsTabId = "general";

interface SettingsTab {
  id: SettingsTabId;
  label: string;
  icon: LucideIcon;
  /** Whether the tab is shown at all. Finer role checks live inside each panel. */
  isAvailable: (user: SafeUserType) => boolean;
}

export const SETTINGS_TABS: SettingsTab[] = [
  { id: "account", label: "Account", icon: UserIcon, isAvailable: () => true },
  { id: "organization", label: "Organization", icon: UsersIcon, isAvailable: () => true },
  { id: "general", label: "General", icon: SlidersHorizontalIcon, isAvailable: () => true },
  {
    id: "chart-of-accounts",
    label: "Chart of accounts",
    icon: BookTextIcon,
    isAvailable: () => true,
  },
];

export function isAdmin(user: SafeUserType): boolean {
  return user.role === "administrator";
}
