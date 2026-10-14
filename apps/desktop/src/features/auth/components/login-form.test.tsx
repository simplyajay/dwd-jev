import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import { LoginForm } from "./login-form";

const login = vi.fn();

vi.mock("../auth-context", () => ({ useAuth: () => ({ login }) }));
// The form only needs <Link> to render; a plain anchor avoids standing up a router.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const WRONG_CREDENTIALS = "Invalid username or password.";

async function submitWrongCredentials() {
  login.mockRejectedValueOnce(new ApiError(401, WRONG_CREDENTIALS));
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText("Username"), "someone");
  await user.type(screen.getByLabelText("Password"), "wrong-password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByText(WRONG_CREDENTIALS);
  return user;
}

beforeEach(() => {
  login.mockReset();
  localStorage.clear();
});

describe("LoginForm sign-in error", () => {
  it("shows the backend's message when sign-in fails", async () => {
    await submitWrongCredentials();

    expect(screen.getByRole("alert")).toHaveTextContent(WRONG_CREDENTIALS);
  });

  it.each(["Username", "Password"])("hides it when the %s field is focused", async (label) => {
    const user = await submitWrongCredentials();

    await user.click(screen.getByLabelText(label));

    expect(screen.queryByText(WRONG_CREDENTIALS)).not.toBeInTheDocument();
  });

  it("hides it on typing when Enter submitted the form and the field kept focus", async () => {
    login.mockRejectedValueOnce(new ApiError(401, WRONG_CREDENTIALS));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("Username"), "someone");
    await user.type(screen.getByLabelText("Password"), "wrong-password{Enter}");
    await screen.findByText(WRONG_CREDENTIALS);
    expect(screen.getByLabelText("Password")).toHaveFocus();

    await user.keyboard("x");

    expect(screen.queryByText(WRONG_CREDENTIALS)).not.toBeInTheDocument();
  });

  it("hides it on clicking the field that already has focus", async () => {
    login.mockRejectedValueOnce(new ApiError(401, WRONG_CREDENTIALS));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("Username"), "someone");
    await user.type(screen.getByLabelText("Password"), "wrong-password{Enter}");
    await screen.findByText(WRONG_CREDENTIALS);

    await user.click(screen.getByLabelText("Password"));

    expect(screen.queryByText(WRONG_CREDENTIALS)).not.toBeInTheDocument();
  });

  it("stays visible until the user acts", async () => {
    login.mockRejectedValueOnce(new ApiError(401, WRONG_CREDENTIALS));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("Username"), "someone");
    await user.type(screen.getByLabelText("Password"), "wrong-password{Enter}");

    expect(await screen.findByText(WRONG_CREDENTIALS)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveValue("wrong-password");
  });

  it("keeps it when something other than a field is focused", async () => {
    const user = await submitWrongCredentials();

    await user.click(screen.getByRole("checkbox", { name: "Remember username" }));

    expect(screen.getByText(WRONG_CREDENTIALS)).toBeInTheDocument();
  });
});

describe("LoginForm field errors", () => {
  it("clears only the focused field's error", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByText("Please enter your username.");
    await user.click(screen.getByLabelText("Username"));

    expect(screen.queryByText("Please enter your username.")).not.toBeInTheDocument();
    expect(screen.getByText("Please enter your password.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});
