/*
 * The app runs in a WebView, which still behaves like a browser: right-click
 * menu, find bar, print, view source, reload. This turns those off so it feels
 * like a desktop app. (Input autocomplete/spellcheck is handled in
 * components/ui/input.tsx; general autofill in tauri.conf.json.)
 */

type Shortcut = { key: string; ctrl?: boolean; shift?: boolean };

const ALWAYS_BLOCKED: Shortcut[] = [
  { key: "f", ctrl: true }, // find in page
  { key: "g", ctrl: true }, // find next
  { key: "g", ctrl: true, shift: true }, // find previous
  { key: "F3" }, // find next
  { key: "F3", shift: true }, // find previous
  { key: "p", ctrl: true }, // print
  { key: "p", ctrl: true, shift: true }, // system print dialog
  { key: "s", ctrl: true }, // save page
  { key: "o", ctrl: true }, // open file
  { key: "u", ctrl: true }, // view source
  { key: "j", ctrl: true }, // downloads
  { key: "h", ctrl: true }, // history
  { key: "F7" }, // caret browsing
];

// Reload and devtools stay available while developing.
const BLOCKED_IN_PRODUCTION: Shortcut[] = [
  { key: "F5" },
  { key: "F5", ctrl: true },
  { key: "r", ctrl: true },
  { key: "r", ctrl: true, shift: true },
  { key: "F12" },
  { key: "i", ctrl: true, shift: true },
  { key: "j", ctrl: true, shift: true },
  { key: "c", ctrl: true, shift: true },
];

function matches(event: KeyboardEvent, shortcut: Shortcut): boolean {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    event.ctrlKey === !!shortcut.ctrl &&
    event.shiftKey === !!shortcut.shift &&
    !event.altKey
  );
}

export function disableBrowserBehaviors({ production }: { production: boolean }): void {
  const blocked = production ? [...ALWAYS_BLOCKED, ...BLOCKED_IN_PRODUCTION] : ALWAYS_BLOCKED;

  // Capture phase, so this runs before any component handler can stop propagation.
  window.addEventListener(
    "keydown",
    (event) => {
      if (blocked.some((shortcut) => matches(event, shortcut))) event.preventDefault();
    },
    { capture: true },
  );

  // The WebView's context menu (Back, Refresh, Search the web, Inspect...).
  // Ctrl+C / Ctrl+X / Ctrl+V keep working in text fields.
  window.addEventListener("contextmenu", (event) => event.preventDefault());
}
