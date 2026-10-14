/**
 * The one error type the API layer throws.
 *
 * `status` is the HTTP status, which the backend also echoes as `code` in the
 * error body. Two values never come from the backend:
 *   0  -- the request never got a response (server down, no network, timeout)
 *   -1 -- a response arrived but wasn't in the agreed shape
 */
export class ApiError extends Error {
  readonly status: number;
  /** For conflicts (409): the offending input, e.g. "username", "email", "jevNumber". */
  readonly field: string | undefined;

  constructor(status: number, message: string, field?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
  }

  /** The stored session is no longer accepted -- sign in again. */
  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export const NETWORK_ERROR_MESSAGE = "Can't reach the server. Check your connection and try again.";
export const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : UNEXPECTED_ERROR_MESSAGE;
}
