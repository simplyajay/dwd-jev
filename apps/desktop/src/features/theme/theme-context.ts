import { createContext, useContext } from "react";
import type { ResolvedTheme, ThemePreference } from "./theme";

// Separate from theme-provider.tsx so hot-reloading the provider keeps the
// same context object (see features/auth/auth-context.ts).

export interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
