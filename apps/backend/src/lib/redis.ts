import { Redis } from "ioredis";
import { env } from "../env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  // Reject commands while disconnected instead of queueing them.
  enableOfflineQueue: false,
  // Fail fast when connected but unresponsive.
  commandTimeout: 200,
});

redis.on("error", (err) => {
  console.warn("[redis] connection error:", err.message);
});
