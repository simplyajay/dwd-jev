import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useParams,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import type { ZodType } from "zod";
import { TooltipProvider } from "@/components/ui/tooltip";

// Radix uses pointer capture and scrollIntoView, and the router scrolls the window; jsdom has none.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
window.scrollTo = () => {};

interface TestRoute {
  /** Under the signed-in area, e.g. "/jevs/$jevId/" (route ID "/_app/jevs/$jevId/"). */
  path: string;
  component: () => ReactNode;
  validateSearch?: ZodType;
}

/** A stand-in page showing its name and params, e.g. "Viewing <jevId>". */
export function stubPage(name: string) {
  return function Stub() {
    const params = useParams({ strict: false }) as Record<string, string>;
    return <p>{[name, ...Object.values(params)].join(" ")}</p>;
  };
}

/** Renders the given routes under "_app", with React Query and tooltips, at `url`. */
export function renderRoutes(routes: TestRoute[], url: string) {
  const rootRoute = createRootRoute({ component: Outlet });
  const appRoute = createRoute({ getParentRoute: () => rootRoute, id: "_app" });
  const children = routes.map(({ path, component, validateSearch }) =>
    createRoute({
      getParentRoute: () => appRoute,
      path,
      component,
      validateSearch,
    }),
  );
  const router = createRouter({
    routeTree: rootRoute.addChildren([appRoute.addChildren(children)]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
  return router;
}
