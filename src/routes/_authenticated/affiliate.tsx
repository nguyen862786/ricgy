import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
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
import { vnd, dt } from "@/lib/format";
import { getMyAffiliateStats } from "@/lib/marketing.functions";
import {
  Share2,
  Copy,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  MousePointerClick,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/affiliate")({
  component: AffiliatePage,
});

function AffiliatePage() {
  const { user } = useAuth();
  const fetchStats = useServerFn(getMyAffiliateStats);

  const { data, isLoading } = useQuery({
    queryKey: ["my-affiliate"],
    queryFn: () => fetchStats(),
  });

  const referralLink =
    typeof window !== "undefined" && user ? `${window.location.origin}/?ref=${user.id}` : "";

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    toast.success("Đã sao chép link giới thiệu");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Share2 className="h-6 w-6" /> Affiliate / Đại lý
      </h1>

      <Card className="p-4">
        <div className="text-sm text-muted-foreground mb-2">Link giới thiệu của bạn</div>
        <div className="flex gap-2">
          <code className="flex-1 px-3 py-2 bg-muted rounded text-sm break-all">
            {referralLink}
          </code>
          <Button onClick={copyLink}>
            <Copy className="mr-2 h-4 w-4" /> Sao chép
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Chia sẻ link này. Khi khách đặt đơn qua link, bạn sẽ được tính hoa hồng (theo cấu hình
          từng sản phẩm).
        </p>
      </Card>

      {isLoading && <div className="text-muted-foreground">Đang tải...</div>}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MousePointerClick className="h-4 w-4" /> Clicks
              </div>
              <div className="text-2xl font-bold mt-1">{data.clicksCount}</div>
              <div className="text-xs text-muted-foreground mt-1">{data.clicks7d} trong 7 ngày</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserPlus className="h-4 w-4" /> Đăng ký
              </div>
              <div className="text-2xl font-bold mt-1">{data.referredSignups}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShoppingBag className="h-4 w-4" /> Tổng đơn
              </div>
              <div className="text-2xl font-bold mt-1">{data.ordersCount}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" /> Đơn đã TT
              </div>
              <div className="text-2xl font-bold mt-1">{data.paidCount}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" /> Doanh thu
              </div>
              <div className="text-xl font-bold mt-1">{vnd(data.totalRevenue)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" /> Hoa hồng
              </div>
              <div className="text-xl font-bold mt-1 text-primary">{vnd(data.totalCommission)}</div>
            </Card>
          </div>

          <Card>
            <div className="p-4 border-b font-semibold">Click gần đây</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trang đích</TableHead>
                  <TableHead>Nguồn (referer)</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentClicks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Chưa có click nào
                    </TableCell>
                  </TableRow>
                )}
                {data.recentClicks.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.landing_path || "/"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-xs">
                      {c.referer || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dt(c.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <div className="p-4 border-b font-semibold">Đơn gần đây từ link giới thiệu</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead className="text-right">Giá trị</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Chưa có đơn nào
                    </TableCell>
                  </TableRow>
                )}
                {data.recentOrders.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">{o.code}</TableCell>
                    <TableCell className="text-right font-medium">{vnd(o.total || 0)}</TableCell>
                    <TableCell>
                      <Badge variant={o.status === "paid" ? "default" : "secondary"}>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dt(o.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
