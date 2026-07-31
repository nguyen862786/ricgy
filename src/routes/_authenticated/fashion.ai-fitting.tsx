import { createFileRoute } from "@tanstack/react-router";
import { AiFittingRoom } from "@/components/fashion/AiFittingRoom";

export const Route = createFileRoute("/_authenticated/fashion/ai-fitting")({
  component: AiFittingRoom,
});
