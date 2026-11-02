import { authApi } from "./auth-api";
import { jevsApi } from "./jevs-api";
import type { Api } from "./types";
import { usersApi } from "./users-api";

export const api: Api = {
  auth: authApi,
  users: usersApi,
  jevs: jevsApi,
};

export { ApiError, errorMessage } from "./errors";
export type { Api, AuthSession, CreateJevBody, JevListRow } from "./types";
