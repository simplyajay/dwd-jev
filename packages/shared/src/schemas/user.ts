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
  isSystemAccount: z.boolean(),
  approvedBy: z.uuid().nullable(),
  approvedAt: z.coerce.date().nullable(),
});

const requiredText = (message: string) =>
  z.string({ error: message }).trim().min(1, message);

const passwordField = (label: string) =>
  z
    .string({ error: `Please enter a ${label.toLowerCase()}.` })
    .min(8, `${label} must be at least 8 characters.`);

export const CreateUserSchema = z.object({
  firstName: requiredText("Please enter your first name."),
  middleName: z.string({ error: "Middle name must be text." }).trim().nullish(),
  lastName: requiredText("Please enter your last name."),
  username: requiredText("Please enter a username."),
  password: passwordField("Password"),
  email: z.email({ error: "Please enter a valid email address." }).nullish(),
  position: requiredText("Please enter your position."),
});

export const LoginInputSchema = z.object({
  username: z
    .string({ error: "Please enter your username." })
    .trim()
    .min(1, "Please enter your username."),
  password: z
    .string({ error: "Please enter your password." })
    .min(1, "Please enter your password."),
});

export type UserType = z.infer<typeof UserSchema>;
export type SafeUserType = Omit<UserType, "password">;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>;
