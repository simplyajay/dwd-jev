// Shared by the form's editable tables (accounts, supporting documents).

/**
 * Accounts table: code, name, debit, credit, remove; external documents reuse it.
 * Needs ~35rem, which the smallest window has up to 125% Windows text size.
 */
export const ACCOUNT_GRID =
  "grid grid-cols-[minmax(6rem,1fr)_minmax(9rem,2fr)_minmax(8rem,min(15%,10rem))_minmax(8rem,min(15%,10rem))_2.25rem] gap-2";

/** Supporting documents table: number, type, date, remove. Needs ~30rem. */
export const SUPPORTING_DOCUMENT_GRID =
  "grid grid-cols-[minmax(7rem,1fr)_minmax(10rem,1.5fr)_9.5rem_2.25rem] gap-2";

/** Rows sit flush, so this padding alone sets the space between rows. */
export const ROW_PADDING_Y = "py-1";

/** On the element holding a table's rows. */
export const ROW_DIVIDERS = "divide-y divide-table-divider";

// In a disabled fieldset (no journal yet, or saving): no row highlight or remove buttons.
const IF_DISABLED_NO_HOVER = "[fieldset:disabled_&]:bg-transparent";
const IF_DISABLED_HIDDEN = "[fieldset:disabled_&]:invisible";

/** Highlighted on hover. The tables' other rows match its px-1. */
export const EDITABLE_ROW = `group/row rounded-md px-1 ${ROW_PADDING_Y} transition-colors hover:bg-muted/50 ${IF_DISABLED_NO_HOVER}`;

/** A row's remove button: shown on hover, or focus so the keyboard reaches it. */
export const SHOW_ON_ROW_HOVER = `opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 ${IF_DISABLED_HIDDEN}`;

/** An external document inside an account row: row spacing, no highlight. */
export const SUB_ROW = `group/sub-row ${ROW_PADDING_Y}`;

/** A sub-row's remove button, like SHOW_ON_ROW_HOVER. */
export const SHOW_ON_SUB_ROW_HOVER = `opacity-0 transition-opacity group-hover/sub-row:opacity-100 group-focus-within/sub-row:opacity-100 ${IF_DISABLED_HIDDEN}`;
