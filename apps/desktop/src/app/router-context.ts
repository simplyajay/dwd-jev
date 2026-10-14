import type { QueryClient } from "@tanstack/react-query";
import type { AuthContextValue } from "@/features/auth/auth-context";

/** Available to every route's beforeLoad/loader via `context`. */
export interface RouterContext {
  queryClient: QueryClient;
  auth: AuthContextValue;
}
