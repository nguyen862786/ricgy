import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantModules } from "@/hooks/useTenantModules";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  Package,
  ClipboardCheck,
  CheckCircle,
  RefreshCcw,
  Warehouse,
  Undo2,
  Wallet,
} from "lucide-react";

// ── Local types ──────────────────────────────────────────────────────
type OrderItem = {
  id: string;
  product_name: string;
  qty: number;
  unit_price: number;
};

type FoundOrder = {
  id: string;
  code: string;
  created_at: string;
  total: number;
  status: string;
  order_items: OrderItem[];
};

type ConditionCheck = {
  hasTags: boolean | null;
  isClean: boolean | null;
  isNotTorn: boolean | null;
  conditionNotes: string;
};

type ReturnForm = {
  selectedItem: OrderItem | null;
  qty: number;
  reason: string;
  reasonDetail: string;
  condition: ConditionCheck;
  resolution: string;
  refundAmount: string;
};

type VariantOption = {
  id: string;
  sku: string;
  size: string;
  color_name: string | null;
  stock: number;
  product_name: string;
};

// ── Constants ────────────────────────────────────────────────────────
const STEP_LABELS = ["Tra cứu đơn", "Kiểm định hàng", "Xử lý & Hoàn trả"];

const REASON_LABELS: Record<string, string> = {
  wrong_size: "Sai size",
  not_as_pictured: "Không đúng hình",
  defect: "Lỗi sản phẩm",
  other: "Lý do khác",
};

const RESOLUTION_LABELS: Record<string, string> = {
  wallet_refund: "Hoàn tiền vào ví",
  exchange: "Đổi sản phẩm",
  invoice_credit: "Bù trừ hoá đơn",
};

const EMPTY_CONDITION: ConditionCheck = {
  hasTags: null,
  isClean: null,
  isNotTorn: null,
  conditionNotes: "",
};

const EMPTY_FORM: ReturnForm = {
  selectedItem: null,
  qty: 1,
  reason: "wrong_size",
  reasonDetail: "",
  condition: EMPTY_CONDITION,
  resolution: "wallet_refund",
  refundAmount: "",
};

const STATUS_LABELS: Record<string, string> = {
  received: "Đã nhận",
  restocked: "Đã hoàn kho",
  refunded: "Đã hoàn tiền",
  rejected: "Từ chối",
};

// ── Sub-component ────────────────────────────────────────────────────
function TriToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(true)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            value === true
              ? "bg-emerald-700 text-white"
              : "bg-muted text-muted-foreground hover:bg-emerald-900/30"
          }`}
        >
          Có
        </button>
        <button
          onClick={() => onChange(false)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            value === false
              ? "bg-red-800 text-white"
              : "bg-muted text-muted-foreground hover:bg-red-900/30"
          }`}
        >
          Không
        </button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────
