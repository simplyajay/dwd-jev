import type { Role, Status, User } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export interface CreateUserData {
  firstName: string;
  middleName: string | null;
  lastName: string;
  username: string;
  password: string;
  email: string | null;
  role: Role;
  position: string;
  status: Status;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

export class PrismaUserRepository implements IUserRepository {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }
}
