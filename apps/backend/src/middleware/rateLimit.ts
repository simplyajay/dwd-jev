import type { RequestHandler } from "express";
import { redis } from "../lib/redis.js";
import { TooManyRequestsError } from "../errors/AppError.js";

interface RateLimitOptions {
  windowSeconds: number;
  max: number;
  keyPrefix: string;
}

// Fixed-window counter per IP. Fails open if Redis is unreachable -- same
// best-effort philosophy as utils/cache.ts.
export const rateLimit = ({ windowSeconds, max, keyPrefix }: RateLimitOptions): RequestHandler => {
  return async (req, _res, next) => {
    const key = `ratelimit:${keyPrefix}:${req.ip ?? "unknown"}`;

    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (count > max) {
        next(new TooManyRequestsError());
        return;
      }
    } catch (err) {
      console.warn(`[rateLimit] check failed for "${key}", allowing request.`, err);
    }

    next();
  };
};
