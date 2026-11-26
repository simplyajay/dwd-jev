import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api";
import { SAVED_JEV } from "@/test/jev-fixtures";
import { renderRoutes, stubPage } from "@/test/render-routes";
import { JevViewPage } from "./jev-view-page";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { jevs: { get: vi.fn(), delete: vi.fn() } } };
});

function renderViewPage() {
  return renderRoutes(
    [
      { path: "/jevs/", component: stubPage("The list") },
      { path: "/jevs/$jevId/", component: JevViewPage },
      { path: "/jevs/$jevId/edit", component: stubPage("Editing") },
    ],
    `/jevs/${SAVED_JEV.id}`,
  );
}

/** The value shown under a field's label in the read-only view. */
const shownValue = (label: string) =>
  screen.getByText(label, { selector: "p" }).nextElementSibling?.textContent;

beforeEach(() => {
  vi.mocked(api.jevs.get).mockReset().mockResolvedValue(SAVED_JEV);
  vi.mocked(api.jevs.delete).mockReset().mockResolvedValue(undefined);
});

describe("JevViewPage", () => {
  it("shows the voucher, accounts and supporting documents read-only", async () => {
    renderViewPage();

    expect(await screen.findByText("JEV No.", { selector: "p" })).toBeVisible();
    expect(shownValue("JEV No.")).toBe("claude-test-jev-2");
    expect(shownValue("Journal")).toBe("[CKDJ] Check Disbursement Journal");
    expect(shownValue("DV No.")).toBe("DV-001");
    expect(shownValue("Check date")).toBe("Nov 04, 2026");
    expect(shownValue("Payee")).toBe("Claude Supplies");
    expect(shownValue("Description")).toBe("Claude test purchase");
    expect(screen.queryByText("ADA No.")).not.toBeInTheDocument();

    expect(screen.getByText("Office Supplies")).toBeVisible();
    expect(screen.getByText("INV-7")).toBeVisible();
    expect(screen.getByTestId("total-debit")).toHaveTextContent("1,500.00");
    expect(screen.getByTestId("total-credit")).toHaveTextContent("1,500.00");
    expect(screen.getByText("[PO] Purchase Order")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("says who created it, and leaves out the last update when there was none", async () => {
    renderViewPage();

    expect(await screen.findByText(/Created by/)).toHaveTextContent(
      /Created by Test 1, Claude on Nov 03, 2026/,
    );
    expect(screen.queryByText(/Last updated/)).not.toBeInTheDocument();
  });

  it("opens the edit page from Edit", async () => {
    const user = userEvent.setup();
    renderViewPage();

    await user.click(await screen.findByRole("link", { name: "Edit" }));

    expect(await screen.findByText(`Editing ${SAVED_JEV.id}`)).toBeInTheDocument();
  });

  it("deletes after the password and returns to the list", async () => {
    const user = userEvent.setup();
    renderViewPage();

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete JEV claude-test-jev-2" });
    await user.type(within(dialog).getByLabelText("Your password"), "claude-test-password-1");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("The list")).toBeInTheDocument();
    expect(api.jevs.delete).toHaveBeenCalledWith(SAVED_JEV.id, {
      password: "claude-test-password-1",
    });
  });
});
