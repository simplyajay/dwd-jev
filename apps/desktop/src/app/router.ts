import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { queryClient } from "./query-client";
import type { RouterContext } from "./router-context";

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    // Supplied by <RouterProvider context> in app.tsx once auth has loaded.
    auth: undefined as unknown as RouterContext["auth"],
  },
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }

  interface StaticDataRouteOption {
    /** Page title shown in the app header. */
    title?: string;
  }
}
