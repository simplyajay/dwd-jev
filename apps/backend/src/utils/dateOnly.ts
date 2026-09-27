// toISOString() always renders in UTC, and @db.Date values come back from
// Prisma anchored to UTC midnight -- so slicing the date off is timezone-safe.
export const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

export const toDateOnlyOrNull = (date: Date | null): string | null =>
  date ? toDateOnly(date) : null;
