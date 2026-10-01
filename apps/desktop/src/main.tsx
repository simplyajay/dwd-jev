import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found");

// Placeholder until the router and providers in src/app are wired up.
createRoot(rootElement).render(<StrictMode>DWD JEV</StrictMode>);
