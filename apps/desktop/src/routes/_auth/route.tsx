import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

/** Public pages. Signed-in users are sent into the app. */
export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (context.auth.state.status === "signed-in") throw redirect({ to: "/jevs" });
  },
  component: Outlet,
});
