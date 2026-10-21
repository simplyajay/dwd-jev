import type { ReactNode } from "react";
import { JevLogo } from "@/components/brand/jev-logo";
import { cn } from "@/lib/utils";

interface AuthSplitLayoutProps {
  /** Login puts the brand panel on the left; sign-up mirrors it to the right. */
  brandSide: "left" | "right";
  children: ReactNode;
}

export function AuthSplitLayout({ brandSide, children }: AuthSplitLayoutProps) {
  return (
    <div className="grid h-svh grid-cols-2">
      <aside
        className={cn(
          "flex items-center justify-center bg-brand-panel p-12 text-heading",
          brandSide === "right" && "order-last",
        )}
      >
        <JevLogo className="w-full max-w-md" />
      </aside>

      <main className="flex items-center justify-center overflow-y-auto p-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}

export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8 space-y-1.5">
      <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
