import { formatPesos, parsePesos } from "./money";

describe("formatPesos", () => {
  it("groups thousands and shows centavos", () => {
    expect(formatPesos(5000.3)).toBe("5,000.30");
    expect(formatPesos(0)).toBe("0.00");
  });
});

describe("parsePesos", () => {
  it("reads typed amounts, with or without commas", () => {
    expect(parsePesos("1,234.5")).toBe(1234.5);
    expect(parsePesos(" 12 ")).toBe(12);
  });

  it("rounds to centavos", () => {
    expect(parsePesos("0.125")).toBe(0.13);
  });

  it("gives undefined for empty or non-numeric text", () => {
    expect(parsePesos("")).toBeUndefined();
    expect(parsePesos(".")).toBeUndefined();
  });
});
