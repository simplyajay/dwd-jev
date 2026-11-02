import { JevListItemSchema, SafeUserSchema } from "@dwd-jev/shared";
import { z } from "zod";

// Response schemas: parsing turns date strings into Dates and catches contract drift.

/** `data` of POST /api/auth/login and POST /api/auth/refresh. */
export const AuthSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: SafeUserSchema,
});

/** `data` of a paginated list (the shared `PaginatedResult`). */
export function paginatedSchema<TItem extends z.ZodType>(item: TItem) {
  return z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
    totalPages: z.number().int(),
  });
}

/** A JEV list row, plus `description` until shared has it. */
export const JevListRowSchema = JevListItemSchema.extend({
  description: z.string().nullish(),
});

/** Body of every error response. */
export const ErrorBodySchema = z.object({
  code: z.number(),
  message: z.string(),
  details: z.object({ field: z.string().optional() }).optional(),
});
