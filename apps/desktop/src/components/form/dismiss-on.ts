/**
 * Handlers that dismiss a field's errors on focus, click or typing (an Enter
 * submit leaves the field focused). Use with onSubmit-only validation.
 */
export function dismissOn(dismiss: () => void) {
  return { onFocus: dismiss, onPointerDown: dismiss, onInput: dismiss };
}
