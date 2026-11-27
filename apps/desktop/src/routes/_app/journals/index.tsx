import { createFileRoute } from "@tanstack/react-router";
import { JournalsPage } from "@/features/journals/components/journals-page";

export const Route = createFileRoute("/_app/journals/")({
  staticData: { title: "Journals" },
  component: JournalsPage,
});
