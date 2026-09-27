import { Prisma } from "@prisma/client";
import { ConflictError } from "../errors/AppError.js";

// Keyed by Prisma field name (returned as details.field). `targets` covers
// other names Postgres may report for the constraint (column or index name).
export type UniqueFieldMap = Record<string, { label: string; targets?: string[] }>;

const isUniqueViolation = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export const toConflictError = (
  error: Prisma.PrismaClientKnownRequestError,
  fields: UniqueFieldMap,
): ConflictError => {
  const target = error.meta?.target;
  const reported: unknown[] = Array.isArray(target) ? target : [target];

  for (const [field, { label, targets = [] }] of Object.entries(fields)) {
    if ([field, ...targets].some((name) => reported.includes(name))) {
      return new ConflictError(`${label} is already in use.`, field);
    }
  }

  return new ConflictError("A record with the same details already exists.");
};

export const withUniqueConflict = async <T>(
  fields: UniqueFieldMap,
  operation: () => Promise<T>,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw toConflictError(error, fields);
    }
    throw error;
  }
};
