import "dotenv/config";
import { z } from "zod";
import { config } from "dotenv";

const nodeEnv = process.env.NODE_ENV ?? "development";

config({ path: nodeEnv === "production" ? ".env.prod" : ".env.dev" });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  // Used only by prisma/seed.ts to set the bootstrap administrator's
  // password. Optional -- the seed script generates a random one if absent.
  // Preprocessed because an empty "ADMIN_PASSWORD=" line in .env parses to
  // "", not undefined, and that should still count as "not set."
  ADMIN_PASSWORD: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().min(1).optional(),
  ),
});

export const env = envSchema.parse(process.env);
