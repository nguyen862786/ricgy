import { createFileRoute } from "@tanstack/react-router";
import { VeganTemples } from "@/components/vegan/VeganTemples";

export const Route = createFileRoute("/_authenticated/vegan/temples")({
  component: VeganTemples,
});