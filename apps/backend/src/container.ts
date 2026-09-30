import { PrismaUserRepository } from "./repositories/UserRepository.js";
import { PrismaJevRepository } from "./repositories/JevRepository.js";
import { PrismaAuditLogRepository } from "./repositories/AuditLogRepository.js";
import { UserService } from "./services/UserService.js";
import { RefreshTokenService } from "./services/RefreshTokenService.js";
import { AuthService } from "./services/AuthService.js";
import { JevService } from "./services/JevService.js";

const userRepository = new PrismaUserRepository();
const jevRepository = new PrismaJevRepository();
export const auditLogRepository = new PrismaAuditLogRepository();

const refreshTokenService = new RefreshTokenService(userRepository);
export const userService = new UserService(userRepository);
export const authService = new AuthService(userService, refreshTokenService);
export const jevService = new JevService(jevRepository);
