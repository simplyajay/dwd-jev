import { CreateUserSchema } from "@dwd-jev/shared";
import { z } from "zod";
import { emptyToUndefined } from "@/lib/form-values";

// Sign-up schemas from the shared CreateUserSchema, plus form-only concerns.

export const PersonalInfoSchema = CreateUserSchema.pick({
  firstName: true,
  middleName: true,
  lastName: true,
  position: true,
}).extend({
  middleName: z.preprocess(emptyToUndefined, CreateUserSchema.shape.middleName),
});

export const AccountInfoSchema = CreateUserSchema.pick({
  email: true,
  username: true,
  password: true,
})
  .extend({
    email: z.preprocess(emptyToUndefined, CreateUserSchema.shape.email),
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
