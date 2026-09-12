import { PrismaUserRepository } from "./repositories/UserRepository.js";
import { UserService } from "./services/UserService.js";
import { RefreshTokenService } from "./services/RefreshTokenService.js";
import { AuthService } from "./services/AuthService.js";

const userRepository = new PrismaUserRepository();

export const userService = new UserService(userRepository);
const refreshTokenService = new RefreshTokenService(userRepository);
export const authService = new AuthService(userService, refreshTokenService);
