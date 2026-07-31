import { createFileRoute } from "@tanstack/react-router";
import { ServiceTimeline } from "@/components/hotel/ServiceTimeline";

export const Route = createFileRoute("/_authenticated/hotel/requests")({
  component: ServiceTimeline,
});