import type {
  SafeUserType,
  SetUserRoleInput,
  SetUserStatusInput,
  UserDetail,
} from "@dwd-jev/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/features/auth/auth-context";
import {
  SettingsLoadError,
  SettingsSection,
} from "@/features/settings/components/settings-section";
import { isAdmin } from "@/features/settings/settings-tabs";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { userQueries } from "../api/user-queries";
import { displayName, initials, ROLE_LABELS } from "../user-labels";
import { PasswordConfirmDialog } from "./password-confirm-dialog";
import { StatusBadge } from "./status-badge";

/** A member's details, shown in place of the lists. */
export function MemberDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: member, isPending, isError, error, refetch } = useQuery(userQueries.detail(id));

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-sm font-medium text-link text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ArrowLeftIcon aria-hidden className="size-4" />
        Back to members
      </button>

      {isPending ? (
        <DetailSkeleton />
      ) : isError ? (
        <SettingsLoadError error={error} onRetry={() => refetch()} />
      ) : (
        <MemberProfile member={member} />
      )}
    </div>
  );
}

function MemberProfile({ member }: { member: UserDetail }) {
  const currentUser = useCurrentUser();
  const isSelf = member.id === currentUser.id;

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar className="size-12 rounded-lg">
          <AvatarFallback className="rounded-lg bg-muted font-medium text-base">
            {initials(member)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-base">
            {displayName(member)}
            {isSelf && <span className="font-normal text-muted-foreground"> (you)</span>}
          </p>
          <p className="truncate text-muted-foreground text-sm">@{member.username}</p>
        </div>
        <StatusBadge status={member.status} />
      </div>

      <SettingsSection title="Details">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Detail label="Email">{member.email ?? "—"}</Detail>
          <Detail label="Position">{member.position}</Detail>
          <Detail label="Role">{ROLE_LABELS[member.role]}</Detail>
          <Detail label="Member since">{formatDate(member.createdAt)}</Detail>
          <Detail label="Approved by">{member.approvedBy?.fullName ?? "—"}</Detail>
          <Detail label="Approved on">
            {member.approvedAt ? formatDate(member.approvedAt) : "—"}
          </Detail>
        </dl>
      </SettingsSection>

      {isAdmin(currentUser) && !isSelf && (
        <SettingsSection title="Manage" description="Administrator actions for this account.">
          {canManage(currentUser, member) ? (
            <ManageActions member={member} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Only the system account can change an administrator.
            </p>
          )}
        </SettingsSection>
      )}
    </>
  );
}

/** Mirrors the backend: admins manage non-admins; only the system account manages admins. */
function canManage(currentUser: SafeUserType, member: UserDetail): boolean {
  return member.role !== "administrator" || currentUser.isSystemAccount;
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="truncate">{children}</dd>
    </div>
  );
}

interface MemberAction {
  title: string;
  summary: string;
  confirmLabel: string;
  /** Sentence after "Enter your password to ...", given the member's name. */
  describe: (name: ReactNode) => ReactNode;
  warning?: string;
  destructive?: boolean;
  run: (password: string) => Promise<void>;
}

/** Status and role changes, each confirmed with the admin's password. */
function ManageActions({ member }: { member: UserDetail }) {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: userQueries.all });
  const status = useMutation({
    mutationFn: (input: SetUserStatusInput) => api.users.setStatus(member.id, input),
    onSettled: invalidate,
  });
  const role = useMutation({
    mutationFn: (input: SetUserRoleInput) => api.users.setRole(member.id, input),
    onSettled: invalidate,
  });

  const nextStatus = member.status === "active" ? "inactive" : "active";
  const statusAction: MemberAction =
    nextStatus === "inactive"
      ? {
          title: "Deactivate account",
          summary:
            "Signs them out and blocks sign-in until an administrator reactivates the account.",
          confirmLabel: "Deactivate",
          describe: (name) => <>deactivate {name}</>,
          warning: "They'll be signed out right away and can't sign in until reactivated.",
          destructive: true,
          run: (password) => status.mutateAsync({ status: nextStatus, password }),
        }
      : {
          title: "Activate account",
          summary: "Lets them sign in again.",
          confirmLabel: "Activate",
          describe: (name) => <>activate {name}</>,
          run: (password) => status.mutateAsync({ status: nextStatus, password }),
        };

  const nextRole = member.role === "administrator" ? "user" : "administrator";
  const roleAction: MemberAction =
    nextRole === "administrator"
      ? {
          title: "Make administrator",
          summary: "Lets them approve accounts and manage other members.",
          confirmLabel: "Make administrator",
          describe: (name) => <>make {name} an administrator</>,
          warning: currentUser.isSystemAccount
            ? undefined
            : "Only the system account can undo this. Once they're an administrator, you can't change their role or status.",
          run: (password) => role.mutateAsync({ role: nextRole, password }),
        }
      : {
          title: "Change to user",
          summary: "Removes their administrator access.",
          confirmLabel: "Change to user",
          describe: (name) => <>change {name} to a regular user</>,
          destructive: true,
          run: (password) => role.mutateAsync({ role: nextRole, password }),
        };

  return (
    <div className="divide-y">
      {/* Awaiting accounts are decided in Pending approvals instead. */}
      {member.status !== "awaiting_approval" && (
        <MemberActionRow member={member} action={statusAction} />
      )}
      <MemberActionRow member={member} action={roleAction} />
    </div>
  );
}

function MemberActionRow({ member, action }: { member: UserDetail; action: MemberAction }) {
  // Snapshot on open: the member refetches while the dialog is closing.
  const [confirming, setConfirming] = useState<MemberAction | null>(null);
  const [open, setOpen] = useState(false);
  const shown = confirming ?? action;
  const name = <span className="font-medium text-foreground">{displayName(member)}</span>;

  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="space-y-0.5">
        <p className="font-medium text-sm">{action.title}</p>
        <p className="text-muted-foreground text-sm">{action.summary}</p>
      </div>
      <Button
        variant={action.destructive ? "destructive" : "default"}
        onClick={() => {
          setConfirming(action);
          setOpen(true);
        }}
      >
        {action.confirmLabel}
      </Button>

      <PasswordConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={shown.title}
        description={<>Enter your password to {shown.describe(name)}.</>}
        warning={shown.warning}
        confirmLabel={shown.confirmLabel}
        destructive={shown.destructive}
        onConfirm={shown.run}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading member" className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {[0, 1, 2, 3, 4, 5].map((cell) => (
          <div key={cell} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
