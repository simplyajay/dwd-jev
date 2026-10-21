import { invoke } from "@tauri-apps/api/core";

/** Typed wrappers for the Rust commands. They only exist inside the Tauri window. */

export const secureStore = {
  saveRefreshToken: (token: string) => invoke<void>("save_refresh_token", { token }),
  loadRefreshToken: () => invoke<string | null>("load_refresh_token"),
  clearRefreshToken: () => invoke<void>("clear_refresh_token"),
};

export function getApiBaseUrl(): Promise<string> {
  return invoke<string>("get_api_base_url");
}
