import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Grid3x3, Wand2, RefreshCcw, Gem } from "lucide-react";
import { ProductMatrix } from "@/components/fashion/ProductMatrix";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/fashion")({
  component: FashionLayout,
});

const FASHION_TABS = [
  { label: "Ma trận sản phẩm", to: "/fashion",             icon: Grid3x3 },
  { label: "Phòng thử AI",     to: "/fashion/ai-fitting",  icon: Wand2 },
  { label: "Đổi trả hàng",    to: "/fashion/returns",     icon: RefreshCcw },
  { label: "Phụ kiện",        to: "/fashion/accessories", icon: Gem },
] as const;

function FashionLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/fashion";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Thời trang & Phụ kiện
        </h1>
        <p className="text-muted-foreground">Boutique Élite Fashion POS</p>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl border bg-muted/40 p-1">
        {FASHION_TABS.map((tab) => {
          const active =
            tab.to === "/fashion"
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

      {isIndex ? <ProductMatrix /> : <Outlet />}
    </div>
  );
}
