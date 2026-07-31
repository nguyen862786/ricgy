import { createFileRoute } from "@tanstack/react-router";
import { GuestWelcome } from "@/components/hotel/GuestWelcome";

export const Route = createFileRoute("/_authenticated/hotel/stay")({
  component: GuestWelcome,
});