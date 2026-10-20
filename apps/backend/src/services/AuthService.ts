import { UnauthorizedError } from "../errors/AppError.js";
import { signAccessToken } from "../utils/jwt.js";
import type { Redis } from "ioredis";
import type {
  LoginInput,
  UpdateAccountInput,
  UpdateAccountResult,
} from "@dwd-jev/shared";
import type { RefreshTokenService, RotatedTokens } from "./RefreshTokenService.js";
import type { UserService } from "./UserService.js";
import type { AuthStateService } from "./AuthStateService.js";
import type { SafeUserType } from "@dwd-jev/shared";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: SafeUserType;
}

export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly authStateService: AuthStateService,
  ) {}

  // Refresh token first, so a Redis outage fails the login without ending the
  // current session.
  async login(input: LoginInput, redis: Redis): Promise<LoginResult> {
    const user = await this.userService.verifyCredentials(input);
    const refreshToken = await this.refreshTokenService.issueRefreshToken(user.id, redis);
    const state = await this.authStateService.bump(user.id, redis);
    if (!state) throw new UnauthorizedError("Invalid username or password.");

    const accessToken = signAccessToken({
      sub: state.id,
      role: state.role,
      ver: state.tokenVersion,
    });
    return { accessToken, refreshToken, user };
  }

  refresh(oldRefreshToken: string, redis: Redis): Promise<RotatedTokens> {
    return this.refreshTokenService.rotateRefreshToken(oldRefreshToken, redis);
  }

  async updateAccount(
    userId: string,
    input: UpdateAccountInput,
    redis: Redis,
  ): Promise<UpdateAccountResult> {
    // Fail before the password write (which ends the session) if Redis is down.
    if (input.newPassword) await this.refreshTokenService.ensureAvailable(redis);

    const { user, authState } = await this.userService.updateAccount(userId, input);
    if (!authState) return { user };

    await this.authStateService.cache(authState, redis);
    const accessToken = signAccessToken({
      sub: authState.id,
      role: authState.role,
      ver: authState.tokenVersion,
    });
    const refreshToken = await this.refreshTokenService.issueRefreshToken(user.id, redis);
    return { user, accessToken, refreshToken };
  }

  async logout(refreshToken: string, redis: Redis): Promise<void> {
    const userId = await this.refreshTokenService.revokeRefreshToken(refreshToken, redis);
    if (userId) await this.authStateService.bump(userId, redis);
  }
}
