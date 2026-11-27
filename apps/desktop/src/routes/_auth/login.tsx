import { createFileRoute } from "@tanstack/react-router";
import { AuthSplitLayout } from "@/features/auth/components/auth-split-layout";
import { LoginForm } from "@/features/auth/components/login-form";

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthSplitLayout brandSide="left">
      <LoginForm />
    </AuthSplitLayout>
  );
}
