import { useSyncExternalStore } from "react";
import { z } from "zod";

/** Until the backend lists the years that have JEVs. */
export const JEV_YEARS = [2026, 2025, 2024, 2023] as const;

export const PAGE_SIZES = [20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

/** The list's URL state; missing values fall back to the current month and page 1. */
export const JevListSearchSchema = z.object({
  year: z.number().int().optional().catch(undefined),
  /** 1-12, or 0 for all months. */
  month: z.number().int().min(0).max(12).optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
});
export type JevListSearch = z.infer<typeof JevListSearchSchema>;

export function resolveJevListSearch(search: JevListSearch, today = new Date()) {
  return {
    year: search.year ?? today.getFullYear(),
    month: search.month ?? today.getMonth() + 1,
    page: search.page ?? 1,
  };
}

// Where the list was last left, so the sidebar and Back return there. Memory only:
// a restart opens on the current month.
let lastSearch: JevListSearch = {};
const listeners = new Set<() => void>();

export function rememberJevListSearch(search: JevListSearch): void {
  lastSearch = search;
  for (const listener of listeners) listener();
}

export function useRememberedJevListSearch(): JevListSearch {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => lastSearch,
  );
}

const PAGE_SIZE_KEY = "jev.list-page-size";

export function readPageSize(): PageSize {
  try {
    const stored = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return PAGE_SIZES.find((size) => size === stored) ?? PAGE_SIZES[0];
  } catch {
    return PAGE_SIZES[0];
  }
}

export function storePageSize(size: PageSize): void {
  try {
    localStorage.setItem(PAGE_SIZE_KEY, String(size));
  } catch {
    // Not persisted; the size still applies until the app closes.
  }
}
