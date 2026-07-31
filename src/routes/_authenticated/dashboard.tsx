import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { vnd, num } from "@/lib/format";
import { Wallet, ShoppingCart, Package, Users, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { isStaff, user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", isStaff, user?.id],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const ordersQ = supabase
        .from("orders")
        .select("id, total, status, created_at, paid_at")
        .gte("created_at", since);
      const topItemsQ = isStaff
        ? supabase
            .from("order_items")
            .select("product_id, product_name, qty, line_total, orders!inner(status, paid_at)")
            .eq("orders.status", "paid")
            .gte("orders.paid_at", since)
            .limit(500)
        : Promise.resolve({ data: [] as any[] });
      const [
        { data: orders },
        { data: products },
        { data: wallet },
        { data: profiles },
        { data: topItems },
      ] = await Promise.all([
        ordersQ,
        supabase.from("products").select("id", { count: "exact", head: false }),
        supabase
          .from("wallets")
          .select("balance, reward_points")
          .eq("user_id", user!.id)
          .maybeSingle(),
        isStaff
          ? supabase.from("profiles").select("id", { count: "exact", head: true })
          : Promise.resolve({ data: null }),
        topItemsQ,
      ]);

      const paid = (orders ?? []).filter((o) => o.status === "paid");
      const revenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);

      // group by day for last 14 days
      const days: { date: string; revenue: number; orders: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        const dayOrders = paid.filter((o) => (o.paid_at ?? o.created_at).slice(0, 10) === key);
        days.push({
          date: label,
          revenue: dayOrders.reduce((s, o) => s + Number(o.total || 0), 0),
          orders: dayOrders.length,
        });
      }

      // top products
      const productAgg = new Map<string, { name: string; qty: number; revenue: number }>();
      for (const it of (topItems as any[]) ?? []) {
        const cur = productAgg.get(it.product_id) ?? { name: it.product_name, qty: 0, revenue: 0 };
        cur.qty += Number(it.qty || 0);
        cur.revenue += Number(it.line_total || 0);
        productAgg.set(it.product_id, cur);
      }
      const topProducts = Array.from(productAgg.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        revenue,
        orderCount: paid.length,
        pendingCount: (orders ?? []).filter((o) => o.status === "pending").length,
        productCount: products?.length ?? 0,
        walletBalance: Number(wallet?.balance || 0),
        rewardPoints: Number(wallet?.reward_points || 0),
        userCount: (profiles as any)?.count ?? 0,
        days,
        topProducts,
      };
    },
  });

  const kpis = [
    {
      label: "Doanh thu 30 ngày",
      value: vnd(stats?.revenue ?? 0),
      icon: TrendingUp,
      tone: "accent" as const,
    },
    {
      label: "Đơn hoàn tất",
      value: num(stats?.orderCount ?? 0),
      icon: ShoppingCart,
      tone: "moss" as const,
    },
    {
      label: "Đơn chờ xử lý",
      value: num(stats?.pendingCount ?? 0),
      icon: Package,
      tone: "map" as const,
    },
    isStaff
      ? {
          label: "Người dùng",
          value: num(stats?.userCount ?? 0),
          icon: Users,
          tone: "light" as const,
        }
      : {
          label: "Số dư ví",
          value: vnd(stats?.walletBalance ?? 0),
          icon: Wallet,
          tone: "light" as const,
        },
  ];

  const donutData = [
    { name: "Hoàn tất", value: stats?.orderCount ?? 0, fill: "var(--chart-2)" },
    { name: "Chờ xử lý", value: stats?.pendingCount ?? 0, fill: "var(--chart-1)" },
  ];
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">Số liệu 30 ngày gần đây</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <StatBlock key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Doanh thu 14 ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats?.days ?? []}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" vertical={false} />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    v >= 1e6
                      ? `${(v / 1e6).toFixed(1)}M`
                      : v >= 1e3
                        ? `${(v / 1e3).toFixed(0)}K`
                        : v
                  }
                />
                <Tooltip
                  formatter={(v: number) => vnd(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                  labelStyle={{ color: "var(--primary-foreground)" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  fill="url(#revFill)"
                  dot={false}
                  activeDot={{ r: 5, fill: "var(--chart-1)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tỷ lệ đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    cornerRadius={8}
                    stroke="none"
                  >
                    {donutData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      background: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{num(donutTotal)}</span>
                <span className="text-xs text-muted-foreground">tổng đơn</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Số đơn theo ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats?.days ?? []} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" vertical={false} />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              />
              <Bar dataKey="orders" radius={[6, 6, 0, 0]} barSize={10}>
                {(stats?.days ?? []).map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? "var(--chart-1)" : "var(--chart-2)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {isStaff && (stats?.topProducts?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top sản phẩm bán chạy (30 ngày)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats!.topProducts.map((p, i) => {
                const max = stats!.topProducts[0].revenue || 1;
                const pct = (p.revenue / max) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {i + 1}. {p.name}
                      </span>
                      <span className="text-muted-foreground">
                        {num(p.qty)} SP ·{" "}
                        <span className="font-semibold text-foreground">{vnd(p.revenue)}</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type Tone = "accent" | "moss" | "map" | "light";

function StatBlock({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: Tone;
}) {
  const toneClass: Record<Tone, string> = {
    accent: "bg-accent text-accent-foreground",
    moss: "bg-primary text-primary-foreground",
    map: "bg-secondary text-secondary-foreground",
    light: "bg-card text-card-foreground",
  };
  return (
    <div className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm ${toneClass[tone]}`}>
      {tone === "map" && (
        <svg
          viewBox="0 0 120 60"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
          aria-hidden
        >
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 12 }).map((_, c) => (
              <circle
                key={`${r}-${c}`}
                cx={6 + c * 10}
                cy={8 + r * 9}
                r={1}
                fill="var(--primary)"
                opacity={0.35}
              />
            )),
          )}
          <path
            d="M14 44 Q44 8 70 30 T112 18"
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.2}
            strokeDasharray="3 2"
          />
        </svg>
      )}
      <div className="relative flex items-start justify-between">
        <span className="text-xs font-medium opacity-80">{label}</span>
        <Icon className="h-5 w-5 opacity-80" />
      </div>
      <div className="relative mt-3 text-2xl font-bold">{value}</div>
    </div>
  );
}
