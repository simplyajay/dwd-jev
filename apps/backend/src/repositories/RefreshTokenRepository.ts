import { prisma } from "../lib/prisma.js";
import { nullIfNotFound } from "../utils/prismaErrors.js";
import type { DbClient } from "../lib/transaction.js";

export interface NewRefreshToken {
  userId: string;
  tokenHash: string;
  tokenVersion: number;
  expiresAt: Date;
}

export interface RotatedRefreshToken {
  userId: string;
  tokenVersion: number;
}

export interface IRefreshTokenRepository {
  replaceForUser(token: NewRefreshToken, client?: DbClient): Promise<void>;
  rotate(
    oldHash: string,
    newHash: string,
    expiresAt: Date,
  ): Promise<RotatedRefreshToken | null>;
  deleteByHash(tokenHash: string, client?: DbClient): Promise<string | null>;
  deleteExpired(): Promise<number>;
}

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  async replaceForUser(
    { userId, ...token }: NewRefreshToken,
    client: DbClient = prisma,
  ): Promise<void> {
    await client.refreshToken.upsert({
      where: { userId },
      create: { userId, ...token },
      update: { ...token, createdAt: new Date() },
    });
  }

  // Swaps the hash in place, so the old token can't be reused and a newer
  // login's token is never overwritten.
  rotate(
    oldHash: string,
    newHash: string,
    expiresAt: Date,
  ): Promise<RotatedRefreshToken | null> {
    return nullIfNotFound(() =>
      prisma.refreshToken.update({
        where: { tokenHash: oldHash, expiresAt: { gt: new Date() } },
        data: { tokenHash: newHash, expiresAt },
        select: { userId: true, tokenVersion: true },
      }),
    );
  }

  // Returns the token's owner, or null if the token was unknown.
  async deleteByHash(
    tokenHash: string,
    client: DbClient = prisma,
  ): Promise<string | null> {
    const deleted = await nullIfNotFound(() =>
      client.refreshToken.delete({ where: { tokenHash }, select: { userId: true } }),
    );
    return deleted?.userId ?? null;
  }

  async deleteExpired(): Promise<number> {
    const { count } = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    return count;
  }
}
