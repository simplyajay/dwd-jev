import type { PaginatedResult } from "@dwd-jev/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useParams,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api, type JevListRow } from "@/lib/api";
import { JevListSearchSchema } from "../jev-list-search";
import { JevListPage } from "./jev-list-page";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { jevs: { listByMonth: vi.fn(), delete: vi.fn() } } };
});

// Radix Select and the router use browser APIs jsdom lacks.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
window.scrollTo = () => {};

const JEV: JevListRow = {
  id: "00000000-0000-4000-8000-0000000000a1",
  jevNumber: "2026-01-0001",
  journalType: "gj",
  jevDate: "2026-01-28",
};

function result(
  items: JevListRow[],
  overrides: Partial<PaginatedResult<JevListRow>> = {},
): PaginatedResult<JevListRow> {
  return { items, total: items.length, page: 1, pageSize: 20, totalPages: 1, ...overrides };
}

function ViewStub() {
  const { jevId } = useParams({ strict: false });
  return <p>Viewing {jevId}</p>;
}

function EditStub() {
  const { jevId } = useParams({ strict: false });
  return <p>Editing {jevId}</p>;
}

/** The real list page under the same route IDs it reads, with stand-ins for the others. */
function renderList(url = "/jevs?year=2026&month=1") {
  const rootRoute = createRootRoute({ component: Outlet });
  const appRoute = createRoute({ getParentRoute: () => rootRoute, id: "_app" });
  const listRoute = createRoute({
    getParentRoute: () => appRoute,
    path: "/jevs/",
    validateSearch: JevListSearchSchema,
    component: JevListPage,
  });
  const viewRoute = createRoute({
    getParentRoute: () => appRoute,
    path: "/jevs/$jevId/",
    component: ViewStub,
  });
  const editRoute = createRoute({
    getParentRoute: () => appRoute,
    path: "/jevs/$jevId/edit",
    component: EditStub,
  });
  const createPageRoute = createRoute({
    getParentRoute: () => appRoute,
    path: "/jevs/new",
    component: () => <p>Creating a JEV</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      appRoute.addChildren([listRoute, createPageRoute, viewRoute, editRoute]),
    ]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
  return router;
}

const lastListInput = () => vi.mocked(api.jevs.listByMonth).mock.lastCall?.[0];

beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.jevs.listByMonth)
    .mockReset()
    .mockResolvedValue(result([JEV]));
  vi.mocked(api.jevs.delete).mockReset().mockResolvedValue(undefined);
});

