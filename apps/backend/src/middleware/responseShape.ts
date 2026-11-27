import type { RequestHandler } from "express";
import { successResponse } from "../utils/apiResponse.js";

declare global {
  namespace Express {
    interface Response {
      success<T>(data: T, statusCode?: number): void;
    }
  }
}

export const responseShape: RequestHandler = (_req, res, next) => {
  res.success = function (data, statusCode = 200) {
    this.status(statusCode).json(successResponse(statusCode, data));
  };
  next();
};
