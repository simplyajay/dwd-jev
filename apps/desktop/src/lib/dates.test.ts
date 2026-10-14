import { formatDateOnly } from "./dates";

describe("formatDateOnly", () => {
  it("formats a date-only string without shifting the day", () => {
    expect(formatDateOnly("2026-12-30")).toBe("Dec 30, 2026");
    expect(formatDateOnly("2026-01-01")).toBe("Jan 01, 2026");
  });

  it("returns malformed input unchanged", () => {
    expect(formatDateOnly("not-a-date")).toBe("not-a-date");
  });
});
