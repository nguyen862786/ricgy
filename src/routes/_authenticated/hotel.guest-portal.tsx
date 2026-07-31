import { createFileRoute } from "@tanstack/react-router";
import { GuestPortal } from "@/components/hotel/GuestPortal";

export const Route = createFileRoute("/_authenticated/hotel/guest-portal")({
  component: GuestPortal,
});
