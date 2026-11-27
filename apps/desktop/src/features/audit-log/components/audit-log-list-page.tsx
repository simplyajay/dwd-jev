import type { AuditAction, AuditLog } from "@dwd-jev/shared";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createDataGridColumnHelper, DataGrid } from "@/components/data-grid/data-grid";
import { ListPagination } from "@/components/data-grid/list-pagination";
import { type PageSize, readPageSize, storePageSize } from "@/components/data-grid/page-size";
import { TruncatedText } from "@/components/truncated-text";
import { Button } from "@/components/ui/button";
import { SettingsLoadError } from "@/features/settings/components/settings-section";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { auditLogQueries } from "../api/audit-log-queries";
import { AUDIT_LOG_PAGE_SIZE_KEY, rememberAuditLogSearch } from "../audit-log-search";
import { entryState } from "../entry-state";
import { ACTION_LABELS } from "../labels";

const route = getRouteApi("/_app/audit-logs/");

const column = createDataGridColumnHelper<AuditLog>();

const ACTION_DOTS: Record<AuditAction, string> = {
  create: "bg-emerald-500",
  update: "bg-amber-500",
  delete: "bg-destructive",
};

export function AuditLogListPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const page = search.page ?? 1;
  const [pageSize, setPageSize] = useState<PageSize>(() => readPageSize(AUDIT_LOG_PAGE_SIZE_KEY));

  const { data, isFetching, isPlaceholderData, isError, error, refetch } = useQuery(
    auditLogQueries.list({ page, pageSize }),
  );
  const loading = isFetching;

  useEffect(() => rememberAuditLogSearch({ page: search.page }), [search.page]);

  const goToPage = (target: number) =>
    navigate({ search: { page: target > 1 ? target : undefined }, replace: true });

  // A page past the end (an old position) moves to the last one.
  const lastPage = data?.totalPages;
  useEffect(() => {
    if (isPlaceholderData || lastPage === undefined || page <= lastPage) return;
    navigate({ search: { page: lastPage > 1 ? lastPage : undefined }, replace: true });
  }, [isPlaceholderData, lastPage, page, navigate]);

  const columns = useMemo(
    () => [
      column.accessor("createdAt", {
        header: "Date & time",
        size: 200,
        cell: (cell) => <span className="tabular-nums">{formatDateTime(cell.getValue())}</span>,
      }),
      column.accessor("actor", {
        header: "User",
        size: 200,
        meta: { minSize: 128 },
        cell: (cell) => {
          const actor = cell.getValue();
          return (
            <>
              <TruncatedText text={actor.fullName} />
              <TruncatedText text={actor.position} className="text-muted-foreground text-xs" />
            </>
          );
        },
      }),
      column.accessor("action", {
        header: "Action",
        size: 112,
        cell: (cell) => <ActionLabel action={cell.getValue()} />,
      }),
      column.accessor("description", {
        header: "Description",
        size: 128,
        meta: { grow: true },
        cell: (cell) => <TruncatedText text={cell.getValue()} />,
      }),
      column.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        size: 96,
        meta: { align: "right" },
        cell: (cell) => (
          <Button variant="ghost" size="sm" className="m-1" asChild>
            <Link
              to="/audit-logs/$action/$documentId"
              params={{
                action: cell.row.original.action,
                documentId: cell.row.original.documentId,
              }}
              state={entryState(cell.row.original)}
            >
              View
            </Link>
          </Button>
        ),
      }),
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col gap-3">
      {isError && !loading ? (
        <SettingsLoadError error={error} onRetry={() => refetch()} />
      ) : (
        <DataGrid
          label="Audit log"
          columns={columns}
          data={data?.items ?? []}
          getRowId={(log) => log.id}
          isLoading={loading}
          loadingIndicator="spinner"
          emptyMessage="No activity yet."
          onRowClick={(log) =>
            navigate({
              to: "/audit-logs/$action/$documentId",
              params: { action: log.action, documentId: log.documentId },
              state: entryState(log),
            })
          }
          className="min-h-0 flex-1"
        />
      )}
      {data && !isError && (
        <ListPagination
          result={data}
          pageSize={pageSize}
          disabled={loading}
          onPageChange={goToPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            storePageSize(AUDIT_LOG_PAGE_SIZE_KEY, size);
            goToPage(1);
          }}
        />
      )}
    </div>
  );
}

export function ActionLabel({ action }: { action: AuditAction }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn("size-1.5 rounded-full", ACTION_DOTS[action])} />
      {ACTION_LABELS[action]}
    </span>
  );
}
