import type { JevRevision } from "@dwd-jev/shared";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api";
import { CLAUDE, SAVED_JEV, toSnapshot } from "@/test/jev-fixtures";
import { renderRoutes, stubPage } from "@/test/render-routes";
import { AuditLogDetailPage } from "./audit-log-detail-page";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { jevs: { get: vi.fn(), getRevision: vi.fn() } } };
});

const REVISION_ID = "00000000-0000-4000-8000-0000000000aa";
const AFTER = toSnapshot(SAVED_JEV);
const BEFORE = {
  ...AFTER,
  payeeName: "Claude Old Supplier",
  supportingDocumentEntries: [
    ...(AFTER.supportingDocumentEntries ?? []),
    {
      id: "00000000-0000-4000-8000-0000000000f2",
      jevId: SAVED_JEV.id,
      sortOrder: 1,
      documentNumber: "OR-5",
      documentCode: "or" as const,
      documentName: "Official Receipt",
      documentDate: "2026-11-01",
    },
  ],
};

function revision(overrides: Partial<JevRevision>): JevRevision {
  return {
    id: REVISION_ID,
    jevId: SAVED_JEV.id,
    beforeData: BEFORE,
    afterData: AFTER,
    updatedBy: CLAUDE,
    updatedAt: new Date("2026-11-05T02:30:00Z"),
    ...overrides,
  };
}

function renderDetail(action: string, documentId = REVISION_ID) {
  return renderRoutes(
    [
      { path: "/audit-logs/", component: stubPage("The audit log") },
      { path: "/audit-logs/$action/$documentId", component: AuditLogDetailPage },
    ],
    `/audit-logs/${action}/${documentId}`,
  );
}

/** The value shown under a field's label in the read-only view. */
const shownValue = (label: string) =>
  screen.getByText(label, { selector: "p" }).nextElementSibling?.textContent;

beforeEach(() => {
  vi.mocked(api.jevs.getRevision).mockReset().mockResolvedValue(revision({}));
  vi.mocked(api.jevs.get)
    .mockReset()
    .mockResolvedValue({ ...SAVED_JEV, deletedAt: new Date("2026-11-06T03:00:00Z") });
});

describe("AuditLogDetailPage", () => {
  it("shows an update's new version with what changed marked", async () => {
    renderDetail("update");

    expect(await screen.findByText(/Updated by/)).toHaveTextContent(
      "Updated by Test 1, Claude on Nov 05, 2026",
    );
    expect(api.jevs.getRevision).toHaveBeenCalledWith(REVISION_ID);
    expect(shownValue("Payee")).toBe("Claude Supplies (changed)");
    expect(shownValue("DV No.")).toBe("DV-001");
    expect(screen.queryByText("OR-5")).not.toBeInTheDocument();
    expect(screen.getByText("Added row")).toBeVisible();
  });

  it("switches to the old version, with removed rows marked", async () => {
    const user = userEvent.setup();
    renderDetail("update");

    await user.click(await screen.findByRole("radio", { name: "Before" }));

    expect(shownValue("Payee")).toBe("Claude Old Supplier (changed)");
    expect(screen.getByText("OR-5").parentElement).toHaveTextContent("OR-5 (removed)");
    expect(screen.getByText("Removed row")).toBeVisible();
  });

  it("says when an update changed nothing", async () => {
    vi.mocked(api.jevs.getRevision).mockResolvedValue(revision({ beforeData: AFTER }));
    renderDetail("update");

    expect(await screen.findByText("Nothing was changed in this update.")).toBeVisible();
  });

  it("shows a create as the JEV it created, without a version switch", async () => {
    vi.mocked(api.jevs.getRevision).mockResolvedValue(revision({ beforeData: null }));
    renderDetail("create");

    expect(await screen.findByText(/Created by/)).toHaveTextContent("Created by Test 1, Claude");
    expect(screen.queryByRole("radio", { name: "Before" })).not.toBeInTheDocument();
    expect(shownValue("Payee")).toBe("Claude Supplies");
  });

  it("shows a delete with who did it and when, from the clicked log row", async () => {
    const router = renderDetail("update");
    await screen.findByText(/Updated by/);

    await router.navigate({
      to: "/audit-logs/$action/$documentId",
      params: { action: "delete", documentId: SAVED_JEV.id },
      state: { auditLogEntry: { actorName: "Test 2, Claude", at: "2026-11-07T04:00:00Z" } },
    });

    expect(await screen.findByText(/Deleted by/)).toHaveTextContent(
      "Deleted by Test 2, Claude on Nov 07, 2026",
    );
    expect(api.jevs.get).toHaveBeenCalledWith(SAVED_JEV.id, { includeDeleted: true });
    expect(shownValue("JEV No.")).toBe("claude-test-jev-2");
  });

  it("falls back to the JEV's delete time when opened without its log row", async () => {
    renderDetail("delete", SAVED_JEV.id);

    expect(await screen.findByText(/Deleted on/)).toHaveTextContent("Deleted on Nov 06, 2026");
    expect(screen.queryByText(/Deleted by/)).not.toBeInTheDocument();
  });

  it("returns to the audit log", async () => {
    const user = userEvent.setup();
    renderDetail("update");
    await screen.findByText(/Updated by/);

    await user.click(screen.getByRole("link", { name: "Back to audit log" }));

    expect(await screen.findByText("The audit log")).toBeInTheDocument();
  });
});
