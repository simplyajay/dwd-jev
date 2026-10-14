import { JevMark } from "@/components/brand/jev-logo";

/** Shown while the stored session is being restored at startup. */
export function SplashScreen() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-6" role="status">
      <JevMark className="size-20 text-heading" />
      <div className="h-1 w-32 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full w-1/3 animate-pulse rounded-full bg-secondary" />
      </div>
      <span className="sr-only">Restoring your session…</span>
    </div>
  );
}
