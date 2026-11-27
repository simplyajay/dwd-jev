/**
 * The one error type the API layer throws. `status` is the HTTP status, or
 * 0 when no response arrived and -1 when it wasn't in the agreed shape.
 */
export class ApiError extends Error {
  readonly status: number;
  /** The input the error is about, e.g. "username" (409), "password" (403) or "newPassword" (400). */
  readonly field: string | undefined;
  /** On 429: seconds until the request may be tried again. */
  readonly retryAfterSeconds: number | undefined;

  constructor(status: number, message: string, field?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  /** The stored session is no longer accepted -- sign in again. */
  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export const NETWORK_ERROR_MESSAGE = "Can't reach the server. Check your connection and try again.";
export const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`;

/** A wait as words, e.g. 90 -> "1 minute and 30 seconds". */
export function formatWait(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return plural(rest, "second");
  if (rest === 0) return plural(minutes, "minute");
  return `${plural(minutes, "minute")} and ${plural(rest, "second")}`;
}

export function tooManyRequestsMessage(retryAfterSeconds: number | undefined): string {
  return retryAfterSeconds
    ? `Too many requests. Try again in ${formatWait(retryAfterSeconds)}.`
    : "Too many requests. Please try again later.";
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : UNEXPECTED_ERROR_MESSAGE;
}
