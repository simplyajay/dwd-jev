import { formatWait, tooManyRequestsMessage } from "./errors";

describe("formatWait", () => {
  it.each([
    [1, "1 second"],
    [45, "45 seconds"],
    [60, "1 minute"],
    [90, "1 minute and 30 seconds"],
    [121, "2 minutes and 1 second"],
  ])("says %i seconds as %s", (seconds, words) => {
    expect(formatWait(seconds)).toBe(words);
  });
});

describe("tooManyRequestsMessage", () => {
  it("falls back to 'later' without a wait", () => {
    expect(tooManyRequestsMessage(undefined)).toBe("Too many requests. Please try again later.");
  });
});
