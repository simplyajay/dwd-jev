import { AuditActionSchema, diffJev, type JevRevision, type JevSnapshot } from "@dwd-jev/shared";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { jevQueries } from "@/features/jev/api/jev-queries";
import { JevDetails, type JevHighlights } from "@/features/jev/components/jev-details";
import { ByLine, JevDetailsSkeleton } from "@/features/jev/components/jev-page-header";
import {
  SettingsLoadError,
  SettingsPlaceholder,
} from "@/features/settings/components/settings-section";
import { cn } from "@/lib/utils";
import { useRememberedAuditLogSearch } from "../audit-log-search";

const route = getRouteApi("/_app/audit-logs/$action/$documentId");

/** A create or update shows its revision; a delete shows the deleted JEV. */
export function AuditLogDetailPage() {
  const params = route.useParams();
  const action = AuditActionSchema.safeParse(params.action);

  return (
    <div className="space-y-3">
      {!action.success ? (
        <>
          <PageToolbar>
            <BackToAuditLogButton />
          </PageToolbar>
          <SettingsPlaceholder>This audit log entry can't be shown.</SettingsPlaceholder>
        </>
      ) : action.data === "delete" ? (
        <DeletedJev jevId={params.documentId} />
      ) : (
        <Revision revisionId={params.documentId} />
      )}
    </div>
  );
}

function BackToAuditLogButton() {
  const search = useRememberedAuditLogSearch();

  return (
    <Button variant="outline" size="sm" asChild>
      <Link to="/audit-logs" search={search}>
        <ArrowLeftIcon />
        Back to audit log
      </Link>
    </Button>
  );
}

/** The toolbar, who did it and when, then the JEV. */
function EntryLayout({
  actions,
  summary,
  children,
}: {
  actions?: ReactNode;
  summary: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <PageToolbar actions={actions}>
        <BackToAuditLogButton />
      </PageToolbar>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
        {summary}
      </div>
      {children}
    </>
  );
}

/** The toolbar, then the load error or a skeleton. */
function EntryLoading({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <>
      <PageToolbar>
        <BackToAuditLogButton />
      </PageToolbar>
      {error ? <SettingsLoadError error={error} onRetry={onRetry} /> : <JevDetailsSkeleton />}
    </>
  );
}

function DeletedJev({ jevId }: { jevId: string }) {
  const { data: jev, error, refetch } = useQuery(jevQueries.deleted(jevId));
  // From the clicked log row; without it, the JEV's own delete time.
  const entry = useRouterState({ select: (state) => state.location.state.auditLogEntry });

  if (!jev) return <EntryLoading error={error} onRetry={() => refetch()} />;

  const deletedAt = entry ? new Date(entry.at) : jev.deletedAt;
  return (
    <EntryLayout
      summary={
        deletedAt && (
          <ByLine
            verb="Deleted"
            user={entry ? { fullName: entry.actorName } : null}
            at={deletedAt}
          />
        )
      }
    >
      <JevDetails jev={jev} />
    </EntryLayout>
  );
}

function Revision({ revisionId }: { revisionId: string }) {
  const { data: revision, error, refetch } = useQuery(jevQueries.revision(revisionId));

  if (!revision) return <EntryLoading error={error} onRetry={() => refetch()} />;
  if (revision.beforeData)
    return <UpdateRevision revision={revision} before={revision.beforeData} />;

  return (
    <EntryLayout
      summary={<ByLine verb="Created" user={revision.updatedBy} at={revision.updatedAt} />}
    >
      <JevDetails jev={revision.afterData} />
    </EntryLayout>
  );
}

type Side = "before" | "after";

// Selected side in the theme colour, like the theme picker.
const TOGGLE_ITEM = "px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

function UpdateRevision({ revision, before }: { revision: JevRevision; before: JevSnapshot }) {
  const after = revision.afterData;
  const [side, setSide] = useState<Side>("after");

  // Swapped arguments: paths in the before version, its removed rows as "added".
  const highlights = useMemo(() => {
    const forward = diffJev(before, after);
    const backward = diffJev(after, before);
    return {
      after: { changed: new Set(forward.changed), rows: new Set(forward.added), rowTone: "added" },
      before: {
        changed: new Set(backward.changed),
        rows: new Set(backward.added),
        rowTone: "removed",
      },
    } satisfies Record<Side, JevHighlights>;
  }, [before, after]);

  const marks = highlights[side];
  const unchanged =
    highlights.after.changed.size === 0 &&
    highlights.after.rows.size === 0 &&
    highlights.before.rows.size === 0;

  return (
    <EntryLayout
      actions={
        <ToggleGroup
          type="single"
          variant="outline"
          aria-label="Version"
          value={side}
          onValueChange={(value) => {
            if (value) setSide(value as Side);
          }}
        >
          <ToggleGroupItem value="before" className={TOGGLE_ITEM}>
            Before
          </ToggleGroupItem>
          <ToggleGroupItem value="after" className={TOGGLE_ITEM}>
            After
          </ToggleGroupItem>
        </ToggleGroup>
      }
      summary={
        <>
          <ByLine verb="Updated" user={revision.updatedBy} at={revision.updatedAt} />
          {unchanged ? (
            <span>Nothing was changed in this update.</span>
          ) : (
            <Legend tone={marks.rowTone} />
          )}
        </>
      }
    >
      <JevDetails jev={side === "after" ? after : before} highlights={marks} />
    </EntryLayout>
  );
}

function Legend({ tone }: { tone: JevHighlights["rowTone"] }) {
  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="size-3 rounded-sm bg-amber-400/25 ring-1 ring-amber-500/40" />
        Changed field
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className={cn(
            "size-3 rounded-sm",
            tone === "added" ? "bg-emerald-500/25" : "bg-destructive/25",
          )}
        />
        {tone === "added" ? "Added row" : "Removed row"}
      </span>
    </>
  );
}
