import { z } from "zod";
import { RoleSchema, StatusSchema } from "../enums.js";

export const UserSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  middleName: z.string().nullable(),
  lastName: z.string(),
  username: z.string(),
  password: z.string(),
  email: z.email().nullable(),
  role: RoleSchema,
  position: z.string(),
  status: StatusSchema,
  createdAt: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserInputSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().nullish(),
  lastName: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(8),
  email: z.email().nullish(),
  position: z.string().min(1),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const LoginInputSchema = z.object({
  username: z.string().min(1, "Please enter your username."),
  password: z.string().min(1, "Please enter your password."),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>;

export const PendingUserSchema = z.object({
  userId: z.uuid(),
  createdAt: z.coerce.date(),
});

export type PendingUser = z.infer<typeof PendingUserSchema>;
