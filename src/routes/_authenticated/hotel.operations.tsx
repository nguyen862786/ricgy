import { createFileRoute } from "@tanstack/react-router";
import { StaffOperations } from "@/components/hotel/StaffOperations";

export const Route = createFileRoute("/_authenticated/hotel/operations")({
  component: StaffOperations,
});