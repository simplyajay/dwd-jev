import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError, api } from "@/lib/api";
import { SAVED_JEV } from "@/test/jev-fixtures";
import { renderRoutes, stubPage } from "@/test/render-routes";
import { JevEditPage } from "./jev-edit-page";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { jevs: { get: vi.fn(), update: vi.fn() } } };
});

function renderEditPage() {
  return renderRoutes(
    [
      { path: "/jevs/", component: stubPage("The list") },
      { path: "/jevs/$jevId/", component: stubPage("Viewing") },
      { path: "/jevs/$jevId/edit", component: JevEditPage },
    ],
    `/jevs/${SAVED_JEV.id}/edit`,
  );
}

type User = ReturnType<typeof userEvent.setup>;

async function changePayee(user: User) {
  const payee = await screen.findByLabelText("Payee");
  await user.clear(payee);
  await user.type(payee, "Claude Office Depot");
}

/** Presses Save, then confirms with the password in the dialog it opens. */
async function saveWithPassword(user: User, password = "claude-test-password-1") {
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  const dialog = await screen.findByRole("dialog", {
    name: "Save changes to JEV claude-test-jev-2",
  });
  await user.type(within(dialog).getByLabelText("Your password"), password);
  await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
  return dialog;
}

beforeEach(() => {
  vi.mocked(api.jevs.get).mockReset().mockResolvedValue(SAVED_JEV);
  vi.mocked(api.jevs.update).mockReset().mockResolvedValue(SAVED_JEV);
});

describe("JevEditPage", () => {
  it("names the JEV being edited by its saved number and journal", async () => {
    const user = userEvent.setup();
    renderEditPage();
    await changePayee(user);
    await user.clear(screen.getByLabelText("JEV No."));
    await user.type(screen.getByLabelText("JEV No."), "claude-test-jev-9");

    expect(screen.getByText(/Editing JEV/)).toHaveTextContent(
      "Editing JEV claude-test-jev-2 · [CKDJ] Check Disbursement Journal",
    );
  });

  it("fills the form from the saved JEV", async () => {
    renderEditPage();

    expect(await screen.findByLabelText("JEV No.")).toHaveValue("claude-test-jev-2");
    expect(screen.getByRole("combobox", { name: "Journal" })).toHaveTextContent(
      "[CKDJ] Check Disbursement Journal",
    );
    expect(screen.getByLabelText("DV No.")).toHaveValue("DV-001");
    expect(screen.getByLabelText("Payee")).toHaveValue("Claude Supplies");
    expect(screen.getByRole("textbox", { name: "Debit, row 1" })).toHaveValue("1,500.00");
    expect(screen.getByRole("textbox", { name: "Credit, row 2" })).toHaveValue("1,500.00");
    expect(screen.getByRole("textbox", { name: "Reference, explanation 1, row 1" })).toHaveValue(
      "INV-7",
    );
    expect(screen.getByRole("textbox", { name: "Description, explanation 1, row 1" })).toHaveValue(
      "Supplier invoice",
    );
    expect(screen.getByRole("textbox", { name: "Document no., document 1" })).toHaveValue("PO-12");
  });

  it("keeps Save disabled until something changes", async () => {
    const user = userEvent.setup();
    renderEditPage();
    const save = await screen.findByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();

    await changePayee(user);

    expect(save).toBeEnabled();
  });

  it("asks for the password before saving", async () => {
    const user = userEvent.setup();
    renderEditPage();
    await changePayee(user);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByRole("dialog", { name: "Save changes to JEV claude-test-jev-2" }),
    ).toBeVisible();
    expect(api.jevs.update).not.toHaveBeenCalled();
  });

  it("sends the whole JEV in pesos with the password, and opens it after saving", async () => {
    const user = userEvent.setup();
    renderEditPage();
    await changePayee(user);
    const description = screen.getByRole("textbox", {
      name: "Description, explanation 1, row 1",
    });
    await user.clear(description);
    await user.type(description, "Claude test invoice");

    await saveWithPassword(user);

    expect(await screen.findByText(`Viewing ${SAVED_JEV.id}`)).toBeInTheDocument();
    expect(api.jevs.update).toHaveBeenCalledWith(
      SAVED_JEV.id,
      expect.objectContaining({
        journalType: "ckdj",
        jevNumber: "claude-test-jev-2",
        dvNumber: "DV-001",
        checkDate: "2026-11-04",
        payeeName: "Claude Office Depot",
        accountingEntries: [
          expect.objectContaining({
            accountCode: "5-02",
            entryType: "debit",
            amount: 1500,
            explanations: [
              { reference: "INV-7", description: "Claude test invoice", amount: 1500 },
            ],
          }),
          expect.objectContaining({ accountCode: "1-01", entryType: "credit", amount: 1500 }),
        ],
        supportingDocuments: [
          { documentCode: "po", documentNumber: "PO-12", documentDate: "2026-11-01" },
        ],
        password: "claude-test-password-1",
      }),
    );
  });

  it("shows a wrong password on the password field and stays on the form", async () => {
    vi.mocked(api.jevs.update).mockRejectedValue(
      new ApiError(403, "Incorrect password.", "password"),
    );
    const user = userEvent.setup();
    renderEditPage();
    await changePayee(user);

    const dialog = await saveWithPassword(user, "not-the-password");

    expect(await within(dialog).findByText("Incorrect password.")).toBeVisible();
    expect(within(dialog).getByLabelText("Your password")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText(`Viewing ${SAVED_JEV.id}`)).not.toBeInTheDocument();
  });

  it("disables Save and counts down after too many attempts", async () => {
    vi.mocked(api.jevs.update).mockRejectedValue(
      new ApiError(429, "Too many requests. Try again in 45 seconds.", undefined, 45),
    );
    const user = userEvent.setup();
    renderEditPage();
    await changePayee(user);

    await saveWithPassword(user);

    expect(await screen.findByText("Too many requests. Try again in 45 seconds.")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(api.jevs.update).toHaveBeenCalledTimes(1);
  });

  it("shows a taken DV number under its field", async () => {
    vi.mocked(api.jevs.update).mockRejectedValue(
      new ApiError(409, "DV number is already in use.", "dvNumber"),
    );
    const user = userEvent.setup();
    renderEditPage();
    await changePayee(user);

    await saveWithPassword(user);

    expect(await screen.findByText("DV number is already in use.")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("DV No.")).toHaveAttribute("aria-invalid", "true");
  });

  it("asks before leaving with unsaved changes", async () => {
    const user = userEvent.setup();
    renderEditPage();
    await changePayee(user);

    await user.click(screen.getByRole("link", { name: "Back to list" }));
    const dialog = await screen.findByRole("dialog", { name: "Discard unsaved changes?" });
    expect(dialog).toHaveTextContent("Your changes to this JEV haven't been saved.");
    await user.click(screen.getByRole("button", { name: "Keep editing" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Payee")).toHaveValue("Claude Office Depot");

    await user.click(screen.getByRole("link", { name: "Back to list" }));
    await user.click(await screen.findByRole("button", { name: "Discard" }));

    expect(await screen.findByText("The list")).toBeInTheDocument();
  });

  it("leaves without asking when nothing changed", async () => {
    const user = userEvent.setup();
    renderEditPage();

    await screen.findByLabelText("Payee");
    await user.click(screen.getByRole("link", { name: "Back to list" }));

    expect(await screen.findByText("The list")).toBeInTheDocument();
  });
});
