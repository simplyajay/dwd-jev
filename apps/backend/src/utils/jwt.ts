import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface AccessTokenPayload {
  sub: string;
  role: string;
}

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
