// For Json columns: JSON.stringify throws on BigInt amounts, so they become
// strings. Returns `unknown`; callers cast.
export const toJsonSafe = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v)));
