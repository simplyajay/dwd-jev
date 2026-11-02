import type { Jev } from "@dwd-jev/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError, api } from "@/lib/api";
import { toDateOnly } from "@/lib/dates";
import { JevCreatePage } from "./jev-create-page";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { jevs: { create: vi.fn() } } };
});

// Radix uses pointer capture and scrollIntoView, and the router scrolls the window; jsdom has none.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
window.scrollTo = () => {};

const today = new Date();
// The 15th of the calendar's opening month: never repeated as an outside day.
const PICKED_DATE = toDateOnly(new Date(today.getFullYear(), today.getMonth(), 15));

const CREATED: Jev = {
  id: "00000000-0000-4000-8000-0000000000b1",
  journalType: "gj",
  jevNumber: "claude-test-jev-1",
  jevDate: PICKED_DATE,
  dvNumber: null,
  dvDate: null,
  adaNumber: null,
  adaDate: null,
  checkNumber: null,
  checkDate: null,
  payeeName: null,
  description: "Claude test entry",
  createdAt: new Date(),
  createdBy: "00000000-0000-4000-8000-000000000001",
  lastUpdatedAt: new Date(),
  lastUpdatedBy: "00000000-0000-4000-8000-000000000001",
  deletedAt: null,
  deletedBy: null,
};

