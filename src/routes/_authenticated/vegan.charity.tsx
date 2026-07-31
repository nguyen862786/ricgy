import { createFileRoute } from "@tanstack/react-router";
import { VeganCharity } from "@/components/vegan/VeganCharity";

export const Route = createFileRoute("/_authenticated/vegan/charity")({
  component: VeganCharity,
});