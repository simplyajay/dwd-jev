import { UnauthorizedError } from "../errors/AppError.js";
import { inTransaction } from "../lib/transaction.js";
import { signAccessToken } from "../utils/jwt.js";
import type {
  LoginInput,
  UpdateAccountInput,
  UpdateAccountResult,
} from "@dwd-jev/shared";
import type { RefreshTokenService, RotatedTokens } from "./RefreshTokenService.js";
import type { UserService } from "./UserService.js";
import type { IUserRepository } from "../repositories/UserRepository.js";
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
    private readonly userRepository: IUserRepository,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.userService.verifyCredentials(input);

    const { state, refreshToken } = await inTransaction(async (tx) => {
      const state = await this.userRepository.bumpTokenVersion(user.id, tx);
      if (!state) throw new UnauthorizedError("Invalid username or password.");
      const refreshToken = await this.refreshTokenService.issue(
        state.id,
        state.tokenVersion,
        tx,
      );
      return { state, refreshToken };
    });

    const accessToken = signAccessToken({
      sub: state.id,
      role: state.role,
      ver: state.tokenVersion,
    });
    return { accessToken, refreshToken, user };
  }

  refresh(oldRefreshToken: string): Promise<RotatedTokens> {
    return this.refreshTokenService.rotate(oldRefreshToken);
  }

  async updateAccount(
    userId: string,
    input: UpdateAccountInput,
  ): Promise<UpdateAccountResult> {
    const { user, authState, refreshToken } = await this.userService.updateAccount(
      userId,
      input,
    );
    if (!authState || !refreshToken) return { user };

    const accessToken = signAccessToken({
      sub: authState.id,
      role: authState.role,
      ver: authState.tokenVersion,
    });
    return { user, accessToken, refreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await inTransaction(async (tx) => {
      const userId = await this.refreshTokenService.revoke(refreshToken, tx);
      if (userId) await this.userRepository.bumpTokenVersion(userId, tx);
    });
  }
}
