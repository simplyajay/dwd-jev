import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth/auth-context";
import { SettingsDialog } from "@/features/settings/components/settings-dialog";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

const SIDEBAR_STORAGE_KEY = "jev.sidebar-open";

function readSidebarOpen(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

/** Container for every signed-in page: sidebar, header, scrolling content. */
export function AppLayout() {
  const { state } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(readSidebarOpen);

  const onSidebarOpenChange = (open: boolean) => {
    setSidebarOpen(open);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open));
    } catch {
      // Not persisted; the sidebar still toggles for this session.
    }
  };

  // On sign-out this layout renders once more before the route guard
  // redirects to /login; everything below assumes a signed-in user.
  if (state.status !== "signed-in") return null;

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={onSidebarOpenChange} className="h-svh">
      <AppSidebar />
      {/* min-w-0 lets wide content (grids) scroll inside instead of stretching the page. */}
      <SidebarInset className="min-w-0 overflow-hidden">
        <AppHeader />
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </SidebarInset>
      <SettingsDialog />
    </SidebarProvider>
  );
}
