import type { AuditLog, PaginatedResult } from "@dwd-jev/shared";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api";
import { CLAUDE } from "@/test/jev-fixtures";
import { renderRoutes, stubPage } from "@/test/render-routes";
import { AuditLogSearchSchema } from "../audit-log-search";
import { AuditLogListPage } from "./audit-log-list-page";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { auditLogs: { list: vi.fn() } } };
});

const LOG: AuditLog = {
  id: "00000000-0000-4000-8000-0000000000b1",
  documentType: "jev",
  documentId: "00000000-0000-4000-8000-0000000000aa",
  action: "update",
  description: "Updated JEV claude-test-jev-2 (was claude-test-jev-1)",
  actor: CLAUDE,
  createdAt: new Date("2026-11-05T02:30:00Z"),
};

function result(
  items: AuditLog[],
  overrides: Partial<PaginatedResult<AuditLog>> = {},
): PaginatedResult<AuditLog> {
  return { items, total: items.length, page: 1, pageSize: 20, totalPages: 1, ...overrides };
}

function renderList(url = "/audit-logs") {
  return renderRoutes(
    [
      { path: "/audit-logs/", component: AuditLogListPage, validateSearch: AuditLogSearchSchema },
      { path: "/audit-logs/$action/$documentId", component: stubPage("Entry") },
    ],
    url,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.auditLogs.list)
    .mockReset()
    .mockResolvedValue(result([LOG]));
});

describe("AuditLogListPage", () => {
  it("shows Date & time, User, Action and Description", async () => {
    renderList();

    await screen.findByText(LOG.description);
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Date & time",
      "User",
      "Action",
      "Description",
      "Actions",
    ]);
    const cells = within(screen.getAllByRole("row")[1] as HTMLElement).getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("Nov 05, 2026");
    expect(cells[1]).toHaveTextContent("Test 1, ClaudeTest Accountant");
    expect(cells[2]).toHaveTextContent("Updated");
  });

  it("asks for the page in the URL, 20 rows at a time", async () => {
    renderList("/audit-logs?page=2");

    await screen.findByText(LOG.description);
    expect(api.auditLogs.list).toHaveBeenCalledWith({ page: 2, pageSize: 20 });
  });

  it("opens the entry by its action and document when its row is clicked", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByText(LOG.description));

    expect(await screen.findByText(`Entry update ${LOG.documentId}`)).toBeInTheDocument();
  });

  it("says when there's no activity", async () => {
    vi.mocked(api.auditLogs.list).mockResolvedValue(result([]));
    renderList();

    expect(await screen.findByText("No activity yet.")).toBeVisible();
  });
});
