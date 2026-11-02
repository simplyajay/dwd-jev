import { getRouteApi } from "@tanstack/react-router";
import { SettingsPlaceholder } from "@/features/settings/components/settings-section";
import { JevPageHeader } from "./jev-page-header";

const route = getRouteApi("/_app/jevs/$jevId/");

export function JevViewPage() {
  const { jevId } = route.useParams();

  return (
    <div className="space-y-3">
      <JevPageHeader jevId={jevId} />
      <SettingsPlaceholder>The read-only view is coming soon.</SettingsPlaceholder>
    </div>
  );
}
