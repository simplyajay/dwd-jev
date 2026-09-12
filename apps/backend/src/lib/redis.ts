import { Redis } from "ioredis";
import { env } from "../env.js";

// enableOfflineQueue: false makes commands reject immediately when
// disconnected instead of queueing forever -- without this, cache reads in
// utils/cache.ts would hang indefinitely (not fail fast) whenever Redis is
// unreachable, which defeats the whole point of a best-effort cache.
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

redis.on("error", (err) => {
  console.warn("[redis] connection error:", err.message);
});
