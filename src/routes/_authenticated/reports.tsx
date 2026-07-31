import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBusinessReport } from "@/lib/reports.functions";
import { QiClubReconciliation } from "@/components/QiClubReconciliation";
import { SurveyLeadsPanel } from "@/components/SurveyLeadsPanel";
import { vnd, num } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp, ShoppingCart, Users, Download, Percent } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const STATUS_COLORS: Record<string, string> = {
  paid: "var(--chart-2)",
  pending: "var(--chart-1)",
  cancelled: "var(--destructive)",
  refunded: "var(--chart-3)",
};

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv =
    "\uFEFF" +
    [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const [days, setDays] = useState(30);
  const [view, setView] = useState<"overview" | "qiclub" | "survey">("overview");
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);
  const fetchReport = useServerFn(getBusinessReport);
  const { data, isLoading, error } = useQuery({
    queryKey: ["business-report", days],
    queryFn: () => fetchReport({ data: { days } }),
    enabled: hasSession === true && view === "overview",
  });

  const kpi = data?.kpi;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" /> Báo cáo & phân tích
        </h1>
        {view === "overview" && (
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <TabsList>
              <TabsTrigger value="7">7 ngày</TabsTrigger>
              <TabsTrigger value="30">30 ngày</TabsTrigger>
              <TabsTrigger value="90">90 ngày</TabsTrigger>
              <TabsTrigger value="365">1 năm</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as "overview" | "qiclub" | "survey")}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="qiclub">Đối soát Công nợ QiClub</TabsTrigger>
          <TabsTrigger value="survey">Khảo sát chẩn đoán</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "survey" ? (
        <SurveyLeadsPanel />
      ) : view === "qiclub" ? (
        <QiClubReconciliation />
      ) : (
        <>
          {isLoading && <div className="text-muted-foreground">Đang tải...</div>}

          {hasSession === false && (
            <Card className="p-4 text-sm text-muted-foreground">
              Bạn đang ở chế độ xem trước (không đăng nhập). Báo cáo cần đăng nhập thực để tải dữ
              liệu từ máy chủ.
            </Card>
          )}
          {error && (
            <Card className="p-4 text-sm text-destructive">
              Không tải được báo cáo: {(error as Error).message}
            </Card>
          )}

          {kpi && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-4 w-4" /> Doanh thu
                  </div>
                  <div className="text-xl font-bold mt-1">{vnd(kpi.revenue)}</div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShoppingCart className="h-4 w-4" /> Đơn (tổng)
                  </div>
                  <div className="text-xl font-bold mt-1">{num(kpi.ordersCount)}</div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShoppingCart className="h-4 w-4" /> Đơn đã TT
                  </div>
                  <div className="text-xl font-bold mt-1">{num(kpi.paidCount)}</div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Percent className="h-4 w-4" /> Tỉ lệ TT
                  </div>
                  <div className="text-xl font-bold mt-1">{kpi.conversionRate.toFixed(1)}%</div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-4 w-4" /> AOV
                  </div>
                  <div className="text-xl font-bold mt-1">{vnd(kpi.aov)}</div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Percent className="h-4 w-4" /> Giảm giá
                  </div>
                  <div className="text-xl font-bold mt-1 text-destructive">
                    {vnd(kpi.discountTotal)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-4 w-4" /> KH mới
                  </div>
                  <div className="text-xl font-bold mt-1">{num(kpi.newCustomers)}</div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="p-4 lg:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Doanh thu & đơn hàng theo ngày</div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadCSV(`revenue-${days}d.csv`, data!.timeseries)}
                    >
                      <Download className="h-3 w-3 mr-1" /> CSV
                    </Button>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data!.timeseries}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) =>
                            v >= 1_000_000
                              ? `${(v / 1_000_000).toFixed(1)}M`
                              : v >= 1000
                                ? `${(v / 1000).toFixed(0)}k`
                                : v
                          }
                        />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                        <Tooltip
                          formatter={(
                            v: number | string | readonly (string | number)[],
                            n: string | number,
                          ) => (n === "revenue" ? vnd(Number(v)) : num(Number(v)))}
                        />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="var(--chart-1)"
                          name="Doanh thu"
                          strokeWidth={2.5}
                          dot={false}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="orders"
                          stroke="var(--chart-2)"
                          name="Đơn"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="paid"
                          stroke="var(--chart-3)"
                          name="Đơn TT"
                          strokeWidth={2}
                          strokeDasharray="4 2"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="font-semibold mb-3">Trạng thái đơn</div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data!.statusBreakdown}
                          dataKey="count"
                          nameKey="status"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={3}
                          cornerRadius={6}
                          label={(e) => `${e.status}: ${e.count}`}
                        >
                          {data!.statusBreakdown.map((s, i) => (
                            <Cell
                              key={i}
                              fill={STATUS_COLORS[s.status] || "var(--muted-foreground)"}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">Khách hàng mới theo ngày</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCSV(`signups-${days}d.csv`, data!.signups)}
                  >
                    <Download className="h-3 w-3 mr-1" /> CSV
                  </Button>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data!.signups}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="var(--chart-2)"
                        name="KH mới"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="font-semibold">Top sản phẩm bán chạy</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCSV(`top-products-${days}d.csv`, data!.topProducts)}
                  >
                    <Download className="h-3 w-3 mr-1" /> CSV
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                      <TableHead className="text-right">% DT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.topProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Chưa có dữ liệu
                        </TableCell>
                      </TableRow>
                    )}
                    {data!.topProducts.map((p, i) => {
                      const share = kpi.revenue ? (p.revenue / kpi.revenue) * 100 : 0;
                      return (
                        <TableRow key={p.product_id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                #{i + 1}
                              </Badge>
                              <span className="font-medium">{p.product_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{num(p.qty)}</TableCell>
                          <TableCell className="text-right font-medium">{vnd(p.revenue)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {share.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
