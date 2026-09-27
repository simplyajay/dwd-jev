import { Redis } from "ioredis";
import { env } from "../env.js";

// enableOfflineQueue: false rejects commands immediately when disconnected
// instead of queueing forever -- otherwise cache reads hang instead of
// failing fast whenever Redis is unreachable.
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

redis.on("error", (err) => {
  console.warn("[redis] connection error:", err.message);
});
