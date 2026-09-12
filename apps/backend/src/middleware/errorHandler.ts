import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";
import { errorResponse } from "../utils/apiResponse.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.statusCode, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join(", ");
    res.status(400).json(errorResponse(400, message));
    return;
  }

  console.error(err);
  res.status(500).json(errorResponse(500, "Internal server error."));
};
