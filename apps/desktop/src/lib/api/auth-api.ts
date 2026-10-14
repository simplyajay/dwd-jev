import { request } from "./http";
import { AuthSessionSchema, SafeUserSchema } from "./schemas";
import type { Api } from "./types";

export const authApi: Api["auth"] = {
  login: (input) =>
    request({ method: "POST", path: "/api/auth/login", body: input, schema: AuthSessionSchema }),

  register: (input) =>
    request({ method: "POST", path: "/api/users/register", body: input, schema: SafeUserSchema }),

  // The backend rotates refresh tokens: the one sent here is spent, and the
  // session returned carries its replacement.
  refresh: (refreshToken) =>
    request({
      method: "POST",
      path: "/api/auth/refresh",
      body: { refreshToken },
      schema: AuthSessionSchema,
    }),

  logout: async (refreshToken) => {
    await request({ method: "POST", path: "/api/auth/logout", body: { refreshToken } });
  },
};
