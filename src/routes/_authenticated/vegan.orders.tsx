import { createFileRoute } from "@tanstack/react-router";
import { VeganOrders } from "@/components/vegan/VeganOrders";

export const Route = createFileRoute("/_authenticated/vegan/orders")({
  component: VeganOrders,
});
