import { createContext, useContext, useEffect } from "react";

/** Provided by the settings dialog, which asks before discarding reported edits. */
export const UnsavedChangesContext = createContext<
  ((key: string, unsaved: boolean) => void) | null
>(null);

/** Tells the settings dialog whether this form has edits that closing would lose. */
export function useReportUnsavedChanges(key: string, unsaved: boolean) {
  const report = useContext(UnsavedChangesContext);
  useEffect(() => {
    report?.(key, unsaved);
    return () => report?.(key, false);
  }, [report, key, unsaved]);
}
