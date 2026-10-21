import type { Role, SafeUserType, Status } from "@dwd-jev/shared";

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
