import { z } from "zod";

// Cents are only used internally, for float-safe sum/equality checks.
export function toCents(pesos: number): number {
  return Math.round(pesos * 100);
}

export const AmountSchema = z.coerce.number().optional();
