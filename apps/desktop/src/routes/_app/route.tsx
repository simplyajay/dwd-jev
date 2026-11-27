import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { SettingsTabIdSchema } from "@/features/settings/settings-tabs";

const AppSearchSchema = z.object({
  /** Open settings tab; the settings dialog is closed when absent. */
  settings: SettingsTabIdSchema.optional().catch(undefined),
});

/** Signed-in area: sidebar + header + page. Signed-out users go to /login. */
export const Route = createFileRoute("/_app")({
  validateSearch: AppSearchSchema,
  beforeLoad: ({ context }) => {
    if (context.auth.state.status !== "signed-in") throw redirect({ to: "/login" });
  },
  component: AppLayout,
});
