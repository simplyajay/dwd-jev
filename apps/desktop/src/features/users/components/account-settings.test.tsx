import type { SafeUserType, UserDetail } from "@dwd-jev/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError, api } from "@/lib/api";
import { AccountSettings } from "./account-settings";

const updateSession = vi.fn();
let currentUser: SafeUserType;
vi.mock("@/features/auth/auth-context", () => ({
  useCurrentUser: () => currentUser,
  useAuth: () => ({ updateSession }),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { users: { updateProfile: vi.fn(), updateAccount: vi.fn() } } };
});

const USER: SafeUserType = {
  id: "00000000-0000-4000-8000-000000000001",
  firstName: "Claude",
  middleName: "M",
  lastName: "Test 1",
  username: "claude-test-username-1",
  email: null,
  role: "user",
  position: "Test account",
  status: "active",
  isSystemAccount: false,
  approvedBy: "00000000-0000-4000-8000-000000000009",
  approvedAt: new Date(2026, 9, 21),
  createdAt: new Date(2026, 9, 21),
};

const detail = (overrides: Partial<UserDetail> = {}): UserDetail => ({
  ...USER,
  approvedBy: {
    id: "00000000-0000-4000-8000-000000000009",
    fullName: "System",
    isSystemAccount: true,
  },
  ...overrides,
});

function renderTab() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <AccountSettings />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  currentUser = USER;
});

describe("Personal information", () => {
  it("sends a cleared middle name as null, updates the session and confirms", async () => {
    vi.mocked(api.users.updateProfile).mockResolvedValue(detail({ middleName: null }));
    const user = renderTab();

    await user.clear(screen.getByLabelText(/Middle name/));
    await user.click(screen.getAllByRole("button", { name: "Save changes" })[0] as HTMLElement);

    expect(api.users.updateProfile).toHaveBeenCalledWith({
      firstName: "Claude",
      middleName: null,
      lastName: "Test 1",
      position: "Test account",
    });
    expect(updateSession).toHaveBeenCalledWith({
      user: expect.objectContaining({ middleName: null, approvedBy: USER.approvedBy }),
    });
    expect(await screen.findByText("Changes saved.")).toBeInTheDocument();
  });
});

describe("Account information", () => {
  const save = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getAllByRole("button", { name: "Save changes" })[1] as HTMLElement);

  it("can't be saved until something other than the current password changes", async () => {
    const user = renderTab();
    const button = screen.getAllByRole("button", { name: "Save changes" })[1];

    await user.type(screen.getByLabelText("Current password"), "secret");
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/^Email/), "claude@example.com");
    expect(button).toBeEnabled();
  });

  it("asks for the current password", async () => {
    const user = renderTab();

    await user.type(screen.getByLabelText(/^Email/), "claude@example.com");
    await save(user);

    expect(screen.getByLabelText("Current password")).toHaveAccessibleDescription(
      /Please enter your current password\./,
    );
    expect(api.users.updateAccount).not.toHaveBeenCalled();
  });

  it("checks the new password against its confirmation", async () => {
    const user = renderTab();

    await user.type(screen.getByLabelText(/^New password/), "new-password-1");
    await user.type(screen.getByLabelText("Confirm new password"), "new-password-2");
    await user.type(screen.getByLabelText("Current password"), "secret");
    await save(user);

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("replaces the stored session with the tokens a password change returns", async () => {
    vi.mocked(api.users.updateAccount).mockResolvedValue({
      user: detail(),
      accessToken: "access-2",
      refreshToken: "refresh-2",
    });
    const user = renderTab();

    await user.type(screen.getByLabelText(/^New password/), "new-password-1");
    await user.type(screen.getByLabelText("Confirm new password"), "new-password-1");
    await user.type(screen.getByLabelText("Current password"), "secret");
    await save(user);

    expect(api.users.updateAccount).toHaveBeenCalledWith({
      username: USER.username,
      email: null,
      newPassword: "new-password-1",
      currentPassword: "secret",
    });
    expect(updateSession).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "access-2", refreshToken: "refresh-2" }),
    );
    expect(await screen.findByText("Changes saved.")).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toHaveValue("");
  });

  it.each([
    ["Current password", new ApiError(403, "Incorrect current password.", "currentPassword")],
    ["Username", new ApiError(403, "you cannot use this username")],
    ["Username", new ApiError(409, "Username is already taken.", "username")],
    [
      "New password",
      new ApiError(
        400,
        "New password must be different from your current password.",
        "newPassword",
      ),
    ],
  ])("shows the error on %s", async (label, error) => {
    vi.mocked(api.users.updateAccount).mockRejectedValue(error);
    const user = renderTab();

    await user.type(screen.getByLabelText(/^Email/), "claude@example.com");
    await user.type(screen.getByLabelText("Current password"), "wrong");
    await save(user);

    expect(await screen.findByText(error.message)).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(`^${label}`))).toHaveAttribute("aria-invalid", "true");
  });
});

describe("System account", () => {
  it("can only change its password", () => {
    currentUser = { ...USER, isSystemAccount: true };
    renderTab();

    expect(screen.getByText("The system account can only change its password.")).toBeVisible();
    for (const label of [
      /First name/,
      /Middle name/,
      /Last name/,
      /Position/,
      /Username/,
      /^Email/,
    ]) {
      expect(screen.getByLabelText(label)).toBeDisabled();
    }
    expect(screen.getByLabelText(/^New password/)).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "Save changes" })).toHaveLength(1);
  });
});
