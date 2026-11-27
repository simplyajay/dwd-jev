import type { SafeUserType, UserDetail } from "@dwd-jev/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api";
import { MemberDetail } from "./member-detail";

let currentUser: SafeUserType;
vi.mock("@/features/auth/auth-context", () => ({ useCurrentUser: () => currentUser }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { users: { get: vi.fn(), setStatus: vi.fn(), setRole: vi.fn() } } };
});

const base = {
  middleName: null,
  email: null,
  position: "Test account",
  isSystemAccount: false,
  createdAt: new Date(2026, 9, 21),
  approvedAt: new Date(2026, 9, 21),
} as const;

const ADMIN: SafeUserType = {
  ...base,
  id: "00000000-0000-4000-8000-000000000001",
  firstName: "Claude",
  lastName: "Admin",
  username: "claudeadmin",
  role: "administrator",
  status: "active",
  approvedBy: null,
};

function member(overrides: Partial<UserDetail> = {}): UserDetail {
  return {
    ...base,
    id: "00000000-0000-4000-8000-000000000002",
    firstName: "Claude",
    lastName: "Test 1",
    username: "claude-test-username-1",
    role: "user",
    status: "active",
    approvedBy: { id: ADMIN.id, fullName: "Admin, Claude", isSystemAccount: false },
    ...overrides,
  };
}

async function show(detail: UserDetail) {
  vi.mocked(api.users.get).mockResolvedValue(detail);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemberDetail id={detail.id} onBack={() => {}} />
    </QueryClientProvider>,
  );
  await screen.findByText(`@${detail.username}`);
}

beforeEach(() => {
  currentUser = ADMIN;
});

describe("MemberDetail actions", () => {
  it("lets an admin deactivate an active non-admin, with their password", async () => {
    vi.mocked(api.users.setStatus).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await show(member());

    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    await user.type(screen.getByLabelText("Your password"), "claudeadmin");
    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(api.users.setStatus).toHaveBeenCalledWith(member().id, {
      status: "inactive",
      password: "claudeadmin",
    });
  });

  it("offers Activate for an inactive non-admin", async () => {
    await show(member({ status: "inactive" }));

    expect(screen.getByRole("button", { name: "Activate" })).toBeInTheDocument();
  });

  it("explains instead of offering actions on another administrator", async () => {
    await show(member({ role: "administrator" }));

    expect(screen.getByText("Only the system account can change an administrator.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
  });

  it("lets an admin make a non-admin an administrator, warning it is one-way", async () => {
    vi.mocked(api.users.setRole).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await show(member());

    await user.click(screen.getByRole("button", { name: "Make administrator" }));
    expect(screen.getByRole("status")).toHaveTextContent("Only the system account can undo this.");
    await user.type(screen.getByLabelText("Your password"), "claudeadmin");
    await user.click(screen.getByRole("button", { name: "Make administrator" }));

    expect(api.users.setRole).toHaveBeenCalledWith(member().id, {
      role: "administrator",
      password: "claudeadmin",
    });
  });

  it("lets the system account change an administrator back to a user", async () => {
    currentUser = { ...ADMIN, isSystemAccount: true };
    await show(member({ role: "administrator" }));

    expect(screen.getByRole("button", { name: "Change to user" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeInTheDocument();
  });

  it("shows no actions on your own account", async () => {
    await show({ ...member(), ...ADMIN, approvedBy: null });

    expect(screen.queryByText("Manage")).not.toBeInTheDocument();
  });

  it("shows non-admins the details only", async () => {
    currentUser = { ...ADMIN, id: "00000000-0000-4000-8000-000000000003", role: "user" };
    await show(member());

    expect(screen.getByText("Test account")).toBeInTheDocument();
    expect(screen.queryByText("Manage")).not.toBeInTheDocument();
  });
});
