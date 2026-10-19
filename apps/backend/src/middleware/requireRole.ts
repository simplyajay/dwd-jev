import type { RequestHandler } from "express";
import type { Role } from "@dwd-jev/shared";
import { ForbiddenError } from "../errors/AppError.js";

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ForbiddenError("You do not have permission to perform this action."));
      return;
    }
    next();
  };
