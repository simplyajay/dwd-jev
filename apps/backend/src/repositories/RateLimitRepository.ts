import { prisma } from "../lib/prisma.js";

export interface IRateLimitRepository {
  hit(key: string, windowSeconds: number): Promise<number>;
  deleteExpired(): Promise<number>;
}

export class PrismaRateLimitRepository implements IRateLimitRepository {
  // Atomic: starts a new window if the current one has expired, else increments.
  async hit(key: string, windowSeconds: number): Promise<number> {
    const [{ count }] = await prisma.$queryRaw<[{ count: number }]>`
      INSERT INTO rate_limits (key, count, expires_at)
      VALUES (${key}, 1, now() + ${windowSeconds} * interval '1 second')
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.expires_at <= now()
          THEN 1 ELSE rate_limits.count + 1 END,
        expires_at = CASE WHEN rate_limits.expires_at <= now()
          THEN EXCLUDED.expires_at ELSE rate_limits.expires_at END
      RETURNING count
    `;
    return count;
  }

  async deleteExpired(): Promise<number> {
    const { count } = await prisma.rateLimit.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    return count;
  }
}
