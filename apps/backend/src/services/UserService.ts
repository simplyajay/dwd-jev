import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors/AppError.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { formatFullName } from "../utils/fullName.js";
import type {
  Role,
  SafeUserType,
  UserDetail,
  UserSummary,
  UserType,
} from "@dwd-jev/shared";
import type {
  CreateUserInput,
  LoginInput,
  UpdateAccountInput,
  UpdateProfileInput,
} from "@dwd-jev/shared";
import type { Redis } from "ioredis";
import type { RefreshTokenService } from "./RefreshTokenService.js";
import type {
  ActiveStatus,
  IUserRepository,
  ManagedUserData,
  UserDetailRow,
  UserSummaryRow,
} from "../repositories/UserRepository.js";

const reserved = ["administrator", "admin", "root"];

const toSafeUser = (user: UserType): SafeUserType => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

const toUserSummary = (user: UserSummaryRow): UserSummary => ({
  id: user.id,
  fullName: formatFullName(user),
  position: user.position,
  status: user.status,
});

const toUserDetail = ({ approvedByUser, ...user }: UserDetailRow): UserDetail => ({
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
  ) {}

  async createUser(input: CreateUserInput): Promise<SafeUserType> {
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
    const updated = await this.updateManagedUser(id, adminId, password, { status });

    // Best effort; refresh re-checks status.
    if (status === "inactive") {
      try {
        await this.refreshTokenService.revokeAllForUser(id, redis);
      } catch (err) {
        console.warn(`[userService] refresh token revoke failed for "${id}".`, err);
      }
    }

    return toUserDetail(updated);
  }

  async setUserRole(
    id: string,
    role: Role,
    adminId: string,
    password: string,
  ): Promise<UserDetail> {
    const updated = await this.updateManagedUser(id, adminId, password, { role });
    return toUserDetail(updated);
  }

  // Only the system account may change another administrator.
  private async updateManagedUser(
    id: string,
    adminId: string,
    password: string,
    data: ManagedUserData,
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
  ): Promise<{ user: UserDetail; passwordChanged: boolean }> {
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
      const forbidden = reserved.includes(input.username.toLocaleLowerCase());

      if (forbidden) {
        throw new ForbiddenError("You cannot use this username.", "username");
      }

      const existing = await this.userRepository.findByUsername(input.username);
      if (existing) throw new ConflictError("Username is already taken.", "username");
    }

    if (email && email !== current.email) {
      const existing = await this.userRepository.findByEmail(email);
      if (existing) throw new ConflictError("Email is already in use.", "email");
    }

    const user = await this.userRepository.updateAccount(userId, {
      username: input.username,
      email,
      ...(input.newPassword && { password: await hashPassword(input.newPassword) }),
    });
    if (!user) throw new NotFoundError("User not found.");

    return { user: toUserDetail(user), passwordChanged: !!input.newPassword };
  }

  // Re-checks the admin in the DB (token role may be stale). 403, not 401, on a
  // wrong password so the client doesn't treat it as an expired token.
  private async confirmAdminPassword(
    adminId: string,
    password: string,
  ): Promise<UserType> {
    const admin = await this.userRepository.findWithPasswordById(adminId);
    if (!admin || admin.status !== "active" || admin.role !== "administrator") {
      throw new ForbiddenError("You do not have permission to perform this action.");
    }

    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) throw new ForbiddenError("Incorrect password.");

    return admin;
  }

  // Verifies credentials only -- token issuance is AuthService's job.
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
