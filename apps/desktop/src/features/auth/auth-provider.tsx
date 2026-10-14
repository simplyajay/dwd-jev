import type { CreateUserInput, LoginInput, SafeUserType } from "@dwd-jev/shared";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { ApiError, type AuthSession, api } from "@/lib/api";
import { setAccessToken } from "@/lib/api/access-token";
import { secureStore } from "@/lib/tauri/commands";
import { AuthContext, type AuthState } from "./auth-context";

async function persistSession(session: AuthSession): Promise<SafeUserType> {
  setAccessToken(session.accessToken);
  await secureStore.saveRefreshToken(session.refreshToken);
  return session.user;
}

/**
 * Restores the previous session from the keychain. Memoised at module level:
 * refresh tokens rotate, so running it twice (e.g. StrictMode's double effect)
 * would revoke the token the first run just received.
 */
let restorePromise: Promise<SafeUserType | null> | null = null;

function restoreSession(): Promise<SafeUserType | null> {
  restorePromise ??= (async () => {
    const refreshToken = await secureStore.loadRefreshToken();
    if (!refreshToken) return null;
    try {
      return await persistSession(await api.auth.refresh(refreshToken));
    } catch (error) {
      // Forget the token only when the server rejected it. If the server was
      // just unreachable, keep it so the next launch can still restore.
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

  const logout = useCallback(async () => {
    const refreshToken = await secureStore.loadRefreshToken();
    // Revoke server-side on a best-effort basis; local sign-out always proceeds.
    if (refreshToken) await api.auth.logout(refreshToken).catch(() => {});
    await secureStore.clearRefreshToken();
    setAccessToken(null);
    queryClient.clear();
    setState({ status: "signed-out" });
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
