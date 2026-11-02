import { getRouteApi } from "@tanstack/react-router";
import { SettingsPlaceholder } from "@/features/settings/components/settings-section";
import { JevPageHeader } from "./jev-page-header";

const route = getRouteApi("/_app/jevs/$jevId/edit");

export function JevEditPage() {
  const { jevId } = route.useParams();

  return (
    <div className="space-y-3">
      <JevPageHeader jevId={jevId} />
      <SettingsPlaceholder>Editing is coming soon.</SettingsPlaceholder>
    </div>
  );
}
