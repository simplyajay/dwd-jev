import { z } from "zod";
import { EntryTypeSchema } from "../enums.js";
import { AmountSchema } from "./amount.js";

export const ExplanationSchema = z.object({
  id: z.uuid(),
  accountingEntryId: z.uuid(),
  reference: z.string(),
  description: z.string(),
  entryType: EntryTypeSchema,
  amount: z.coerce.bigint(),
});
export type Explanation = z.infer<typeof ExplanationSchema>;

// accountingEntryId comes from the route; entryType is inherited from the parent.
export const CreateExplanationInputSchema = z.object({
  reference: z.string(),
  description: z.string(),
  amount: AmountSchema,
});
export type CreateExplanationInput = z.infer<typeof CreateExplanationInputSchema>;
