import { formatDate, formatDateOnly, parseDateOnly, toDateOnly } from "./dates";

describe("parseDateOnly and toDateOnly", () => {
  it("round-trip a calendar day through local time", () => {
    expect(parseDateOnly("2026-01-05")).toEqual(new Date(2026, 0, 5));
    expect(toDateOnly(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("gives undefined for an empty or malformed value", () => {
    expect(parseDateOnly("")).toBeUndefined();
    expect(parseDateOnly("soon")).toBeUndefined();
  });
});

describe("formatDateOnly", () => {
  it("formats a date-only string without shifting the day", () => {
    expect(formatDateOnly("2026-12-30")).toBe("Dec 30, 2026");
    expect(formatDateOnly("2026-01-01")).toBe("Jan 01, 2026");
  });

  it("returns malformed input unchanged", () => {
    expect(formatDateOnly("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDate", () => {
  it("formats a timestamp as its local calendar day", () => {
    expect(formatDate(new Date(2026, 9, 21, 23, 59))).toBe("Oct 21, 2026");
  });
});
