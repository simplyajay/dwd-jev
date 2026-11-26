import { useBlocker } from "@tanstack/react-router";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef, useState } from "react";
import { DiscardChangesDialog } from "@/features/settings/components/discard-changes-dialog";

/**
 * Asks before leaving the page or closing the window while `unsaved`.
 * Render `dialog`; wrap a navigation that shouldn't ask (e.g. after saving) in `bypass`.
 */
export function useUnsavedChangesGuard(unsaved: boolean, description: string) {
  const unsavedRef = useRef(unsaved);
  unsavedRef.current = unsaved;
  const bypassRef = useRef(false);
  const [closingWindow, setClosingWindow] = useState(false);

  const blocker = useBlocker({
    // Search changes (e.g. opening settings) stay on the page; signing out isn't asked.
    shouldBlockFn: ({ current, next }) =>
      unsavedRef.current &&
      !bypassRef.current &&
      next.pathname !== current.pathname &&
      !next.routeId.startsWith("/_auth"),
    enableBeforeUnload: false,
    withResolver: true,
  });

  useEffect(() => {
    if (!unsaved || !isTauri()) return;
    let stopped = false;
    let unlisten: (() => void) | undefined;
    getCurrentWindow()
      .onCloseRequested((event) => {
        event.preventDefault();
        setClosingWindow(true);
      })
      .then((stop) => {
        if (stopped) stop();
        else unlisten = stop;
      });
    return () => {
      stopped = true;
      unlisten?.();
    };
  }, [unsaved]);

  const bypass = useCallback(async (navigate: () => Promise<void>) => {
    bypassRef.current = true;
    try {
      await navigate();
    } finally {
      bypassRef.current = false;
    }
  }, []);

  const keepEditing = () => {
    blocker.reset?.();
    setClosingWindow(false);
  };
  const discard = () => {
    if (closingWindow) {
      getCurrentWindow()
        .destroy()
        .catch(() => setClosingWindow(false));
      return;
    }
    blocker.proceed?.();
  };

  const dialog = (
    <DiscardChangesDialog
      open={blocker.status === "blocked" || closingWindow}
      onKeepEditing={keepEditing}
      onDiscard={discard}
      description={description}
    />
  );

  return { dialog, bypass };
}
