import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vnd, dt, num } from "@/lib/format";
import { getCustomer360 } from "@/lib/customers.functions";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Wallet,
  Award,
  ShoppingBag,
  Users,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  component: Customer360,
});

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  pending: { label: "Chờ TT", variant: "secondary" },
  paid: { label: "Đã TT", variant: "default" },
  cancelled: { label: "Đã huỷ", variant: "destructive" },
  refunded: { label: "Hoàn tiền", variant: "outline" },
};

function Customer360() {
  const { isStaff } = useAuth();
  const { id } = Route.useParams();
  const fetchData = useServerFn(getCustomer360);

  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-360", id],
    queryFn: () => fetchData({ data: { customerId: id } }),
  });

  const tierInfo = useMemo(() => {
    if (!data) return null;
    const key = (data.profile.tier || "standard").toLowerCase();
    return data.tiers.find((t: any) => t.name.toLowerCase() === key);
  }, [data]);

  const nextTier = useMemo(() => {
    if (!data) return null;
    const spent = Number(data.profile.total_spent || 0);
    const above = data.tiers.filter((t: any) => Number(t.min_spent) > spent);
    return above.length > 0 ? above[0] : null;
  }, [data]);

  if (!isStaff) return <div className="text-muted-foreground">Không có quyền.</div>;
  if (isLoading) return <div className="text-muted-foreground p-8">Đang tải...</div>;
  if (error) return <div className="text-destructive p-8">Lỗi: {(error as Error).message}</div>;
  if (!data) return null;

  const { profile, wallet, orders, transactions, referrals, stats } = data;
  const progress = nextTier
    ? Math.min(100, (Number(profile.total_spent || 0) / Number(nextTier.min_spent)) * 100)
    : 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/customers">
            <ArrowLeft className="h-4 w-4 mr-1" /> Khách hàng
          </Link>
        </Button>
      </div>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {(profile.full_name || profile.email || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.full_name || "—"}</h1>
              <div className="text-sm text-muted-foreground space-y-1 mt-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> {profile.email || "—"}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {profile.phone || "—"}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" /> Tham gia {dt(profile.created_at)}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge
              style={tierInfo ? { background: tierInfo.color, color: "white" } : undefined}
              className="text-base px-3 py-1"
            >
              <Award className="h-4 w-4 mr-1" /> {profile.tier || "standard"}
            </Badge>
            {tierInfo && (
              <div className="text-xs text-muted-foreground mt-1">
                Giảm giá -{tierInfo.discount_percent}%
              </div>
            )}
          </div>
        </div>

        {(profile.tags?.length > 0 || profile.marketing_notes) && (
          <div className="mt-4 pt-4 border-t space-y-2">
            {profile.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {profile.tags.map((t: string) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
            {profile.marketing_notes && (
              <div className="text-sm text-muted-foreground italic">{profile.marketing_notes}</div>
            )}
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> Tổng chi
          </div>
          <div className="text-xl font-bold mt-1">{vnd(profile.total_spent)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag className="h-4 w-4" /> Đơn hàng
          </div>
          <div className="text-xl font-bold mt-1">
            {stats.paidOrders}
            <span className="text-sm text-muted-foreground">/{stats.totalOrders}</span>
          </div>
          <div className="text-xs text-muted-foreground">TB {vnd(stats.avgOrder)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" /> Số dư ví
          </div>
          <div className="text-xl font-bold mt-1">{vnd(wallet?.balance || 0)}</div>
          <div className="text-xs text-muted-foreground">
            {num(wallet?.reward_points || 0)} điểm thưởng
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> Giới thiệu
          </div>
          <div className="text-xl font-bold mt-1">{referrals.length}</div>
          <div className="text-xs text-muted-foreground">khách đã mời</div>
        </Card>
      </div>

      {/* Tier progress */}
      {nextTier && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>
              Tiến độ lên hạng <strong>{nextTier.name}</strong>
            </span>
            <span className="text-muted-foreground">
              {vnd(profile.total_spent)} / {vnd(nextTier.min_spent)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Cần thêm{" "}
            <strong className="text-foreground">
              {vnd(Number(nextTier.min_spent) - Number(profile.total_spent || 0))}
            </strong>{" "}
            để đạt hạng {nextTier.name}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Đơn hàng ({orders.length})</TabsTrigger>
          <TabsTrigger value="transactions">Giao dịch ví ({transactions.length})</TabsTrigger>
          <TabsTrigger value="referrals">Đã giới thiệu ({referrals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Tổng</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Chưa có đơn hàng
                    </TableCell>
                  </TableRow>
                )}
                {orders.map((o: any) => {
                  const st = STATUS_LABEL[o.status] ?? { label: o.status, variant: "secondary" };
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.code}</TableCell>
                      <TableCell className="text-sm">
                        {o.items.slice(0, 2).map((it: any) => (
                          <div key={it.id}>
                            {it.product_name}{" "}
                            <span className="text-muted-foreground">×{it.qty}</span>
                          </div>
                        ))}
                        {o.items.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{o.items.length - 2} sản phẩm
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{vnd(o.total)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {dt(o.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Chưa có giao dịch
                    </TableCell>
                  </TableRow>
                )}
                {transactions.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge variant="outline">{t.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{t.note || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.status}</Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${Number(t.amount) >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {Number(t.amount) >= 0 ? "+" : ""}
                      {vnd(t.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {dt(t.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Đã chi</TableHead>
                  <TableHead>Tham gia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Chưa giới thiệu ai
                    </TableCell>
                  </TableRow>
                )}
                {referrals.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link
                        to="/customers/$id"
                        params={{ id: r.id }}
                        className="font-medium hover:underline"
                      >
                        {r.full_name || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell className="text-right">{vnd(r.total_spent)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {dt(r.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
