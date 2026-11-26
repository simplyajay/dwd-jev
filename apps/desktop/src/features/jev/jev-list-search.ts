import { z } from "zod";
import { createRememberedSearch } from "@/lib/remembered-search";

/** Until the backend lists the years that have JEVs. */
export const JEV_YEARS = [2026, 2025, 2024, 2023] as const;

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

// For the sidebar link and Back to list.
const remembered = createRememberedSearch<JevListSearch>();
export const rememberJevListSearch = remembered.remember;
export const useRememberedJevListSearch = remembered.useRemembered;

export const JEV_PAGE_SIZE_KEY = "jev.list-page-size";