function renderCreatePage() {
  const rootRoute = createRootRoute({ component: Outlet });
  const appRoute = createRoute({ getParentRoute: () => rootRoute, id: "_app" });
  const listRoute = createRoute({
    getParentRoute: () => appRoute,
    path: "/jevs/",
    component: () => <p>The list</p>,
  });
  const createPageRoute = createRoute({
    getParentRoute: () => appRoute,
    path: "/jevs/new",
    component: JevCreatePage,
  });
  const viewRoute = createRoute({
    getParentRoute: () => appRoute,
    path: "/jevs/$jevId/",
    component: () => <p>Viewing the JEV</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      appRoute.addChildren([listRoute, createPageRoute, viewRoute]),
    ]),
    history: createMemoryHistory({ initialEntries: ["/jevs/new"] }),
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

async function pickJournal(user: UserEvent, label: string) {
  await user.click(await screen.findByRole("combobox", { name: "Journal" }));
  await user.click(await screen.findByRole("option", { name: label }));
}

async function pickDate(user: UserEvent, fieldName: string) {
  await user.click(screen.getByRole("button", { name: fieldName }));
  await user.click(within(await screen.findByRole("grid")).getByText("15"));
}

/** Types into an amount box and leaves it, which is when the amount is taken. */
async function typeAmount(user: UserEvent, label: string, amount: string) {
  await user.type(screen.getByRole("textbox", { name: label }), amount);
  await user.tab();
}

async function fillBalancedGeneralJournal(user: UserEvent) {
  await pickJournal(user, "[GJ] General Journal");
  await user.type(screen.getByLabelText("JEV No."), "claude-test-jev-1");
  await pickDate(user, "JEV date");
  await user.type(screen.getByLabelText("Description"), "Claude test entry");
  await user.type(screen.getByRole("textbox", { name: "Account code, row 1" }), "1-01");
  await user.type(screen.getByRole("textbox", { name: "Account name, row 1" }), "Cash");
  await typeAmount(user, "Debit, row 1", "1234.5");
  await user.type(screen.getByRole("textbox", { name: "Account code, row 2" }), "4-01");
  await user.type(screen.getByRole("textbox", { name: "Account name, row 2" }), "Income");
  await typeAmount(user, "Credit, row 2", "1,234.50");
}

beforeEach(() => {
  vi.mocked(api.jevs.create).mockReset().mockResolvedValue(CREATED);
});

describe("JevCreatePage", () => {
  it("keeps everything but the journal disabled until one is picked", async () => {
    renderCreatePage();

    expect(await screen.findByLabelText("JEV No.")).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Account code, row 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Create JEV" })).toBeDisabled();
  });

  it("shows each journal's own fields, and clears them on switching", async () => {
    const user = userEvent.setup();
    renderCreatePage();

    await pickJournal(user, "[CKDJ] Check Disbursement Journal");
    await user.type(screen.getByLabelText("JEV No."), "claude-test-jev-1");
    await user.type(screen.getByLabelText("DV No."), "DV-1");
    expect(screen.getByLabelText("Check No.")).toBeInTheDocument();
    expect(screen.queryByLabelText("ADA No.")).not.toBeInTheDocument();

    await pickJournal(user, "[CDJ] Cash Disbursement Journal");

    expect(screen.getByLabelText("DV No.")).toHaveValue("");
    expect(screen.getByLabelText("ADA No.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Check No.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("JEV No.")).toHaveValue("claude-test-jev-1");
  });

  it("puts each amount on the side it was typed in, and totals both sides", async () => {
    const user = userEvent.setup();
    renderCreatePage();
    await pickJournal(user, "[GJ] General Journal");

    await typeAmount(user, "Debit, row 1", "1500");
    await typeAmount(user, "Credit, row 2", "1000.25");

    expect(screen.getByRole("textbox", { name: "Debit, row 1" })).toHaveValue("1,500.00");
    expect(screen.getByTestId("total-debit")).toHaveTextContent("1,500.00");
    expect(screen.getByTestId("total-credit")).toHaveTextContent("1,000.25");

    // Typing in the other column moves the amount there.
    await typeAmount(user, "Credit, row 1", "500");
    expect(screen.getByRole("textbox", { name: "Debit, row 1" })).toHaveValue("");
    expect(screen.getByTestId("total-credit")).toHaveTextContent("1,500.25");
  });

  it("sends the typed dates and peso amounts, then offers what to do next", async () => {
    const user = userEvent.setup();
    renderCreatePage();
    await fillBalancedGeneralJournal(user);

    await user.click(screen.getByRole("button", { name: "Create JEV" }));

    expect(api.jevs.create).toHaveBeenCalledWith({
      journalType: "gj",
      jevNumber: "claude-test-jev-1",
      jevDate: PICKED_DATE,
      description: "Claude test entry",
      accountingEntries: [
        {
          accountCode: "1-01",
          accountName: "Cash",
          entryType: "debit",
          amount: 1234.5,
          externalDocumentEntries: [],
        },
        {
          accountCode: "4-01",
          accountName: "Income",
          entryType: "credit",
          amount: 1234.5,
          externalDocumentEntries: [],
        },
      ],
      supportingDocuments: [],
    });
    const dialog = await screen.findByRole("dialog", { name: "JEV created" });
    expect(dialog).toHaveTextContent("JEV claude-test-jev-1 was saved.");
    expect(screen.getByLabelText("JEV No.")).toHaveValue("");

    await user.click(within(dialog).getByRole("link", { name: "View JEV" }));
    expect(await screen.findByText("Viewing the JEV")).toBeInTheDocument();
  });

  it("clears all of an account row's errors when any of its fields is focused", async () => {
    const user = userEvent.setup();
    renderCreatePage();
    await pickJournal(user, "[GJ] General Journal");

    await user.click(screen.getByRole("button", { name: "Create JEV" }));
    expect(await screen.findAllByText("Please enter account code.")).toHaveLength(2);
    expect(screen.getAllByText("Enter debit or credit.")).toHaveLength(2);

    await user.click(screen.getByRole("textbox", { name: "Account name, row 1" }));

    // Row 1's code, name and amount messages are gone; row 2 keeps its own.
    expect(screen.getAllByText("Please enter account code.")).toHaveLength(1);
    expect(screen.getAllByText("Please enter account name.")).toHaveLength(1);
    expect(screen.getAllByText("Enter debit or credit.")).toHaveLength(1);
  });

  it("refuses an unbalanced voucher without sending it", async () => {
    const user = userEvent.setup();
    renderCreatePage();
    await fillBalancedGeneralJournal(user);
    await typeAmount(user, "Credit, row 2", "1");

    await user.click(screen.getByRole("button", { name: "Create JEV" }));

    expect(await screen.findByText("Debit and credit must be balanced.")).toBeInTheDocument();
    expect(api.jevs.create).not.toHaveBeenCalled();
  });

  it("shows when external documents don't add up to their account", async () => {
    const user = userEvent.setup();
    renderCreatePage();
    await fillBalancedGeneralJournal(user);
    await user.click(
      screen.getAllByRole("button", { name: "Add external document" })[0] as HTMLElement,
    );
    await user.type(
      screen.getByRole("textbox", { name: "Document no., external document 1, row 1" }),
      "PO-1",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Document name, external document 1, row 1" }),
      "Supplier",
    );
    await typeAmount(user, "Debit, external document 1, row 1", "1000");

    await user.click(screen.getByRole("button", { name: "Create JEV" }));

    expect(
      await screen.findByText("External documents must total the account's debit."),
    ).toBeInTheDocument();
    expect(api.jevs.create).not.toHaveBeenCalled();
  });

  it("starts a supporting document on the journal's first allowed type", async () => {
    const user = userEvent.setup();
    renderCreatePage();
    await pickJournal(user, "[CKDJ] Check Disbursement Journal");

    await user.click(screen.getByRole("button", { name: "Add document" }));

    expect(screen.getByRole("combobox", { name: "Type, document 1" })).toHaveTextContent(
      "[PO] Purchase Order",
    );
  });

  it("picks a supporting document's date inside the table", async () => {
    const user = userEvent.setup();
    renderCreatePage();
    await pickJournal(user, "[CKDJ] Check Disbursement Journal");
    await user.click(screen.getByRole("button", { name: "Add document" }));

    await pickDate(user, "Date, document 1");

    expect(screen.getByRole("button", { name: "Date, document 1" })).not.toHaveTextContent(
      "Select date",
    );
  });

  it("locks the whole form, and Back to list, while saving", async () => {
    vi.mocked(api.jevs.create).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderCreatePage();
    await fillBalancedGeneralJournal(user);

    await user.click(screen.getByRole("button", { name: "Create JEV" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Journal" })).toBeDisabled();
    expect(screen.getByLabelText("JEV No.")).toBeDisabled();
    expect(screen.getByRole("button", { name: "JEV date" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Debit, row 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add account" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Back to list" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows a taken JEV number under its field", async () => {
    vi.mocked(api.jevs.create).mockRejectedValue(
      new ApiError(409, "JEV number already exists.", "jevNumber"),
    );
    const user = userEvent.setup();
    renderCreatePage();
    await fillBalancedGeneralJournal(user);

    await user.click(screen.getByRole("button", { name: "Create JEV" }));

    expect(await screen.findByText("JEV number already exists.")).toBeInTheDocument();
    expect(screen.getByLabelText("JEV No.")).toHaveAttribute("aria-invalid", "true");
  });
});
