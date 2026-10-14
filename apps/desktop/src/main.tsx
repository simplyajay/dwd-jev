import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import { App } from "@/app/app";
import { applyTheme, readThemePreference } from "@/features/theme/theme";
import { disableBrowserBehaviors } from "@/lib/tauri/browser-behaviors";

// Before first paint, so a dark-theme user never sees a light flash.
applyTheme(readThemePreference());
disableBrowserBehaviors({ production: import.meta.env.PROD });

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
