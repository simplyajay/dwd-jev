import { PrismaUserRepository } from "./repositories/UserRepository.js";
import { PrismaJevRepository } from "./repositories/JevRepository.js";
import { PrismaAuditLogRepository } from "./repositories/AuditLogRepository.js";
import { PrismaRefreshTokenRepository } from "./repositories/RefreshTokenRepository.js";
import { PrismaRateLimitRepository } from "./repositories/RateLimitRepository.js";
import { UserService } from "./services/UserService.js";
import { RefreshTokenService } from "./services/RefreshTokenService.js";
import { AuthService } from "./services/AuthService.js";
import { AuthStateService } from "./services/AuthStateService.js";
import { JevService } from "./services/JevService.js";

const userRepository = new PrismaUserRepository();
const jevRepository = new PrismaJevRepository();
export const auditLogRepository = new PrismaAuditLogRepository();
const refreshTokenRepository = new PrismaRefreshTokenRepository();
export const rateLimitRepository = new PrismaRateLimitRepository();

export const authStateService = new AuthStateService(userRepository);
const refreshTokenService = new RefreshTokenService(
  userRepository,
  refreshTokenRepository,
);
export const userService = new UserService(
  userRepository,
  refreshTokenService,
  authStateService,
);
export const authService = new AuthService(
  userService,
  refreshTokenService,
  authStateService,
  userRepository,
);
export const jevService = new JevService(jevRepository);
