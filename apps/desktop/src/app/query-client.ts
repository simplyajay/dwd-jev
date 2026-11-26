import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

// A 4xx won't change on retry, and retrying a 429 only extends the wait.
const isClientError = (error: Error) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => failureCount < 1 && !isClientError(error),
      refetchOnWindowFocus: false,
    },
  },
});
