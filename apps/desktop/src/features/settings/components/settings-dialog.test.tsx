import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useReportUnsavedChanges } from "../unsaved-changes";
import { SettingsDialog } from "./settings-dialog";

const switchTab = vi.fn();
const close = vi.fn();
vi.mock("../use-settings-dialog", () => ({
  useSettingsDialog: () => ({ activeTab: "account", isOpen: true, switchTab, close }),
}));
vi.mock("@/features/auth/auth-context", () => ({ useCurrentUser: () => ({ role: "user" }) }));
vi.mock("@/features/users/components/account-settings", () => ({
  AccountSettings: function EditablePanel() {
    const [edited, setEdited] = useState(false);
    useReportUnsavedChanges("test-form", edited);
    return (
      <button type="button" onClick={() => setEdited(true)}>
        Make an edit
      </button>
    );
  },
}));
vi.mock("@/features/users/components/organization-settings", () => ({
  OrganizationSettings: () => null,
}));
vi.mock("@/features/chart-of-accounts/components/chart-of-accounts-settings", () => ({
  ChartOfAccountsSettings: () => null,
}));
vi.mock("@/features/theme/components/theme-settings", () => ({ ThemeSettings: () => null }));

describe("SettingsDialog unsaved changes", () => {
  it("switches tabs straight away when nothing is unsaved", async () => {
    const user = userEvent.setup();
    render(<SettingsDialog />);

    await user.click(screen.getByRole("tab", { name: "General" }));

    expect(switchTab).toHaveBeenCalledWith("general");
    expect(screen.queryByText("Discard unsaved changes?")).not.toBeInTheDocument();
  });

  it("asks before leaving the tab, and Keep editing stays", async () => {
    const user = userEvent.setup();
    render(<SettingsDialog />);

    await user.click(screen.getByRole("button", { name: "Make an edit" }));
    await user.click(screen.getByRole("tab", { name: "General" }));

    expect(screen.getByText("Discard unsaved changes?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(switchTab).not.toHaveBeenCalled();
  });

  it("asks before closing, and Discard closes", async () => {
    const user = userEvent.setup();
    render(<SettingsDialog />);

    await user.click(screen.getByRole("button", { name: "Make an edit" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Discard" }));

    expect(close).toHaveBeenCalledTimes(1);
  });
});
