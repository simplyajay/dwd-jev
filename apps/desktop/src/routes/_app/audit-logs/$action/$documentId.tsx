import { createFileRoute } from "@tanstack/react-router";
import { AuditLogDetailPage } from "@/features/audit-log/components/audit-log-detail-page";

export const Route = createFileRoute("/_app/audit-logs/$action/$documentId")({
  staticData: { title: "Audit Log" },
  component: AuditLogDetailPage,
});
