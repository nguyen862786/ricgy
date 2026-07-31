import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantModules } from "@/hooks/useTenantModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ChevronLeft, ChevronRight, Check, Grid3x3 } from "lucide-react";

// ── Local types ──────────────────────────────────────────────────────
type Gender = "male" | "female" | "kids" | "unisex";
type Category =
  | "clothing"
  | "glasses"
  | "watch"
  | "hair_clip"
  | "bag"
  | "accessories";

type BasicInfo = {
  name: string;
  brand: string;
  gender: Gender;
  category: Category;
  description: string;
  basePrice: string;
};

type ColorDef = { id: string; name: string; hex: string };

type SizeMeasurement = {
  chestCm: string;
  waistCm: string;
  hipCm: string;
  lengthCm: string;
  heightMinCm: string;
  heightMaxCm: string;
  weightMinKg: string;
  weightMaxKg: string;
};

type MatrixCell = { stock: string; priceDelta: string };
type VariantMatrix = Record<string, Record<string, MatrixCell>>;

// ── Constants ────────────────────────────────────────────────────────
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const NON_CLOTHING_SIZES = ["FREE"];
const STEPS = [
  "Thông tin cơ bản",
  "Màu sắc & Chất liệu",
  "Kích cỡ & Số đo",
  "Ma trận SKU",
];

const MATERIAL_SUGGESTIONS = [
  "Cotton",
  "Linen",
  "Lụa",
  "Denim",
  "Len",
  "Kaki",
  "Polyester",
  "Da",
];

const EMPTY_BASIC: BasicInfo = {
  name: "",
  brand: "",
  gender: "unisex",
  category: "clothing",
  description: "",
  basePrice: "",
};

const EMPTY_MEASURE: SizeMeasurement = {
  chestCm: "",
  waistCm: "",
  hipCm: "",
  lengthCm: "",
  heightMinCm: "",
  heightMaxCm: "",
  weightMinKg: "",
  weightMaxKg: "",
};

