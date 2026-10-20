// @db.Date values are UTC midnight, so slicing toISOString() is timezone-safe.
export const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

export const toDateOnlyOrNull = (date: Date | null): string | null =>
  date ? toDateOnly(date) : null;
