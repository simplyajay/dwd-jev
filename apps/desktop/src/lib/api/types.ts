import type {
  AuditLog,
  AuditLogListInput,
  ConfirmPasswordInput,
  CreateJevInputSchema,
  CreateUserInput,
  Jev,
  JevByMonthInput,
  JevListItem,
  JevRevision,
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
import type { AuthSessionSchema } from "./schemas";

export type JevListRow = JevListItem;

/** What login and refresh return. */
export type AuthSession = z.output<typeof AuthSessionSchema>;

/** The create/update body as sent: dates as "YYYY-MM-DD" strings and amounts in pesos. */
export type JevBody = z.input<typeof CreateJevInputSchema>;

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
    /** Amounts are in cents. A deleted JEV is a 404 unless `includeDeleted`. */
    get(id: string, options?: { includeDeleted?: boolean }): Promise<Jev>;
    /** 409 with a field (e.g. "jevNumber") when a number is taken. */
    create(input: JevBody): Promise<Jev>;
    /** Replaces the whole JEV. Every save is a new revision, even without changes. */
    update(id: string, input: JevBody): Promise<Jev>;
    /** 403 with field "password" for a wrong password. */
    delete(id: string, input: ConfirmPasswordInput): Promise<void>;
    /** A create or update revision; its id is that audit log's `documentId`. */
    getRevision(id: string): Promise<JevRevision>;
  };
  auditLogs: {
    /** Newest first. */
    list(input: AuditLogListInput): Promise<PaginatedResult<AuditLog>>;
  };
}
