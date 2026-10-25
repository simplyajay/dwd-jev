import "dotenv/config";
import { z } from "zod";
import { config } from "dotenv";

const nodeEnv = process.env.NODE_ENV ?? "development";

config({ path: nodeEnv === "production" ? ".env.prod" : ".env.dev" });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  // An empty "ADMIN_PASSWORD=" counts as unset (seed.ts then generates one).
  ADMIN_PASSWORD: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().min(1).optional(),
  ),
});

export const env = envSchema.parse(process.env);
