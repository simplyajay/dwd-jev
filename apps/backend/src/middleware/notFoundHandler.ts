import type { RequestHandler } from "express";
import { errorResponse } from "../utils/apiResponse.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(errorResponse(404, `No route for ${req.method} ${req.originalUrl}`));
};
