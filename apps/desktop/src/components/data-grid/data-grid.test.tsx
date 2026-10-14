import { render, screen, within } from "@testing-library/react";
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
    <DataGrid
      label="Fruits"
      columns={columns}
      data={fruits}
      getRowId={(fruit) => fruit.id}
      {...props}
    />,
  );
}

describe("DataGrid", () => {
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

  it("shows placeholder rows instead of data or the empty state while loading", () => {
    renderGrid({ data: [], isLoading: true });

    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("No data")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row").length).toBeGreaterThan(2);
  });
});
