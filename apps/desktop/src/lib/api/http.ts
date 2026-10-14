import { fetch } from "@tauri-apps/plugin-http";
import type { z } from "zod";
import { getApiBaseUrl } from "@/lib/tauri/commands";
import { getAccessToken } from "./access-token";
import { ApiError, NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from "./errors";
import { ErrorBodySchema } from "./schemas";

/*
 * JSON client for the backend, over the Tauri HTTP plugin (requests leave from
 * Rust, so there is no CORS, and only the configured API origin is reachable).
 *
 * Contract:
 *   success -> { code, data }
 *   failure -> { code, message, details?: { field } }
 *
 * Not handled yet: retrying a request after refreshing an expired access
 * token. Add that here when the first authenticated endpoint is wired.
 */

const TIMEOUT_MS = 15_000;

// Asked once; the URL is compiled into the app and cannot change at runtime.
let baseUrlPromise: Promise<string> | null = null;
const baseUrl = () => {
  baseUrlPromise ??= getApiBaseUrl();
  return baseUrlPromise;
};

interface RequestOptions<TSchema extends z.ZodType> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Path under the API origin, e.g. "/api/auth/login". */
  path: string;
  body?: unknown;
  /** Validates `data` of the success envelope. Omit when the caller ignores it. */
  schema?: TSchema;
}

export async function request<TSchema extends z.ZodType = z.ZodUnknown>({
  method,
  path,
  body,
  schema,
}: RequestOptions<TSchema>): Promise<z.output<TSchema>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const accessToken = getAccessToken();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${await baseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      connectTimeout: TIMEOUT_MS,
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

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

  // 400s carry raw validator output and 5xx carry internals; neither is meant
  // for users. Everything else (401, 403, 404, 409...) is written for them.
  const userFacing = status !== 400 && status < 500;
  return new ApiError(
    status,
    userFacing ? parsed.data.message : UNEXPECTED_ERROR_MESSAGE,
    parsed.data.details?.field,
  );
}
