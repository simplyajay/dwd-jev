import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createDataGridColumnHelper, DataGrid } from "./data-grid";

interface Fruit {
  id: string;
  name: string;
  price: number;
}

const column = createDataGridColumnHelper<Fruit>();
const columns = [
  column.accessor("name", { header: "Name", meta: { grow: true } }),
  column.accessor("price", { header: "Price", size: 120, meta: { align: "right" } }),
];

const fruits: Fruit[] = [
  { id: "a", name: "Apple", price: 10 },
  { id: "b", name: "Banana", price: 5 },
];

function renderGrid(props: Partial<React.ComponentProps<typeof DataGrid<Fruit>>> = {}) {
  return render(
    <TooltipProvider>
      <DataGrid
        label="Fruits"
        columns={columns}
        data={fruits}
        getRowId={(fruit) => fruit.id}
        {...props}
      />
    </TooltipProvider>,
  );
}

describe("DataGrid", () => {
  it("sizes columns in rem, squeezing grow columns before ones with a minSize", () => {
    renderGrid({
      columns: [
        column.accessor("id", { header: "Code", size: 180, meta: { minSize: 96 } }),
        column.accessor("name", { header: "Name", size: 128, meta: { grow: true } }),
        column.accessor("price", { header: "Price", size: 120 }),
      ],
    });

    const headerRow = screen.getAllByRole("row")[0] as HTMLElement;
    expect(headerRow.style.gridTemplateColumns).toBe(
      "minmax(6rem, 11.25rem) minmax(8rem, 1fr) 7.5rem",
    );
  });

  it("renders a header row and one row per item", () => {
    renderGrid();

    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Name",
      "Price",
    ]);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(
      within(rows[1] as HTMLElement)
        .getAllByRole("cell")
        .map((c) => c.textContent),
    ).toEqual(["Apple", "10"]);
  });

  it("shows a single cell spanning every column when there is no data", () => {
    renderGrid({ data: [], emptyMessage: "No fruits yet" });

    // Header row + exactly one body row holding exactly one cell.
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(2);
    const cells = within(rows[1] as HTMLElement).getAllByRole("cell");
    expect(cells).toHaveLength(1);
    expect(cells[0]).toHaveTextContent("No fruits yet");
    expect(cells[0]).toHaveAttribute("aria-colspan", String(columns.length));
  });

  it("keeps the header visible alongside the empty state", () => {
    renderGrid({ data: [] });

    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("can show one spinner across the body while loading, keeping the header", () => {
    renderGrid({ isLoading: true, loadingIndicator: "spinner" });

    expect(screen.getByRole("status", { name: "Loading fruits" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("shows placeholder rows instead of data or the empty state while loading", () => {
    renderGrid({ data: [], isLoading: true });

    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("No data")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row").length).toBeGreaterThan(2);
  });
});

describe("DataGrid row clicks", () => {
  it("opens a row by click, Enter or Space", async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    renderGrid({ onRowClick });
    const [apple, banana] = screen.getAllByRole("row").slice(1);

    await user.click(within(apple as HTMLElement).getByText("Apple"));
    (banana as HTMLElement).focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onRowClick.mock.calls.map(([fruit]) => fruit.name)).toEqual([
      "Apple",
      "Banana",
      "Banana",
    ]);
  });

  it("ignores clicks and keys on a control inside the row", async () => {
    const onRowClick = vi.fn();
    const onButton = vi.fn();
    const user = userEvent.setup();
    renderGrid({
      onRowClick,
      columns: [
        ...columns,
        column.display({
          id: "actions",
          cell: () => (
            <button type="button" onClick={onButton}>
              Menu
            </button>
          ),
        }),
      ],
    });
    const [button] = screen.getAllByRole("button", { name: "Menu" });

    await user.click(button as HTMLElement);
    await user.keyboard("{Enter}");

    expect(onButton).toHaveBeenCalledTimes(2);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("leaves rows out of the tab order when they don't open anything", () => {
    renderGrid();

    for (const row of screen.getAllByRole("row")) expect(row).not.toHaveAttribute("tabindex");
  });
});
