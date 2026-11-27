import type { AuditLog } from "@dwd-jev/shared";

/** Who and when, from the clicked row; a deleted JEV's `deletedBy` is only an id. */
export interface AuditLogEntryState {
  actorName: string;
  /** ISO time, as history state is serialized. */
  at: string;
}

declare module "@tanstack/react-router" {
  interface HistoryState {
    auditLogEntry?: AuditLogEntryState;
  }
}

/** History state for opening a log row's detail page. */
export function entryState(log: AuditLog) {
  return {
    auditLogEntry: { actorName: log.actor.fullName, at: log.createdAt.toISOString() },
  };
}
