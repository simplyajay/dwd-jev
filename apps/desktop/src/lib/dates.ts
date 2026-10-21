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

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

/** Formats a point in time (e.g. `createdAt`) as its calendar day in local time. */
export function formatDate(value: Date): string {
  return DATE_FORMAT.format(value);
}
