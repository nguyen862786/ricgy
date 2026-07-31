import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppConfig } from "@/hooks/useAppConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ManagerApprovalDialog } from "@/components/ManagerApprovalDialog";
import { vnd, dt } from "@/lib/format";
import { markOrderPaid, cancelOrder } from "@/lib/orders.functions";
import { issueEInvoice, batchIssueEInvoices } from "@/lib/einvoice.functions";
import { Plus, Trash2, CheckCircle2, XCircle, Package, FileText, Receipt } from "lucide-react";
import { toast } from "sonner";

type AppliedBundle = { id: string; name: string; sets: number; saving: number };

function computeBundleSavings(
  lines: { product_id: string; qty: number }[],
  bundles: any[],
  priceOf: (id: string) => number,
): { discount: number; applied: AppliedBundle[] } {
  const have = new Map<string, number>();
  for (const l of lines) have.set(l.product_id, (have.get(l.product_id) ?? 0) + l.qty);

  let discount = 0;
  const applied: AppliedBundle[] = [];
  for (const b of bundles) {
    const items: any[] = b.bundle_items ?? [];
    if (items.length === 0) continue;
    let sets = Infinity;
    for (const it of items) {
      const owned = have.get(it.product_id) ?? 0;
      sets = Math.min(sets, Math.floor(owned / Math.max(1, it.quantity)));
    }
    if (!Number.isFinite(sets) || sets < 1) continue;
    const original = items.reduce((s, it) => s + priceOf(it.product_id) * it.quantity, 0);
    const perCombo = original - Number(b.bundle_price ?? 0);
    if (perCombo > 0) {
      const saving = perCombo * sets;
      discount += saving;
      applied.push({ id: b.id, name: b.name, sets, saving });
    }
  }
  return { discount, applied };
}

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
});

const statusLabel: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  refunded: "Hoàn tiền",
};
const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  paid: "default",
  cancelled: "destructive",
  refunded: "outline",
};

type Line = { product_id: string; product_name: string; qty: number; unit_price: number };

