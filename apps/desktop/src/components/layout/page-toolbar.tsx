import type { ReactNode } from "react";

interface PageToolbarProps {
  /** Left: the back button and any label. */
  children: ReactNode;
  /** Right, e.g. Edit and Delete. */
  actions?: ReactNode;
}

/** A page's top row. */
export function PageToolbar({ children, actions }: PageToolbarProps) {
  return (
    <div className="flex min-h-8 w-full items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
