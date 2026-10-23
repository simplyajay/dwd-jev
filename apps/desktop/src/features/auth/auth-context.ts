import type { CreateUserInput, LoginInput, SafeUserType } from "@dwd-jev/shared";
import { createContext, useContext } from "react";

// Kept apart from auth-provider.tsx so hot-reloading the provider keeps this context object.

export type AuthState =
  | { status: "restoring" }
  | { status: "signed-out" }
  /** The server ended the session; the app stays up behind a dialog until the user leaves. */
  | { status: "signed-in"; user: SafeUserType; sessionEnded?: true };

export interface SessionUpdate {
  user: SafeUserType;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthContextValue {
  state: AuthState;
  login: (input: LoginInput) => Promise<void>;
  /** Resolves with the created account (not signed in -- it may need approval). */
  register: (input: CreateUserInput) => Promise<SafeUserType>;
  logout: () => Promise<void>;
  /** Clears the ended session and goes to the login page. */
  leaveEndedSession: () => void;
  /** After the user edits their own account. New tokens replace the stored session. */
  updateSession: (update: SessionUpdate) => Promise<void>;
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
