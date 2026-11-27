import type { ReactNode } from "react";

/** A titled card of the JEV form and the read-only view. */
export function JevSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="font-medium text-base">{title}</h2>
      {children}
    </section>
  );
}
