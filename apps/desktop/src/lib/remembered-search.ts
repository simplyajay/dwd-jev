import { useSyncExternalStore } from "react";

/** A list's last search, so links back return there. Memory only. */
export function createRememberedSearch<TSearch extends object>() {
  let last = {} as TSearch;
  const listeners = new Set<() => void>();

  return {
    remember(search: TSearch): void {
      last = search;
      for (const listener of listeners) listener();
    },
    useRemembered(): TSearch {
      return useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => last,
      );
    },
  };
}