// ── Component ────────────────────────────────────────────────────────
export function ProductMatrix() {
  const { tenantId } = useTenantModules();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(EMPTY_BASIC);
  const [colors, setColors] = useState<ColorDef[]>([]);
  const [draftColor, setDraftColor] = useState({ name: "", hex: "#4a7c59" });
  const [materials, setMaterials] = useState<string[]>([]);
  const [draftMaterial, setDraftMaterial] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [measurements, setMeasurements] = useState<
    Record<string, SizeMeasurement>
  >({});
  const [matrix, setMatrix] = useState<VariantMatrix>({});

  const isClothing = basicInfo.category === "clothing";
  const availableSizes = isClothing ? CLOTHING_SIZES : NON_CLOTHING_SIZES;

  // At least one (possibly empty) material so the matrix always has a dimension
  const effectiveMaterials = materials.length > 0 ? materials : [""];
  const cellKey = (colorId: string, material: string) =>
    material ? `${colorId}|${material}` : colorId;

  // Regenerate matrix keys when colors or sizes change (preserving existing values)
  useEffect(() => {
    setMatrix((prev) => {
      const next: VariantMatrix = {};
      const mats = materials.length > 0 ? materials : [""];
      for (const color of colors) {
        for (const material of mats) {
          const key = material ? `${color.id}|${material}` : color.id;
          next[key] = {};
          for (const size of selectedSizes) {
            next[key][size] = prev[key]?.[size] ?? {
              stock: "0",
              priceDelta: "0",
            };
          }
        }
      }
      return next;
    });
  }, [colors, selectedSizes, materials]);

  // Auto-select FREE size for non-clothing categories
  useEffect(() => {
    if (!isClothing) setSelectedSizes(["FREE"]);
    else setSelectedSizes([]);
  }, [isClothing]);

  const addColor = () => {
    if (!draftColor.name.trim()) return;
    setColors((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: draftColor.name.trim(), hex: draftColor.hex },
    ]);
    setDraftColor({ name: "", hex: "#4a7c59" });
  };

  const removeColor = (id: string) =>
    setColors((prev) => prev.filter((c) => c.id !== id));

  const addMaterial = (name: string) => {
    const v = name.trim();
    if (!v || materials.includes(v)) return;
    setMaterials((prev) => [...prev, v]);
    setDraftMaterial("");
  };

  const removeMaterial = (name: string) =>
    setMaterials((prev) => prev.filter((m) => m !== name));

  const toggleSize = (size: string) =>
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );

  const setMeasure = (
    size: string,
    field: keyof SizeMeasurement,
    value: string,
  ) =>
    setMeasurements((prev) => ({
      ...prev,
      [size]: { ...(prev[size] ?? EMPTY_MEASURE), [field]: value },
    }));

  const setCell = (
    key: string,
    size: string,
    field: keyof MatrixCell,
    value: string,
  ) =>
    setMatrix((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [size]: {
          ...(prev[key]?.[size] ?? { stock: "0", priceDelta: "0" }),
          [field]: value,
        },
      },
    }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Chưa xác định doanh nghiệp");

      const { data: product, error: prodErr } = await supabase
        .from("fashion_products")
        .insert({
          tenant_id: tenantId,
          name: basicInfo.name.trim(),
          brand: basicInfo.brand.trim() || null,
          gender: basicInfo.gender,
          category: basicInfo.category,
          description: basicInfo.description.trim() || null,
          base_price: Number(basicInfo.basePrice) || 0,
        })
        .select("id")
        .single();
      if (prodErr) throw prodErr;

      const variants = colors.flatMap((color) =>
        effectiveMaterials.flatMap((material) =>
          selectedSizes.map((size) => {
            const key = cellKey(color.id, material);
            const cell = matrix[key]?.[size];
            const m = measurements[size] ?? EMPTY_MEASURE;
            const matCode = material
              ? `-${material.replace(/\s+/g, "").toUpperCase().slice(0, 3)}`
              : "";
            return {
              tenant_id: tenantId,
              product_id: product.id,
              sku: `${product.id.slice(0, 6)}-${color.name.replace(/\s+/g, "").toUpperCase().slice(0, 4)}${matCode}-${size}`,
              size,
              color_name: color.name,
              color_hex: color.hex,
              chest_cm: m.chestCm ? Number(m.chestCm) : null,
              waist_cm: m.waistCm ? Number(m.waistCm) : null,
              hip_cm: m.hipCm ? Number(m.hipCm) : null,
              length_cm: m.lengthCm ? Number(m.lengthCm) : null,
              height_min_cm: m.heightMinCm ? Number(m.heightMinCm) : null,
              height_max_cm: m.heightMaxCm ? Number(m.heightMaxCm) : null,
              weight_min_kg: m.weightMinKg ? Number(m.weightMinKg) : null,
              weight_max_kg: m.weightMaxKg ? Number(m.weightMaxKg) : null,
              price_delta: Number(cell?.priceDelta) || 0,
              stock: Number(cell?.stock) || 0,
              attributes: material ? { material } : {},
            };
          }),
        ),
      );

      if (variants.length > 0) {
        const { error: varErr } = await supabase
          .from("fashion_variants")
          .insert(variants);
        if (varErr) throw varErr;
      }

      return product.id;
    },
    onSuccess: () => {
      toast.success("Sản phẩm đã được tạo thành công!");
      queryClient.invalidateQueries({ queryKey: ["fashion_products", tenantId] });
      setStep(0);
      setBasicInfo(EMPTY_BASIC);
      setColors([]);
      setMaterials([]);
      setSelectedSizes([]);
      setMeasurements({});
      setMatrix({});
    },
    onError: (err: Error) => toast.error(`Lỗi: ${err.message}`),
  });

  const canNext = () => {
    if (step === 0)
      return basicInfo.name.trim().length > 0 && basicInfo.basePrice.length > 0;
    if (step === 1) return colors.length > 0;
    if (step === 2) return selectedSizes.length > 0;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* ── Step indicator ── */}
      <div className="flex items-center">
        {STEPS.map((label, i) => (
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
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`mx-2 hidden text-xs font-medium sm:inline ${
                i === step ? "text-emerald-400" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-8 sm:w-12 ${i < step ? "bg-emerald-700" : "bg-muted"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Basic info ── */}
      {step === 0 && (
        <Card className="border-emerald-900/30 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Grid3x3 className="h-4 w-4 text-emerald-400" />
              Thông tin sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tên sản phẩm *</Label>
              <Input
                value={basicInfo.name}
                onChange={(e) =>
                  setBasicInfo((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Đầm hoa mùa hè..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Thương hiệu</Label>
              <Input
                value={basicInfo.brand}
                onChange={(e) =>
                  setBasicInfo((p) => ({ ...p, brand: e.target.value }))
                }
                placeholder="Élite Collection..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Giới tính</Label>
              <Select
                value={basicInfo.gender}
                onValueChange={(v) =>
                  setBasicInfo((p) => ({ ...p, gender: v as Gender }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="kids">Trẻ em</SelectItem>
                  <SelectItem value="unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Danh mục</Label>
              <Select
                value={basicInfo.category}
                onValueChange={(v) =>
                  setBasicInfo((p) => ({ ...p, category: v as Category }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clothing">Quần áo</SelectItem>
                  <SelectItem value="glasses">Kính mắt</SelectItem>
                  <SelectItem value="watch">Đồng hồ</SelectItem>
                  <SelectItem value="hair_clip">Phụ kiện tóc</SelectItem>
                  <SelectItem value="bag">Túi xách</SelectItem>
                  <SelectItem value="accessories">Phụ kiện khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Giá gốc (VND) *</Label>
              <Input
                type="number"
                min="0"
                value={basicInfo.basePrice}
                onChange={(e) =>
                  setBasicInfo((p) => ({ ...p, basePrice: e.target.value }))
                }
                placeholder="850000"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Mô tả</Label>
              <Textarea
                rows={3}
                value={basicInfo.description}
                onChange={(e) =>
                  setBasicInfo((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Chất liệu vải lụa mềm mại..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 1: Colors ── */}
      {step === 1 && (
        <Card className="border-emerald-900/30 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Thêm màu sắc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label>Mã màu</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draftColor.hex}
                    onChange={(e) =>
                      setDraftColor((p) => ({ ...p, hex: e.target.value }))
                    }
                    className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
                  />
                  <span className="font-mono text-sm text-muted-foreground">
                    {draftColor.hex}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tên màu</Label>
                <Input
                  value={draftColor.name}
                  onChange={(e) =>
                    setDraftColor((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Xanh Pastel"
                  className="w-40"
                  onKeyDown={(e) => e.key === "Enter" && addColor()}
                />
              </div>
              <Button
                onClick={addColor}
                disabled={!draftColor.name.trim()}
                className="bg-emerald-700 hover:bg-emerald-600"
              >
                <Plus className="mr-1 h-4 w-4" /> Thêm
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <Badge
                  key={c.id}
                  className="gap-2 pr-1 text-sm"
                  style={{
                    backgroundColor: c.hex + "33",
                    borderColor: c.hex,
                    color: "inherit",
                  }}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.name}
                  <button
                    onClick={() => removeColor(c.id)}
                    className="ml-1 rounded-full hover:bg-black/20"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {colors.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Chưa có màu nào. Hãy thêm ít nhất 1 màu.
                </p>
              )}
            </div>

            {/* ── Materials (chất liệu) ── */}
            <div className="space-y-3 border-t border-border pt-4">
              <Label>Chất liệu (tuỳ chọn — tạo ma trận theo chất liệu)</Label>
              <div className="flex flex-wrap items-end gap-3">
                <Input
                  value={draftMaterial}
                  onChange={(e) => setDraftMaterial(e.target.value)}
                  placeholder="VD: Lụa, Cotton..."
                  className="w-48"
                  onKeyDown={(e) =>
                    e.key === "Enter" && addMaterial(draftMaterial)
                  }
                />
                <Button
                  onClick={() => addMaterial(draftMaterial)}
                  disabled={!draftMaterial.trim()}
                  variant="outline"
                >
                  <Plus className="mr-1 h-4 w-4" /> Thêm chất liệu
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {MATERIAL_SUGGESTIONS.filter((m) => !materials.includes(m)).map(
                  (m) => (
                    <button
                      key={m}
                      onClick={() => addMaterial(m)}
                      className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-emerald-700 hover:text-emerald-300"
                    >
                      + {m}
                    </button>
                  ),
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {materials.map((m) => (
                  <Badge key={m} className="gap-2 pr-1 text-sm" variant="secondary">
                    {m}
                    <button
                      onClick={() => removeMaterial(m)}
                      className="ml-1 rounded-full hover:bg-black/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {materials.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Bỏ trống nếu sản phẩm chỉ có 1 chất liệu.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Sizes + measurements ── */}
      {step === 2 && (
        <Card className="border-emerald-900/30 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">
              Kích cỡ & Thông số kỹ thuật
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Chọn size</Label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedSizes.includes(size)
                        ? "border-emerald-500 bg-emerald-900/40 text-emerald-300"
                        : "border-border text-muted-foreground hover:border-emerald-700"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {isClothing && selectedSizes.length > 0 && (
              <div className="space-y-4">
                <Label>Thông số từng size (cm / kg)</Label>
                {selectedSizes.map((size) => (
                  <div
                    key={size}
                    className="rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <h4 className="mb-3 font-medium text-emerald-400">
                      Size {size}
                    </h4>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {(
                        [
                          ["chestCm", "Vòng 1 (cm)"],
                          ["waistCm", "Vòng 2 (cm)"],
                          ["hipCm", "Vòng 3 (cm)"],
                          ["lengthCm", "Chiều dài (cm)"],
                          ["heightMinCm", "Cao min (cm)"],
                          ["heightMaxCm", "Cao max (cm)"],
                          ["weightMinKg", "Nặng min (kg)"],
                          ["weightMaxKg", "Nặng max (kg)"],
                        ] as [keyof SizeMeasurement, string][]
                      ).map(([field, label]) => (
                        <div key={field} className="space-y-1">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="—"
                            value={measurements[size]?.[field] ?? ""}
                            onChange={(e) =>
                              setMeasure(size, field, e.target.value)
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: SKU matrix ── */}
      {step === 3 && (
        <Card className="border-emerald-900/30 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">
              Ma trận SKU — Tồn kho & Giá chênh lệch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {effectiveMaterials.map((material) => (
              <div key={material || "_default"} className="space-y-2">
                {material && (
                  <h4 className="text-sm font-semibold text-emerald-300">
                    Chất liệu: {material}
                  </h4>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 text-left font-medium text-muted-foreground">
                          Màu sắc
                        </th>
                        {selectedSizes.map((s) => (
                          <th
                            key={s}
                            className="min-w-[120px] pb-2 text-center font-medium text-emerald-400"
                          >
                            {s}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {colors.map((color) => {
                        const key = cellKey(color.id, material);
                        return (
                          <tr
                            key={color.id}
                            className="border-b border-border/50"
                          >
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-4 w-4 rounded-full"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span>{color.name}</span>
                              </div>
                            </td>
                            {selectedSizes.map((size) => (
                              <td key={size} className="px-2 py-3">
                                <div className="space-y-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="SL"
                                    value={matrix[key]?.[size]?.stock ?? "0"}
                                    onChange={(e) =>
                                      setCell(key, size, "stock", e.target.value)
                                    }
                                    className="h-8 text-center text-sm"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="±giá"
                                    value={
                                      matrix[key]?.[size]?.priceDelta ?? "0"
                                    }
                                    onChange={(e) =>
                                      setCell(
                                        key,
                                        size,
                                        "priceDelta",
                                        e.target.value,
                                      )
                                    }
                                    className="h-7 text-center text-xs text-muted-foreground"
                                  />
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <p className="mt-3 text-xs text-muted-foreground">
              Hàng đầu: số lượng tồn kho. Hàng dưới: chênh lệch giá so với giá
              gốc (có thể âm).
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Quay lại
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="bg-emerald-700 hover:bg-emerald-600"
          >
            Tiếp theo <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={
              saveMutation.isPending ||
              colors.length === 0 ||
              selectedSizes.length === 0
            }
            className="bg-emerald-700 hover:bg-emerald-600"
          >
            {saveMutation.isPending ? "Đang lưu..." : "Tạo sản phẩm"}
          </Button>
        )}
      </div>
    </div>
  );
}
