import type { Request, RequestHandler } from "express";
import { redis } from "../lib/redis.js";
import { TooManyRequestsError } from "../errors/AppError.js";

interface RateLimitOptions {
  windowSeconds: number;
  max: number;
  keyPrefix: string;
  keyBy?: (req: Request) => string | undefined;
}

// Atomic, so a key can't be left without a TTL and block forever.
const INCR_WITH_TTL = `
local count = redis.call("INCR", KEYS[1])
if redis.call("TTL", KEYS[1]) == -1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return count
`;

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
      const count = (await redis.eval(INCR_WITH_TTL, 1, key, windowSeconds)) as number;

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
