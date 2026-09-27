// Prisma's Json columns go through JSON.stringify, which throws on BigInt
// (amount fields are BigInt). Returns `unknown`, not `T`, since BigInt
// becomes a string -- callers should cast to whatever shape they need.
export const toJsonSafe = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v)));
