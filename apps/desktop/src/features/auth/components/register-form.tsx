import type { SafeUserType } from "@dwd-jev/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { CircleCheckIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { dismissOn } from "@/components/form/dismiss-on";
import { FormAlert } from "@/components/form/form-alert";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { ApiError, errorMessage } from "@/lib/api";
import { useAuth } from "../auth-context";
import {
  type AccountInfo,
  type AccountInfoInput,
  AccountInfoSchema,
  type PersonalInfo,
  type PersonalInfoInput,
  PersonalInfoSchema,
} from "../schemas";
import { AuthHeading } from "./auth-split-layout";

type Step = "personal" | "account";

const STEP_COPY = {
  personal: { index: 1, title: "Personal information" },
  account: { index: 2, title: "Account information" },
} as const;

export function RegisterForm() {
  const [step, setStep] = useState<Step>("personal");
  const [personal, setPersonal] = useState<PersonalInfo | null>(null);
  const [registered, setRegistered] = useState<SafeUserType | null>(null);

  if (registered) return <RegisterSuccess user={registered} />;

  const { index, title } = STEP_COPY[step];

  return (
    <>
      <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
        Step {index} of 2 · {title}
      </p>
      <AuthHeading
        title="Create an account"
        description="An administrator will review your account before you can sign in."
      />

      {step === "personal" ? (
        <PersonalInfoStep
          defaultValues={personal}
          onNext={(values) => {
            setPersonal(values);
            setStep("account");
          }}
        />
      ) : (
        <AccountInfoStep
          personal={personal}
          onBack={() => setStep("personal")}
          onRegistered={setRegistered}
        />
      )}

      <p className="mt-6 text-center text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-link hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

function PersonalInfoStep({
  defaultValues,
  onNext,
}: {
  defaultValues: PersonalInfo | null;
  onNext: (values: PersonalInfo) => void;
}) {
  const form = useForm<PersonalInfoInput, unknown, PersonalInfo>({
    resolver: zodResolver(PersonalInfoSchema),
    // Validate on submit only (see dismissOn).
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: false,
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      middleName: defaultValues?.middleName ?? "",
      lastName: defaultValues?.lastName ?? "",
      position: defaultValues?.position ?? "",
    },
  });
  const { errors } = form.formState;

  const dismissErrorsOn = (field: keyof PersonalInfoInput) =>
    dismissOn(() => form.clearErrors(field));

  return (
    <form onSubmit={form.handleSubmit(onNext)} noValidate>
      <FieldGroup>
        <TextField
          label="First name"
          autoFocus
          error={errors.firstName}
          {...form.register("firstName")}
          {...dismissErrorsOn("firstName")}
        />
        <TextField
          label="Middle name"
          optional
          error={errors.middleName}
          {...form.register("middleName")}
          {...dismissErrorsOn("middleName")}
        />
        <TextField
          label="Last name"
          error={errors.lastName}
          {...form.register("lastName")}
          {...dismissErrorsOn("lastName")}
        />
        <TextField
          label="Position"
          error={errors.position}
          {...form.register("position")}
          {...dismissErrorsOn("position")}
        />
        <Button type="submit" size="lg">
          Next
        </Button>
      </FieldGroup>
    </form>
  );
}

function AccountInfoStep({
  personal,
  onBack,
  onRegistered,
}: {
  personal: PersonalInfo | null;
  onBack: () => void;
  onRegistered: (user: SafeUserType) => void;
}) {
  const { register } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<AccountInfoInput, unknown, AccountInfo>({
    resolver: zodResolver(AccountInfoSchema),
    shouldFocusError: false,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { email: "", username: "", password: "", confirmPassword: "" },
  });
  const { errors, isSubmitting } = form.formState;

  // Correcting any field also drops the submit error above the form.
  const dismissErrorsOn = (field: keyof AccountInfoInput) =>
    dismissOn(() => {
      form.clearErrors(field);
      setSubmitError(null);
    });

  const onSubmit = form.handleSubmit(async ({ confirmPassword: _, ...account }) => {
    if (!personal) return onBack();
    setSubmitError(null);
    try {
      onRegistered(await register({ ...personal, ...account }));
    } catch (error) {
      // A conflict names its field: show the message there.
      if (error instanceof ApiError && (error.field === "username" || error.field === "email")) {
        form.setError(error.field, { message: error.message });
        return;
      }
      setSubmitError(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormAlert message={submitError} />
        <TextField
          label="Username"
          autoFocus
          error={errors.username}
          {...form.register("username")}
          {...dismissErrorsOn("username")}
        />
        <TextField
          label="Email"
          type="email"
          optional
          error={errors.email}
          {...form.register("email")}
          {...dismissErrorsOn("email")}
        />
        <TextField
          label="Password"
          type="password"
          error={errors.password}
          {...form.register("password")}
          {...dismissErrorsOn("password")}
        />
        <TextField
          label="Confirm password"
          type="password"
          error={errors.confirmPassword}
          {...form.register("confirmPassword")}
          {...dismissErrorsOn("confirmPassword")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create account"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function RegisterSuccess({ user }: { user: SafeUserType }) {
  // Accounts normally start as awaiting_approval; say so only when that is true.
  const description =
    user.status === "active"
      ? "Your account is ready. You can sign in now."
      : "Your account is awaiting administrator approval. You can sign in once it has been approved.";

  return (
    <div className="space-y-6 text-center">
      <CircleCheckIcon className="mx-auto size-12 text-secondary" aria-hidden />
      <AuthHeading title="Account created" description={description} />
      <Button asChild size="lg" className="w-full">
        <Link to="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
