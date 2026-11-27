import { createFileRoute } from "@tanstack/react-router";
import { JevListPage } from "@/features/jev/components/jev-list-page";
import { JevListSearchSchema } from "@/features/jev/jev-list-search";

export const Route = createFileRoute("/_app/jevs/")({
  validateSearch: JevListSearchSchema,
  staticData: { title: "Journal Entry Vouchers" },
  component: JevListPage,
});
