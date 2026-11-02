import { createFileRoute } from "@tanstack/react-router";
import { JevViewPage } from "@/features/jev/components/jev-view-page";

export const Route = createFileRoute("/_app/jevs/$jevId/")({
  staticData: { title: "Journal Entry Voucher" },
  component: JevViewPage,
});
