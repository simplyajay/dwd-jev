import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const userQueries = {
  /** Prefix of every user query, for invalidation. */
  all: ["users"] as const,
  list: () =>
    queryOptions({
      queryKey: [...userQueries.all, "list"],
      queryFn: () => api.users.list(),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...userQueries.all, "detail", id],
      queryFn: () => api.users.get(id),
    }),
  pending: () =>
    queryOptions({
      queryKey: [...userQueries.all, "pending"],
      queryFn: () => api.users.listPending(),
    }),
};
