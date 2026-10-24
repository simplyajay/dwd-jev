import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors/AppError.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { formatFullName } from "../utils/fullName.js";
import { inTransaction } from "../lib/transaction.js";
import type {
  Role,
  SafeUserType,
  UserDetail,
  UserSummary,
} from "@dwd-jev/shared";
import type {
  CreateUserInput,
  LoginInput,
  UpdateAccountInput,
  UpdateProfileInput,
} from "@dwd-jev/shared";
import type { Redis } from "ioredis";
import type { RefreshTokenService } from "./RefreshTokenService.js";
import type { AuthStateService } from "./AuthStateService.js";
import type {
  ActiveStatus,
  AuthState,
  IUserRepository,
  ManagedUserData,
  UserDetailRow,
  UserRow,
  UserSummaryRow,
} from "../repositories/UserRepository.js";

const RESERVED_USERNAMES = ["administrator", "admin", "root"];

const assertUsernameAllowed = (username: string): void => {
  if (RESERVED_USERNAMES.includes(username.toLocaleLowerCase())) {
    throw new ForbiddenError("You cannot use this username.", "username");
  }
};

const toSafeUser = (user: UserRow): SafeUserType => {
  const { password: _password, tokenVersion: _tokenVersion, ...safeUser } = user;
  return safeUser;
};

const toAuthState = ({ id, status, role, tokenVersion }: AuthState): AuthState => ({
  id,
  status,
  role,
  tokenVersion,
});

const toUserSummary = (user: UserSummaryRow): UserSummary => ({
  id: user.id,
  fullName: formatFullName(user),
  position: user.position,
  status: user.status,
});

