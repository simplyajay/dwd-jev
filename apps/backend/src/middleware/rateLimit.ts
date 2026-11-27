import type { Request, RequestHandler } from "express";
import { rateLimitRepository } from "../container.js";
import { TooManyRequestsError } from "../errors/AppError.js";

interface RateLimitOptions {
  windowSeconds: number;
  max: number;
  keyPrefix: string;
  keyBy?: (req: Request) => string | undefined;
}

// Fixed-window counter, per IP unless keyBy is given. Fails open if the DB is down.
export const rateLimit = ({
  windowSeconds,
  max,
  keyPrefix,
  keyBy = (req) => req.ip,
}: RateLimitOptions): RequestHandler => {
  return async (req, res, next) => {
    const key = `${keyPrefix}:${keyBy(req) ?? "unknown"}`;

    try {
      const { count, retryAfterSeconds } = await rateLimitRepository.hit(
        key,
        windowSeconds,
      );

      if (count > max) {
        res.set("Retry-After", String(retryAfterSeconds));
        next(new TooManyRequestsError(retryAfterSeconds));
        return;
      }
    } catch (err) {
      console.warn(`[rateLimit] check failed for "${key}", allowing request.`, err);
    }

    next();
  };
};
