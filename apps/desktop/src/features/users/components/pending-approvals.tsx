import type { UserSummary } from "@dwd-jev/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SettingsLoadError,
  SettingsPlaceholder,
} from "@/features/settings/components/settings-section";
import { api } from "@/lib/api";
import { userQueries } from "../api/user-queries";
import { PasswordConfirmDialog } from "./password-confirm-dialog";

type Decision = "approve" | "reject";

/** The approval queue. Only rendered for administrators. */
export function PendingApprovals() {
  const { data: users, isPending, isError, error, refetch } = useQuery(userQueries.pending());

  // Separate from `decision`, so the text stays while the dialog closes.
  const [decision, setDecision] = useState<{ kind: Decision; user: UserSummary } | null>(null);
  const [open, setOpen] = useState(false);
  const decide = (kind: Decision, user: UserSummary) => {
    setDecision({ kind, user });
    setOpen(true);
  };

  if (isPending) return <PendingSkeleton />;

  if (isError) return <SettingsLoadError error={error} onRetry={() => refetch()} />;

  if (users.length === 0) {
    return <SettingsPlaceholder>No accounts are waiting for approval.</SettingsPlaceholder>;
  }

  return (
    <>
      <ul className="divide-y rounded-lg border">
        {users.map((user) => (
          <li key={user.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{user.fullName}</p>
              <p className="truncate text-muted-foreground text-xs">{user.position}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => decide("reject", user)}>
              Reject
            </Button>
            <Button size="sm" onClick={() => decide("approve", user)}>
              Approve
            </Button>
          </li>
        ))}
      </ul>

      {decision && (
        <DecisionDialog
          kind={decision.kind}
          user={decision.user}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}

function DecisionDialog({
  kind,
  user,
  open,
  onOpenChange,
}: {
  kind: Decision;
  user: UserSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: (password: string) => api.users[kind](user.id, { password }),
    // Also on failure: another admin may have decided already.
    onSettled: () => queryClient.invalidateQueries({ queryKey: userQueries.all }),
  });

  const name = <span className="font-medium text-foreground">{user.fullName}</span>;

  return kind === "approve" ? (
    <PasswordConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Approve account"
      description={<>Enter your password to approve {name}. They can sign in once approved.</>}
      confirmLabel="Approve"
      onConfirm={mutateAsync}
    />
  ) : (
    <PasswordConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reject account"
      description={<>Enter your password to reject {name}.</>}
      warning="Rejecting permanently deletes this account. They will need to sign up again."
      confirmLabel="Reject"
      destructive
      onConfirm={mutateAsync}
    />
  );
}

function PendingSkeleton() {
  return (
    <ul
      className="divide-y rounded-lg border"
      aria-busy="true"
      aria-label="Loading pending accounts"
    >
      {[0, 1].map((row) => (
        <li key={row} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-18" />
        </li>
      ))}
    </ul>
  );
}
