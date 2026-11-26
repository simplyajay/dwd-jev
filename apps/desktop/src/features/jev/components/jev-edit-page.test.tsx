import { screen } from "@testing-library/react";
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

async function changePayee(user: ReturnType<typeof userEvent.setup>) {
  const payee = await screen.findByLabelText("Payee");
  await user.clear(payee);
  await user.type(payee, "Claude Office Depot");
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
    expect(
      screen.getByRole("textbox", { name: "Document no., external document 1, row 1" }),
    ).toHaveValue("INV-7");
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

  it("sends the whole JEV in pesos and opens it after saving", async () => {
    const user = userEvent.setup();
    renderEditPage();
    await changePayee(user);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

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
            externalDocumentEntries: [
              { documentNumber: "INV-7", documentName: "Supplier invoice", amount: 1500 },
            ],
          }),
          expect.objectContaining({ accountCode: "1-01", entryType: "credit", amount: 1500 }),
        ],
        supportingDocuments: [
          { documentCode: "po", documentNumber: "PO-12", documentDate: "2026-11-01" },
        ],
      }),
    );
  });

  it("shows a taken DV number under its field", async () => {
    vi.mocked(api.jevs.update).mockRejectedValue(
      new ApiError(409, "DV number is already in use.", "dvNumber"),
    );
    const user = userEvent.setup();
    renderEditPage();
    await changePayee(user);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("DV number is already in use.")).toBeVisible();
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
