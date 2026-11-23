import type { UserRef, UserRefWithPosition } from "@dwd-jev/shared";
import { formatFullName } from "./fullName.js";

export const USER_REF_SELECT = {
  id: true,
  firstName: true,
  middleName: true,
  lastName: true,
  isSystemAccount: true,
} as const;

export const USER_REF_WITH_POSITION_SELECT = {
  ...USER_REF_SELECT,
  position: true,
} as const;

interface UserRefRow {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  isSystemAccount: boolean;
}

export const toUserRef = (user: UserRefRow): UserRef => ({
  id: user.id,
  fullName: user.isSystemAccount ? "System" : formatFullName(user),
  isSystemAccount: user.isSystemAccount,
});

export const toUserRefWithPosition = (
  user: UserRefRow & { position: string },
): UserRefWithPosition => ({ ...toUserRef(user), position: user.position });
