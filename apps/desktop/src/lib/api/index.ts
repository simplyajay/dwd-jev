import { authApi } from "./auth-api";
import { fakeJevsApi } from "./fake";
import type { Api } from "./types";
import { usersApi } from "./users-api";

export const api: Api = {
  auth: authApi,
  users: usersApi,
  // Not wired to the backend yet.
  jevs: fakeJevsApi,
};

export { ApiError, errorMessage } from "./errors";
export type { Api, AuthSession } from "./types";
