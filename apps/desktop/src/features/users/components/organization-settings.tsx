import { useState } from "react";
import { useCurrentUser } from "@/features/auth/auth-context";
import { SettingsSection } from "@/features/settings/components/settings-section";
import { isAdmin } from "@/features/settings/settings-tabs";
import { MemberDetail } from "./member-detail";
import { Members } from "./members";
import { PendingApprovals } from "./pending-approvals";

export function OrganizationSettings() {
  const user = useCurrentUser();
  // A member's detail replaces the whole tab; Back returns to the lists.
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  if (openMemberId) {
    return <MemberDetail id={openMemberId} onBack={() => setOpenMemberId(null)} />;
  }

  return (
    <>
      {isAdmin(user) && (
        <SettingsSection
          title="Pending approvals"
          description="New accounts wait here until an administrator approves them."
        >
          <PendingApprovals />
        </SettingsSection>
      )}

      <SettingsSection
        title="Members"
        description={
          isAdmin(user)
            ? "People in your organization, including inactive accounts."
            : "People in your organization."
        }
      >
        <Members onOpen={setOpenMemberId} />
      </SettingsSection>
    </>
  );
}
