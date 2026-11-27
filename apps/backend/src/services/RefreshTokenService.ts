import { createHash, randomBytes } from "node:crypto";
import { UnauthorizedError } from "../errors/AppError.js";
import { signAccessToken } from "../utils/jwt.js";
import type { DbClient } from "../lib/transaction.js";
import type { IRefreshTokenRepository } from "../repositories/RefreshTokenRepository.js";
import type { IUserRepository } from "../repositories/UserRepository.js";
import type { SafeUserType } from "@dwd-jev/shared";

const REFRESH_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

const generateToken = (): string => randomBytes(32).toString("hex");

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const newExpiry = (): Date => new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

const invalidToken = (): UnauthorizedError =>
  new UnauthorizedError("Refresh token is invalid or expired.");

export interface RotatedTokens {
  accessToken: string;
  refreshToken: string;
  user: SafeUserType;
}

export class RefreshTokenService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  // Replaces the user's token; pass the version the token is valid for.
  async issue(userId: string, tokenVersion: number, client?: DbClient): Promise<string> {
    const token = generateToken();
    await this.refreshTokenRepository.replaceForUser(
      { userId, tokenHash: hashToken(token), tokenVersion, expiresAt: newExpiry() },
      client,
    );
    return token;
  }

  // Returns the token's owner, or null if the token was unknown.
  revoke(token: string, client?: DbClient): Promise<string | null> {
    return this.refreshTokenRepository.deleteByHash(hashToken(token), client);
  }

  async rotate(oldToken: string): Promise<RotatedTokens> {
    const refreshToken = generateToken();
    const rotated = await this.refreshTokenRepository.rotate(
      hashToken(oldToken),
      hashToken(refreshToken),
      newExpiry(),
    );
    if (!rotated) throw invalidToken();

    // Any version bump since issue (role, status, password, logout) ends the session.
    const found = await this.userRepository.findSessionUser(rotated.userId);
    if (
      !found ||
      found.status !== "active" ||
      found.tokenVersion !== rotated.tokenVersion
    ) {
      throw invalidToken();
    }

    const { tokenVersion, ...user } = found;
    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      ver: tokenVersion,
    });
    return { accessToken, refreshToken, user };
  }

  deleteExpired(): Promise<number> {
    return this.refreshTokenRepository.deleteExpired();
  }
}
