import { z } from "zod";

export const ChartOfAccountsSchema = z.object({
  id: z.uuid(),
  accountCode: z.string(),
  accountName: z.string(),
  gso: z.string().nullable(),
});
export type ChartOfAccounts = z.infer<typeof ChartOfAccountsSchema>;

// A single row from the CSV import. No id — the whole table gets replaced,
// not merged, so rows are never individually addressed.
const ChartOfAccountsRowSchema = z.object({
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  gso: z.string().nullish(),
});

export const ReplaceChartOfAccountsInputSchema = z.array(ChartOfAccountsRowSchema);
export type ReplaceChartOfAccountsInput = z.infer<
  typeof ReplaceChartOfAccountsInputSchema
>;
