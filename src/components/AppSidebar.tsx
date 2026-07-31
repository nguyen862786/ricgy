import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Banknote,
  Users,
  Settings,
  LogOut,
  Tag,
  UserCircle,
  Crown,
  Megaphone,
  Share2,
  BarChart3,
  ClipboardList,
  Store,
  Monitor,
  Clock,
  Boxes,
  CreditCard,
  BedDouble,
  Tablet,
  MessageSquare,
  Grid3x3,
  Wand2,
  RefreshCcw,
  Gem,
  Sprout,
  Building2,
  HeartHandshake,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useTenantModules } from "@/hooks/useTenantModules";
import { ACCESS_GROUP_LABEL } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

// Hiển thị menu được điều khiển hoàn toàn bởi ROUTE_ACCESS trong src/lib/rbac.ts
// — chỉ cần khai báo item ở đây, quyền xem sẽ tự động khớp theo nhóm tài khoản.

const mainItems: SidebarItem[] = [
  { title: "Tổng quan", url: "/dashboard", icon: LayoutDashboard },
  { title: "Sản phẩm", url: "/products", icon: Package },
  { title: "Chiến dịch & Voucher", url: "/promos", icon: Tag },
  { title: "Đơn hàng", url: "/orders", icon: ShoppingCart },
];

const opsItems: SidebarItem[] = [
  { title: "POS bán quầy", url: "/pos", icon: Monitor },
  { title: "Chốt ca", url: "/shifts", icon: Clock },
  { title: "Kho vận", url: "/inventory", icon: Boxes },
];

const walletItems: SidebarItem[] = [
  { title: "Ví của tôi", url: "/wallet", icon: Wallet },
  { title: "Affiliate / Đại lý", url: "/affiliate", icon: Share2 },
  { title: "Duyệt rút tiền", url: "/withdrawals", icon: Banknote },
];

const adminItems: SidebarItem[] = [
  { title: "Báo cáo", url: "/reports", icon: BarChart3 },
  { title: "Thống kê khảo sát", url: "/survey-stats", icon: ClipboardList },
  { title: "Marketing", url: "/marketing", icon: Megaphone },
  { title: "Cửa hàng", url: "/stores", icon: Store },
  { title: "Khách hàng", url: "/customers", icon: UserCircle },
  { title: "Hạng khách hàng", url: "/tiers", icon: Crown },
  { title: "Người dùng", url: "/users", icon: Users },
  { title: "Cấu hình", url: "/settings", icon: Settings },
];

const fashionItems: SidebarItem[] = [
  { title: "Ma trận sản phẩm", url: "/fashion",             icon: Grid3x3 },
  { title: "Phòng thử AI",     url: "/fashion/ai-fitting",  icon: Wand2 },
  { title: "Đổi trả hàng",    url: "/fashion/returns",     icon: RefreshCcw },
  { title: "Phụ kiện",        url: "/fashion/accessories", icon: Gem },
];

const billingItems: SidebarItem[] = [
  { title: "Gói dịch vụ & Billing", url: "/billing", icon: CreditCard },
  { title: "Doanh nghiệp & Module", url: "/super-admin/modules", icon: Boxes },
];

export function AppSidebar() {
  const { user, group, canAccess, signOut } = useAuth();
  const { canAccessModule } = useTenantModules();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const displayName = (
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "Người dùng"
  ).toString();
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const renderGroup = (label: string, items: SidebarItem[]) => {
    const visible = items.filter((i) => canAccess(i.url) && canAccessModule(i.url));
    if (visible.length === 0) return null;
    return (
      <SidebarGroup key={label}>
        <SidebarGroupLabel className="text-[0.65rem] font-semibold uppercase tracking-widest text-accent/80">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1.5">
            {visible.map((item) => {
              const active = pathname === item.url || pathname.startsWith(item.url + "/");
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className={cn(
                      "rounded-full px-3 py-5 font-medium text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      active &&
                        "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/20 hover:bg-sidebar-primary hover:text-sidebar-primary-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground",
                    )}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className="p-2">
      <SidebarHeader className="pb-4">
        <div className="flex flex-col items-center gap-2 px-2 py-3 text-center group-data-[collapsible=icon]:px-0">
          <div className="rounded-full p-[3px] ring-2 ring-accent">
            <Avatar className="h-16 w-16 border-2 border-sidebar group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
              <AvatarFallback className="bg-sidebar-accent text-base font-bold text-accent">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold uppercase tracking-wide text-sidebar-foreground">
              {displayName}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/50">{user?.email}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Kinh doanh", mainItems)}
        {renderGroup("Vận hành", opsItems)}
        {renderGroup("Thời trang", fashionItems)}
        {renderGroup("Tài chính", walletItems)}
        {renderGroup("Quản trị", adminItems)}
        {renderGroup("Super Admin", billingItems)}
      </SidebarContent>
      <SidebarFooter>
        <div className="space-y-3 px-2 group-data-[collapsible=icon]:hidden">
          <div>
            <div className="mb-2 text-[0.65rem] font-semibold uppercase tracking-widest text-accent/80">
              Đang online
            </div>
            <div className="flex items-center">
              {ONLINE_TEAM.map((t, i) => (
                <Avatar
                  key={t}
                  className="h-7 w-7 border-2 border-sidebar"
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                >
                  <AvatarFallback className="bg-sidebar-accent text-[0.6rem] font-semibold text-accent">
                    {t}
                  </AvatarFallback>
                </Avatar>
              ))}
              <span
                className="grid h-7 place-items-center rounded-full bg-accent px-2 text-[0.65rem] font-bold text-accent-foreground"
                style={{ marginLeft: -8 }}
              >
                +70
              </span>
            </div>
          </div>
          <NetworkMap />
        </div>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
            <div className="truncate text-xs font-medium text-sidebar-foreground/80">
              {ACCESS_GROUP_LABEL[group]}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title="Đăng xuất"
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

const ONLINE_TEAM = ["AN", "BT", "CH", "DM"];

function NetworkMap() {
  return (
    <svg viewBox="0 0 200 90" className="w-full" aria-hidden>
      {Array.from({ length: 7 }).map((_, r) =>
        Array.from({ length: 16 }).map((_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={8 + c * 12}
            cy={12 + r * 11}
            r={1.1}
            fill="rgba(255,255,255,0.18)"
          />
        )),
      )}
      <path
        d="M20 70 Q60 10 100 50 T180 30"
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.5}
        strokeDasharray="3 3"
        opacity={0.85}
      />
      <circle cx={20} cy={70} r={3} fill="var(--accent)" />
      <circle cx={100} cy={50} r={3} fill="var(--accent)" />
      <circle cx={180} cy={30} r={3} fill="var(--accent)" />
    </svg>
  );
}
