/** Dismisses a field's errors on focus, click or typing. For onSubmit-only validation. */
export function dismissOn(dismiss: () => void) {
  return { onFocus: dismiss, onPointerDown: dismiss, onInput: dismiss };
}
