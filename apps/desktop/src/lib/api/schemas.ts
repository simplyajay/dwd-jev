import { UserSchema } from "@dwd-jev/shared";
import { z } from "zod";

/*
 * Runtime schemas for API responses. Parsing at the boundary turns JSON date
 * strings into the Dates the shared types promise, and fails loudly if the
 * backend's response ever drifts from the contract.
 */

/*
 * TODO(backend agent): export `SafeUserSchema` from @dwd-jev/shared
 * (packages/shared/src/schemas/user.ts) next to the `SafeUserType` type it
 * already exports, e.g.
 *
 *   export const SafeUserSchema = UserSchema.omit({ password: true });
 *
 * Once it exists, delete this local copy and import the shared one instead.
 */
export const SafeUserSchema = UserSchema.omit({ password: true });

/** `data` of POST /api/auth/login and POST /api/auth/refresh. */
export const AuthSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: SafeUserSchema,
});

/** Body of every error response. `details.field` is set on conflicts. */
export const ErrorBodySchema = z.object({
  code: z.number(),
  message: z.string(),
  details: z.object({ field: z.string().optional() }).optional(),
});
