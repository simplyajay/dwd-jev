import { type ReactNode, useEffect, useState } from "react";
import {
  applyTheme,
  type ResolvedTheme,
  readThemePreference,
  resolveTheme,
  systemPrefersDark,
  type ThemePreference,
  writeThemePreference,
} from "./theme";
import { ThemeContext } from "./theme-context";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState(readThemePreference);
  // main.tsx already applied the stored theme before first paint.
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(preference));

  useEffect(() => {
    setResolvedTheme(applyTheme(preference));
    if (preference !== "system") return;

    const query = systemPrefersDark();
    const onChange = () => setResolvedTheme(applyTheme("system"));
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = (next: ThemePreference) => {
    writeThemePreference(next);
    setPreferenceState(next);
  };

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}