const toUserDetail = ({
  approvedByUser,
  tokenVersion: _tokenVersion,
  ...user
}: UserDetailRow): UserDetail => ({
  ...user,
  approvedBy: approvedByUser && {
    id: approvedByUser.id,
    fullName: approvedByUser.isSystemAccount ? "System" : formatFullName(approvedByUser),
    isSystemAccount: approvedByUser.isSystemAccount,
  },
});

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly authStateService: AuthStateService,
  ) {}

  async createUser(input: CreateUserInput): Promise<SafeUserType> {
    assertUsernameAllowed(input.username);

    const existingUsername = await this.userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new ConflictError("Username is already taken.", "username");
    }

    if (input.email) {
      const existingEmail = await this.userRepository.findByEmail(input.email);
      if (existingEmail) {
        throw new ConflictError("Email is already in use.", "email");
      }
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await this.userRepository.create({
      firstName: input.firstName,
      middleName: input.middleName || null,
      lastName: input.lastName,
      username: input.username,
      password: hashedPassword,
      email: input.email ?? null,
      position: input.position,
    });

    return toSafeUser(user);
  }

  // Hides system accounts; non-admins see active users only.
  async getUserById(id: string, viewerRole: Role): Promise<UserDetail> {
    const user = await this.userRepository.findDetailById(id);

    const isHidden =
      !user ||
      user.isSystemAccount ||
      (viewerRole !== "administrator" && user.status !== "active");
    if (isHidden) throw new NotFoundError("User not found.");

    return toUserDetail(user);
  }

  async getPendingUsers(): Promise<UserSummary[]> {
    const users = await this.userRepository.findPendingUsers();
    return users.map(toUserSummary);
  }

  async getApprovedUsers(viewerRole: Role): Promise<UserSummary[]> {
    const users = await this.userRepository.findApprovedUsers(
      viewerRole === "administrator",
    );
    return users.map(toUserSummary);
  }

  async approveUser(id: string, adminId: string, password: string): Promise<UserDetail> {
    await this.confirmAdminPassword(adminId, password);

    const user = await this.userRepository.approvePending(id, adminId);
    if (!user) throw new NotFoundError("Pending user not found.");

    return toUserDetail(user);
  }

  async rejectUser(id: string, adminId: string, password: string): Promise<void> {
    await this.confirmAdminPassword(adminId, password);

    const deleted = await this.userRepository.deletePending(id);
    if (!deleted) throw new NotFoundError("Pending user not found.");
  }

  async setUserStatus(
    id: string,
    status: ActiveStatus,
    adminId: string,
    password: string,
    redis: Redis,
  ): Promise<UserDetail> {
    // The version bump also invalidates the user's refresh token.
    const updated = await this.updateManagedUser(id, adminId, password, { status }, redis);
    return toUserDetail(updated);
  }

  async setUserRole(
    id: string,
    role: Role,
    adminId: string,
    password: string,
    redis: Redis,
  ): Promise<UserDetail> {
    const updated = await this.updateManagedUser(id, adminId, password, { role }, redis);
    return toUserDetail(updated);
  }

  // Only the system account may change another administrator.
  private async updateManagedUser(
    id: string,
    adminId: string,
    password: string,
    data: ManagedUserData,
    redis: Redis,
  ): Promise<UserDetailRow> {
    const field = "status" in data ? "status" : "role";
    const admin = await this.confirmAdminPassword(adminId, password);

    const target = await this.userRepository.findById(id);
    if (!target || target.isSystemAccount) throw new NotFoundError("User not found.");
    if (target.status === "awaiting_approval") {
      throw new ConflictError("Pending users must be approved or rejected.");
    }
    if (target.id === admin.id)
      throw new ForbiddenError(`You cannot change your own ${field}.`);
    if (target.role === "administrator" && !admin.isSystemAccount) {
      throw new ForbiddenError(
        `Only the system account can change another administrator's ${field}.`,
      );
    }

    const updated = await this.userRepository.updateManagedUser(
      id,
      data,
      !admin.isSystemAccount,
    );
    if (!updated) {
      throw new ConflictError(
        "This user was changed by someone else. Please refresh and try again.",
      );
    }

    await this.authStateService.cache(toAuthState(updated), redis);
    return updated;
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserDetail> {
    const current = await this.userRepository.findById(userId);
    if (!current) throw new NotFoundError("User not found.");
    if (current.isSystemAccount) {
      throw new ForbiddenError(
        "The system account's personal information cannot be changed.",
      );
    }

    const user = await this.userRepository.updateProfile(userId, {
      firstName: input.firstName,
      middleName: input.middleName || null,
      lastName: input.lastName,
      position: input.position,
    });
    if (!user) throw new NotFoundError("User not found.");

    return toUserDetail(user);
  }

  async updateAccount(
    userId: string,
    input: UpdateAccountInput,
  ): Promise<{ user: UserDetail; authState?: AuthState; refreshToken?: string }> {
    const current = await this.userRepository.findWithPasswordById(userId);
    if (!current) throw new NotFoundError("User not found.");

    const isPasswordValid = await comparePassword(
      input.currentPassword,
      current.password,
    );
    if (!isPasswordValid) {
      throw new ForbiddenError("Incorrect current password.", "currentPassword");
    }

    const email = input.email ?? null;

    // The system account may only change its password.
    if (current.isSystemAccount) {
      if (input.username !== current.username) {
        throw new ForbiddenError(
          "The system account's username cannot be changed.",
          "username",
        );
      }
      if (email !== current.email) {
        throw new ForbiddenError(
          "The system account's email cannot be changed.",
          "email",
        );
      }
    }

    if (
      input.newPassword &&
      (await comparePassword(input.newPassword, current.password))
    ) {
      throw new ValidationError(
        "New password must be different from your current password.",
        "newPassword",
      );
    }

    if (input.username !== current.username) {
      assertUsernameAllowed(input.username);

      const existing = await this.userRepository.findByUsername(input.username);
      if (existing) throw new ConflictError("Username is already taken.", "username");
    }

    if (email && email !== current.email) {
      const existing = await this.userRepository.findByEmail(email);
      if (existing) throw new ConflictError("Email is already in use.", "email");
    }

    const data = {
      username: input.username,
      email,
      ...(input.newPassword && { password: await hashPassword(input.newPassword) }),
    };

    // A password change bumps the version; reissue in the same transaction so
    // this session survives.
    return inTransaction(async (tx) => {
      const user = await this.userRepository.updateAccount(userId, data, tx);
      if (!user) throw new NotFoundError("User not found.");
      if (!data.password) return { user: toUserDetail(user) };

      const refreshToken = await this.refreshTokenService.issue(
        user.id,
        user.tokenVersion,
        tx,
      );
      return { user: toUserDetail(user), authState: toAuthState(user), refreshToken };
    });
  }

  // Re-reads the admin from the DB. A wrong password is 403, not 401, so the
  // client doesn't treat it as an expired token.
  private async confirmAdminPassword(
    adminId: string,
    password: string,
  ): Promise<UserRow> {
    const admin = await this.userRepository.findWithPasswordById(adminId);
    if (!admin || admin.status !== "active" || admin.role !== "administrator") {
      throw new ForbiddenError("You do not have permission to perform this action.");
    }

    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) throw new ForbiddenError("Incorrect password.", "password");

    return admin;
  }

  // Credentials only; AuthService issues tokens.
  async verifyCredentials(input: LoginInput): Promise<SafeUserType> {
    const user = await this.userRepository.findWithPasswordByUsername(input.username);
    if (!user) {
      throw new UnauthorizedError("Invalid username or password.");
    }

    const isPasswordValid = await comparePassword(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid username or password.");
    }

    if (user.status === "awaiting_approval")
      throw new ForbiddenError("Your account is awaiting administrator approval.");

    if (user.status === "inactive") {
      throw new UnauthorizedError(
        "Account is inactive. Please contact an administrator.",
      );
    }

    return toSafeUser(user);
  }
}
