import { type LoginInput, LoginInputSchema } from "@dwd-jev/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { errorMessage } from "@/lib/api";
import { useAuth } from "../auth-context";
import { forgetUsername, readRememberedUsername, rememberUsername } from "../remembered-username";
import { AuthHeading, FormAlert } from "./auth-split-layout";

export function LoginForm() {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Read once on mount; drives both the prefilled username and the checkbox.
  const [rememberedUsername] = useState(readRememberedUsername);
  const [remember, setRemember] = useState(rememberedUsername !== null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    // Fields clear their error on focus, so the default "focus the first invalid
    // field" would erase that error the moment it appeared.
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: false,
    defaultValues: { username: rememberedUsername ?? "", password: "" },
  });

  const { clearErrors } = form;
  const { errors, isSubmitting } = form.formState;

  // Going back to a field means the user is correcting the form: drop that
  // field's error and the sign-in error (wrong password, pending account...).
  //
  // Focus alone is not enough. Submitting with Enter leaves the field focused,
  // so there is no later focus event -- clicking or typing in it must count too.
  const dismissErrorsOn = (field: keyof LoginInput) => {
    const dismiss = () => {
      clearErrors(field);
      setSubmitError(null);
    };
    return { onFocus: dismiss, onPointerDown: dismiss, onInput: dismiss };
  };

  const onRememberChange = (checked: boolean) => {
    setRemember(checked);
    // Unticking forgets straight away, not only after the next sign-in.
    if (!checked) forgetUsername();
  };

  // On success the auth state flips to signed-in and the _auth route guard
  // redirects to the app, so there is nothing to navigate here.
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
