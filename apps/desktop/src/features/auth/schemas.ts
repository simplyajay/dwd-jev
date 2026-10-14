import { CreateUserSchema } from "@dwd-jev/shared";
import { z } from "zod";

/*
 * Sign-up form schemas, derived from the shared CreateUserSchema so the
 * backend's rules stay the source of truth.
 *
 * The shared schema has no custom messages yet, so the fields are re-declared
 * here with the SAME rules plus readable messages. Drop these overrides once
 * shared adds messages (as LoginInputSchema already does).
 */

/** Text inputs give "" for empty; optional fields should treat that as absent. */
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const PersonalInfoSchema = CreateUserSchema.pick({
  firstName: true,
  middleName: true,
  lastName: true,
  position: true,
}).extend({
  firstName: z.string().trim().min(1, "Please enter your first name."),
  middleName: z.preprocess(emptyToUndefined, z.string().trim().nullish()),
  lastName: z.string().trim().min(1, "Please enter your last name."),
  position: z.string().trim().min(1, "Please enter your position."),
});

export const AccountInfoSchema = CreateUserSchema.pick({
  email: true,
  username: true,
  password: true,
})
  .extend({
    email: z.preprocess(emptyToUndefined, z.email("Please enter a valid email address.").nullish()),
    username: z.string().trim().min(1, "Please enter a username."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type PersonalInfoInput = z.input<typeof PersonalInfoSchema>;
export type PersonalInfo = z.output<typeof PersonalInfoSchema>;
export type AccountInfoInput = z.input<typeof AccountInfoSchema>;
export type AccountInfo = z.output<typeof AccountInfoSchema>;
