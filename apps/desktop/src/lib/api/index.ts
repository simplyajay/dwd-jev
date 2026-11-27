import { auditLogsApi } from "./audit-logs-api";
import { authApi } from "./auth-api";
import { jevsApi } from "./jevs-api";
import type { Api } from "./types";
import { usersApi } from "./users-api";

export const api: Api = {
  auth: authApi,
  users: usersApi,
  jevs: jevsApi,
  auditLogs: auditLogsApi,
};

export { ApiError, errorMessage, tooManyRequestsMessage } from "./errors";
export type { Api, AuthSession, JevBody, JevListRow, UpdateJevBody } from "./types";
