/**
 * The access token lives only in memory. The HTTP client reads it per request;
 * the auth provider sets it on sign-in/refresh and clears it on sign-out.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
