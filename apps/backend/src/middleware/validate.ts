import type { RequestHandler } from "express";
import { z, type ZodType } from "zod";
import { ValidationError } from "../errors/AppError.js";

export const IdParamSchema = z.object({ id: z.uuid("Invalid id.") });

export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new ValidationError(result.error.issues.map((issue) => issue.message).join(", ")),
      );
      return;
    }

    req.body = result.data;
    next();
  };

export const validateParams =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(
        new ValidationError(result.error.issues.map((issue) => issue.message).join(", ")),
      );
      return;
    }

    next();
  };
