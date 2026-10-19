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

export const SafeUserSchema = UserSchema.omit({ password: true });

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

export const UpdateProfileInputSchema = CreateUserSchema.pick({
  firstName: true,
  middleName: true,
  lastName: true,
  position: true,
});

export const UpdateAccountInputSchema = z.object({
  username: CreateUserSchema.shape.username,
  email: CreateUserSchema.shape.email,
  currentPassword: z
    .string({ error: "Please enter your current password." })
    .min(1, "Please enter your current password."),
  newPassword: passwordField("New password").optional(),
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

export const ConfirmPasswordInputSchema = z.object({
  password: z
    .string({ error: "Please enter your password." })
    .min(1, "Please enter your password."),
});

export const SetUserStatusInputSchema = ConfirmPasswordInputSchema.extend({
  status: z.enum(["active", "inactive"], { error: "Status must be active or inactive." }),
});

export const SetUserRoleInputSchema = ConfirmPasswordInputSchema.extend({
  role: z.enum(["administrator", "user"], {
    error: "Role must be administrator or user.",
  }),
});

export type UserType = z.infer<typeof UserSchema>;
export type SafeUserType = z.infer<typeof SafeUserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type ConfirmPasswordInput = z.infer<typeof ConfirmPasswordInputSchema>;
export type SetUserStatusInput = z.infer<typeof SetUserStatusInputSchema>;
export type SetUserRoleInput = z.infer<typeof SetUserRoleInputSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountInputSchema>;

export const UserSummarySchema = z.object({
  id: z.uuid(),
  fullName: z.string(),
  position: z.string(),
  status: StatusSchema,
});
export type UserSummary = z.infer<typeof UserSummarySchema>;

// approvedBy.fullName is "System" for system accounts.
export const UserDetailSchema = SafeUserSchema.extend({
  approvedBy: z
    .object({
      id: z.uuid(),
      fullName: z.string(),
      isSystemAccount: z.boolean(),
    })
    .nullable(),
});
export type UserDetail = z.infer<typeof UserDetailSchema>;

// Tokens are present only when the password was changed.
export const UpdateAccountResultSchema = z.object({
  user: UserDetailSchema,
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});
export type UpdateAccountResult = z.infer<typeof UpdateAccountResultSchema>;

export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>;
