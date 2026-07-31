import { createFileRoute } from "@tanstack/react-router";
import { VeganPos } from "@/components/vegan/VeganPos";

export const Route = createFileRoute("/_authenticated/vegan/pos")({
  component: VeganPos,
});