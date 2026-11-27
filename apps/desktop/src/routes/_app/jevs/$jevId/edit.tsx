import { createFileRoute } from "@tanstack/react-router";
import { JevEditPage } from "@/features/jev/components/jev-edit-page";

export const Route = createFileRoute("/_app/jevs/$jevId/edit")({
  staticData: { title: "Edit Journal Entry Voucher" },
  component: JevEditPage,
});
