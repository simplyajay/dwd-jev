import { createFileRoute } from "@tanstack/react-router";
import { AuthSplitLayout } from "@/features/auth/components/auth-split-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

export const Route = createFileRoute("/_auth/register")({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <AuthSplitLayout brandSide="right">
      <RegisterForm />
    </AuthSplitLayout>
  );
}
