import type { User } from "@prisma/client";
import type { CreateUserInput, LoginInput, Role, Status } from "@dwd-jev/shared";
import { ConflictError, UnauthorizedError } from "../errors/AppError.js";
import type { IUserRepository } from "../repositories/UserRepository.js";
import { comparePassword, hashPassword } from "../utils/password.js";

export type SafeUser = Omit<User, "password">;

const toSafeUser = (user: User): SafeUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(input: CreateUserInput): Promise<SafeUser> {
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
      role: "user",
      position: input.position,
      status: "inactive",
    });

    return toSafeUser(user);
  }

  // Verifies credentials only -- token issuance (access + refresh) is AuthService's job
  async verifyCredentials(input: LoginInput): Promise<SafeUser> {
    const user = await this.userRepository.findByUsername(input.username);
    if (!user) {
      throw new UnauthorizedError("Invalid username or password.");
    }

    const isPasswordValid = await comparePassword(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid username or password.");
    }

    if (user.status !== "active") {
      throw new UnauthorizedError("Account is inactive. Please contact administrator.");
    }

    return toSafeUser(user);
  }
}
