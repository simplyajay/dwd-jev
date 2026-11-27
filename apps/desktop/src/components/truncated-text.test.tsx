import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TruncatedText } from "./truncated-text";

const TEXT = "A long description that doesn't fit on one line of its column.";

// jsdom has no layout, so each test sets how wide the text is against its box.
function renderWithWidths(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(scrollWidth);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(clientWidth);
  render(
    <TooltipProvider>
      <TruncatedText text={TEXT} />
    </TooltipProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TruncatedText", () => {
  it("shows the whole text on hover when it's cut off", async () => {
    const user = userEvent.setup();
    renderWithWidths(400, 120);

    await user.hover(screen.getByText(TEXT));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(TEXT);
  });

  it("shows no tooltip when the text fits", async () => {
    const user = userEvent.setup();
    renderWithWidths(120, 120);

    await user.hover(screen.getByText(TEXT));

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
