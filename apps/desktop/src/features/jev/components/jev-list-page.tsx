import { type JevListItem, JOURNAL_TYPE_LABELS } from "@dwd-jev/shared";
import { useQuery } from "@tanstack/react-query";
import { createDataGridColumnHelper, DataGrid } from "@/components/data-grid/data-grid";
import { formatDateOnly } from "@/lib/dates";
import { jevQueries } from "../api/jev-queries";

const column = createDataGridColumnHelper<JevListItem>();

const columns = [
  column.accessor("jevNumber", { header: "JEV No.", size: 180 }),
  column.accessor("journalType", {
    header: "Journal",
    size: 260,
    meta: { grow: true },
    cell: (cell) => JOURNAL_TYPE_LABELS[cell.getValue()],
  }),
  column.accessor("jevDate", {
    header: "Date",
    size: 160,
    cell: (cell) => formatDateOnly(cell.getValue()),
  }),
];

export function JevListPage() {
  // Filters (month / date range / keyword) come with the list toolbar.
  const { data, isPending } = useQuery(
    jevQueries.byMonth({ year: new Date().getFullYear(), month: 0, page: 1, pageSize: 20 }),
  );

  return (
    <DataGrid
      label="Journal entry vouchers"
      columns={columns}
      data={data?.items ?? []}
      getRowId={(jev) => jev.id}
      isLoading={isPending}
      emptyMessage="No journal entry vouchers found."
      className="h-full"
    />
  );
}
