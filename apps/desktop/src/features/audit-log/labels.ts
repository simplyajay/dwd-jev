import type { AuditAction } from "@dwd-jev/shared";

export const ACTION_LABELS: Record<AuditAction, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
};
