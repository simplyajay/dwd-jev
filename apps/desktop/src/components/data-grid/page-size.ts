export const PAGE_SIZES = [20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

/** A list's rows per page, kept in localStorage under `key`. */
export function readPageSize(key: string): PageSize {
  try {
    const stored = Number(localStorage.getItem(key));
    return PAGE_SIZES.find((size) => size === stored) ?? PAGE_SIZES[0];
  } catch {
    return PAGE_SIZES[0];
  }
}

export function storePageSize(key: string, size: PageSize): void {
  try {
    localStorage.setItem(key, String(size));
  } catch {
    // Not persisted; the size still applies until the app closes.
  }
}
