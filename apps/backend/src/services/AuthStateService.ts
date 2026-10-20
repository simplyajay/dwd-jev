import type { Redis } from "ioredis";
import type { AuthState, IUserRepository } from "../repositories/UserRepository.js";

const AUTH_STATE_TTL_SECONDS = 60;

const authStateKey = (userId: string): string => `auth:user:${userId}`;

// Writes only if nothing is cached or the version is newer, so a stale read
// can't overwrite a newer state.
const SET_IF_NEWER = `
local current = redis.call("GET", KEYS[1])
if current and cjson.decode(current).tokenVersion >= tonumber(ARGV[2]) then
  return 0
end
redis.call("SET", KEYS[1], ARGV[1], "EX", ARGV[3])
return 1
`;

// The DB is the source of truth; Redis is a best-effort cache in front of it.
export class AuthStateService {
  constructor(private readonly userRepository: IUserRepository) {}

  // A cache behind the token's version is stale; fall through to the DB.
  async get(
    userId: string,
    tokenVersion: number,
    redis: Redis,
  ): Promise<AuthState | null> {
    const cached = await this.read(userId, redis);
    if (cached && cached.tokenVersion >= tokenVersion) return cached;

    const state = await this.userRepository.findAuthState(userId);
    if (state) await this.cache(state, redis);
    return state;
  }

  async bump(userId: string, redis: Redis): Promise<AuthState | null> {
    const state = await this.userRepository.bumpTokenVersion(userId);
    if (state) await this.cache(state, redis);
    return state;
  }

  async cache(state: AuthState, redis: Redis): Promise<void> {
    try {
      await redis.eval(
        SET_IF_NEWER,
        1,
        authStateKey(state.id),
        JSON.stringify(state),
        state.tokenVersion,
        AUTH_STATE_TTL_SECONDS,
      );
    } catch (err) {
      console.warn(`[authState] cache write failed for "${state.id}".`, err);
    }
  }

  private async read(userId: string, redis: Redis): Promise<AuthState | null> {
    try {
      const raw = await redis.get(authStateKey(userId));
      return raw ? (JSON.parse(raw) as AuthState) : null;
    } catch (err) {
      console.warn(`[authState] cache read failed for "${userId}".`, err);
      return null;
    }
  }
}
