import { fetch } from "@tauri-apps/plugin-http";
import { setAccessToken } from "./access-token";
import { authApi } from "./auth-api";
import { ApiError } from "./errors";
import { setSessionRefresher } from "./http";
import { usersApi } from "./users-api";

vi.mock("@tauri-apps/plugin-http", () => ({ fetch: vi.fn() }));
vi.mock("@/lib/tauri/commands", () => ({
  getApiBaseUrl: () => Promise.resolve("http://localhost:3456"),
}));

const fetchMock = vi.mocked(fetch);

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

/** Awaits a call that must fail, and returns the ApiError it threw. */
async function failure(call: Promise<unknown>): Promise<ApiError> {
  const error = await call.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

// Bodies below are copied from the real backend's responses.
const USER = {
  id: "cf9ac65a-6f0b-41a1-8d23-630ad545b306",
  firstName: "Claude",
  middleName: null,
  lastName: "Test",
  username: "claude-test-username-1",
  email: null,
  role: "user",
  position: "Test account",
  status: "awaiting_approval",
  isSystemAccount: false,
  approvedBy: null,
  approvedAt: null,
  createdAt: "2026-10-11T16:55:12.001Z",
};
const SESSION = { accessToken: "access-1", refreshToken: "refresh-1", user: USER };
const CREDENTIALS = { username: "claude-test-username-1", password: "claude-test-password-1" };

beforeEach(() => {
  fetchMock.mockReset();
  setAccessToken(null);
  setSessionRefresher(null);
});

describe("auth API requests", () => {
  it("posts login credentials as JSON to /api/auth/login", async () => {
    respond(200, { code: 200, data: SESSION });

    await authApi.login(CREDENTIALS);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("http://localhost:3456/api/auth/login");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(CREDENTIALS);
    expect(init?.headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("sends registration to /api/users/register and refresh/logout with the token in the body", async () => {
    respond(201, { code: 201, data: USER });
    respond(200, { code: 200, data: SESSION });
    respond(200, { code: 200, data: null });

    await authApi.register({
      ...CREDENTIALS,
      firstName: "Claude",
      lastName: "Test",
      position: "QA",
    });
    await authApi.refresh("refresh-0");
    await authApi.logout("refresh-1");

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "http://localhost:3456/api/users/register",
      "http://localhost:3456/api/auth/refresh",
      "http://localhost:3456/api/auth/logout",
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      refreshToken: "refresh-0",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({
      refreshToken: "refresh-1",
    });
  });

  it("adds the bearer token only when one is set", async () => {
    respond(200, { code: 200, data: null });
    respond(200, { code: 200, data: null });

    await authApi.logout("r");
    setAccessToken("access-1");
    await authApi.logout("r");

    expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty("Authorization");
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer access-1",
    });
  });
});

describe("auth API responses", () => {
  it("unwraps the { code, data } envelope and turns date strings into Dates", async () => {
    respond(200, { code: 200, data: SESSION });

    const session = await authApi.login(CREDENTIALS);

    expect(session.accessToken).toBe("access-1");
    expect(session.refreshToken).toBe("refresh-1");
    expect(session.user.username).toBe("claude-test-username-1");
    expect(session.user.createdAt).toEqual(new Date("2026-10-11T16:55:12.001Z"));
    expect(session.user.approvedAt).toBeNull();
  });

  it("returns the created user from register", async () => {
    respond(201, { code: 201, data: USER });

    const user = await authApi.register({
      ...CREDENTIALS,
      firstName: "Claude",
      lastName: "Test",
      position: "QA",
    });

    expect(user.status).toBe("awaiting_approval");
  });

  it("never exposes a password even if the backend sent one", async () => {
    respond(200, { code: 200, data: { ...SESSION, user: { ...USER, password: "hash" } } });

    const session = await authApi.login(CREDENTIALS);

    expect(session.user).not.toHaveProperty("password");
  });

  it("rejects a success response that doesn't match the contract", async () => {
    respond(200, { code: 200, data: { accessToken: "access-1", user: USER } });

    const error = await failure(authApi.login(CREDENTIALS));

    expect(error.status).toBe(-1);
    expect(error.message).toBe("Something went wrong. Please try again.");
  });
});

describe("auth API errors", () => {
  it("shows the backend's message for wrong credentials (401)", async () => {
    respond(401, { code: 401, message: "Invalid username or password." });

    const error = await failure(authApi.login(CREDENTIALS));

    expect(error.status).toBe(401);
    expect(error.message).toBe("Invalid username or password.");
    expect(error.isUnauthorized).toBe(true);
  });

  it("shows the backend's message for an account awaiting approval (403)", async () => {
    respond(403, { code: 403, message: "Your account is awaiting administrator approval." });

    const error = await failure(authApi.login(CREDENTIALS));

    expect(error.status).toBe(403);
    expect(error.message).toBe("Your account is awaiting administrator approval.");
  });

  it("carries the conflicting field on a 409", async () => {
    respond(409, {
      code: 409,
      message: "Username is already taken.",
      details: { field: "username" },
    });

    const error = await failure(
      authApi.register({ ...CREDENTIALS, firstName: "Claude", lastName: "Test", position: "QA" }),
    );

    expect(error.status).toBe(409);
    expect(error.field).toBe("username");
    expect(error.message).toBe("Username is already taken.");
  });

  it("hides raw validator output (400) and server internals (5xx)", async () => {
    respond(400, { code: 400, message: "Too small: expected string to have >=8 characters" });
    respond(500, { code: 500, message: "PrismaClientKnownRequestError: ..." });

    const badRequest = await failure(authApi.login(CREDENTIALS));
    const serverError = await failure(authApi.login(CREDENTIALS));

    expect(badRequest.status).toBe(400);
    expect(badRequest.message).toBe("Something went wrong. Please try again.");
    expect(serverError.status).toBe(500);
    expect(serverError.message).toBe("Something went wrong. Please try again.");
    expect(serverError.isUnauthorized).toBe(false);
  });

  it("reports an unreachable server as status 0", async () => {
    fetchMock.mockRejectedValueOnce(new Error("error sending request"));

    const error = await failure(authApi.login(CREDENTIALS));

    expect(error.status).toBe(0);
    expect(error.message).toBe("Can't reach the server. Check your connection and try again.");
    expect(error.isUnauthorized).toBe(false);
  });

  it("handles an error response with a non-JSON body", async () => {
    fetchMock.mockResolvedValueOnce(new Response("<html>Bad Gateway</html>", { status: 502 }));

    const error = await failure(authApi.login(CREDENTIALS));

    expect(error.status).toBe(502);
    expect(error.message).toBe("Something went wrong. Please try again.");
  });
});

describe("session refresh on 401", () => {
  const PENDING = [
    {
      id: "a54f473a-721a-4b75-9e3f-7d85214720ed",
      fullName: "Test, Claude",
      position: "Test account",
      status: "awaiting_approval",
    },
  ];
  const EXPIRED = { code: 401, message: "Unauthorized" };

  /** A refresher that renews the access token, like the auth provider's. */
  function renewTo(token: string) {
    const refresher = vi.fn(async () => {
      setAccessToken(token);
      return true;
    });
    setSessionRefresher(refresher);
    return refresher;
  }

  const sentTokens = () =>
    fetchMock.mock.calls.map(
      ([, init]) => (init?.headers as Record<string, string> | undefined)?.Authorization,
    );

  it("refreshes once and replays the request with the new token", async () => {
    setAccessToken("access-1");
    const refresher = renewTo("access-2");
    respond(401, EXPIRED);
    respond(200, { code: 200, data: PENDING });

    const users = await usersApi.listPending();

    expect(users).toHaveLength(1);
    expect(refresher).toHaveBeenCalledTimes(1);
    expect(sentTokens()).toEqual(["Bearer access-1", "Bearer access-2"]);
  });

  it("replays the body too", async () => {
    setAccessToken("access-1");
    renewTo("access-2");
    respond(401, EXPIRED);
    respond(200, { code: 200, data: null });

    await usersApi.approve(PENDING[0]?.id ?? "", { password: "secret" });

    expect(fetchMock.mock.calls.map(([, init]) => init?.body)).toEqual([
      '{"password":"secret"}',
      '{"password":"secret"}',
    ]);
  });

  it("passes the 401 on when the refresh fails", async () => {
    setAccessToken("access-1");
    setSessionRefresher(async () => false);
    respond(401, EXPIRED);

    const error = await failure(usersApi.listPending());

    expect(error.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("replays at most once", async () => {
    setAccessToken("access-1");
    const refresher = renewTo("access-2");
    respond(401, EXPIRED);
    respond(401, EXPIRED);

    const error = await failure(usersApi.listPending());

    expect(error.status).toBe(401);
    expect(refresher).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shares one refresh between requests that fail together", async () => {
    setAccessToken("access-1");
    const refresher = renewTo("access-2");
    respond(401, EXPIRED);
    respond(401, EXPIRED);
    respond(200, { code: 200, data: PENDING });
    respond(200, { code: 200, data: PENDING });

    await Promise.all([usersApi.listPending(), usersApi.listPending()]);

    expect(refresher).toHaveBeenCalledTimes(1);
    expect(sentTokens().slice(2)).toEqual(["Bearer access-2", "Bearer access-2"]);
  });

  it("never refreshes for auth endpoints", async () => {
    const refresher = renewTo("access-2");
    respond(401, { code: 401, message: "Invalid username or password." });

    await failure(authApi.login(CREDENTIALS));

    expect(refresher).not.toHaveBeenCalled();
  });

  it("does not refresh on a wrong password (403)", async () => {
    setAccessToken("access-1");
    const refresher = renewTo("access-2");
    respond(403, { code: 403, message: "Incorrect password.", details: { field: "password" } });

    const error = await failure(usersApi.approve("id", { password: "wrong" }));

    expect(error.field).toBe("password");
    expect(error.message).toBe("Incorrect password.");
    expect(refresher).not.toHaveBeenCalled();
  });
});
