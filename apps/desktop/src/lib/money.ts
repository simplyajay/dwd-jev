// Form amounts are pesos as JS numbers (what the API takes); responses send cents.

const PESO_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPesos(pesos: number): string {
  return PESO_FORMAT.format(pesos);
}

/** Typed text as pesos rounded to centavos; undefined when empty or not a number. */
export function parsePesos(text: string): number | undefined {
  const cleaned = text.replace(/,/g, "").trim();
  if (cleaned === "") return undefined;
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : undefined;
}
