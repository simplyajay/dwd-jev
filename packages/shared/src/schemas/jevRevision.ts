import { z } from "zod";
import { JevSchema, JevUserRefSchema } from "./jev.js";

// beforeData and afterData are in the GET /jev/:id shape, so diffJev takes them as-is.
export const JevRevisionSchema = z.object({
  id: z.uuid(),
  jevId: z.uuid(),
  beforeData: JevSchema,
  afterData: JevSchema,
  updatedBy: JevUserRefSchema,
  updatedAt: z.coerce.date(),
});
export type JevRevision = z.infer<typeof JevRevisionSchema>;
