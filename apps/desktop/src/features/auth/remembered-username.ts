const STORAGE_KEY = "jev.remembered-username";

export function readRememberedUsername(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function rememberUsername(username: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, username);
  } catch {
    // Not persisted; the user just types it again next time.
  }
}

export function forgetUsername(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to remove.
  }
}
