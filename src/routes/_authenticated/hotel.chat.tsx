import { createFileRoute } from "@tanstack/react-router";
import { HotelChatConsole } from "@/components/hotel/HotelChatConsole";

export const Route = createFileRoute("/_authenticated/hotel/chat")({
  component: HotelChatConsole,
});
