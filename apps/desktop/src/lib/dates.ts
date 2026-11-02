const DATE_ONLY_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  timeZone: "UTC",
});

/** Formats an API date-only string ("2026-12-30"), in UTC so the day never shifts. */
export function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return DATE_ONLY_FORMAT.format(new Date(Date.UTC(year, month - 1, day)));
}

/** A date-only string ("2026-12-30") as local midnight, for date pickers. */
export function parseDateOnly(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

/** A picked local day as a date-only string. */
export function toDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

/** Formats a point in time (e.g. `createdAt`) as its calendar day in local time. */
export function formatDate(value: Date): string {
  return DATE_FORMAT.format(value);
}
