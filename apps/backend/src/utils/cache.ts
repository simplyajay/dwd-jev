import { redis } from "../lib/redis.js";

// Redis is a convenience, not a dependency -- any failure here falls back to
// the caller's fetcher instead of failing the request.

export const getOrSet = async <T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> => {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    console.warn(`[cache] read failed for "${key}", falling back to source.`, err);
  }

  const value = await fetcher();

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.warn(`[cache] write failed for "${key}".`, err);
  }

  return value;
};

export const invalidate = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`[cache] invalidate failed for "${key}".`, err);
  }
};

// Pattern-based bulk invalidation (e.g. "user:*") via SCAN, not KEYS -- KEYS
// blocks Redis for the duration of the scan on large keyspaces.
export const invalidatePattern = async (pattern: string): Promise<void> => {
  try {
    const keysToDelete: string[] = [];
    const stream = redis.scanStream({ match: pattern, count: 100 });

    for await (const keys of stream) {
      keysToDelete.push(...(keys as string[]));
    }

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
  } catch (err) {
    console.warn(`[cache] invalidate pattern failed for "${pattern}".`, err);
  }
};
