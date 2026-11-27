import { createFileRoute } from "@tanstack/react-router";
import { AuditLogSearchSchema } from "@/features/audit-log/audit-log-search";
import { AuditLogListPage } from "@/features/audit-log/components/audit-log-list-page";

export const Route = createFileRoute("/_app/audit-logs/")({
  validateSearch: AuditLogSearchSchema,
  staticData: { title: "Audit Log" },
  component: AuditLogListPage,
});
