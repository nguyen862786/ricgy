import { createFileRoute } from "@tanstack/react-router";
import { VeganProducts } from "@/components/vegan/VeganProducts";

export const Route = createFileRoute("/_authenticated/vegan/products")({
  component: VeganProducts,
});