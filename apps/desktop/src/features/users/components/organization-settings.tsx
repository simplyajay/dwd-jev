import { useCurrentUser } from "@/features/auth/auth-context";
import {
  SettingsPlaceholder,
  SettingsSection,
} from "@/features/settings/components/settings-section";
import { isAdmin } from "@/features/settings/settings-tabs";

export function OrganizationSettings() {
  const user = useCurrentUser();

  return (
    <>
      {/* Approving accounts is an administrator task; others don't see the queue. */}
      {isAdmin(user) && (
        <SettingsSection
          title="Pending approvals"
          description="New accounts wait here until an administrator approves them."
        >
          <SettingsPlaceholder>No accounts are waiting for approval.</SettingsPlaceholder>
        </SettingsSection>
      )}

      <SettingsSection title="Members" description="People in your organization.">
        <SettingsPlaceholder>The member list will appear here.</SettingsPlaceholder>
      </SettingsSection>
    </>
  );
}
