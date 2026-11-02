import { JOURNAL_TYPE_LABELS } from "@dwd-jev/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsLoadError } from "@/features/settings/components/settings-section";
import { formatDateOnly } from "@/lib/dates";
import { jevQueries } from "../api/jev-queries";
import { useRememberedJevListSearch } from "../jev-list-search";

/** Returns to the list as it was left. */
export function BackToListButton({ disabled = false }: { disabled?: boolean }) {
  const listSearch = useRememberedJevListSearch();

  return (
    <Button variant="outline" size="sm" asChild>
      <Link to="/jevs" search={listSearch} disabled={disabled}>
        <ArrowLeftIcon />
        Back to list
      </Link>
    </Button>
  );
}

/** Back to the list, then the JEV's number, journal and date. */
export function JevPageHeader({ jevId }: { jevId: string }) {
  const { data: jev, isPending, isError, error, refetch } = useQuery(jevQueries.detail(jevId));

  return (
    <div className="space-y-3">
      <BackToListButton />

      {isError ? (
        <SettingsLoadError error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div role="status" aria-label="Loading JEV" className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      ) : (
        <div className="space-y-1">
          <h2 className="font-semibold text-xl tabular-nums">JEV {jev.jevNumber}</h2>
          <p className="text-muted-foreground text-sm">
            {JOURNAL_TYPE_LABELS[jev.journalType]} · {formatDateOnly(jev.jevDate)}
          </p>
        </div>
      )}
    </div>
  );
}
