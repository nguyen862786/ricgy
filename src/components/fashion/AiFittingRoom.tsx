import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useTenantModules } from "@/hooks/useTenantModules";
import { generateTryOn } from "@/lib/fashion-tryon.functions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2, CheckCircle, AlertCircle, Package, Sparkles, Loader2, Shirt } from "lucide-react";

// ── Local types ──────────────────────────────────────────────────────
type FashionProduct = {
  id: string;
  name: string;
  brand: string | null;
  gender: string;
  category: string;
  base_price: number;
};

type FashionVariant = {
  id: string;
  size: string;
  color_name: string | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  height_min_cm: number | null;
  height_max_cm: number | null;
  weight_min_kg: number | null;
  weight_max_kg: number | null;
  price_delta: number;
  stock: number;
  is_active: boolean;
};

type BodyMeasurements = {
  height: string;
  weight: string;
  bust: string;
  waist: string;
  hip: string;
};

type RecommendResult = {
  size: string;
  variant: FashionVariant;
  score: number;
  matchReason: string[];
};

// ── Algorithm ────────────────────────────────────────────────────────
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function recommendSize(
  variants: FashionVariant[],
  m: BodyMeasurements,
): RecommendResult | null {
  const h = Number(m.height);
  const w = Number(m.weight);
  const bust = Number(m.bust);
  const waist = Number(m.waist);
  const hip = Number(m.hip);

  const scored = CLOTHING_SIZES.map((size) => {
    const v = variants.find(
      (x) => x.size === size && x.is_active && x.stock > 0,
    );
    if (!v) return null;

    let score = 0;
    const reasons: string[] = [];

    if (v.height_min_cm && v.height_max_cm && h > 0) {
      if (h >= v.height_min_cm && h <= v.height_max_cm) {
        score += 4;
        reasons.push(
          `Chiều cao ${h}cm phù hợp (${v.height_min_cm}–${v.height_max_cm}cm)`,
        );
      }
    }
    if (v.chest_cm && bust > 0) {
      const d = Math.abs(v.chest_cm - bust);
      if (d <= 2) {
        score += 4;
        reasons.push("Vòng 1 khớp chính xác");
      } else if (d <= 5) {
        score += 2;
        reasons.push(`Vòng 1 khớp gần (±${d.toFixed(0)}cm)`);
      }
    }
    if (v.waist_cm && waist > 0) {
      const d = Math.abs(v.waist_cm - waist);
      if (d <= 2) {
        score += 4;
        reasons.push("Vòng 2 khớp chính xác");
      } else if (d <= 5) {
        score += 2;
        reasons.push(`Vòng 2 khớp gần (±${d.toFixed(0)}cm)`);
      }
    }
    if (v.hip_cm && hip > 0) {
      const d = Math.abs(v.hip_cm - hip);
      if (d <= 2) {
        score += 3;
        reasons.push("Vòng 3 khớp chính xác");
      } else if (d <= 5) {
        score += 1;
        reasons.push("Vòng 3 khớp gần");
      }
    }
    if (v.weight_min_kg && v.weight_max_kg && w > 0) {
      if (w >= v.weight_min_kg && w <= v.weight_max_kg) {
        score += 3;
        reasons.push(`Cân nặng ${w}kg phù hợp`);
      }
    }

    return { size, variant: v, score, matchReason: reasons };
  }).filter((x): x is RecommendResult => x !== null);

  scored.sort((a, b) => b.score - a.score);
  return scored[0] ?? null;
}

// ── Component ────────────────────────────────────────────────────────
const EMPTY_MEASUREMENTS: BodyMeasurements = {
  height: "",
  weight: "",
  bust: "",
  waist: "",
  hip: "",
};

