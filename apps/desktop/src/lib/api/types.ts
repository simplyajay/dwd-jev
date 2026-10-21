import type {
  ConfirmPasswordInput,
  CreateUserInput,
  JevByMonthInput,
  JevListItem,
  LoginInput,
  PaginatedResult,
  SafeUserType,
  SetUserRoleInput,
  SetUserStatusInput,
  UserDetail,
  UserSummary,
} from "@dwd-jev/shared";
import type { z } from "zod";
import type { AuthSessionSchema } from "./schemas";

/** What login and refresh return. */
export type AuthSession = z.output<typeof AuthSessionSchema>;

/** Everything the UI needs from the backend. Screens depend only on this. */
export interface Api {
  auth: {
    login(input: LoginInput): Promise<AuthSession>;
    /** New accounts usually start as `awaiting_approval`. */
    register(input: CreateUserInput): Promise<SafeUserType>;
    refresh(refreshToken: string): Promise<AuthSession>;
    logout(refreshToken: string): Promise<void>;
  };
  /** Administrator actions take the admin's own password. */
  users: {
    /** In the backend's order. Admins also get inactive accounts. */
    list(): Promise<UserSummary[]>;
    get(id: string): Promise<UserDetail>;
    listPending(): Promise<UserSummary[]>;
    approve(id: string, input: ConfirmPasswordInput): Promise<void>;
    /** Deletes the account. */
    reject(id: string, input: ConfirmPasswordInput): Promise<void>;
    /** Deactivating also ends that user's session. */
    setStatus(id: string, input: SetUserStatusInput): Promise<void>;
    /** Only the system account can change an administrator's role. */
    setRole(id: string, input: SetUserRoleInput): Promise<void>;
  };
  jevs: {
    listByMonth(input: JevByMonthInput): Promise<PaginatedResult<JevListItem>>;
  };
}
