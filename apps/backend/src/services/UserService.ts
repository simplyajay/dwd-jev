import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/AppError.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import type { UserType, SafeUserType } from "@dwd-jev/shared";
import type { CreateUserInput, LoginInput } from "@dwd-jev/shared";
import type { IUserRepository } from "../repositories/UserRepository.js";

const toSafeUser = (user: UserType): SafeUserType => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

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

    //status, role, isSystemAccount, and createAt is not included because it has default values
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

  async getUserById(id: string): Promise<SafeUserType | null> {
    const user = await this.userRepository.findById(id);

    if (!user) throw new NotFoundError("User not found.");

    return toSafeUser(user);
  }

  async getPendingUsers(): Promise<SafeUserType[]> {
    return await this.userRepository.findUsers(true);
  }

  async getApprovedUsers(): Promise<SafeUserType[]> {
    return await this.userRepository.findUsers();
  }

  // Verifies credentials only -- token issuance (access + refresh) is AuthService's job
  async verifyCredentials(input: LoginInput): Promise<SafeUserType> {
    const user = await this.userRepository.findByUsername(input.username);
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
