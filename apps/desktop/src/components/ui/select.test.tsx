import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { TooltipProvider } from "./tooltip";

// Radix uses pointer capture and scrollIntoView; jsdom has neither.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

const LONG = "[BUR] Budget Utilization Request";

// jsdom has no layout, so each test sets how wide the value is against its box.
function renderSelect(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(scrollWidth);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(clientWidth);
  render(
    <TooltipProvider>
      <Select defaultValue="bur">
        <SelectTrigger aria-label="Type" variant="table">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bur">{LONG}</SelectItem>
          <SelectItem value="inv">Invoice</SelectItem>
        </SelectContent>
      </Select>
    </TooltipProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SelectTrigger", () => {
  it("shows the whole value on hover when it's cut off", async () => {
    const user = userEvent.setup();
    renderSelect(400, 120);

    await user.hover(screen.getByRole("combobox", { name: "Type" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(LONG);
  });

  it("shows no tooltip when the value fits", async () => {
    const user = userEvent.setup();
    renderSelect(120, 120);

    await user.hover(screen.getByRole("combobox", { name: "Type" }));

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("keeps the select's open state on the trigger, not the tooltip's", async () => {
    const user = userEvent.setup();
    renderSelect(120, 120);
    const trigger = screen.getByRole("combobox", { name: "Type" });

    await user.click(trigger);

    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("data-state", "open");
  });
});
