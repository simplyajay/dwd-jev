/**
 * The one error type the API layer throws. `status` is the HTTP status, or
 * 0 when no response arrived and -1 when it wasn't in the agreed shape.
 */
export class ApiError extends Error {
  readonly status: number;
  /** The input the error is about, e.g. "username" (409) or "password" (403). */
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
