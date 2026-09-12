import { randomBytes } from "node:crypto";
import type { Redis } from "ioredis";
import { UnauthorizedError } from "../errors/AppError.js";
import type { IUserRepository } from "../repositories/UserRepository.js";
import { signAccessToken } from "../utils/jwt.js";

const REFRESH_TOKEN_TTL_SECONDS = 28800; // 8 hours

const refreshTokenKey = (token: string): string => `refresh:${token}`;

export interface RotatedTokens {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenService {
  constructor(private readonly userRepository: IUserRepository) {}

  async issueRefreshToken(userId: string, redis: Redis): Promise<string> {
    const token = randomBytes(32).toString("hex");
    await redis.set(refreshTokenKey(token), userId, "EX", REFRESH_TOKEN_TTL_SECONDS);
    return token;
  }

  async revokeRefreshToken(token: string, redis: Redis): Promise<void> {
    await redis.del(refreshTokenKey(token));
  }

  async rotateRefreshToken(oldToken: string, redis: Redis): Promise<RotatedTokens> {
    const userId = await redis.get(refreshTokenKey(oldToken));
    if (!userId) {
      throw new UnauthorizedError("Refresh token is invalid or expired.");
    }

    // Delete first -- a refresh token must never be usable twice, even if
    // something below throws.
    await redis.del(refreshTokenKey(oldToken));

    // Re-checked fresh from the DB (not cached in Redis) so a role change or
    // deactivation takes effect on the next rotation, not just at next login.
    const user = await this.userRepository.findById(userId);
    if (!user || user.status !== "active") {
      throw new UnauthorizedError("Refresh token is invalid or expired.");
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = await this.issueRefreshToken(user.id, redis);

    return { accessToken, refreshToken };
  }
}
