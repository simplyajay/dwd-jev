import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { DEFAULT_SETTINGS_TAB, type SettingsTabId } from "./settings-tabs";

const appRoute = getRouteApi("/_app");

/**
 * The settings dialog's state lives in the URL (`?settings=<tab>`) so any
 * screen can link straight to a tab and Back closes the dialog.
 */
export function useSettingsDialog() {
  const activeTab = appRoute.useSearch({ select: (search) => search.settings });
  // Deliberately not appRoute.useNavigate(): "." must resolve against the
  // page the user is on, not the pathless /_app layout (which resolves to "/").
  const navigate = useNavigate();

  const setTab = (settings: SettingsTabId | undefined, replace: boolean) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, settings }), replace });

  return {
    activeTab,
    isOpen: activeTab !== undefined,
    open: (tab: SettingsTabId = DEFAULT_SETTINGS_TAB) => setTab(tab, false),
    /** Switching tabs replaces history, so Back closes rather than rewinds tabs. */
    switchTab: (tab: SettingsTabId) => setTab(tab, true),
    close: () => setTab(undefined, true),
  };
}
