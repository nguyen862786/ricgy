import { createFileRoute } from "@tanstack/react-router";
import { AccessoryHub } from "@/components/fashion/AccessoryHub";

export const Route = createFileRoute("/_authenticated/fashion/accessories")({
  component: AccessoryHub,
});
