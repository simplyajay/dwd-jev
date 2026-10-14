import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextField } from "./text-field";

describe("TextField", () => {
  it("associates the label with the input", () => {
    render(<TextField label="Username" />);

    expect(screen.getByLabelText("Username")).toBeInstanceOf(HTMLInputElement);
  });

  it("calls onFocus when the input is focused", async () => {
    const onFocus = vi.fn();
    render(<TextField label="Username" onFocus={onFocus} />);

    await userEvent.click(screen.getByLabelText("Username"));

    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it("shows the error and marks the input invalid", () => {
    render(<TextField label="Username" error={{ message: "Please enter a username." }} />);

    const input = screen.getByLabelText("Username");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a username.");
    expect(input).toHaveAccessibleDescription("Please enter a username.");
  });

  it("is not invalid without an error", () => {
    render(<TextField label="Username" />);

    expect(screen.getByLabelText("Username")).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("turns browser autocomplete and spellcheck off by default", () => {
    render(
      <>
        <TextField label="Username" />
        <TextField label="Password" type="password" />
      </>,
    );

    expect(screen.getByLabelText("Username")).toHaveAttribute("autocomplete", "off");
    expect(screen.getByLabelText("Username")).toHaveAttribute("spellcheck", "false");
    // Chromium ignores "off" on password fields; "new-password" is what stops it.
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
  });

  it("labels optional fields", () => {
    render(<TextField label="Middle name" optional />);

    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });
});
