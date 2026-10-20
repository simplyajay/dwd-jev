import { randomBytes } from "node:crypto";
import { ServiceUnavailableError, UnauthorizedError } from "../errors/AppError.js";
import { signAccessToken } from "../utils/jwt.js";
import type { Redis } from "ioredis";
import type { IUserRepository } from "../repositories/UserRepository.js";

const REFRESH_TOKEN_TTL_SECONDS = 28800; // 8 hours

const refreshTokenKey = (token: string): string => `refresh:${token}`;

const userActiveTokenKey = (userId: string): string =>
  `user:${userId}:active_refresh_token`;

// Refresh tokens live only in Redis, so an outage is a 503, not a 500.
const withRedis = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (err) {
    console.warn("[refreshToken] Redis unavailable.", err);
    throw new ServiceUnavailableError();
  }
};

export interface RotatedTokens {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenService {
  constructor(private readonly userRepository: IUserRepository) {}

  // For callers that must fail before changing anything.
  async ensureAvailable(redis: Redis): Promise<void> {
    await withRedis(() => redis.ping());
  }

  issueRefreshToken(userId: string, redis: Redis): Promise<string> {
    return withRedis(async () => {
      const existingToken = await redis.get(userActiveTokenKey(userId));

      if (existingToken) await redis.del(refreshTokenKey(existingToken));

      const token = randomBytes(32).toString("hex");
      await redis.set(refreshTokenKey(token), userId, "EX", REFRESH_TOKEN_TTL_SECONDS);
      await redis.set(userActiveTokenKey(userId), token, "EX", REFRESH_TOKEN_TTL_SECONDS);
      return token;
    });
  }

  // Returns the token's owner, or null if the token was unknown.
  revokeRefreshToken(token: string, redis: Redis): Promise<string | null> {
    return withRedis(async () => {
      const userId = await redis.get(refreshTokenKey(token));
      await redis.del(refreshTokenKey(token));
      if (userId) await redis.del(userActiveTokenKey(userId));
      return userId;
    });
  }

  revokeAllForUser(userId: string, redis: Redis): Promise<void> {
    return withRedis(async () => {
      const token = await redis.get(userActiveTokenKey(userId));
      if (token) await redis.del(refreshTokenKey(token));
      await redis.del(userActiveTokenKey(userId));
    });
  }

  async rotateRefreshToken(oldToken: string, redis: Redis): Promise<RotatedTokens> {
    const userId = await withRedis(() => redis.get(refreshTokenKey(oldToken)));
    if (!userId) {
      throw new UnauthorizedError("Refresh token is invalid or expired.");
    }

    // Delete first so a token can never be used twice.
    await withRedis(() => redis.del(refreshTokenKey(oldToken)));

    // From the DB, so a deactivation applies immediately.
    const user = await this.userRepository.findAuthState(userId);
    if (!user || user.status !== "active") {
      throw new UnauthorizedError("Refresh token is invalid or expired.");
    }

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      ver: user.tokenVersion,
    });
    const refreshToken = await this.issueRefreshToken(user.id, redis);

    return { accessToken, refreshToken };
  }
}