export function AiFittingRoom() {
  const { tenantId } = useTenantModules();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [measurements, setMeasurements] =
    useState<BodyMeasurements>(EMPTY_MEASUREMENTS);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [tryOnColor, setTryOnColor] = useState<string>("");

  const { data: products = [] } = useQuery({
    queryKey: ["fashion_products", tenantId, "clothing"],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fashion_products")
        .select("id, name, brand, gender, category, base_price")
        .eq("tenant_id", tenantId!)
        .eq("category", "clothing")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as FashionProduct[];
    },
  });

  const { data: variants = [] } = useQuery({
    queryKey: ["fashion_variants", selectedProductId],
    enabled: !!selectedProductId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fashion_variants")
        .select(
          "id, size, color_name, chest_cm, waist_cm, hip_cm, height_min_cm, height_max_cm, weight_min_kg, weight_max_kg, price_delta, stock, is_active",
        )
        .eq("product_id", selectedProductId)
        .order("size");
      if (error) throw error;
      return data as FashionVariant[];
    },
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const colorOptions = Array.from(
    new Set(
      variants
        .filter((v) => v.is_active && v.color_name)
        .map((v) => v.color_name as string),
    ),
  );

  const runTryOn = useServerFn(generateTryOn);
  const tryOnMutation = useMutation({
    mutationFn: runTryOn,
    onSuccess: (res) => setTryOnImage(res.image),
    onError: (err: Error) => toast.error(err.message),
  });

  const setMeasure = (field: keyof BodyMeasurements, value: string) =>
    setMeasurements((p) => ({ ...p, [field]: value }));

  const handleAnalyze = () => {
    const res = recommendSize(variants, measurements);
    setResult(res);
    setHasSearched(true);
    setTryOnImage(null);
  };

  const handleTryOn = () => {
    if (!selectedProduct) return;
    tryOnMutation.mutate({
      data: {
        productName: selectedProduct.name,
        category: selectedProduct.category,
        gender: selectedProduct.gender,
        color: tryOnColor || colorOptions[0] || "",
        size: result?.size ?? "",
        material: "",
        notes: "",
      },
    });
  };

  return (
    <div className="space-y-6">
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Left: Input panel ── */}
      <div className="space-y-4">
        <Card className="border-emerald-900/30 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-emerald-400" />
              Chọn sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProductId}
              onValueChange={setSelectedProductId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn sản phẩm cần tư vấn size..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.brand ? ` — ${p.brand}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{selectedProduct.gender}</Badge>
                <Badge
                  variant="outline"
                  className="border-emerald-700 text-emerald-400"
                >
                  {selectedProduct.base_price.toLocaleString("vi-VN")}₫
                </Badge>
                <Badge variant="outline">
                  {variants.filter((v) => v.is_active).length} biến thể
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-900/30 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="h-4 w-4 text-emerald-400" />
              Số đo khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {(
              [
                ["height", "Chiều cao (cm)", "163"],
                ["weight", "Cân nặng (kg)", "52"],
                ["bust", "Vòng 1 — Ngực (cm)", "84"],
                ["waist", "Vòng 2 — Eo (cm)", "66"],
                ["hip", "Vòng 3 — Hông (cm)", "92"],
              ] as [keyof BodyMeasurements, string, string][]
            ).map(([field, label, placeholder]) => (
              <div key={field}>
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder={placeholder}
                  value={measurements[field]}
                  onChange={(e) => setMeasure(field, e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
            ))}
            <div className="col-span-2">
              <Button
                className="w-full bg-emerald-700 hover:bg-emerald-600"
                onClick={handleAnalyze}
                disabled={!selectedProductId}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Phân tích & Gợi ý Size
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Right: Result panel ── */}
      <Card className="border-emerald-900/30 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Kết quả phân tích</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Wand2 className="mb-3 h-10 w-10 opacity-30" />
              <p>
                Nhập số đo và chọn sản phẩm để AI gợi ý size phù hợp nhất
              </p>
            </div>
          )}

          {hasSearched && !result && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-yellow-500" />
              <p className="font-medium">Không tìm được size phù hợp</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sản phẩm có thể chưa nhập đủ thông số. Thử sản phẩm khác.
              </p>
            </div>
          )}

          {hasSearched && result && (
            <div className="space-y-5">
              <div className="rounded-xl border-2 border-emerald-600 bg-emerald-950/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">Size được gợi ý</p>
                <p className="my-2 text-5xl font-black text-emerald-400">
                  {result.size}
                </p>
                <Badge className="bg-emerald-700">
                  Điểm khớp: {result.score}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Lý do gợi ý:</p>
                {result.matchReason.length > 0 ? (
                  result.matchReason.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {r}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Size phổ biến nhất còn hàng.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">So sánh tất cả size:</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 text-left">Size</th>
                        <th className="p-2 text-center">Vòng 1</th>
                        <th className="p-2 text-center">Vòng 2</th>
                        <th className="p-2 text-center">Vòng 3</th>
                        <th className="p-2 text-center">Tồn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants
                        .filter((v) => v.is_active && v.stock > 0)
                        .map((v) => (
                          <tr
                            key={v.id}
                            className={`border-t border-border ${
                              v.size === result.size
                                ? "bg-emerald-950/40 font-semibold"
                                : ""
                            }`}
                          >
                            <td className="p-2">
                              {v.size}
                              {v.size === result.size && (
                                <span className="ml-1 text-emerald-400">★</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {v.chest_cm ?? "—"}
                            </td>
                            <td className="p-2 text-center">
                              {v.waist_cm ?? "—"}
                            </td>
                            <td className="p-2 text-center">
                              {v.hip_cm ?? "—"}
                            </td>
                            <td className="p-2 text-center">{v.stock}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* ── Virtual Try-On (AI visual preview) ── */}
      <Card className="border-emerald-900/30 bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Buồng thử đồ ảo AI — Xem trước trang phục
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedProductId ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Shirt className="mb-3 h-10 w-10 opacity-30" />
              <p>Chọn một sản phẩm để mô phỏng trang phục trên người mẫu ảo.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {colorOptions.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Màu sắc mô phỏng</Label>
                    <Select
                      value={tryOnColor || colorOptions[0]}
                      onValueChange={setTryOnColor}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Sản phẩm:</span>{" "}
                    {selectedProduct?.name}
                  </p>
                  {result && (
                    <p>
                      <span className="font-medium text-foreground">Size gợi ý:</span>{" "}
                      {result.size}
                    </p>
                  )}
                </div>
                <Button
                  className="w-full bg-emerald-700 hover:bg-emerald-600"
                  onClick={handleTryOn}
                  disabled={tryOnMutation.isPending}
                >
                  {tryOnMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo ảnh thử đồ...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Mô phỏng thử đồ AI
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  AI tạo ảnh người mẫu ảo mặc trang phục đã chọn để khách hình
                  dung trước khi mua.
                </p>
              </div>

              <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/20">
                {tryOnMutation.isPending ? (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <p className="text-sm">Đang dựng hình ảnh...</p>
                  </div>
                ) : tryOnImage ? (
                  <img
                    src={tryOnImage}
                    alt={`Mô phỏng thử đồ ${selectedProduct?.name ?? ""}`}
                    className="h-full max-h-[440px] w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Shirt className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Ảnh thử đồ sẽ hiển thị ở đây</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