export function ReturnManager() {
  const { tenantId } = useTenantModules();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [searchCode, setSearchCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState<FoundOrder | null>(null);
  const [returnForm, setReturnForm] = useState<ReturnForm>(EMPTY_FORM);
  const [variantId, setVariantId] = useState<string>("");
  const [restock, setRestock] = useState(true);

  // Variants of this tenant — to link a returned item back to inventory
  const { data: variantOptions = [] } = useQuery({
    queryKey: ["fashion_variants_options", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fashion_variants")
        .select(
          "id, sku, size, color_name, stock, fashion_products(name)",
        )
        .eq("tenant_id", tenantId!)
        .eq("is_active", true)
        .order("sku");
      if (error) throw error;
      return (data ?? []).map((v) => {
        const prod = v.fashion_products as unknown as { name: string } | null;
        return {
          id: v.id,
          sku: v.sku,
          size: v.size,
          color_name: v.color_name,
          stock: v.stock,
          product_name: prod?.name ?? "—",
        } satisfies VariantOption;
      });
    },
  });

  // Returns report — aggregate stats for the tenant
  const { data: returns = [] } = useQuery({
    queryKey: ["order_returns", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_returns")
        .select("id, status, resolution, refund_amount, qty, created_at")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as {
        id: string;
        status: string;
        resolution: string | null;
        refund_amount: number | null;
        qty: number;
        created_at: string;
      }[];
    },
  });

  const report = {
    total: returns.length,
    restocked: returns.filter((r) => r.status === "restocked").length,
    refundTotal: returns.reduce((s, r) => s + (r.refund_amount ?? 0), 0),
    unitsBack: returns
      .filter((r) => r.status === "restocked")
      .reduce((s, r) => s + (r.qty ?? 0), 0),
  };

  const resaleable =
    returnForm.condition.hasTags === true &&
    returnForm.condition.isClean === true &&
    returnForm.condition.isNotTorn === true;

  const updateForm = <K extends keyof ReturnForm>(
    key: K,
    value: ReturnForm[K],
  ) => setReturnForm((p) => ({ ...p, [key]: value }));

  const updateCondition = <K extends keyof ConditionCheck>(
    key: K,
    value: ConditionCheck[K],
  ) =>
    setReturnForm((p) => ({
      ...p,
      condition: { ...p.condition, [key]: value },
    }));

  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, code, created_at, total, status, order_items(id, product_name, qty, unit_price)",
        )
        .eq("code", searchCode.trim().toUpperCase())
        .maybeSingle();
      if (error) throw error;
      setFoundOrder(data as FoundOrder | null);
      if (!data) toast.error("Không tìm thấy đơn hàng.");
    } catch {
      toast.error("Lỗi khi tra cứu đơn hàng.");
    } finally {
      setSearching(false);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId || !foundOrder || !returnForm.selectedItem)
        throw new Error("Thiếu thông tin đơn hàng");
      const willRestock = restock && resaleable && !!variantId;
      const { error } = await supabase.from("order_returns").insert({
        tenant_id: tenantId,
        order_id: foundOrder.id,
        order_code: foundOrder.code,
        variant_id: variantId || null,
        product_name: returnForm.selectedItem.product_name,
        qty: returnForm.qty,
        unit_price: returnForm.selectedItem.unit_price,
        reason: returnForm.reason,
        reason_detail: returnForm.reasonDetail || null,
        has_tags: returnForm.condition.hasTags,
        is_clean: returnForm.condition.isClean,
        is_not_torn: returnForm.condition.isNotTorn,
        condition_notes: returnForm.condition.conditionNotes || null,
        status: willRestock ? "restocked" : "received",
        resolution: returnForm.resolution,
        refund_amount:
          Number(returnForm.refundAmount) ||
          returnForm.selectedItem.unit_price * returnForm.qty,
        created_by: user?.id ?? null,
      });
      if (error) throw error;

      // Reverse logistics: automatically return units to inventory
      if (willRestock) {
        const { error: rpcErr } = await supabase.rpc(
          "restock_fashion_variant",
          { _variant_id: variantId, _qty: returnForm.qty },
        );
        if (rpcErr) throw rpcErr;
      }
      return willRestock;
    },
    onSuccess: (didRestock) => {
      toast.success(
        didRestock
          ? "Đã ghi nhận đổi trả và hoàn hàng vào kho!"
          : "Đã ghi nhận đổi trả thành công!",
      );
      queryClient.invalidateQueries({ queryKey: ["order_returns", tenantId] });
      queryClient.invalidateQueries({
        queryKey: ["fashion_variants_options", tenantId],
      });
      setStep(0);
      setSearchCode("");
      setFoundOrder(null);
      setReturnForm(EMPTY_FORM);
      setVariantId("");
      setRestock(true);
    },
    onError: (err: Error) => toast.error(`Lỗi: ${err.message}`),
  });

  return (
    <div className="space-y-6">
      {/* ── Reverse logistics report ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Tổng đổi trả", value: report.total, icon: RefreshCcw },
          { label: "Đã hoàn kho", value: report.restocked, icon: Warehouse },
          { label: "SP về kho", value: report.unitsBack, icon: Package },
          {
            label: "Tổng hoàn tiền",
            value: `${report.refundTotal.toLocaleString("vi-VN")}₫`,
            icon: Wallet,
          },
        ].map((s) => (
          <Card key={s.label} className="border-emerald-900/30 bg-card/60">
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className="h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Step indicator ── */}
      <div className="flex items-center">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < step
                  ? "bg-emerald-700 text-white"
                  : i === step
                    ? "bg-emerald-500 text-white ring-2 ring-emerald-300"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`mx-2 hidden text-xs font-medium sm:inline ${
                i === step ? "text-emerald-400" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`h-px w-10 sm:w-16 ${i < step ? "bg-emerald-700" : "bg-muted"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Search ── */}
      {step === 0 && (
        <Card className="border-emerald-900/30 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-emerald-400" />
              Tra cứu đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Mã đơn hàng (VD: ORD-ABC123)"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !searchCode.trim()}
                className="bg-emerald-700 hover:bg-emerald-600"
              >
                {searching ? "..." : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {foundOrder && (
              <div className="space-y-3 rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-emerald-300">
                      #{foundOrder.code}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(foundOrder.created_at).toLocaleDateString(
                        "vi-VN",
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {foundOrder.total.toLocaleString("vi-VN")}₫
                  </span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Chọn sản phẩm đổi trả:</Label>
                  {foundOrder.order_items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => updateForm("selectedItem", item)}
                      className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                        returnForm.selectedItem?.id === item.id
                          ? "border-emerald-500 bg-emerald-950/40"
                          : "border-border hover:border-emerald-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.product_name}</span>
                        <span className="text-muted-foreground">
                          ×{item.qty}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.unit_price.toLocaleString("vi-VN")}₫/cái
                      </span>
                    </button>
                  ))}
                </div>

                {returnForm.selectedItem && (
                  <div className="flex items-center gap-3">
                    <Label className="text-xs">Số lượng đổi trả:</Label>
                    <Input
                      type="number"
                      min="1"
                      max={returnForm.selectedItem.qty}
                      value={returnForm.qty}
                      onChange={(e) =>
                        updateForm("qty", Number(e.target.value))
                      }
                      className="h-8 w-20"
                    />
                    <span className="text-xs text-muted-foreground">
                      / {returnForm.selectedItem.qty}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Lý do đổi trả</Label>
                  <Select
                    value={returnForm.reason}
                    onValueChange={(v) => updateForm("reason", v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REASON_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Chi tiết lý do (tuỳ chọn)"
                    value={returnForm.reasonDetail}
                    onChange={(e) => updateForm("reasonDetail", e.target.value)}
                    className="h-9"
                  />
                </div>

                <Button
                  className="w-full bg-emerald-700 hover:bg-emerald-600"
                  onClick={() => setStep(1)}
                  disabled={!returnForm.selectedItem}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Tiếp tục kiểm định
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 1: Condition check ── */}
      {step === 1 && (
        <Card className="border-emerald-900/30 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4 text-emerald-400" />
              Kiểm định hàng trả về
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-sm font-medium">
                {returnForm.selectedItem?.product_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {returnForm.qty} ×{" "}
                {returnForm.selectedItem?.unit_price.toLocaleString("vi-VN")}₫
                — Lý do: {REASON_LABELS[returnForm.reason]}
              </p>
            </div>

            <div className="space-y-3">
              <TriToggle
                label="Còn nguyên mác / tag"
                value={returnForm.condition.hasTags}
                onChange={(v) => updateCondition("hasTags", v)}
              />
              <TriToggle
                label="Hàng sạch sẽ"
                value={returnForm.condition.isClean}
                onChange={(v) => updateCondition("isClean", v)}
              />
              <TriToggle
                label="Không rách / lỗi"
                value={returnForm.condition.isNotTorn}
                onChange={(v) => updateCondition("isNotTorn", v)}
              />
              <div className="space-y-1.5">
                <Label className="text-xs">Ghi chú tình trạng</Label>
                <Textarea
                  rows={2}
                  placeholder="Mô tả tình trạng hàng..."
                  value={returnForm.condition.conditionNotes}
                  onChange={(e) =>
                    updateCondition("conditionNotes", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(0)}
                className="flex-1"
              >
                Quay lại
              </Button>
              <Button
                className="flex-1 bg-emerald-700 hover:bg-emerald-600"
                onClick={() => setStep(2)}
              >
                Tiếp theo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Resolution ── */}
      {step === 2 && (
        <Card className="border-emerald-900/30 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCcw className="h-4 w-4 text-emerald-400" />
              Phương thức xử lý
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {Object.entries(RESOLUTION_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => updateForm("resolution", key)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    returnForm.resolution === key
                      ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
                      : "border-border hover:border-emerald-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {returnForm.resolution === "wallet_refund" && (
              <div className="space-y-1.5">
                <Label>Số tiền hoàn trả (VND)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder={
                    returnForm.selectedItem
                      ? String(
                          returnForm.selectedItem.unit_price * returnForm.qty,
                        )
                      : "0"
                  }
                  value={returnForm.refundAmount}
                  onChange={(e) => updateForm("refundAmount", e.target.value)}
                />
              </div>
            )}

            {/* ── Reverse logistics: link variant + auto restock ── */}
            <div className="space-y-3 rounded-lg border border-emerald-800/40 bg-emerald-950/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                <Warehouse className="h-4 w-4" />
                Hoàn trả kho (Reverse Logistics)
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Liên kết biến thể SKU để hoàn kho</Label>
                <Select value={variantId} onValueChange={setVariantId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Chọn SKU tương ứng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {variantOptions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.product_name} — {v.size}
                        {v.color_name ? ` / ${v.color_name}` : ""} · tồn {v.stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!resaleable ? (
                <p className="flex items-center gap-2 text-xs text-yellow-500">
                  <Undo2 className="h-3.5 w-3.5" />
                  Hàng chưa đạt kiểm định (mác/sạch/không lỗi) nên không tự hoàn kho.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setRestock((v) => !v)}
                  className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>Tự động cộng tồn kho khi xác nhận</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      restock && !!variantId
                        ? "bg-emerald-700 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {restock && variantId ? "BẬT" : "TẮT"}
                  </span>
                </button>
              )}
              {restock && resaleable && !variantId && (
                <p className="text-xs text-muted-foreground">
                  Chọn SKU ở trên để kích hoạt hoàn kho tự động.
                </p>
              )}
            </div>

            <div className="space-y-1 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Sản phẩm:</span>{" "}
                {returnForm.selectedItem?.product_name}
              </p>
              <p>
                <span className="font-medium text-foreground">Tình trạng:</span>{" "}
                {[
                  returnForm.condition.hasTags !== null &&
                    `Mác: ${returnForm.condition.hasTags ? "✓" : "✗"}`,
                  returnForm.condition.isClean !== null &&
                    `Sạch: ${returnForm.condition.isClean ? "✓" : "✗"}`,
                  returnForm.condition.isNotTorn !== null &&
                    `Lành: ${returnForm.condition.isNotTorn ? "✓" : "✗"}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p>
                <span className="font-medium text-foreground">Xử lý:</span>{" "}
                {RESOLUTION_LABELS[returnForm.resolution]}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Quay lại
              </Button>
              <Button
                className="flex-1 bg-emerald-700 hover:bg-emerald-600"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending
                  ? "Đang xử lý..."
                  : "Xác nhận đổi trả"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
