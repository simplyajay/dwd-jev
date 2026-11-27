import { Prisma } from "@prisma/client";
import type { JevSnapshot } from "@dwd-jev/shared";
import { prisma } from "../lib/prisma.js";
import type { Tx } from "../lib/transaction.js";
import { toJsonSafe } from "../utils/jsonSafe.js";
import { USER_REF_WITH_POSITION_SELECT } from "../utils/userRef.js";

const JEV_REVISION_INCLUDE = {
  updatedByUser: { select: USER_REF_WITH_POSITION_SELECT },
} satisfies Prisma.JevRevisionInclude;

export type JevRevisionRow = Prisma.JevRevisionGetPayload<{
  include: typeof JEV_REVISION_INCLUDE;
}>;

export interface CreateJevRevisionInput {
  jevId: string;
  beforeData: JevSnapshot | null;
  afterData: JevSnapshot;
  updatedBy: string;
}

export interface IJevRevisionRepository {
  create(data: CreateJevRevisionInput, tx: Tx): Promise<{ id: string }>;
  findById(id: string): Promise<JevRevisionRow | null>;
}

export class PrismaJevRevisionRepository implements IJevRevisionRepository {
  create(
    { beforeData, afterData, ...data }: CreateJevRevisionInput,
    tx: Tx,
  ): Promise<{ id: string }> {
    return tx.jevRevision.create({
      data: {
        ...data,
        // DbNull stores SQL NULL; JsonNull would store a JSON null.
        beforeData:
          beforeData === null
            ? Prisma.DbNull
            : (toJsonSafe(beforeData) as Prisma.InputJsonValue),
        afterData: toJsonSafe(afterData) as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
  }

  findById(id: string): Promise<JevRevisionRow | null> {
    return prisma.jevRevision.findUnique({
      where: { id },
      include: JEV_REVISION_INCLUDE,
    });
  }
}
