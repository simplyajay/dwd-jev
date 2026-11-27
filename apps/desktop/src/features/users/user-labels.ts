import type { Role, SafeUserType, Status, UserDetail } from "@dwd-jev/shared";

export const ROLE_LABELS: Record<Role, string> = {
  administrator: "Administrator",
  user: "User",
};

export const STATUS_LABELS: Record<Status, string> = {
  awaiting_approval: "Awaiting approval",
  active: "Active",
  inactive: "Inactive",
};

/** "First Middle Last" -- the API's `fullName` summaries use "Last, First Middle". */
export function displayName(user: Pick<SafeUserType, "firstName" | "middleName" | "lastName">) {
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ");
}

export function initials(user: Pick<SafeUserType, "firstName" | "lastName">) {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

/** The signed-in user is kept in the login shape, where `approvedBy` is just an id. */
export function toSafeUser(detail: UserDetail): SafeUserType {
  return { ...detail, approvedBy: detail.approvedBy?.id ?? null };
}
