import { prisma } from "../lib/prisma.js";
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

export type ProfileData = Pick<UserType, "firstName" | "middleName" | "lastName" | "position">;

export type AccountData = Pick<UserType, "username" | "email"> & { password?: string };

export type UserDetailRow = SafeUserType & { approvedByUser: ApproverRow | null };

export interface IUserRepository {
  findById(id: string): Promise<SafeUserType | null>;
  findByUsername(username: string): Promise<SafeUserType | null>;
  findByEmail(email: string): Promise<SafeUserType | null>;
  findWithPasswordById(id: string): Promise<UserType | null>;
  findWithPasswordByUsername(username: string): Promise<UserType | null>;
  findDetailById(id: string): Promise<UserDetailRow | null>;
  findApprovedUsers(includeInactive: boolean): Promise<UserSummaryRow[]>;
  findPendingUsers(): Promise<UserSummaryRow[]>;
  create(data: CreateUserInput): Promise<UserType>;
  approvePending(id: string, approvedBy: string): Promise<UserDetailRow | null>;
  deletePending(id: string): Promise<boolean>;
  updateManagedUser(
    id: string,
    data: ManagedUserData,
    onlyRegularUsers: boolean,
  ): Promise<UserDetailRow | null>;
  updateProfile(id: string, data: ProfileData): Promise<UserDetailRow | null>;
  updateAccount(id: string, data: AccountData): Promise<UserDetailRow | null>;
}

export class PrismaUserRepository implements IUserRepository {
  findById(id: string): Promise<SafeUserType | null> {
    return prisma.user.findUnique({ where: { id }, omit: { password: true } });
  }

  findByUsername(username: string): Promise<SafeUserType | null> {
    return prisma.user.findUnique({ where: { username }, omit: { password: true } });
  }

  findByEmail(email: string): Promise<SafeUserType | null> {
    return prisma.user.findUnique({ where: { email }, omit: { password: true } });
  }

  // Only for password checks.
  findWithPasswordById(id: string): Promise<UserType | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findWithPasswordByUsername(username: string): Promise<UserType | null> {
    return prisma.user.findUnique({ where: { username } });
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

  create(data: CreateUserInput): Promise<UserType> {
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
        data,
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

  updateAccount(id: string, data: AccountData): Promise<UserDetailRow | null> {
    return withUniqueConflict(USER_UNIQUE_FIELDS, () =>
      nullIfNotFound(() =>
        prisma.user.update({
          where: { id },
          data,
          omit: { password: true },
          include: APPROVER_INCLUDE,
        }),
      ),
    );
  }
}
