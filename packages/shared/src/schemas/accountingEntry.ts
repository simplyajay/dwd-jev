import { z } from "zod";
import { EntryTypeSchema } from "../enums.js";
import { AmountSchema, toCents } from "./amount.js";
import { CreateExplanationInputSchema, ExplanationSchema } from "./explanation.js";

export const AccountingEntrySchema = z.object({
  id: z.uuid(),
  jevId: z.uuid(),
  sortOrder: z.number().int(),
  accountCode: z.string(),
  accountName: z.string(),
  entryType: EntryTypeSchema,
  amount: z.coerce.bigint(),
  explanations: z.array(ExplanationSchema),
});
export type AccountingEntry = z.infer<typeof AccountingEntrySchema>;

export const CreateAccountingEntryInputSchema = z
  .object({
    accountCode: z.string().nonempty("Please enter account code."),
    accountName: z.string().nonempty("Please enter account name."),
    entryType: EntryTypeSchema.nullable(),
    amount: AmountSchema,
    explanations: z.array(CreateExplanationInputSchema).default([]),
  })
  .superRefine((data, ctx) => {
    const { entryType, amount, explanations } = data;

    if (entryType === null || amount === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Enter debit or credit.",
      });
      return;
    }

    if (amount <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Amount must be greater than 0.",
      });
      return;
    }

    if (explanations.length === 0) return;

    const hasIncompleteDetails = explanations.some(
      (explanation) => !explanation.reference || !explanation.description,
    );

    if (hasIncompleteDetails) {
      ctx.addIssue({
        code: "custom",
        path: ["explanations"],
        message: "Enter the reference and description.",
      });
      return;
    }

    const explanationsTotalCents = explanations.reduce(
      (sum, explanation) => sum + toCents(explanation.amount ?? 0),
      0,
    );

    if (explanationsTotalCents !== toCents(amount)) {
      ctx.addIssue({
        code: "custom",
        path: ["explanations"],
        message: `Explanations must total the account's ${entryType}.`,
      });
    }
  });
export type CreateAccountingEntryInput = z.infer<typeof CreateAccountingEntryInputSchema>;
