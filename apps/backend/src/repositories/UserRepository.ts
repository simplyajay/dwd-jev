import { prisma } from "../lib/prisma.js";
import type { DbClient } from "../lib/transaction.js";
import {
  nullIfNotFound,
  withUniqueConflict,
  type UniqueFieldMap,
} from "../utils/prismaErrors.js";
import type { CreateUserInput, SafeUserType, UserType } from "@dwd-jev/shared";

// Backstop for the race the UserService pre-check can't close (see createUser).
const USER_UNIQUE_FIELDS: UniqueFieldMap = {
  username: { label: "Username" },
  email: { label: "Email" },
};

const APPROVER_INCLUDE = {
  approvedByUser: {
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      isSystemAccount: true,
    },
  },
} as const;

const AUTH_STATE_SELECT = {
  id: true,
  status: true,
  role: true,
  tokenVersion: true,
} as const;

const SAFE_OMIT = { password: true, tokenVersion: true } as const;

const BUMP_TOKEN_VERSION = { tokenVersion: { increment: 1 } } as const;

const SUMMARY_SELECT = {
  id: true,
  firstName: true,
  middleName: true,
  lastName: true,
  position: true,
  status: true,
} as const;

export type UserSummaryRow = Pick<
  UserType,
  "id" | "firstName" | "middleName" | "lastName" | "position" | "status"
>;

export type ApproverRow = Pick<
  UserType,
  "id" | "firstName" | "middleName" | "lastName" | "isSystemAccount"
>;

export type ActiveStatus = Exclude<UserType["status"], "awaiting_approval">;

export type ManagedUserData = { status: ActiveStatus } | { role: UserType["role"] };

export type ProfileData = Pick<
  UserType,
  "firstName" | "middleName" | "lastName" | "position"
>;

export type AccountData = Pick<UserType, "username" | "email"> & { password?: string };

export type UserRow = UserType & { tokenVersion: number };

export type AuthState = Pick<UserType, "id" | "status" | "role"> & {
  tokenVersion: number;
};

// tokenVersion is internal; the service strips it before responding.
export type UserDetailRow = SafeUserType & {
  tokenVersion: number;
  approvedByUser: ApproverRow | null;
};

export interface IUserRepository {
  findById(id: string): Promise<SafeUserType | null>;
  findByUsername(username: string): Promise<SafeUserType | null>;
  findByEmail(email: string): Promise<SafeUserType | null>;
  findWithPasswordById(id: string): Promise<UserRow | null>;
  findWithPasswordByUsername(username: string): Promise<UserRow | null>;
  findAuthState(id: string): Promise<AuthState | null>;
  bumpTokenVersion(id: string, client?: DbClient): Promise<AuthState | null>;
  findDetailById(id: string): Promise<UserDetailRow | null>;
  findApprovedUsers(includeInactive: boolean): Promise<UserSummaryRow[]>;
  findPendingUsers(): Promise<UserSummaryRow[]>;
  create(data: CreateUserInput): Promise<UserRow>;
  approvePending(id: string, approvedBy: string): Promise<UserDetailRow | null>;
  deletePending(id: string): Promise<boolean>;
  updateManagedUser(
    id: string,
    data: ManagedUserData,
    onlyRegularUsers: boolean,
  ): Promise<UserDetailRow | null>;
  updateProfile(id: string, data: ProfileData): Promise<UserDetailRow | null>;
  updateAccount(
    id: string,
    data: AccountData,
    client?: DbClient,
  ): Promise<UserDetailRow | null>;
}

export class PrismaUserRepository implements IUserRepository {
  findById(id: string): Promise<SafeUserType | null> {
    return prisma.user.findUnique({ where: { id }, omit: SAFE_OMIT });
  }

  findByUsername(username: string): Promise<SafeUserType | null> {
    return prisma.user.findUnique({ where: { username }, omit: SAFE_OMIT });
  }

  findByEmail(email: string): Promise<SafeUserType | null> {
    return prisma.user.findUnique({ where: { email }, omit: SAFE_OMIT });
  }

  // Only for password checks.
  findWithPasswordById(id: string): Promise<UserRow | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findWithPasswordByUsername(username: string): Promise<UserRow | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  findAuthState(id: string): Promise<AuthState | null> {
    return prisma.user.findUnique({ where: { id }, select: AUTH_STATE_SELECT });
  }

  bumpTokenVersion(id: string, client: DbClient = prisma): Promise<AuthState | null> {
    return nullIfNotFound(() =>
      client.user.update({
        where: { id },
        data: BUMP_TOKEN_VERSION,
        select: AUTH_STATE_SELECT,
      }),
    );
  }

  findDetailById(id: string): Promise<UserDetailRow | null> {
    return prisma.user.findUnique({
      where: { id },
      omit: { password: true },
      include: APPROVER_INCLUDE,
    });
  }

  findApprovedUsers(includeInactive: boolean): Promise<UserSummaryRow[]> {
    return prisma.user.findMany({
      where: {
        status: includeInactive ? { in: ["active", "inactive"] } : "active",
        isSystemAccount: false,
      },
      select: SUMMARY_SELECT,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  findPendingUsers(): Promise<UserSummaryRow[]> {
    return prisma.user.findMany({
      where: { status: "awaiting_approval" },
      select: SUMMARY_SELECT,
      orderBy: { createdAt: "asc" },
    });
  }

  create(data: CreateUserInput): Promise<UserRow> {
    return withUniqueConflict(USER_UNIQUE_FIELDS, () => prisma.user.create({ data }));
  }

  // Match pending users only; null/false once processed.
  approvePending(id: string, approvedBy: string): Promise<UserDetailRow | null> {
    return nullIfNotFound(() =>
      prisma.user.update({
        where: { id, status: "awaiting_approval" },
        data: { status: "active", approvedBy, approvedAt: new Date() },
        omit: { password: true },
        include: APPROVER_INCLUDE,
      }),
    );
  }

  async deletePending(id: string): Promise<boolean> {
    const deleted = await nullIfNotFound(() =>
      prisma.user.delete({ where: { id, status: "awaiting_approval" } }),
    );
    return deleted !== null;
  }

  // Re-applies the service's checks to close races.
  updateManagedUser(
    id: string,
    data: ManagedUserData,
    onlyRegularUsers: boolean,
  ): Promise<UserDetailRow | null> {
    return nullIfNotFound(() =>
      prisma.user.update({
        where: {
          id,
          isSystemAccount: false,
          status: { in: ["active", "inactive"] },
          ...(onlyRegularUsers && { role: "user" }),
        },
        data: { ...data, ...BUMP_TOKEN_VERSION },
        omit: { password: true },
        include: APPROVER_INCLUDE,
      }),
    );
  }

  updateProfile(id: string, data: ProfileData): Promise<UserDetailRow | null> {
    return nullIfNotFound(() =>
      prisma.user.update({
        where: { id },
        data,
        omit: { password: true },
        include: APPROVER_INCLUDE,
      }),
    );
  }

  updateAccount(
    id: string,
    data: AccountData,
    client: DbClient = prisma,
  ): Promise<UserDetailRow | null> {
    return withUniqueConflict(USER_UNIQUE_FIELDS, () =>
      nullIfNotFound(() =>
        client.user.update({
          where: { id },
          data: { ...data, ...(data.password && BUMP_TOKEN_VERSION) },
          omit: { password: true },
          include: APPROVER_INCLUDE,
        }),
      ),
    );
  }
}
