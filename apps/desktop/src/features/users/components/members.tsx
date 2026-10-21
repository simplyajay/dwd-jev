import type { UserSummary } from "@dwd-jev/shared";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useMemo } from "react";
import {
  createDataGridColumnHelper,
  DataGrid,
  type DataGridColumn,
} from "@/components/data-grid/data-grid";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/features/auth/auth-context";
import { SettingsLoadError } from "@/features/settings/components/settings-section";
import { isAdmin } from "@/features/settings/settings-tabs";
import { userQueries } from "../api/user-queries";
import { StatusBadge } from "./status-badge";

const column = createDataGridColumnHelper<UserSummary>();

/** The member list, in the order the backend returns it. */
export function Members({ onOpen }: { onOpen: (id: string) => void }) {
  const currentUser = useCurrentUser();
  const showStatus = isAdmin(currentUser); // non-admins only ever get active members
  const { data: members, isPending, isError, error, refetch } = useQuery(userQueries.list());

  const columns = useMemo(() => {
    const list: DataGridColumn<UserSummary>[] = [
      column.accessor("fullName", {
        header: "Name",
        size: 200,
        meta: { grow: true },
        cell: (cell) => (
          <>
            {cell.getValue()}
            {cell.row.original.id === currentUser.id && (
              <span className="text-muted-foreground"> (you)</span>
            )}
          </>
        ),
      }),
      column.accessor("position", { header: "Position", size: 160, meta: { grow: true } }),
    ];
    if (showStatus) {
      list.push(
        column.accessor("status", {
          header: "Status",
          size: 130,
          cell: (cell) => <StatusBadge status={cell.getValue()} />,
        }),
      );
    }
    return list;
  }, [currentUser.id, showStatus]);

  return (
    <div className="space-y-3">
      {/* Not wired: search will be a backend feature. */}
      <div className="relative">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Search members"
          aria-label="Search members"
          disabled
          className="pl-8"
        />
      </div>

      {isError ? (
        <SettingsLoadError error={error} onRetry={() => refetch()} />
      ) : (
        <DataGrid
          label="Members"
          columns={columns}
          data={members ?? []}
          getRowId={(member) => member.id}
          isLoading={isPending}
          emptyMessage="No members yet."
          onRowClick={(member) => onOpen(member.id)}
        />
      )}
    </div>
  );
}
