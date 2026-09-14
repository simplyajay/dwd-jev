import { prisma } from "../lib/prisma.js";
import { SafeUserType } from "@dwd-jev/shared";
import type { CreateUserInput, UserType } from "@dwd-jev/shared";

export interface IUserRepository {
  findById(id: string): Promise<UserType | null>;
  findByUsername(username: string): Promise<UserType | null>;
  findByEmail(email: string): Promise<UserType | null>;
  findUsers(isPending?: boolean): Promise<SafeUserType[]>;
  create(data: CreateUserInput): Promise<UserType>;
}

export class PrismaUserRepository implements IUserRepository {
  findById(id: string): Promise<UserType | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findByUsername(username: string): Promise<UserType | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  findByEmail(email: string): Promise<UserType | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  //password excluded since this data will not be used for verification
  findUsers(isPending: boolean): Promise<SafeUserType[]> {
    return prisma.user.findMany({
      where: { status: isPending ? "awaiting_approval" : { not: "awaiting_approval" } },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
        status: true,
        position: true,
        isSystemAccount: true,
        approvedAt: true,
        approvedBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  create(data: CreateUserInput): Promise<UserType> {
    return prisma.user.create({ data });
  }
}
