import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { PasswordConfirmDialog } from "@/components/password-confirm-dialog";
import { Button } from "@/components/ui/button";
import { auditLogQueries } from "@/features/audit-log/api/audit-log-queries";
import { SettingsLoadError } from "@/features/settings/components/settings-section";
import { api } from "@/lib/api";
import { jevQueries } from "../api/jev-queries";
import { useRememberedJevListSearch } from "../jev-list-search";
import { JevDetails } from "./jev-details";
import { BackToListButton, JevAuthorship, JevDetailsSkeleton } from "./jev-page-header";

const route = getRouteApi("/_app/jevs/$jevId/");

export function JevViewPage() {
  const { jevId } = route.useParams();
  const navigate = route.useNavigate();
  const queryClient = useQueryClient();
  const listSearch = useRememberedJevListSearch();
  const { data: jev, isPending, isError, error, refetch } = useQuery(jevQueries.detail(jevId));
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteJev = async (password: string) => {
    await api.jevs.delete(jevId, { password });
    // Leave first, so this page doesn't refetch the deleted JEV.
    await navigate({ to: "/jevs", search: listSearch });
    queryClient.removeQueries({ queryKey: jevQueries.detail(jevId).queryKey });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: jevQueries.all }),
      queryClient.invalidateQueries({ queryKey: auditLogQueries.all }),
    ]);
  };

  return (
    <div className="space-y-3">
      {/* Disabled until the JEV loads. */}
      <PageToolbar
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/jevs/$jevId/edit" params={{ jevId }} disabled={!jev}>
                <PencilIcon />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" disabled={!jev} onClick={() => setDeleteOpen(true)}>
              <Trash2Icon />
              Delete
            </Button>
          </>
        }
      >
        <BackToListButton />
      </PageToolbar>

      {isError ? (
        <SettingsLoadError error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <JevDetailsSkeleton />
      ) : (
        <>
          <JevDetails jev={jev} />

          <JevAuthorship jev={jev} />

          <PasswordConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={`Delete JEV ${jev.jevNumber}`}
            description="Enter your password to delete this journal entry voucher."
            warning="This can't be undone. A deleted JEV is left out of the trial balance."
            confirmLabel="Delete"
            destructive
            onConfirm={deleteJev}
          />
        </>
      )}
    </div>
  );
}
