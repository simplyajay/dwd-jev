import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
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
import type { CreateUserInput, LoginInput } from "@dwd-jev/shared";
import type {
  IUserRepository,
  UserDetailRow,
  UserSummaryRow,
} from "../repositories/UserRepository.js";

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
  constructor(private readonly userRepository: IUserRepository) {}

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
      middleName: input.middleName ?? null,
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
