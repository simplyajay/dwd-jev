import type { RequestHandler } from "express";
import { userRepository } from "../container.js";
import { UnauthorizedError } from "../errors/AppError.js";
import { verifyAccessToken, type AccessTokenPayload } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

// Mounted per route (register and login need no token). Status and role come
// from the DB, not the token.
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Unauthorized"));
    return;
  }

  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(header.slice("Bearer ".length));
  } catch {
    next(new UnauthorizedError("Invalid or expired token."));
    return;
  }

  try {
    const state = await userRepository.findAuthState(payload.sub);
    if (!state || state.status !== "active" || state.tokenVersion !== payload.ver) {
      next(new UnauthorizedError("Your session is no longer valid. Please log in again."));
      return;
    }

    req.user = { sub: state.id, role: state.role, ver: state.tokenVersion };
    next();
  } catch (err) {
    next(err);
  }
};
