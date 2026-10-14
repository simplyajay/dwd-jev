const DATE_ONLY_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  timeZone: "UTC",
});

/**
 * Formats an API date-only string ("2026-12-30") for display. Parsed and
 * formatted in UTC so the calendar day never shifts with the local timezone.
 */
export function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return DATE_ONLY_FORMAT.format(new Date(Date.UTC(year, month - 1, day)));
}
