import type { Jev, JevUserRef } from "@dwd-jev/shared";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/dates";
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

/** Stand-in for the JEV's cards while it loads. */
export function JevDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading JEV" className="space-y-6">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}

/** "Created by … on …", and the last update when there was one. */
export function JevAuthorship({ jev }: { jev: Jev }) {
  const updated = jev.lastUpdatedAt.getTime() !== jev.createdAt.getTime();

  return (
    <p className="text-muted-foreground text-xs">
      <ByLine verb="Created" user={jev.createdBy} at={jev.createdAt} />
      {updated && (
        <>
          {" · "}
          <ByLine verb="Last updated" user={jev.lastUpdatedBy} at={jev.lastUpdatedAt} />
        </>
      )}
    </p>
  );
}

interface ByLineProps {
  verb: string;
  /** Null when unknown, e.g. a delete opened without its log row. */
  user: Pick<JevUserRef, "fullName"> | null;
  at: Date;
}

/** "Created by Juan on Nov 24, 2026, 3:05 PM", or "Deleted on …" without a user. */
export function ByLine({ verb, user, at }: ByLineProps) {
  return (
    <span>
      {verb}
      {user && (
        <>
          {" "}
          by <span className="text-foreground">{user.fullName}</span>
        </>
      )}{" "}
      on <span className="tabular-nums">{formatDateTime(at)}</span>
    </span>
  );
}
