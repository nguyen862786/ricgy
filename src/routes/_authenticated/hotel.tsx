import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { BookingEngine } from "@/components/hotel/BookingEngine";
import { cn } from "@/lib/utils";
import { BedDouble, Tablet, MessageSquare, ClipboardCheck, Leaf, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hotel")({
  component: HotelLayout,
});

const HOTEL_TABS = [
  { label: "Đặt phòng",    to: "/hotel",               icon: BedDouble },
  { label: "Vận hành",     to: "/hotel/operations",    icon: ClipboardCheck },
  { label: "Trải nghiệm khách", to: "/hotel/stay",     icon: Leaf },
  { label: "Theo dõi yêu cầu", to: "/hotel/requests",  icon: ListChecks },
  { label: "Cổng khách",   to: "/hotel/guest-portal",  icon: Tablet },
  { label: "Chat đa kênh", to: "/hotel/chat",          icon: MessageSquare },
] as const;

function HotelLayout() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const isIndex = pathname === "/hotel";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Khách sạn &amp; Farmstay</h1>
        <p className="text-muted-foreground">Oasis Garden PMS — Quản lý đặt phòng, IoT &amp; chat đa kênh</p>
      </div>

      {/* Tab navigation shared across all hotel sub-pages */}
      <div className="flex gap-1 rounded-xl border bg-muted/40 p-1">
        {HOTEL_TABS.map(tab => {
          const Icon = tab.icon;
          const active = pathname === tab.to || (tab.to !== "/hotel" && pathname.startsWith(tab.to));
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* At /hotel index → show BookingEngine; at sub-routes → render child via Outlet */}
      {isIndex ? <BookingEngine /> : <Outlet />}
    </div>
  );
}
