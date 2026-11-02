import { createFileRoute } from "@tanstack/react-router";
import { JevCreatePage } from "@/features/jev/components/jev-create-page";

export const Route = createFileRoute("/_app/jevs/new")({
  staticData: { title: "New Journal Entry Voucher" },
  component: JevCreatePage,
});
