import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export type Tx = Prisma.TransactionClient;

// Repositories take this so the same call works inside or outside a transaction.
export type DbClient = Tx | typeof prisma;

export const inTransaction = <T>(fn: (tx: Tx) => Promise<T>): Promise<T> =>
  prisma.$transaction(fn);
