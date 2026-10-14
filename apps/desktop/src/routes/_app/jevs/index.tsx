import { createFileRoute } from "@tanstack/react-router";
import { JevListPage } from "@/features/jev/components/jev-list-page";

export const Route = createFileRoute("/_app/jevs/")({
  staticData: { title: "Journal Entry Vouchers" },
  component: JevListPage,
});
