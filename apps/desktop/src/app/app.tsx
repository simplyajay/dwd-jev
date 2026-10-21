import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/features/auth/auth-context";
import { AuthProvider } from "@/features/auth/auth-provider";
import { SplashScreen } from "@/features/auth/components/splash-screen";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { queryClient } from "./query-client";
import { router } from "./router";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <AppRouter />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppRouter() {
  const auth = useAuth();
  const { status } = auth.state;

  // Re-run the route guards (which redirect) on sign-in and sign-out, once restored.
  useEffect(() => {
    if (status !== "restoring") router.invalidate();
  }, [status]);

  if (status === "restoring") return <SplashScreen />;
  return <RouterProvider router={router} context={{ auth }} />;
}
