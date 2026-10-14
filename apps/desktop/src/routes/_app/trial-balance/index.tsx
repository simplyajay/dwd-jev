import { createFileRoute } from "@tanstack/react-router";
import { TrialBalancePage } from "@/features/trial-balance/components/trial-balance-page";

export const Route = createFileRoute("/_app/trial-balance/")({
  staticData: { title: "Trial Balance" },
  component: TrialBalancePage,
});
