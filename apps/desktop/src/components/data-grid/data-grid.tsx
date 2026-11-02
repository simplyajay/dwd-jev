import {
  type ColumnDef,
  columnSizingFeature,
  createColumnHelper,
  flexRender,
  type RowData,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { Loader2Icon } from "lucide-react";
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
  useRef,
} from "react";
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
  /** Accessible name for the grid. */
  label: string;
  isLoading?: boolean;
  /** What the body shows while loading: placeholder rows, or one spinner filling it. */
  loadingIndicator?: "skeleton" | "spinner";
  emptyMessage?: ReactNode;
  /** Makes rows clickable, and focusable for Enter or Space. */
  onRowClick?: (row: TData) => void;
  className?: string;
}

const SKELETON_ROWS = 8;
const CELL = "flex min-w-0 items-center px-4";
const CONTROLS = "a, button, input, select, textarea";

/** False for events from a control in the row or a portal it opened (portals bubble in React). */
function isRowEvent(event: SyntheticEvent<HTMLElement>): boolean {
  const target = event.target as Element;
  return event.currentTarget.contains(target) && !target.closest(CONTROLS);
}

/** Div + CSS grid table: rows share one column template, so the empty state can span them all. */
export function DataGrid<TData extends RowData>({
  columns,
  data,
  getRowId,
  label,
  isLoading = false,
  loadingIndicator = "skeleton",
  emptyMessage = "No data",
  onRowClick,
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

  // One cell across all columns, pinned to the visible width so its content stays centred.
  const spanningRow = (content: ReactNode) => (
    <div role="row" className="flex flex-1">
      <div
        role="cell"
        aria-colspan={headers.length}
        className="sticky left-0 flex min-h-40 items-center justify-center p-6 text-center text-muted-foreground text-sm"
        style={{ width: viewportWidth ?? "100%" }}
      >
        {content}
      </div>
    </div>
  );

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
          {isLoading && loadingIndicator === "spinner"
            ? spanningRow(
                <Loader2Icon
                  role="status"
                  aria-label={`Loading ${label.toLowerCase()}`}
                  className="size-8 animate-spin"
                />,
              )
            : isLoading
              ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
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
              : rows.length === 0
                ? spanningRow(emptyMessage)
                : rows.map((row) => (
                    <div
                      key={row.id}
                      role="row"
                      className={cn(
                        "grid border-table-divider border-b last:border-b-0 hover:bg-muted/50",
                        onRowClick &&
                          "cursor-pointer outline-none focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset",
                      )}
                      style={{ gridTemplateColumns }}
                      {...(onRowClick && {
                        tabIndex: 0,
                        onClick: (event: MouseEvent<HTMLDivElement>) => {
                          if (isRowEvent(event)) onRowClick(row.original);
                        },
                        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
                          if (!isRowEvent(event)) return;
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault(); // Space would scroll the grid
                          onRowClick(row.original);
                        },
                      })}
                    >
                      {row.getAllCells().map((cell) => (
                        <div
                          key={cell.id}
                          role="cell"
                          className={cn(
                            CELL,
                            "h-11 text-sm",
                            alignClass(cell.column.columnDef.meta),
                          )}
                        >
                          <span className="truncate">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
        </div>
      </div>
    </div>
  );
}
