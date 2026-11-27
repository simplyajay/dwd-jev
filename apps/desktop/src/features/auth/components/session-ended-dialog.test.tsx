import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AuthState } from "../auth-context";
import { SessionEndedDialog } from "./session-ended-dialog";

const leaveEndedSession = vi.fn();
let state: AuthState;
vi.mock("../auth-context", () => ({ useAuth: () => ({ state, leaveEndedSession }) }));

const USER = {
  id: "00000000-0000-4000-8000-000000000001",
  firstName: "Claude",
  middleName: null,
  lastName: "Test 1",
  username: "claude-test-username-1",
  email: null,
  role: "user",
  position: "Test account",
  status: "active",
  isSystemAccount: false,
  approvedBy: null,
  approvedAt: null,
  createdAt: new Date(2026, 9, 21),
} as const;

describe("SessionEndedDialog", () => {
  it("stays hidden while the session is fine", () => {
    state = { status: "signed-in", user: USER };
    render(<SessionEndedDialog />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("focuses Go to login, which leaves the session", async () => {
    state = { status: "signed-in", user: USER, sessionEnded: true };
    const user = userEvent.setup();
    render(<SessionEndedDialog />);

    const button = screen.getByRole("button", { name: "Go to login" });
    expect(button).toHaveFocus();
    await user.click(button);

    expect(leaveEndedSession).toHaveBeenCalledTimes(1);
  });

  it("can't be dismissed with Escape or a click outside", async () => {
    state = { status: "signed-in", user: USER, sessionEnded: true };
    const user = userEvent.setup();
    render(<SessionEndedDialog />);

    await user.keyboard("{Escape}");
    // userEvent refuses to click through the modal (the page behind it is
    // pointer-events: none), so dispatch the press Radix listens for directly.
    fireEvent.pointerDown(document.body);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});
