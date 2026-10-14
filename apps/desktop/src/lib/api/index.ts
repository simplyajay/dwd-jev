import { authApi } from "./auth-api";
import { fakeJevsApi } from "./fake";
import type { Api } from "./types";

export const api: Api = {
  auth: authApi,
  // Not wired to the backend yet.
  jevs: fakeJevsApi,
};

export { ApiError, errorMessage } from "./errors";
export type { Api, AuthSession } from "./types";
