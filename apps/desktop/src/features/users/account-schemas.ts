import { UpdateAccountInputSchema, UpdateProfileInputSchema } from "@dwd-jev/shared";
import { z } from "zod";
import { emptyToNull, emptyToUndefined } from "@/lib/form-values";

// Account tab forms: the shared update schemas, plus form-only concerns.

export const ProfileFormSchema = UpdateProfileInputSchema.extend({
  middleName: z.preprocess(emptyToNull, UpdateProfileInputSchema.shape.middleName),
});

export const AccountFormSchema = UpdateAccountInputSchema.extend({
  email: z.preprocess(emptyToNull, UpdateAccountInputSchema.shape.email),
  // Empty means "keep my password".
  newPassword: z.preprocess(emptyToUndefined, UpdateAccountInputSchema.shape.newPassword),
  confirmPassword: z.string(),
}).refine((data) => (data.newPassword ?? "") === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

export type ProfileFormInput = z.input<typeof ProfileFormSchema>;
export type ProfileForm = z.output<typeof ProfileFormSchema>;
export type AccountFormInput = z.input<typeof AccountFormSchema>;
export type AccountForm = z.output<typeof AccountFormSchema>;
