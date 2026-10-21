import { fetch } from "@tauri-apps/plugin-http";
import type { z } from "zod";
import { getApiBaseUrl } from "@/lib/tauri/commands";
import { getAccessToken } from "./access-token";
import { ApiError, NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from "./errors";
import { ErrorBodySchema } from "./schemas";

// JSON client over the Tauri HTTP plugin: no CORS, and only the API origin is reachable.
// A 401 outside /api/auth refreshes the session and replays the request once.

const TIMEOUT_MS = 15_000;

// The URL is compiled in, so ask for it once.
let baseUrlPromise: Promise<string> | null = null;
const baseUrl = () => {
  baseUrlPromise ??= getApiBaseUrl();
  return baseUrlPromise;
};

/** Renews the session and reports success; registered by the auth provider. */
type SessionRefresher = () => Promise<boolean>;

let sessionRefresher: SessionRefresher | null = null;
// One refresh at a time: refresh tokens rotate, so a second one would be spent.
let refreshInFlight: Promise<boolean> | null = null;

export function setSessionRefresher(refresher: SessionRefresher | null): void {
  sessionRefresher = refresher;
}

function refreshSession(): Promise<boolean> {
  if (!sessionRefresher) return Promise.resolve(false);
  refreshInFlight ??= sessionRefresher()
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

interface RequestOptions<TSchema extends z.ZodType> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Path under the API origin, e.g. "/api/auth/login". */
  path: string;
  body?: unknown;
  /** Validates the envelope's `data`; omit when the caller ignores it. */
  schema?: TSchema;
}

export async function request<TSchema extends z.ZodType = z.ZodUnknown>(
  options: RequestOptions<TSchema>,
): Promise<z.output<TSchema>> {
  const sentToken = getAccessToken();
  let response = await send(options, sentToken);

  // Auth endpoints use 401 for bad credentials; refreshing there would loop.
  if (response.status === 401 && !options.path.startsWith("/api/auth/")) {
    // Another request may have renewed the token already.
    const renewed = getAccessToken() !== sentToken || (await refreshSession());
    if (renewed) response = await send(options, getAccessToken());
  }

  return readResponse(response, options.schema);
}

async function send(
  { method, path, body }: RequestOptions<z.ZodType>,
  accessToken: string | null,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    return await fetch(`${await baseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      connectTimeout: TIMEOUT_MS,
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }
}

async function readResponse<TSchema extends z.ZodType>(
  response: Response,
  schema: TSchema | undefined,
): Promise<z.output<TSchema>> {
  const payload: unknown = await response.json().catch(() => undefined);

  if (!response.ok) throw toApiError(response.status, payload);

  const data = (payload as { data?: unknown } | undefined)?.data;
  if (!schema) return data as z.output<TSchema>;

  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError(-1, UNEXPECTED_ERROR_MESSAGE);
  return parsed.data;
}

function toApiError(status: number, payload: unknown): ApiError {
  const parsed = ErrorBodySchema.safeParse(payload);
  if (!parsed.success) return new ApiError(status, UNEXPECTED_ERROR_MESSAGE);

  // 400 and 5xx messages are raw internals, not meant for users.
  const userFacing = status !== 400 && status < 500;
  return new ApiError(
    status,
    userFacing ? parsed.data.message : UNEXPECTED_ERROR_MESSAGE,
    parsed.data.details?.field,
  );
}
