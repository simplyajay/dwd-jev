import {
  type ColumnDef,
  columnSizingFeature,
  createColumnHelper,
  flexRender,
  type RowData,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { type ReactNode, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useElementWidth } from "@/hooks/use-element-width";
import { cn } from "@/lib/utils";

export interface DataGridColumnMeta {
  /** Column takes the leftover width; its `size` becomes the minimum. */
  grow?: boolean;
  align?: "left" | "right";
}

const features = tableFeatures({
  columnSizingFeature,
  columnMeta: {} as DataGridColumnMeta,
});

// biome-ignore lint/suspicious/noExplicitAny: a column list mixes cell value types
export type DataGridColumn<TData extends RowData> = ColumnDef<typeof features, TData, any>;

export function createDataGridColumnHelper<TData extends RowData>() {
  return createColumnHelper<typeof features, TData>();
}

interface DataGridProps<TData extends RowData> {
  columns: DataGridColumn<TData>[];
  data: TData[];
  getRowId: (row: TData) => string;
  /** Accessible name for the grid, e.g. "Journal entry vouchers". */
  label: string;
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  className?: string;
}

const SKELETON_ROWS = 8;
const CELL = "flex min-w-0 items-center px-4";

/**
 * Table built from divs + CSS grid instead of <table>. Every row is its own
 * grid sharing one column template, which keeps columns aligned and lets the
 * empty state be a single full-width block with no colspan bookkeeping.
 */
export function DataGrid<TData extends RowData>({
  columns,
  data,
  getRowId,
  label,
  isLoading = false,
  emptyMessage = "No data",
  className,
}: DataGridProps<TData>) {
  const table = useTable({ features, columns, data, getRowId });
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportWidth = useElementWidth(scrollRef);

  const headers = table.getHeaderGroups().flatMap((group) => group.headers);
  const rows = table.getRowModel().rows;

  const gridTemplateColumns = headers
    .map((header) => {
      const size = header.getSize();
      return header.column.columnDef.meta?.grow ? `minmax(${size}px, 1fr)` : `${size}px`;
    })
    .join(" ");
  const minWidth = headers.reduce((total, header) => total + header.getSize(), 0);
  const alignClass = (meta: DataGridColumnMeta | undefined) =>
    meta?.align === "right" && "justify-end text-right";

  return (
    <div
      ref={scrollRef}
      role="table"
      aria-label={label}
      aria-busy={isLoading}
      aria-rowcount={isLoading ? undefined : rows.length + 1}
      className={cn("overflow-auto rounded-xl border bg-card", className)}
    >
      <div className="flex min-h-full flex-col" style={{ minWidth }}>
        <div role="rowgroup" className="sticky top-0 z-10 border-b bg-card">
          <div role="row" className="grid" style={{ gridTemplateColumns }}>
            {headers.map((header) => (
              <div
                key={header.id}
                role="columnheader"
                className={cn(
                  CELL,
                  "h-10 font-medium text-table-header text-xs uppercase tracking-wide",
                  alignClass(header.column.columnDef.meta),
                )}
              >
                <span className="truncate">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div role="rowgroup" className="flex flex-1 flex-col">
          {isLoading ? (
            Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
                key={index}
                role="row"
                className="grid border-table-divider border-b last:border-b-0"
                style={{ gridTemplateColumns }}
              >
                {headers.map((header) => (
                  <div key={header.id} role="cell" className={cn(CELL, "h-11")}>
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ))
          ) : rows.length === 0 ? (
            <div role="row" className="flex flex-1">
              {/*
               * One cell spanning every column. It is pinned to the visible
               * width (sticky + measured width) so the message stays centred
               * on screen even when the columns overflow horizontally.
               */}
              <div
                role="cell"
                aria-colspan={headers.length}
                className="sticky left-0 flex min-h-40 items-center justify-center p-6 text-center text-muted-foreground text-sm"
                style={{ width: viewportWidth ?? "100%" }}
              >
                {emptyMessage}
              </div>
            </div>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                role="row"
                className="grid border-table-divider border-b last:border-b-0 hover:bg-muted/50"
                style={{ gridTemplateColumns }}
              >
                {row.getAllCells().map((cell) => (
                  <div
                    key={cell.id}
                    role="cell"
                    className={cn(CELL, "h-11 text-sm", alignClass(cell.column.columnDef.meta))}
                  >
                    <span className="truncate">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
