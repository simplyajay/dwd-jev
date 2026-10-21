// Turns off WebView browser behaviors (context menu, find, print...) so it feels like a desktop app.

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

  // Capture phase: runs before component handlers can stop propagation.
  window.addEventListener(
    "keydown",
    (event) => {
      if (blocked.some((shortcut) => matches(event, shortcut))) event.preventDefault();
    },
    { capture: true },
  );

  // Blocks the WebView's context menu; clipboard shortcuts keep working.
  window.addEventListener("contextmenu", (event) => event.preventDefault());
}
