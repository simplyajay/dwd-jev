import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import { PasswordConfirmDialog } from "./password-confirm-dialog";

function renderDialog(onConfirm: (password: string) => Promise<unknown>) {
  const onOpenChange = vi.fn();
  render(
    <PasswordConfirmDialog
      open
      onOpenChange={onOpenChange}
      title="Approve account"
      description="Enter your password to approve Test, Claude."
      confirmLabel="Approve"
      onConfirm={onConfirm}
    />,
  );
  return { onOpenChange, password: screen.getByLabelText("Your password") };
}

const confirm = () => userEvent.click(screen.getByRole("button", { name: "Approve" }));

describe("PasswordConfirmDialog", () => {
  it("runs the action with the password and closes", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { onOpenChange, password } = renderDialog(onConfirm);

    await userEvent.type(password, "secret");
    await confirm();

    expect(onConfirm).toHaveBeenCalledWith("secret");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("asks for a password before running the action", async () => {
    const onConfirm = vi.fn();
    renderDialog(onConfirm);

    await confirm();

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText("Please enter your password.")).toBeInTheDocument();
  });

  it("shows a wrong password on the field, stays open, and clears it on typing", async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValue(new ApiError(403, "Incorrect password.", "password"));
    const { onOpenChange, password } = renderDialog(onConfirm);

    await userEvent.type(password, "wrong");
    await confirm();

    expect(password).toHaveAccessibleDescription("Incorrect password.");
    expect(onOpenChange).not.toHaveBeenCalled();

    await userEvent.type(password, "x");

    expect(screen.queryByText("Incorrect password.")).not.toBeInTheDocument();
  });

  it("shows other failures above the form", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new ApiError(404, "User not found."));
    const { password } = renderDialog(onConfirm);

    await userEvent.type(password, "secret");
    await confirm();

    expect(password).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("User not found.");
  });
});
