import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAppConfig } from "@/hooks/useAppConfig";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ReceiptPreview, type ReceiptData } from "@/components/ReceiptPreview";
import { vnd } from "@/lib/format";
import { markOrderPaid } from "@/lib/orders.functions";
import { verifyQiClubCode, claimQiClubCode, lookupQiClubMember } from "@/lib/qiclub.functions";
import { splitSubsidy } from "@/lib/qiclub";
import type { Database } from "@/integrations/supabase/types";
import {
  Plus,
  Minus,
  Trash2,
  Wifi,
  Printer,
  ShoppingBag,
  Search,
  Ticket,
  CheckCircle2,
  XCircle,
  UserSearch,
  Award,
  Coins,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pos")({
  component: PosPage,
});

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type Cart = Record<string, { product: ProductRow; qty: number }>;

// localStorage retry queue for failed QiClub webhook claims
const QICLUB_RETRY_KEY = "qiclub_claim_retry";

type RetryEntry = {
  code: string;
  orderId: string;
  storeId: string | null;
  subtotal: number;
  failedAt: string;
};

function pushRetryQueue(entry: RetryEntry) {
  try {
    const raw = localStorage.getItem(QICLUB_RETRY_KEY);
    const queue: RetryEntry[] = raw ? (JSON.parse(raw) as RetryEntry[]) : [];
    queue.push(entry);
    localStorage.setItem(QICLUB_RETRY_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("LocalStorage Error:", error);
  }
}

type AllianceValue = { prefix?: string; qiclub?: number; company?: number; store?: number };

function PosPage() {
  const { storeId, store } = useAppConfig();
  const { user } = useAuth();
  const markPaid = useServerFn(markOrderPaid);
  const verifyVoucher = useServerFn(verifyQiClubCode);
  const claimVoucher = useServerFn(claimQiClubCode);
  const lookupMember = useServerFn(lookupQiClubMember);
  const [cart, setCart] = useState<Cart>({});
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState("Tiền mặt");
  const [paper, setPaper] = useState<"k57" | "k80">("k80");
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [voucher, setVoucher] = useState<{
    code: string;
    discount: number;
    ref: string;
    split: { qiclub: number; company: number; store: number };
  } | null>(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [member, setMember] = useState<{
    member: {
      id: string;
      phone: string;
      qr_code: string;
      full_name: string | null;
      total_points: number;
      is_active: boolean;
    };
    membership: { internal_tier: string; points: number; visit_count: number } | null;
  } | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["pos-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");
      return data ?? [];
    },
  });

  // Tỷ lệ tài trợ liên minh QiClub (dùng cho mã DEMO / phân rã nháp)
  const { data: alliance } = useQuery({
    queryKey: ["qiclub-alliance"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "qiclub_alliance")
        .maybeSingle();
      const v = (data?.value as AllianceValue | null) ?? {};
      return {
        prefix: v.prefix ?? "QIC",
        qiclub: Number(v.qiclub ?? 60),
        company: Number(v.company ?? 30),
        store: Number(v.store ?? 10),
      };
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

  const lines = Object.values(cart);
  const subtotal = lines.reduce(
    (s, l) => s + l.qty * Number(l.product.sale_price ?? l.product.list_price),
    0,
  );
  const voucherDiscount = voucher ? Math.min(voucher.discount, subtotal) : 0;
  const grandTotal = Math.max(0, subtotal - voucherDiscount);

  function add(p: ProductRow) {
    setCart((c) => ({ ...c, [p.id]: { product: p, qty: (c[p.id]?.qty ?? 0) + 1 } }));
  }
  function setQty(id: string, qty: number) {
    setCart((c) => {
      if (qty <= 0) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: { ...c[id], qty } };
    });
  }

  async function lookupQiMember() {
    const q = memberQuery.trim();
    if (q.length < 3) return toast.error("Nhập SĐT hoặc mã QR hợp lệ");
    setMemberLoading(true);
    try {
      toast.loading("Đang tra cứu QiClub...", { id: "member" });
      const res = await lookupMember({ data: { query: q } });
      if (!res.found) {
        setMember(null);
        toast.error("Không tìm thấy thành viên QiClub", { id: "member" });
        return;
      }
      setMember({ member: res.member, membership: res.membership });
      toast.success(`Đã nhận diện ${res.member.full_name ?? res.member.phone}`, { id: "member" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lỗi tra cứu", { id: "member" });
    } finally {
      setMemberLoading(false);
    }
  }

  function clearMember() {
    setMember(null);
    setMemberQuery("");
  }

  async function applyVoucher() {
    const code = voucherCode.trim();
    if (!code) return;
    if (subtotal <= 0) return toast.error("Giỏ hàng trống");

    // Mã demo (chứa "DEMO"): phân rã nháp tức thì, không gọi máy chủ.
    if (code.toUpperCase().includes("DEMO")) {
      const discount = Math.min(100_000, subtotal);
      const r = alliance ?? { qiclub: 60, company: 30, store: 10 };
      const split = splitSubsidy(discount, r.qiclub, r.company, r.store);
      setVoucher({ code: code.toUpperCase(), discount, ref: "DEMO-DRAFT", split });
      toast.success(`Mã mẫu hợp lệ · giảm ${vnd(discount)} (nháp)`, { id: "voucher" });
      return;
    }

    setVerifying(true);
    try {
      toast.loading("Đang gọi QiClub VerifyCode...", { id: "voucher" });
      const res = await verifyVoucher({ data: { code, subtotal, storeId: storeId ?? null } });
      if (!res.valid) {
        setVoucher(null);
        toast.error(res.reason, { id: "voucher" });
        return;
      }
      setVoucher({
        code: code.toUpperCase(),
        discount: res.discount,
        ref: res.qiclub_ref,
        split: res.split,
      });
      toast.success(`Mã hợp lệ · giảm ${vnd(res.discount)} (ref ${res.qiclub_ref})`, {
        id: "voucher",
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lỗi xác thực mã", { id: "voucher" });
    } finally {
      setVerifying(false);
    }
  }

  function clearVoucher() {
    setVoucher(null);
    setVoucherCode("");
  }

  async function checkout() {
    if (lines.length === 0) return;
    setProcessing(true);
    try {
      const items = lines.map((l) => {
        const p = l.product;
        const unit = Number(p.sale_price ?? p.list_price);
        const line_total = unit * l.qty;
        const cashback =
          p.cashback_type === "percent"
            ? (line_total * Number(p.cashback_value || 0)) / 100
            : Number(p.cashback_value || 0) * l.qty;
        return {
          product_id: p.id,
          product_name: p.name,
          qty: l.qty,
          unit_price: unit,
          line_total,
          cashback_amount: cashback,
          affiliate_commission: (line_total * Number(p.affiliate_rate_percent || 0)) / 100,
          agent_commission: (line_total * Number(p.agent_rate_percent || 0)) / 100,
        };
      });

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          store_id: storeId,
          cashflow_mode: store?.cashflow_mode ?? "per_store",
          subtotal,
          discount: voucherDiscount,
          total: grandTotal,
          promo_code: voucher?.code ?? null,
          note: "POS - bán quầy",
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("order_items").insert(items.map((it) => ({ ...it, order_id: order.id })));

      // Hiển thị hoá đơn NGAY để thu ngân có thể in mà không cần chờ xử lý thanh toán
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setReceipt({
        code: order.code,
        storeName: store?.name ?? "Cửa hàng",
        storeAddress: store?.address,
        storePhone: store?.phone,
        staffEmail: user?.email ?? null,
        createdAt: order.created_at,
        items: lines.map((l) => ({
          name: l.product.name,
          qty: l.qty,
          unit_price: Number(l.product.sale_price ?? l.product.list_price),
        })),
        subtotal,
        discount: voucherDiscount,
        total: grandTotal,
        paymentMethod: payment,
        lookupUrl: `${origin}/orders?code=${order.code}`,
      });

      // Capture trước khi clear state
      const capturedVoucher = voucher;
      setCart({});
      clearVoucher();
      clearMember();
      setProcessing(false); // mở khoá UI ngay

      // Xử lý thanh toán và claim voucher song song — không chặn cashier
      toast.loading("Đang xử lý thanh toán & gửi máy in...", { id: "pos" });
      void Promise.all([
        markPaid({ data: { orderId: order.id } })
          .then(() => toast.success("Thanh toán thành công · đã gửi máy in", { id: "pos" }))
          .catch((e: unknown) => {
            console.error("markPaid error:", e);
            toast.error("Lỗi cập nhật đơn: " + (e instanceof Error ? e.message : String(e)), {
              id: "pos",
            });
          }),

        capturedVoucher && capturedVoucher.ref !== "DEMO-DRAFT"
          ? claimVoucher({
              data: {
                code: capturedVoucher.code,
                orderId: order.id,
                storeId: storeId ?? null,
                subtotal,
              },
            }).catch((e: unknown) => {
              console.error("claimVoucher error:", e);
              // Đưa vào retry queue — sẽ được xử lý tự động sau
              pushRetryQueue({
                code: capturedVoucher.code,
                orderId: order.id,
                storeId: storeId ?? null,
                subtotal,
                failedAt: new Date().toISOString(),
              });
              toast.warning("Mã QiClub sẽ được retry tự động khi có mạng", {
                id: "qiclub-claim",
              });
            })
          : Promise.resolve(),
      ]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định", { id: "pos" });
      setProcessing(false);
    }
  }

  function printReceipt() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <style>{`@media print { body * { visibility: hidden; } #receipt-print, #receipt-print * { visibility: visible; } #receipt-print { position: fixed; left: 0; top: 0; } }`}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">POS bán quầy</h1>
          <p className="text-sm text-muted-foreground">{store?.name ?? "Chưa chọn điểm bán"}</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Wifi className="h-3.5 w-3.5 text-success" /> Sunmi/iMin đã kết nối
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm sản phẩm / SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p)}
                className="rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent"
              >
                <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                <div className="mt-1 text-sm font-semibold text-primary">
                  {vnd(p.sale_price ?? p.list_price)}
                </div>
                <div className="text-xs text-muted-foreground">Tồn: {p.stock ?? 0}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                Không có sản phẩm
              </p>
            )}
          </div>
        </div>

        <Card className="flex h-fit flex-col p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <ShoppingBag className="h-4 w-4" /> Giỏ hàng ({lines.length})
          </div>
          <div className="space-y-2">
            {lines.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Chưa có sản phẩm</p>
            )}
            {lines.map((l) => (
              <div key={l.product.id} className="flex items-center gap-2 border-b pb-2">
                <div className="flex-1">
                  <div className="text-sm font-medium">{l.product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {vnd(l.product.sale_price ?? l.product.list_price)}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setQty(l.product.id, l.qty - 1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-6 text-center text-sm">{l.qty}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setQty(l.product.id, l.qty + 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setQty(l.product.id, 0)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <div className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <UserSearch className="h-3.5 w-3.5" /> Thành viên QiClub
              </div>
              {member ? (
                <div className="space-y-1.5 rounded bg-primary/5 px-2 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                      {member.member.full_name ?? member.member.phone}
                    </span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={clearMember}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    SĐT {member.member.phone} · QR {member.member.qr_code}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Coins className="h-3.5 w-3.5 text-warning" />
                    Ví điểm tổng QiClub:{" "}
                    <span className="font-semibold text-foreground">
                      {member.member.total_points.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Award className="h-3.5 w-3.5 text-success" />
                    {member.membership ? (
                      <>
                        Hạng tại cửa hàng:{" "}
                        <span className="font-semibold text-foreground">
                          {member.membership.internal_tier}
                        </span>{" "}
                        · {member.membership.visit_count} lượt
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Chưa là thành viên nội bộ tại đây
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    className="h-8"
                    placeholder="SĐT / quét QR tổng"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") lookupQiMember();
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={memberLoading || memberQuery.trim().length < 3}
                    onClick={lookupQiMember}
                  >
                    {memberLoading ? "..." : "Tra cứu"}
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Ticket className="h-3.5 w-3.5" /> Voucher QiClub
              </div>
              {voucher ? (
                <div className="flex items-center justify-between gap-2 rounded bg-success/10 px-2 py-1.5 text-sm">
                  <span className="flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    {voucher.code}
                  </span>
                  <span className="text-success font-medium">-{vnd(voucherDiscount)}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={clearVoucher}>
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    className="h-8"
                    placeholder="Nhập / quét mã QiClub"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyVoucher();
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={verifying || !voucherCode.trim()}
                    onClick={applyVoucher}
                  >
                    {verifying ? "..." : "Áp dụng"}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Tạm tính</span>
              <span>{vnd(subtotal)}</span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex items-center justify-between text-sm text-success">
                <span>Giảm voucher</span>
                <span>-{vnd(voucherDiscount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-semibold">
              <span>Tổng</span>
              <span className="text-lg">{vnd(grandTotal)}</span>
            </div>

            {voucher && voucherDiscount > 0 && (
              <div className="rounded-md border border-dashed bg-muted/30 p-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5" /> Phân rã tài trợ{" "}
                    {voucher.ref === "DEMO-DRAFT" ? "(nháp)" : ""}
                  </span>
                  <span className="font-mono">{voucher.ref}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>QiClub chịu</span>
                  <span className="font-medium text-chart-1">{vnd(voucher.split.qiclub)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Tổng công ty chịu</span>
                  <span className="font-medium text-chart-2">{vnd(voucher.split.company)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Cửa hàng chịu</span>
                  <span className="font-medium text-chart-3">{vnd(voucher.split.store)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
                  <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
                  <SelectItem value="Thẻ">Thẻ</SelectItem>
                  <SelectItem value="QR Code">QR Code</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paper} onValueChange={(v) => setPaper(v as "k57" | "k80")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="k80">Khổ K80</SelectItem>
                  <SelectItem value="k57">Khổ K57</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={lines.length === 0 || processing}
              onClick={checkout}
            >
              Thanh toán {grandTotal > 0 ? vnd(grandTotal) : ""}
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hoá đơn — {receipt?.code}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-md bg-muted/40 py-4">
            {receipt && <ReceiptPreview data={receipt} paper={paper} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceipt(null)}>
              Đóng
            </Button>
            <Button onClick={printReceipt}>
              <Printer className="mr-1.5 h-4 w-4" /> In lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
