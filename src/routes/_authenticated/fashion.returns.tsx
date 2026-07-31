import { createFileRoute } from "@tanstack/react-router";
import { ReturnManager } from "@/components/fashion/ReturnManager";

export const Route = createFileRoute("/_authenticated/fashion/returns")({
  component: ReturnManager,
});
