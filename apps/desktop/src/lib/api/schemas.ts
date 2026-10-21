import { SafeUserSchema } from "@dwd-jev/shared";
import { z } from "zod";

// Response schemas: parsing turns date strings into Dates and catches contract drift.

/** `data` of POST /api/auth/login and POST /api/auth/refresh. */
export const AuthSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: SafeUserSchema,
});

/** Body of every error response. */
export const ErrorBodySchema = z.object({
  code: z.number(),
  message: z.string(),
  details: z.object({ field: z.string().optional() }).optional(),
});
