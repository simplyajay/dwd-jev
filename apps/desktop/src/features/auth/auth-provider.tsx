import type { CreateUserInput, LoginInput, SafeUserType } from "@dwd-jev/shared";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { ApiError, type AuthSession, api } from "@/lib/api";
import { setAccessToken } from "@/lib/api/access-token";
import { setSessionRefresher } from "@/lib/api/http";
import { secureStore } from "@/lib/tauri/commands";
import { AuthContext, type AuthState } from "./auth-context";

async function persistSession(session: AuthSession): Promise<SafeUserType> {
  setAccessToken(session.accessToken);
  await secureStore.saveRefreshToken(session.refreshToken);
  return session.user;
}

/** Restores the stored session once: refresh tokens rotate, so a second run would revoke it. */
let restorePromise: Promise<SafeUserType | null> | null = null;

function restoreSession(): Promise<SafeUserType | null> {
  restorePromise ??= (async () => {
    const refreshToken = await secureStore.loadRefreshToken();
    if (!refreshToken) return null;
    try {
      return await persistSession(await api.auth.refresh(refreshToken));
    } catch (error) {
      // Keep the token if the server was only unreachable.
      if (error instanceof ApiError && error.isUnauthorized) {
        await secureStore.clearRefreshToken();
      }
      return null;
    }
  })();
  return restorePromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: "restoring" });

  useEffect(() => {
    let active = true;
    restoreSession().then((user) => {
      if (active) setState(user ? { status: "signed-in", user } : { status: "signed-out" });
    });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const user = await persistSession(await api.auth.login(input));
    setState({ status: "signed-in", user });
  }, []);

  const register = useCallback((input: CreateUserInput) => api.auth.register(input), []);

  const signOut = useCallback(() => {
    queryClient.clear();
    setState({ status: "signed-out" });
  }, [queryClient]);

  const logout = useCallback(async () => {
    const refreshToken = await secureStore.loadRefreshToken();
    // Best effort; local sign-out proceeds regardless.
    if (refreshToken) await api.auth.logout(refreshToken).catch(() => {});
    await secureStore.clearRefreshToken();
    setAccessToken(null);
    signOut();
  }, [signOut]);

  // Drop the tokens, but keep the screen up until the user acknowledges.
  const markSessionEnded = useCallback(async () => {
    await secureStore.clearRefreshToken();
    setAccessToken(null);
    setState((prev) => (prev.status === "signed-in" ? { ...prev, sessionEnded: true } : prev));
  }, []);

  // Called by the HTTP client on a 401. A refresh also picks up user changes, like a new role.
  useEffect(() => {
    setSessionRefresher(async () => {
      const refreshToken = await secureStore.loadRefreshToken();
      if (!refreshToken) {
        await markSessionEnded();
        return false;
      }
      try {
        const user = await persistSession(await api.auth.refresh(refreshToken));
        setState({ status: "signed-in", user });
        return true;
      } catch (error) {
        // An unreachable server leaves the session alone.
        if (error instanceof ApiError && error.isUnauthorized) await markSessionEnded();
        return false;
      }
    });
    return () => setSessionRefresher(null);
  }, [markSessionEnded]);

  return (
    <AuthContext.Provider value={{ state, login, register, logout, leaveEndedSession: signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
