import type { RequestHandler } from "express";
import { UnauthorizedError } from "../errors/AppError.js";
import { verifyAccessToken, type AccessTokenPayload } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

// Not mounted globally -- createUser/login must stay reachable without a
// token. Apply this per-route to whatever needs to be authenticated.
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing bearer token."));
    return;
  }

  try {
    req.user = verifyAccessToken(header.slice("Bearer ".length));
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token."));
  }
};
