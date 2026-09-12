import type { Redis } from "ioredis";
import type { LoginInput } from "@dwd-jev/shared";
import { signAccessToken } from "../utils/jwt.js";
import type { RefreshTokenService, RotatedTokens } from "./RefreshTokenService.js";
import type { SafeUser, UserService } from "./UserService.js";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async login(input: LoginInput, redis: Redis): Promise<LoginResult> {
    const user = await this.userService.verifyCredentials(input);
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = await this.refreshTokenService.issueRefreshToken(user.id, redis);
    return { accessToken, refreshToken, user };
  }

  refresh(oldRefreshToken: string, redis: Redis): Promise<RotatedTokens> {
    return this.refreshTokenService.rotateRefreshToken(oldRefreshToken, redis);
  }

  logout(refreshToken: string, redis: Redis): Promise<void> {
    return this.refreshTokenService.revokeRefreshToken(refreshToken, redis);
  }
}
