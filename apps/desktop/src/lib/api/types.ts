import type {
  ConfirmPasswordInput,
  CreateJevInputSchema,
  CreateUserInput,
  Jev,
  JevByMonthInput,
  LoginInput,
  PaginatedResult,
  SafeUserType,
  SetUserRoleInput,
  SetUserStatusInput,
  UpdateAccountInput,
  UpdateAccountResult,
  UpdateProfileInput,
  UserDetail,
  UserSummary,
} from "@dwd-jev/shared";
import type { z } from "zod";
import type { AuthSessionSchema, JevListRowSchema } from "./schemas";

export type JevListRow = z.output<typeof JevListRowSchema>;

/** What login and refresh return. */
export type AuthSession = z.output<typeof AuthSessionSchema>;

/** The create body as sent: dates as "YYYY-MM-DD" strings and amounts in pesos. */
export type CreateJevBody = z.input<typeof CreateJevInputSchema>;

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
    /** The signed-in user's own name and position. */
    updateProfile(input: UpdateProfileInput): Promise<UserDetail>;
    /** The signed-in user's sign-in details. Tokens come back only on a password change. */
    updateAccount(input: UpdateAccountInput): Promise<UpdateAccountResult>;
  };
  jevs: {
    /** `month: 0` lists the whole year. */
    listByMonth(input: JevByMonthInput): Promise<PaginatedResult<JevListRow>>;
    /** Amounts are in cents. */
    get(id: string): Promise<Jev>;
    /** 409 with field "jevNumber" when the number is taken. */
    create(input: CreateJevBody): Promise<Jev>;
    delete(id: string, input: ConfirmPasswordInput): Promise<void>;
  };
}
