import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Sprout, Package, Building2, Monitor, HeartHandshake, ListChecks } from "lucide-react";
import { VeganDashboard } from "@/components/vegan/VeganDashboard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/vegan")({
  component: VeganLayout,
});

const TABS = [
  { label: "Tổng quan chuỗi", to: "/vegan", icon: Sprout },
  { label: "Sản phẩm & Lô", to: "/vegan/products", icon: Package },
  { label: "Chùa & Logistics", to: "/vegan/temples", icon: Building2 },
  { label: "POS bán lẻ", to: "/vegan/pos", icon: Monitor },
  { label: "Đơn & Trạng thái", to: "/vegan/orders", icon: ListChecks },
  { label: "Quỹ & Đối soát", to: "/vegan/charity", icon: HeartHandshake },
] as const;

function VeganLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/vegan";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chuỗi cung ứng & Bán hàng Thực phẩm Chay</h1>
        <p className="text-muted-foreground">
          Xưởng sản xuất → Kho vệ tinh (Chùa) → Người tiêu dùng
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border bg-muted/40 p-1">
        {TABS.map((tab) => {
          const active =
            tab.to === "/vegan"
              ? isIndex
              : pathname === tab.to || pathname.startsWith(tab.to + "/");
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {isIndex ? <VeganDashboard /> : <Outlet />}
    </div>
  );
}