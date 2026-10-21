import { type LoginInput, LoginInputSchema } from "@dwd-jev/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { dismissOn } from "@/components/form/dismiss-on";
import { FormAlert } from "@/components/form/form-alert";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { errorMessage } from "@/lib/api";
import { useAuth } from "../auth-context";
import { forgetUsername, readRememberedUsername, rememberUsername } from "../remembered-username";
import { AuthHeading } from "./auth-split-layout";

export function LoginForm() {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Read once on mount; drives both the prefilled username and the checkbox.
  const [rememberedUsername] = useState(readRememberedUsername);
  const [remember, setRemember] = useState(rememberedUsername !== null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    // Errors clear on focus, so focusing the first invalid field would erase them.
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: false,
    defaultValues: { username: rememberedUsername ?? "", password: "" },
  });

  const { clearErrors } = form;
  const { errors, isSubmitting } = form.formState;

  // Correcting a field also drops the sign-in error.
  const dismissErrorsOn = (field: keyof LoginInput) =>
    dismissOn(() => {
      clearErrors(field);
      setSubmitError(null);
    });

  const onRememberChange = (checked: boolean) => {
    setRemember(checked);
    // Unticking forgets straight away, not only after the next sign-in.
    if (!checked) forgetUsername();
  };

  // On success, the _auth route guard redirects into the app.
  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await login(values);
      if (remember) rememberUsername(values.username);
    } catch (error) {
      setSubmitError(errorMessage(error));
    }
  });

  return (
    <>
      <AuthHeading title="Sign in" description="Enter your username and password to continue." />

      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <TextField
            label="Username"
            autoFocus={rememberedUsername === null}
            error={errors.username}
            {...form.register("username")}
            {...dismissErrorsOn("username")}
          />

          <TextField
            label="Password"
            type="password"
            autoFocus={rememberedUsername !== null}
            error={errors.password}
            {...form.register("password")}
            {...dismissErrorsOn("password")}
          />

          <Field orientation="horizontal">
            <Checkbox
              id="remember-username"
              checked={remember}
              onCheckedChange={(checked) => onRememberChange(checked === true)}
            />
            <FieldLabel htmlFor="remember-username" className="font-normal">
              Remember username
            </FieldLabel>
          </Field>

          <FormAlert message={submitError} />

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-link hover:underline">
              Sign up
            </Link>
          </p>
        </FieldGroup>
      </form>
    </>
  );
}
