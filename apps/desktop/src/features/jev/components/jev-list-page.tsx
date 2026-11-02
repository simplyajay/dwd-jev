import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { EllipsisIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createDataGridColumnHelper, DataGrid } from "@/components/data-grid/data-grid";
import { PasswordConfirmDialog } from "@/components/password-confirm-dialog";
import { TruncatedText } from "@/components/truncated-text";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsLoadError } from "@/features/settings/components/settings-section";
import { api, type JevListRow } from "@/lib/api";
import { formatDateOnly } from "@/lib/dates";
import { jevQueries } from "../api/jev-queries";
import {
  JEV_YEARS,
  type JevListSearch,
  type PageSize,
  readPageSize,
  rememberJevListSearch,
  resolveJevListSearch,
  storePageSize,
} from "../jev-list-search";
import { JOURNAL_SHORT_LABELS } from "../labels";
import { JevListPagination } from "./jev-list-pagination";

const route = getRouteApi("/_app/jevs/");

const MONTH_NAMES = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2000, index, 1)),
);

const column = createDataGridColumnHelper<JevListRow>();

export function JevListPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { year, month, page } = resolveJevListSearch(search);
  const [pageSize, setPageSize] = useState<PageSize>(readPageSize);

  // Snapshot on open, so the dialog keeps its text while closing.
  const [deleting, setDeleting] = useState<JevListRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isFetching, isPlaceholderData, isError, error, refetch } = useQuery(
    jevQueries.byMonth({ year, month, page, pageSize }),
  );
  // Any fetch (first load, new page or month, refresh after a delete) locks the controls.
  const loading = isFetching;

  useEffect(
    () =>
      rememberJevListSearch({
        year: search.year,
        month: search.month,
        page: search.page,
      }),
    [search.year, search.month, search.page],
  );

  const setSearch = (next: JevListSearch, resetPage = true) =>
    navigate({
      search: (prev) => ({ ...prev, ...(resetPage && { page: undefined }), ...next }),
      replace: true,
    });
  const goToPage = (target: number) => setSearch({ page: target > 1 ? target : undefined }, false);

  // A page past the end (an old position, or after a delete) moves to the last one.
  const lastPage = data?.totalPages;
  useEffect(() => {
    if (isPlaceholderData || lastPage === undefined || page <= lastPage) return;
    navigate({
      search: (prev) => ({ ...prev, page: lastPage > 1 ? lastPage : undefined }),
      replace: true,
    });
  }, [isPlaceholderData, lastPage, page, navigate]);

  const columns = useMemo(
    () => [
      column.accessor("jevDate", {
        header: "Date",
        size: 140,
        cell: (cell) => <span className="tabular-nums">{formatDateOnly(cell.getValue())}</span>,
      }),
      column.accessor("jevNumber", {
        header: "JEV No.",
        size: 180,
        cell: (cell) => <span className="tabular-nums">{cell.getValue()}</span>,
      }),
      column.accessor("journalType", {
        header: "Journal",
        size: 100,
        cell: (cell) => JOURNAL_SHORT_LABELS[cell.getValue()],
      }),
      // Not sent by the list API yet; empty until the backend adds it.
      column.accessor("description", {
        header: "Description",
        size: 320,
        meta: { grow: true },
        cell: (cell) => {
          const description = cell.getValue();
          return description ? (
            <TruncatedText text={description} />
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      }),
      column.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        size: 64,
        meta: { align: "right" },
        cell: (cell) => (
          <JevActionsMenu
            jev={cell.row.original}
            onDelete={(jev) => {
              setDeleting(jev);
              setDeleteOpen(true);
            }}
          />
        ),
      }),
    ],
    [],
  );

  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.jevs.delete(id, { password }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: jevQueries.all }),
  });

  const period = month === 0 ? String(year) : `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <Select
          value={String(year)}
          onValueChange={(value) => setSearch({ year: Number(value) })}
          disabled={loading}
        >
          <SelectTrigger aria-label="Year" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {JEV_YEARS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(month)}
          onValueChange={(value) => setSearch({ month: Number(value) })}
          disabled={loading}
        >
          <SelectTrigger aria-label="Month" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All months</SelectItem>
            {MONTH_NAMES.map((name, index) => (
              <SelectItem key={name} value={String(index + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild className="ml-auto">
          {/* Usable while loading: it leaves the page, so it can't disturb the request. */}
          <Link to="/jevs/new">
            <PlusIcon />
            New JEV
          </Link>
        </Button>
      </div>

      {isError && !loading ? (
        <SettingsLoadError error={error} onRetry={() => refetch()} />
      ) : (
        // While loading, the body is one spinner, so rows and their menus can't be used.
        <DataGrid
          label="Journal entry vouchers"
          columns={columns}
          data={data?.items ?? []}
          getRowId={(jev) => jev.id}
          isLoading={loading}
          loadingIndicator="spinner"
          emptyMessage={`No JEVs for ${period}.`}
          onRowClick={(jev) => navigate({ to: "/jevs/$jevId", params: { jevId: jev.id } })}
          className="min-h-0 flex-1"
        />
      )}
      {/* Stays in place (disabled) while loading, showing the last page's numbers. */}
      {data && !isError && (
        <JevListPagination
          result={data}
          pageSize={pageSize}
          disabled={loading}
          onPageChange={goToPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            storePageSize(size);
            goToPage(1);
          }}
        />
      )}

      <PasswordConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete JEV ${deleting?.jevNumber ?? ""}`}
        description="Enter your password to delete this journal entry voucher."
        warning="This can't be undone. A deleted JEV is left out of the trial balance."
        confirmLabel="Delete"
        destructive
        onConfirm={(password) =>
          deleting ? remove.mutateAsync({ id: deleting.id, password }) : Promise.resolve()
        }
      />
    </div>
  );
}

function JevActionsMenu({
  jev,
  onDelete,
}: {
  jev: JevListRow;
  onDelete: (jev: JevListRow) => void;
}) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for JEV ${jev.jevNumber}`}
          className="m-1"
        >
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => navigate({ to: "/jevs/$jevId/edit", params: { jevId: jev.id } })}
        >
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(jev)}>
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
