import { z } from "zod";
import { JevSchema, JevUserRefSchema } from "./jev.js";

// Content only; who and when come from the revision row.
export const JevSnapshotSchema = JevSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  lastUpdatedAt: true,
  lastUpdatedBy: true,
  deletedAt: true,
  deletedBy: true,
});
export type JevSnapshot = z.infer<typeof JevSnapshotSchema>;

// beforeData is null on the revision written when the JEV is created.
export const JevRevisionSchema = z.object({
  id: z.uuid(),
  jevId: z.uuid(),
  beforeData: JevSnapshotSchema.nullable(),
  afterData: JevSnapshotSchema,
  updatedBy: JevUserRefSchema,
  updatedAt: z.coerce.date(),
});
export type JevRevision = z.infer<typeof JevRevisionSchema>;
