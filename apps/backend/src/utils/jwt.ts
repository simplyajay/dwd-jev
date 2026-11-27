import jwt from "jsonwebtoken";
import { z } from "zod";
import { RoleSchema } from "@dwd-jev/shared";
import { env } from "../env.js";

const AccessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  role: RoleSchema,
  ver: z.number().int().nonnegative(),
});

export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>;

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });

// Throws on a bad signature, expiry, or a payload missing a valid ver.
export const verifyAccessToken = (token: string): AccessTokenPayload =>
  AccessTokenPayloadSchema.parse(jwt.verify(token, env.JWT_SECRET));
