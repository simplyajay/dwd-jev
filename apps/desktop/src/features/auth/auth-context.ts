import type { CreateUserInput, LoginInput, SafeUserType } from "@dwd-jev/shared";
import { createContext, useContext } from "react";

/*
 * Kept apart from auth-provider.tsx on purpose. The provider imports the API
 * layer, so editing anything under lib/api hot-reloads it; if the context were
 * created in that same module it would be recreated too, and every mounted
 * consumer would lose its provider.
 */

export type AuthState =
  | { status: "restoring" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: SafeUserType };

export interface AuthContextValue {
  state: AuthState;
  login: (input: LoginInput) => Promise<void>;
  /** Resolves with the created account (not signed in -- it may need approval). */
  register: (input: CreateUserInput) => Promise<SafeUserType>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

/** For screens under the signed-in layout, where a user is guaranteed. */
export function useCurrentUser(): SafeUserType {
  const { state } = useAuth();
  if (state.status !== "signed-in") throw new Error("useCurrentUser requires a signed-in user");
  return state.user;
}
