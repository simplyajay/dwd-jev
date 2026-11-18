import type { Prisma } from "@prisma/client";
import type { Jev } from "@dwd-jev/shared";
import type { Tx } from "../lib/transaction.js";
import { toJsonSafe } from "../utils/jsonSafe.js";

export interface CreateJevRevisionInput {
  jevId: string;
  beforeData: Jev;
  afterData: Jev;
  updatedBy: string;
}

export interface IJevRevisionRepository {
  create(data: CreateJevRevisionInput, tx: Tx): Promise<{ id: string }>;
}

export class PrismaJevRevisionRepository implements IJevRevisionRepository {
  create(
    { beforeData, afterData, ...data }: CreateJevRevisionInput,
    tx: Tx,
  ): Promise<{ id: string }> {
    return tx.jevRevision.create({
      data: {
        ...data,
        beforeData: toJsonSafe(beforeData) as Prisma.InputJsonValue,
        afterData: toJsonSafe(afterData) as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
  }
}
