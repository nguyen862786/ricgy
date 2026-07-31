import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { vnd, num } from "@/lib/format";
import { COVERAGE_TARGET, currentMonth, daysUntil, expiryLevel } from "@/lib/vegan";
import {
  Building2,
  Banknote,
  HeartHandshake,
  Package,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function VeganDashboard() {
  const { data } = useQuery({
    queryKey: ["vegan-dashboard"],
    queryFn: async () => {
      const [temples, products, orders, stock, charity] = await Promise.all([
        supabase.from("vegan_temples").select("id, name, region, status"),
        supabase.from("vegan_products").select("id").eq("active", true),
        supabase
          .from("vegan_orders")
          .select("subtotal, commission_amount, charity_amount, temple_id, created_at")
          .in("status", ["completed", "delivered"]),
        supabase
          .from("vegan_temple_stock")
          .select(
            "quantity, temple_id, vegan_products(name), vegan_batches(batch_number, exp_date), vegan_temples(name)",
          )
          .gt("quantity", 0),
        supabase
          .from("vegan_charity_programs")
          .select("status, budget")
          .eq("period_month", currentMonth()),
      ]);
      return {
        temples: temples.data ?? [],
        products: products.data ?? [],
        orders: orders.data ?? [],
        stock: (stock.data ?? []) as any[],
        charity: charity.data ?? [],
      };
    },
  });

  const temples = data?.temples ?? [];
  const orders = data?.orders ?? [];
  const stock = data?.stock ?? [];
  const charity = data?.charity ?? [];

  const signed = temples.filter((t) => t.status === "signed").length;
  const revenue = orders.reduce((s, o) => s + Number(o.subtotal), 0);
  const commission = orders.reduce((s, o) => s + Number(o.commission_amount), 0);
  const charityAccrued = orders.reduce((s, o) => s + Number(o.charity_amount), 0);
  const charityDone = charity.filter((c) => c.status === "done").length;

  // Doanh thu theo Chùa
  const byTemple = new Map<string, number>();
  orders.forEach((o) => {
    if (!o.temple_id) return;
    byTemple.set(o.temple_id, (byTemple.get(o.temple_id) ?? 0) + Number(o.subtotal));
  });
  const revChart = temples
    .filter((t) => byTemple.has(t.id))
    .map((t) => ({ name: t.name.replace("Chùa ", ""), value: byTemple.get(t.id) ?? 0 }))
    .sort((a, b) => b.value - a.value);

  // Cảnh báo hạn sử dụng
  const expiring = stock
    .filter((s) => {
      const lvl = expiryLevel(s.vegan_batches?.exp_date);
      return lvl === "soon" || lvl === "expired";
    })
    .sort((a, b) => daysUntil(a.vegan_batches?.exp_date) - daysUntil(b.vegan_batches?.exp_date));

  return (
    <div className="space-y-5">
      {/* KPI bento */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Building2}
          label="Chùa đã ký kết"
          value={`${signed}/${COVERAGE_TARGET}`}
          sub={`${temples.length - signed} đang thương thảo`}
        />
        <Kpi icon={TrendingUp} label="Doanh thu (đã chốt)" value={vnd(revenue)} sub={`${orders.length} đơn`} />
        <Kpi icon={Banknote} label="Hoa hồng kết nối" value={vnd(commission)} sub="Trả cho Sư kết nối" />
        <Kpi
          icon={HeartHandshake}
          label="Quỹ từ thiện trích lập"
          value={vnd(charityAccrued)}
          sub={`${charityDone}/${charity.length} chương trình đã thực hiện`}
        />
      </div>

      {/* Coverage */}
      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Tiến độ phủ sóng 500 Chùa</h3>
          <span className="text-sm text-muted-foreground">
            {signed} / {COVERAGE_TARGET} ({((signed / COVERAGE_TARGET) * 100).toFixed(1)}%)
          </span>
        </div>
        <Progress value={(signed / COVERAGE_TARGET) * 100} className="h-3" />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by temple */}
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <TrendingUp className="h-4 w-4 text-accent" /> Doanh thu theo Chùa
          </h3>
          {revChart.length === 0 ? (
            <Empty text="Chưa có đơn hàng" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => vnd(v)}
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {revChart.map((_, i) => (
                    <Cell key={i} fill="var(--accent)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Expiry warnings */}
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-warning" /> Cảnh báo hạn sử dụng (HSD)
          </h3>
          {expiring.length === 0 ? (
            <Empty text="Không có lô hàng sắp hết hạn" />
          ) : (
            <div className="space-y-2">
              {expiring.slice(0, 8).map((s, i) => {
                const d = daysUntil(s.vegan_batches?.exp_date);
                const expired = d < 0;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{s.vegan_products?.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {s.vegan_temples?.name} · Lô {s.vegan_batches?.batch_number} · SL{" "}
                        {num(s.quantity)}
                      </div>
                    </div>
                    <Badge variant={expired ? "destructive" : "secondary"}>
                      {expired ? "Đã hết hạn" : `Còn ${d} ngày`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Package className="h-3.5 w-3.5" />
        {data?.products.length ?? 0} SKU đang kinh doanh · Luồng: Xưởng → Kho vệ tinh (Chùa) → Người
        tiêu dùng.
      </p>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-accent" /> {label}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid h-[200px] place-items-center text-sm text-muted-foreground">{text}</div>
  );
}