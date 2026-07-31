import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vnd, dt } from "@/lib/format";
import {
  ORDER_FLOW,
  ORDER_STATUS_LABEL,
  flowIndex,
  nextStatus,
  normalizeStatus,
  estimateDeliveryAt,
  type OrderStatus,
} from "@/lib/vegan";
import { cn } from "@/lib/utils";
import {
  Package,
  CheckCircle2,
  Circle,
  Truck,
  ChefHat,
  ClipboardCheck,
  PackageCheck,
  XCircle,
  Clock,
  History,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const STEP_ICON: Record<string, typeof Circle> = {
  placed: ClipboardCheck,
  confirmed: CheckCircle2,
  preparing: ChefHat,
  delivering: Truck,
  delivered: PackageCheck,
};

function statusTone(s: string): "ok" | "active" | "cancelled" {
  if (normalizeStatus(s) === "cancelled") return "cancelled";
  if (flowIndex(s) >= ORDER_FLOW.length - 1) return "ok";
  return "active";
}

export function VeganOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["vegan-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vegan_orders")
        .select(
          "id, code, channel, customer_name, customer_phone, customer_address, subtotal, status, created_at, estimated_delivery_at, delivered_at, vegan_temples(name, region)",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      return (data ?? []) as any[];
    },
  });

  const filtered = orders.filter((o) => {
    const byStatus =
      filter === "all"
        ? true
        : filter === "open"
          ? statusTone(o.status) === "active"
          : normalizeStatus(o.status) === filter;
    const q = search.trim().toLowerCase();
    const bySearch =
      !q ||
      o.code?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.toLowerCase().includes(q);
    return byStatus && bySearch;
  });

  async function advance(o: any) {
    const next = nextStatus(o.status);
    if (!next) return;
    const patch: { status: string; estimated_delivery_at?: string } = { status: next };
    // Nếu chưa có thời gian dự kiến mà bắt đầu xử lý -> tạo mốc dự kiến
    if (!o.estimated_delivery_at && next !== "cancelled") {
      patch.estimated_delivery_at = estimateDeliveryAt(o.channel, new Date(o.created_at));
    }
    const { error } = await supabase.from("vegan_orders").update(patch).eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success(`Đã chuyển sang "${ORDER_STATUS_LABEL[next]}"`);
    qc.invalidateQueries({ queryKey: ["vegan-orders"] });
    qc.invalidateQueries({ queryKey: ["vegan-order-events", o.id] });
  }

  async function cancel(o: any) {
    const { error } = await supabase
      .from("vegan_orders")
      .update({ status: "cancelled" })
      .eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success(`Đã hủy đơn ${o.code}`);
    qc.invalidateQueries({ queryKey: ["vegan-orders"] });
    qc.invalidateQueries({ queryKey: ["vegan-order-events", o.id] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Tìm mã đơn, tên hoặc SĐT khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả đơn</SelectItem>
            <SelectItem value="open">Đang xử lý</SelectItem>
            <SelectItem value="placed">Khách đặt hàng</SelectItem>
            <SelectItem value="confirmed">Đã xác nhận</SelectItem>
            <SelectItem value="preparing">Chùa soạn hàng</SelectItem>
            <SelectItem value="delivering">Đang giao</SelectItem>
            <SelectItem value="delivered">Đã giao xong</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card className="grid h-40 place-items-center text-sm text-muted-foreground">
          Đang tải đơn hàng...
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="grid h-40 place-items-center text-sm text-muted-foreground">
          Chưa có đơn hàng phù hợp
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} onAdvance={advance} onCancel={cancel} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onAdvance,
  onCancel,
}: {
  order: any;
  onAdvance: (o: any) => void;
  onCancel: (o: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const tone = statusTone(order.status);
  const cancelled = tone === "cancelled";
  const curIdx = flowIndex(order.status);
  const next = nextStatus(order.status);
  const temple = order.vegan_temples;

  const eta = order.estimated_delivery_at;
  const overdue =
    eta && !order.delivered_at && tone === "active" && new Date(eta).getTime() < Date.now();

  return (
    <Card className="overflow-hidden p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{order.code}</span>
            <Badge variant={order.channel === "online" ? "default" : "secondary"}>
              {order.channel === "online" ? "Online" : "Tại quầy"}
            </Badge>
            <Badge
              variant={cancelled ? "destructive" : tone === "ok" ? "default" : "outline"}
            >
              {ORDER_STATUS_LABEL[normalizeStatus(order.status) as OrderStatus]}
            </Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {order.customer_name || "Khách lẻ"}
            {order.customer_phone ? ` · ${order.customer_phone}` : ""}
            {temple ? ` · Chùa ${temple.name}` : ""}
          </div>
          {order.customer_address && (
            <div className="text-xs text-muted-foreground">{order.customer_address}</div>
          )}
        </div>
        <div className="text-right">
          <div className="font-semibold text-accent">{vnd(order.subtotal)}</div>
          <div className="text-xs text-muted-foreground">Đặt: {dt(order.created_at)}</div>
        </div>
      </div>

      {/* Timeline các bước */}
      {!cancelled ? (
        <div className="mt-4 flex items-center">
          {ORDER_FLOW.map((step, i) => {
            const Icon = STEP_ICON[step] ?? Circle;
            const done = i <= curIdx;
            const active = i === curIdx;
            return (
              <div key={step} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full border-2 transition-colors",
                      done
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-muted bg-muted/40 text-muted-foreground",
                      active && "ring-2 ring-accent/40",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "mt-1.5 w-20 text-center text-[11px] leading-tight",
                      done ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {ORDER_STATUS_LABEL[step]}
                  </span>
                </div>
                {i < ORDER_FLOW.length - 1 && (
                  <div
                    className={cn(
                      "mx-1 h-0.5 flex-1 rounded -translate-y-3",
                      i < curIdx ? "bg-accent" : "bg-muted",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4" /> Đơn đã bị hủy
        </div>
      )}

      {/* ETA */}
      {!cancelled && (
        <div
          className={cn(
            "mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
            order.delivered_at
              ? "bg-success/10 text-success"
              : overdue
                ? "bg-destructive/10 text-destructive"
                : "bg-muted/50 text-muted-foreground",
          )}
        >
          <Clock className="h-4 w-4" />
          {order.delivered_at ? (
            <span>Đã giao xong lúc {dt(order.delivered_at)}</span>
          ) : eta ? (
            <span>
              Dự kiến giao: {dt(eta)} {overdue && "· Trễ hẹn!"}
            </span>
          ) : (
            <span>Chưa có thời gian giao dự kiến</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {next && (
          <Button size="sm" onClick={() => onAdvance(order)}>
            {STEP_ICON[next] &&
              (() => {
                const Icon = STEP_ICON[next];
                return <Icon className="mr-1.5 h-4 w-4" />;
              })()}
            Chuyển: {ORDER_STATUS_LABEL[next]}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )}
        {!cancelled && tone === "active" && (
          <Button size="sm" variant="outline" onClick={() => onCancel(order)}>
            <XCircle className="mr-1.5 h-4 w-4" /> Hủy đơn
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          <History className="mr-1.5 h-4 w-4" />
          {open ? "Ẩn lịch sử" : "Lịch sử thao tác"}
        </Button>
      </div>

      {open && <OrderHistory orderId={order.id} />}
    </Card>
  );
}

function OrderHistory({ orderId }: { orderId: string }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["vegan-order-events", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("vegan_order_events")
        .select("id, status, note, actor_name, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      return (data ?? []) as any[];
    },
  });

  return (
    <div className="mt-3 rounded-xl border bg-muted/30 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Package className="h-3.5 w-3.5" /> Lịch sử thao tác
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có lịch sử</p>
      ) : (
        <ol className="space-y-3">
          {events.map((e, i) => (
            <li key={e.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "mt-0.5 h-2.5 w-2.5 rounded-full",
                    normalizeStatus(e.status) === "cancelled" ? "bg-destructive" : "bg-accent",
                  )}
                />
                {i < events.length - 1 && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="flex-1 pb-1">
                <div className="text-sm font-medium">
                  {ORDER_STATUS_LABEL[normalizeStatus(e.status) as OrderStatus] ?? e.status}
                </div>
                <div className="text-xs text-muted-foreground">
                  {dt(e.created_at)}
                  {e.actor_name ? ` · ${e.actor_name}` : ""}
                  {e.note ? ` · ${e.note}` : ""}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