function OrdersPage() {
  const { user, canManageOrders } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  // Đơn đang chờ phê duyệt huỷ (nhân viên không có quyền tự huỷ).
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const markPaid = useServerFn(markOrderPaid);
  const cancel = useServerFn(cancelOrder);
  const issueInv = useServerFn(issueEInvoice);
  const batchInv = useServerFn(batchIssueEInvoices);

  async function doCancel(orderId: string) {
    try {
      await cancel({ data: { orderId } });
      toast.success("Đã huỷ đơn");
      qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, product_name, qty, unit_price, line_total)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: invoicedIds = new Set<string>() } = useQuery({
    queryKey: ["einvoices-issued"],
    queryFn: async () => {
      const { data } = await supabase.from("einvoices").select("order_id").eq("status", "issued");
      return new Set((data ?? []).map((r) => r.order_id).filter(Boolean) as string[]);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng</h1>
          <p className="text-sm text-muted-foreground">{orders.length} đơn</p>
        </div>
        <div className="flex gap-2">
          {canManageOrders && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res: any = await batchInv({ data: {} });
                  if (res.count === 0) toast.info("Không có đơn khách lẻ cần gom xuất");
                  else toast.success(`Đã gom xuất ${res.count} đơn · HĐ ${res.invoice_no}`);
                  qc.invalidateQueries({ queryKey: ["einvoices-issued"] });
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            >
              <Receipt className="mr-2 h-4 w-4" /> Gom xuất cuối ngày
            </Button>
          )}
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> Tạo đơn
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>SP</TableHead>
              <TableHead className="text-right">Tổng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Chưa có đơn
                </TableCell>
              </TableRow>
            )}
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono font-medium">{o.code}</TableCell>
                <TableCell className="text-sm">{dt(o.created_at)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {o.order_items?.length ?? 0} dòng
                </TableCell>
                <TableCell className="text-right font-semibold">{vnd(o.total)}</TableCell>
                <TableCell>
                  <Badge variant={statusColor[o.status]}>{statusLabel[o.status]}</Badge>
                </TableCell>
                <TableCell>
                  {o.status === "pending" && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Đánh dấu đã thanh toán"
                        onClick={async () => {
                          try {
                            await markPaid({ data: { orderId: o.id } });
                            toast.success("Đã thanh toán + ghi nhận hoa hồng");
                            qc.invalidateQueries({ queryKey: ["orders"] });
                          } catch (e: any) {
                            toast.error(e.message);
                          }
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={canManageOrders ? "Hủy đơn" : "Hủy đơn (cần Quản lý phê duyệt)"}
                        onClick={async () => {
                          if (canManageOrders) {
                            if (!confirm("Hủy đơn?")) return;
                            await doCancel(o.id);
                          } else {
                            setPendingCancelId(o.id);
                          }
                        }}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                  {o.status === "paid" &&
                    canManageOrders &&
                    (invoicedIds.has(o.id) ? (
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" /> Đã xuất HĐ
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Xuất hoá đơn điện tử"
                        onClick={async () => {
                          try {
                            const res: any = await issueInv({
                              data: { orderId: o.id, provider: "misa" },
                            });
                            toast.success(`Đã xuất HĐ ${res.invoice_no}`);
                            qc.invalidateQueries({ queryKey: ["einvoices-issued"] });
                          } catch (e: any) {
                            toast.error(e.message);
                          }
                        }}
                      >
                        <FileText className="mr-1 h-4 w-4" /> Xuất HĐ
                      </Button>
                    ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {creating && (
        <CreateOrderDialog
          onClose={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["orders"] });
          }}
        />
      )}

      <ManagerApprovalDialog
        open={!!pendingCancelId}
        onClose={() => setPendingCancelId(null)}
        title="Phê duyệt huỷ đơn"
        description="Nhân viên không được tự huỷ đơn. Cần Quản lý cửa hàng hoặc Chủ doanh nghiệp nhập mật khẩu để phê duyệt."
        onApproved={() => {
          if (pendingCancelId) doCancel(pendingCancelId);
        }}
      />
    </div>
  );
}

function CreateOrderDialog({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [affiliateEmail, setAffiliateEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { stores, storeId: activeStoreId, store: activeStore } = useAppConfig();
  const [storeId, setStoreId] = useState<string | null>(activeStoreId);
  const [cashflow, setCashflow] = useState<"per_store" | "company">(
    activeStore?.cashflow_mode ?? "per_store",
  );

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-order"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true);
      return data ?? [];
    },
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ["bundles-for-order"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_bundles")
        .select("*, bundle_items(*)")
        .eq("is_active", true);
      return (data ?? []) as any[];
    },
  });

  function addLine(productId: string) {
    const p = products.find((x: any) => x.id === productId);
    if (!p) return;
    setLines((ls) => [
      ...ls,
      {
        product_id: p.id,
        product_name: p.name,
        qty: 1,
        unit_price: Number(p.sale_price ?? p.list_price),
      },
    ]);
  }

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit_price, 0);

  const priceOf = (id: string) => {
    const p: any = products.find((x: any) => x.id === id);
    return Number(p?.sale_price ?? p?.list_price ?? 0);
  };
  const applicableBundles = bundles.filter((b: any) => !b.store_id || b.store_id === storeId);
  const { discount: bundleDiscount, applied: appliedBundles } = computeBundleSavings(
    lines,
    applicableBundles,
    priceOf,
  );

  async function lookupUserId(email: string) {
    if (!email) return null;
    const { data } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    return data?.id ?? null;
  }

  async function save() {
    if (lines.length === 0) return toast.error("Cần ít nhất 1 sản phẩm");
    setSaving(true);
    try {
      const customerId = await lookupUserId(customerEmail);
      const affiliateId = await lookupUserId(affiliateEmail);

      // promo
      let discount = 0;
      if (promoCode) {
        const { data: promo } = await supabase
          .from("promo_codes")
          .select("*")
          .eq("code", promoCode.toUpperCase())
          .eq("is_active", true)
          .maybeSingle();
        if (promo && subtotal >= Number(promo.min_order_amount)) {
          discount = (subtotal * Number(promo.discount_percent)) / 100;
          if (promo.max_discount_amount)
            discount = Math.min(discount, Number(promo.max_discount_amount));
        }
      }
      discount += bundleDiscount;
      const total = Math.max(0, subtotal - discount);
      const bundleNote = appliedBundles.length
        ? "Combo: " + appliedBundles.map((a) => `${a.name} x${a.sets}`).join(", ")
        : "";
      const finalNote = [note, bundleNote].filter(Boolean).join(" | ") || null;

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          affiliate_id: affiliateId,
          store_id: storeId,
          cashflow_mode: cashflow,
          promo_code: promoCode || null,
          subtotal,
          discount,
          total,
          note: finalNote,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;

      const items = lines.map((l) => {
        const p: any = products.find((x: any) => x.id === l.product_id);
        const line_total = l.qty * l.unit_price;
        const cashback =
          p?.cashback_type === "percent"
            ? (line_total * Number(p?.cashback_value || 0)) / 100
            : Number(p?.cashback_value || 0) * l.qty;
        const aff = (line_total * Number(p?.affiliate_rate_percent || 0)) / 100;
        const agent = (line_total * Number(p?.agent_rate_percent || 0)) / 100;
        return {
          order_id: order.id,
          product_id: l.product_id,
          product_name: l.product_name,
          qty: l.qty,
          unit_price: l.unit_price,
          line_total,
          cashback_amount: cashback,
          affiliate_commission: aff,
          agent_commission: agent,
        };
      });
      await supabase.from("order_items").insert(items);
      toast.success("Đã tạo đơn");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo đơn mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cửa hàng / Điểm bán</Label>
              <Select
                value={storeId ?? "none"}
                onValueChange={(v) => {
                  const id = v === "none" ? null : v;
                  setStoreId(id);
                  const s = stores.find((x) => x.id === id);
                  if (s) setCashflow(s.cashflow_mode);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cửa hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Không gán —</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Luồng tiền</Label>
              <Select value={cashflow} onValueChange={(v) => setCashflow(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_store">Tiền về điểm bán</SelectItem>
                  <SelectItem value="company">Tiền về công ty tổng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Email khách hàng</Label>
              <Input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Affiliate (nếu có)</Label>
              <Input value={affiliateEmail} onChange={(e) => setAffiliateEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mã KM</Label>
              <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Thêm sản phẩm</Label>
            <Select onValueChange={addLine}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn sản phẩm..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {vnd(p.sale_price ?? p.list_price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {lines.length > 0 && (
            <div className="rounded-md border">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2 border-b p-2 last:border-b-0">
                  <div className="flex-1 text-sm">{l.product_name}</div>
                  <Input
                    className="w-20"
                    type="number"
                    min={1}
                    value={l.qty}
                    onChange={(e) =>
                      setLines((ls) =>
                        ls.map((x, j) => (j === i ? { ...x, qty: +e.target.value } : x)),
                      )
                    }
                  />
                  <Input
                    className="w-32"
                    type="number"
                    value={l.unit_price}
                    onChange={(e) =>
                      setLines((ls) =>
                        ls.map((x, j) => (j === i ? { ...x, unit_price: +e.target.value } : x)),
                      )
                    }
                  />
                  <div className="w-32 text-right text-sm font-medium">
                    {vnd(l.qty * l.unit_price)}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-between border-t p-2 text-sm">
                <span>Tạm tính</span>
                <span>{vnd(subtotal)}</span>
              </div>
              {appliedBundles.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-2 pb-1 text-sm text-success"
                >
                  <span className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" /> Combo: {a.name} ×{a.sets}
                  </span>
                  <span>− {vnd(a.saving)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t p-2 font-semibold">
                <span>Tạm tính sau combo</span>
                <span>{vnd(Math.max(0, subtotal - bundleDiscount))}</span>
              </div>
            </div>
          )}

          {appliedBundles.length > 0 && (
            <div className="rounded-md border border-success/40 bg-success/5 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-success">🎁 Đã tự động áp dụng combo</span>
                <span className="font-semibold text-success">Tiết kiệm {vnd(bundleDiscount)}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={save} disabled={saving}>
            Tạo đơn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
