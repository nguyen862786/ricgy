import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vnd } from "@/lib/format";
import { currentMonth, type CharityMode } from "@/lib/vegan";
import { HeartHandshake, Banknote, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

export function VeganCharity() {
  const qc = useQueryClient();
  const month = currentMonth();

  const { data } = useQuery({
    queryKey: ["vegan-charity", month],
    queryFn: async () => {
      const [temples, orders, programs] = await Promise.all([
        supabase
          .from("vegan_temples")
          .select("id, name, region, status, commission_rate, charity_mode, charity_percent, charity_fixed")
          .eq("status", "signed")
          .order("name"),
        supabase
          .from("vegan_orders")
          .select("temple_id, subtotal, commission_amount, charity_amount, created_at")
          .in("status", ["completed", "delivered"]),
        supabase.from("vegan_charity_programs").select("*").eq("period_month", month),
      ]);
      return {
        temples: temples.data ?? [],
        orders: orders.data ?? [],
        programs: (programs.data ?? []) as any[],
      };
    },
  });

  const temples = data?.temples ?? [];
  const orders = data?.orders ?? [];
  const programs = data?.programs ?? [];

  const monthOrders = orders.filter((o) => (o.created_at ?? "").slice(0, 7) === month);

  const perTemple = temples.map((t) => {
    const tos = monthOrders.filter((o) => o.temple_id === t.id);
    const revenue = tos.reduce((s, o) => s + Number(o.subtotal), 0);
    const commission = tos.reduce((s, o) => s + Number(o.commission_amount), 0);
    const charity = tos.reduce((s, o) => s + Number(o.charity_amount), 0);
    const program = programs.find((p) => p.temple_id === t.id);
    return { temple: t, revenue, commission, charity, program };
  });

  const totalRev = perTemple.reduce((s, r) => s + r.revenue, 0);
  const totalCom = perTemple.reduce((s, r) => s + r.commission, 0);
  const totalCharity = perTemple.reduce((s, r) => s + r.charity, 0);
  const done = perTemple.filter((r) => r.program?.status === "done").length;

  // Dòng tiền 6 tháng gần nhất
  const trend = buildTrend(orders);

  async function toggleProgram(row: (typeof perTemple)[number]) {
    const newStatus = row.program?.status === "done" ? "pending" : "done";
    const budget =
      row.temple.charity_mode === "fixed" ? Number(row.temple.charity_fixed) : Math.round(row.charity);
    if (row.program) {
      const { error } = await supabase
        .from("vegan_charity_programs")
        .update({ status: newStatus, executed_at: newStatus === "done" ? new Date().toISOString() : null })
        .eq("id", row.program.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("vegan_charity_programs").insert({
        temple_id: row.temple.id,
        period_month: month,
        budget,
        status: newStatus,
        executed_at: newStatus === "done" ? new Date().toISOString() : null,
        note: "Chương trình Ăn chay miễn phí / tháng",
      });
      if (error) return toast.error(error.message);
    }
    toast.success(newStatus === "done" ? "Đã đánh dấu thực hiện" : "Đã đặt lại Chưa thực hiện");
    qc.invalidateQueries({ queryKey: ["vegan-charity", month] });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={TrendingUp} label="Doanh thu tháng này" value={vnd(totalRev)} />
        <Kpi icon={Banknote} label="Hoa hồng chi trả" value={vnd(totalCom)} />
        <Kpi icon={HeartHandshake} label="Quỹ từ thiện trích lập" value={vnd(totalCharity)} />
        <Kpi
          icon={CheckCircle2}
          label="Chương trình đã thực hiện"
          value={`${done}/${perTemple.length}`}
        />
      </div>

      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <TrendingUp className="h-4 w-4 text-accent" /> Dòng tiền 6 tháng (DT · Hoa hồng · Quỹ)
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trend} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: number) => vnd(v)}
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
            />
            <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="var(--accent)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="commission" name="Hoa hồng" stroke="var(--primary)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="charity" name="Quỹ từ thiện" stroke="var(--success)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div className="border-b p-4">
          <h3 className="font-semibold">Đối soát theo Chùa · tháng {month}</h3>
          <p className="text-sm text-muted-foreground">
            Chương trình “Ăn chay miễn phí / tháng” bắt buộc tại mỗi Chùa.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chùa</TableHead>
              <TableHead className="text-right">Doanh thu</TableHead>
              <TableHead className="text-right">Hoa hồng</TableHead>
              <TableHead>Cấu hình quỹ</TableHead>
              <TableHead className="text-right">Quỹ trích lập</TableHead>
              <TableHead>Chương trình</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perTemple.map((r) => {
              const isDone = r.program?.status === "done";
              return (
                <TableRow key={r.temple.id}>
                  <TableCell className="font-medium">{r.temple.name}</TableCell>
                  <TableCell className="text-right">{vnd(r.revenue)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{vnd(r.commission)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.temple.charity_mode === ("percent" as CharityMode)
                      ? `${r.temple.charity_percent}% DT`
                      : `${vnd(r.temple.charity_fixed)}/tháng`}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-success">
                    {vnd(r.charity)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isDone ? "default" : "secondary"}>
                      {isDone ? "Đã thực hiện" : "Chưa thực hiện"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={isDone ? "outline" : "default"}
                      onClick={() => toggleProgram(r)}
                    >
                      {isDone ? (
                        <>
                          <Circle className="mr-1.5 h-3.5 w-3.5" /> Đặt lại
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Đánh dấu xong
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {perTemple.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Chưa có Chùa đã ký kết
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function buildTrend(orders: any[]) {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  return months.map((m) => {
    const os = orders.filter((o) => (o.created_at ?? "").slice(0, 7) === m);
    return {
      month: m.slice(5) + "/" + m.slice(2, 4),
      revenue: os.reduce((s, o) => s + Number(o.subtotal), 0),
      commission: os.reduce((s, o) => s + Number(o.commission_amount), 0),
      charity: os.reduce((s, o) => s + Number(o.charity_amount), 0),
    };
  });
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-accent" /> {label}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
    </Card>
  );
}