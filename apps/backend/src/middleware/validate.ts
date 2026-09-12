import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../errors/AppError.js";

export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new ValidationError(result.error.issues.map((issue) => issue.message).join(", ")));
      return;
    }
    req.body = result.data;
    next();
  };
