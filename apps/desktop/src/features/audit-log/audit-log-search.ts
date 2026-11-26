import { z } from "zod";
import { createRememberedSearch } from "@/lib/remembered-search";

/** The list's URL state; filters come later. */
export const AuditLogSearchSchema = z.object({
  page: z.number().int().min(1).optional().catch(undefined),
});
export type AuditLogSearch = z.infer<typeof AuditLogSearchSchema>;

// For the sidebar link and Back to audit log.
const remembered = createRememberedSearch<AuditLogSearch>();
export const rememberAuditLogSearch = remembered.remember;
export const useRememberedAuditLogSearch = remembered.useRemembered;

export const AUDIT_LOG_PAGE_SIZE_KEY = "audit-log.list-page-size";
