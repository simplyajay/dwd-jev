import type { Request, RequestHandler } from "express";
import { redis } from "../lib/redis.js";
import { TooManyRequestsError } from "../errors/AppError.js";

interface RateLimitOptions {
  windowSeconds: number;
  max: number;
  keyPrefix: string;
  keyBy?: (req: Request) => string | undefined;
}

// Fixed-window counter, per IP unless keyBy is given. Fails open if Redis is down.
export const rateLimit = ({
  windowSeconds,
  max,
  keyPrefix,
  keyBy = (req) => req.ip,
}: RateLimitOptions): RequestHandler => {
  return async (req, _res, next) => {
    const key = `ratelimit:${keyPrefix}:${keyBy(req) ?? "unknown"}`;

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
