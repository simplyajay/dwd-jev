import type { SafeUserType } from "@dwd-jev/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { type FieldPath, type FieldValues, type UseFormReturn, useForm } from "react-hook-form";
import { dismissOn } from "@/components/form/dismiss-on";
import { FormAlert } from "@/components/form/form-alert";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useAuth, useCurrentUser } from "@/features/auth/auth-context";
import { SettingsSection } from "@/features/settings/components/settings-section";
import { useReportUnsavedChanges } from "@/features/settings/unsaved-changes";
import { ApiError, api, errorMessage } from "@/lib/api";
import {
  type AccountForm,
  type AccountFormInput,
  AccountFormSchema,
  type ProfileForm,
  type ProfileFormInput,
  ProfileFormSchema,
} from "../account-schemas";
import { userQueries } from "../api/user-queries";
import { toSafeUser } from "../user-labels";

// The backend lets the system account change only its password.
const SYSTEM_ACCOUNT_NOTE = "The system account can only change its password.";

// Reserved usernames come back as a 403 without a field, so match the message.
const isReservedUsername = (error: ApiError) =>
  error.status === 403 && /cannot use this username/i.test(error.message);

export function AccountSettings() {
  const user = useCurrentUser();

  return (
    <>
      {user.isSystemAccount && (
        <div className="mb-6">
          <FormAlert message={SYSTEM_ACCOUNT_NOTE} tone="info" />
        </div>
      )}
      <PersonalInformationForm />
      <AccountInformationForm />
    </>
  );
}

const profileValues = (user: SafeUserType): ProfileFormInput => ({
  firstName: user.firstName,
  middleName: user.middleName ?? "",
  lastName: user.lastName,
  position: user.position,
});

function PersonalInformationForm() {
  const user = useCurrentUser();
  const { updateSession } = useAuth();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<ProfileFormInput, unknown, ProfileForm>({
    resolver: zodResolver(ProfileFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: false, // see dismissOn
    defaultValues: profileValues(user),
  });
  const { errors, isDirty, isSubmitting } = form.formState;
  const readOnly = user.isSystemAccount;
  useReportUnsavedChanges("personal-information", isDirty);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const updated = toSafeUser(await api.users.updateProfile(values));
      await updateSession({ user: updated });
      form.reset(profileValues(updated));
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: userQueries.all });
    } catch (error) {
      setSubmitError(errorMessage(error));
    }
  });

  const field = fieldProps(form, () => setSubmitError(null));

  return (
    <SettingsSection title="Personal information" description="Your name and position.">
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <FormAlert message={submitError} />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="First name"
              disabled={readOnly}
              error={errors.firstName}
              {...field("firstName")}
            />
            <TextField
              label="Middle name"
              optional
              disabled={readOnly}
              error={errors.middleName}
              {...field("middleName")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Last name"
              disabled={readOnly}
              error={errors.lastName}
              {...field("lastName")}
            />
            <TextField
              label="Position"
              disabled={readOnly}
              error={errors.position}
              {...field("position")}
            />
          </div>
          {!readOnly && (
            <SaveRow disabled={!isDirty} isSubmitting={isSubmitting} saved={saved && !isDirty} />
          )}
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}

const accountValues = (user: Pick<SafeUserType, "username" | "email">): AccountFormInput => ({
  username: user.username,
  email: user.email ?? "",
  newPassword: "",
  confirmPassword: "",
  currentPassword: "",
});

function AccountInformationForm() {
  const user = useCurrentUser();
  const { updateSession } = useAuth();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<AccountFormInput, unknown, AccountForm>({
    resolver: zodResolver(AccountFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: false,
    defaultValues: accountValues(user),
  });
  const { errors, dirtyFields, isSubmitting } = form.formState;
  // The current password alone isn't a change worth saving or warning about.
  const hasChanges = Boolean(dirtyFields.username || dirtyFields.email || dirtyFields.newPassword);
  useReportUnsavedChanges(
    "account-information",
    hasChanges || Boolean(dirtyFields.confirmPassword),
  );

  const onSubmit = form.handleSubmit(async ({ confirmPassword: _, ...values }) => {
    setSubmitError(null);
    // Disabled for the system account; send them unchanged.
    const input = user.isSystemAccount
      ? { ...values, username: user.username, email: user.email }
      : values;
    try {
      const result = await api.users.updateAccount(input);
      const updated = toSafeUser(result.user);
      // A password change ends the old session; the reply carries its replacement.
      await updateSession({
        user: updated,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      form.reset(accountValues(updated));
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: userQueries.all });
    } catch (error) {
      if (error instanceof ApiError) {
        const field = isReservedUsername(error) ? "username" : error.field;
        if (
          field === "username" ||
          field === "email" ||
          field === "newPassword" ||
          field === "currentPassword"
        ) {
          form.setError(field, { message: error.message });
          return;
        }
      }
      setSubmitError(errorMessage(error));
    }
  });

  const field = fieldProps(form, () => setSubmitError(null));

  return (
    <SettingsSection
      title="Account information"
      description="How you sign in. Leave the new password empty to keep your current one."
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <FormAlert message={submitError} />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Username"
              disabled={user.isSystemAccount}
              error={errors.username}
              {...field("username")}
            />
            <TextField
              label="Email"
              type="email"
              optional
              disabled={user.isSystemAccount}
              error={errors.email}
              {...field("email")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="New password"
              type="password"
              optional
              error={errors.newPassword}
              {...field("newPassword")}
            />
            <TextField
              label="Confirm new password"
              type="password"
              error={errors.confirmPassword}
              {...field("confirmPassword")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Current password"
              type="password"
              description="Required to save any change here."
              error={errors.currentPassword}
              {...field("currentPassword")}
            />
          </div>
          <SaveRow
            disabled={!hasChanges}
            isSubmitting={isSubmitting}
            saved={saved && !hasChanges}
          />
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}

/** register() plus error dismissal: going back to a field drops its error and the form's. */
function fieldProps<T extends FieldValues>(form: UseFormReturn<T>, clearSubmitError: () => void) {
  return (name: FieldPath<T>) => ({
    ...form.register(name),
    ...dismissOn(() => {
      form.clearErrors(name);
      clearSubmitError();
    }),
  });
}

function SaveRow({
  disabled,
  isSubmitting,
  saved,
}: {
  disabled: boolean;
  isSubmitting: boolean;
  saved: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" className="w-fit" disabled={disabled || isSubmitting}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
      {saved && (
        <span
          role="status"
          className="inline-flex items-center gap-1.5 text-muted-foreground text-sm"
        >
          <CheckIcon aria-hidden className="size-4 text-brand-mark" />
          Changes saved.
        </span>
      )}
    </div>
  );
}
