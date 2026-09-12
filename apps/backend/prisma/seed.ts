import { randomBytes } from "node:crypto";
import { prisma } from "../src/lib/prisma.js";
import { env } from "../src/env.js";
import { hashPassword } from "../src/utils/password.js";

const main = async () => {
  const existing = await prisma.user.findUnique({ where: { username: "administrator" } });
  if (existing) {
    console.log("Administrator account already exists, skipping.");
    return;
  }

  const plainPassword = env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64");

  if (!env.ADMIN_PASSWORD) {
    console.warn("ADMIN_PASSWORD not set -- generated a random password instead:");
    console.warn(plainPassword);
    console.warn("Save this now. It is hashed before storage and cannot be recovered.");
  }

  const hashedPassword = await hashPassword(plainPassword);

  await prisma.user.create({
    data: {
      firstName: "Administrator",
      lastName: "Account",
      username: "administrator",
      password: hashedPassword,
      role: "administrator",
      status: "active",
      position: "System",
      isSystemAccount: true,
    },
  });

  console.log("Administrator account created.");
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