describe("JevListPage", () => {
  it("keeps the headers, fills the body with a spinner, and locks every control, while a page loads", async () => {
    const user = userEvent.setup();
    vi.mocked(api.jevs.listByMonth).mockImplementation(async ({ page }) =>
      result([JEV], { page, total: 45, totalPages: 3 }),
    );
    renderList();
    await screen.findByText("2026-01-0001");
    vi.mocked(api.jevs.listByMonth).mockReturnValue(new Promise(() => {}));

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.getByRole("status", { name: "Loading journal entry vouchers" })).toBeVisible();
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Date",
      "JEV No.",
      "Journal",
      "Description",
      "Actions",
    ]);
    expect(screen.queryByText("2026-01-0001")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Year" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Month" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Rows per page" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "New JEV" })).not.toHaveAttribute("aria-disabled");
    for (const name of ["First page", "Previous page", "Next page", "Last page"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
  });

  it("shows Date, JEV No., Journal, Description and Actions, in that order", async () => {
    vi.mocked(api.jevs.listByMonth).mockResolvedValue(
      result([
        JEV,
        { ...JEV, id: "00000000-0000-4000-8000-0000000000a2", description: "Claude test entry" },
      ]),
    );
    renderList();

    await screen.findAllByText("2026-01-0001");
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Date",
      "JEV No.",
      "Journal",
      "Description",
      "Actions",
    ]);
    const [withoutDescription, withDescription] = screen
      .getAllByRole("row")
      .slice(1) as HTMLElement[];
    expect(within(withoutDescription as HTMLElement).getAllByRole("cell")[0]).toHaveTextContent(
      "Jan 28, 2026",
    );
    // Until the backend sends it, the cell shows a dash.
    expect(within(withoutDescription as HTMLElement).getAllByRole("cell")[3]).toHaveTextContent(
      "—",
    );
    expect(within(withDescription as HTMLElement).getAllByRole("cell")[3]).toHaveTextContent(
      "Claude test entry",
    );
  });

  it("opens on the current month, page 1, 20 rows", async () => {
    renderList("/jevs");

    await screen.findByText("2026-01-0001");
    const today = new Date();
    expect(lastListInput()).toEqual({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      page: 1,
      pageSize: 20,
    });
  });

  it("goes back to page 1 when the month changes", async () => {
    const user = userEvent.setup();
    const router = renderList("/jevs?year=2026&month=1&page=2");
    vi.mocked(api.jevs.listByMonth).mockResolvedValue(
      result([JEV], { page: 2, total: 25, totalPages: 2 }),
    );
    await screen.findByText("2026-01-0001");

    await user.click(screen.getByRole("combobox", { name: "Month" }));
    await user.click(await screen.findByRole("option", { name: "All months" }));

    expect(router.state.location.search).toEqual({ year: 2026, month: 0 });
    expect(lastListInput()).toMatchObject({ year: 2026, month: 0, page: 1 });
  });

  it("pages forward and back", async () => {
    const user = userEvent.setup();
    vi.mocked(api.jevs.listByMonth).mockImplementation(async ({ page }) =>
      result([JEV], { page, total: 45, totalPages: 3 }),
    );
    renderList();
    await screen.findByText("Showing 1–20 of 45");

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await screen.findByText("Showing 21–40 of 45");
    await user.click(screen.getByRole("button", { name: "Last page" }));
    await screen.findByText("Page 3 of 3");

    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
  });

  it("keeps the shown range until the new page size's rows arrive", async () => {
    const user = userEvent.setup();
    vi.mocked(api.jevs.listByMonth).mockResolvedValue(result([JEV], { total: 45, totalPages: 3 }));
    renderList();
    await screen.findByText("Showing 1–20 of 45");
    vi.mocked(api.jevs.listByMonth).mockReturnValue(new Promise(() => {}));

    await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
    await user.click(await screen.findByRole("option", { name: "50" }));

    expect(screen.getByRole("combobox", { name: "Rows per page" })).toHaveTextContent("50");
    expect(screen.getByText("Showing 1–20 of 45")).toBeInTheDocument();
  });

  it("remembers the page size and goes back to page 1", async () => {
    const user = userEvent.setup();
    renderList("/jevs?year=2026&month=1&page=2");
    vi.mocked(api.jevs.listByMonth).mockImplementation(async ({ page, pageSize }) =>
      result([JEV], { page, pageSize, total: 120, totalPages: Math.ceil(120 / pageSize) }),
    );
    await screen.findByText("2026-01-0001");

    await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
    await user.click(await screen.findByRole("option", { name: "50" }));

    await screen.findByText("Showing 1–50 of 120");
    expect(localStorage.getItem("jev.list-page-size")).toBe("50");
  });

  it("moves to the last page when the page is past the end", async () => {
    vi.mocked(api.jevs.listByMonth).mockImplementation(async ({ page }) =>
      result([JEV], { page, total: 25, totalPages: 2 }),
    );
    const router = renderList("/jevs?year=2026&month=1&page=9");

    await screen.findByText("Page 2 of 2");
    expect(router.state.location.search).toMatchObject({ page: 2 });
  });

  it("names the period when it has no JEVs", async () => {
    vi.mocked(api.jevs.listByMonth).mockResolvedValue(result([]));
    renderList("/jevs?year=2025&month=3");

    expect(await screen.findByText("No JEVs for March 2025.")).toBeInTheDocument();
  });

  it("offers Try again when the list fails to load", async () => {
    vi.mocked(api.jevs.listByMonth).mockRejectedValue(new Error("down"));
    renderList();

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("opens the create page from New JEV even while the list is loading", async () => {
    vi.mocked(api.jevs.listByMonth).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByRole("link", { name: "New JEV" }));

    expect(await screen.findByText("Creating a JEV")).toBeInTheDocument();
  });

  it("opens the create page from New JEV", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByRole("link", { name: "New JEV" }));

    expect(await screen.findByText("Creating a JEV")).toBeInTheDocument();
  });

  it("opens the JEV when its row is clicked", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByText("2026-01-0001"));

    expect(await screen.findByText(`Viewing ${JEV.id}`)).toBeInTheDocument();
  });

  it("opens Edit from the actions menu without opening the row", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByRole("button", { name: "Actions for JEV 2026-01-0001" }));
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));

    expect(await screen.findByText(`Editing ${JEV.id}`)).toBeInTheDocument();
  });

  it("deletes from the actions menu after the password, staying on the list", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByRole("button", { name: "Actions for JEV 2026-01-0001" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete JEV 2026-01-0001" });
    expect(dialog).toHaveTextContent("This can't be undone.");
    await user.type(within(dialog).getByLabelText("Your password"), "claude-test-password-1");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(api.jevs.delete).toHaveBeenCalledWith(JEV.id, { password: "claude-test-password-1" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("2026-01-0001")).toBeInTheDocument();
  });
});
