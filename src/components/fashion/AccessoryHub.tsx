import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantModules } from "@/hooks/useTenantModules";
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
import { toast } from "sonner";
import { Plus, Gem, Eye, EyeOff } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
type AccessoryCategory = "glasses" | "watch" | "hair_clip" | "bag";

type AttrField = {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
};

type AccessoryProduct = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  base_price: number;
  is_active: boolean;
};

type NewProduct = {
  name: string;
  brand: string;
  gender: string;
  base_price: string;
  description: string;
};

type AttrValues = Record<string, string | number | boolean>;

// ── Category schema ──────────────────────────────────────────────────
const ATTR_SCHEMA: Record<AccessoryCategory, AttrField[]> = {
  glasses: [
    {
      id: "frame_material",
      label: "Chất liệu gọng",
      type: "select",
      options: ["Nhựa acetate", "Kim loại", "Titanium", "TR90"],
    },
    {
      id: "lens_type",
      label: "Loại kính",
      type: "select",
      options: [
        "Trong suốt",
        "Chống nắng",
        "Chống ánh sáng xanh",
        "Đổi màu",
      ],
    },
    { id: "uv_protection", label: "Chuẩn chống UV", type: "text" },
    { id: "frame_width_mm", label: "Rộng gọng (mm)", type: "number" },
  ],
  watch: [
    {
      id: "movement",
      label: "Loại máy",
      type: "select",
      options: ["Quartz", "Automatic", "Manual", "Solar"],
    },
    { id: "water_resistance_m", label: "Chống nước (m)", type: "number" },
    { id: "case_material", label: "Vỏ đồng hồ", type: "text" },
    {
      id: "strap_material",
      label: "Dây đồng hồ",
      type: "select",
      options: ["Da thật", "Da PU", "Thép không gỉ", "Silicone"],
    },
  ],
  hair_clip: [
    {
      id: "material",
      label: "Chất liệu",
      type: "select",
      options: ["Nhựa resin", "Kim loại", "Vải", "Pha lê"],
    },
    {
      id: "style",
      label: "Kiểu dáng",
      type: "select",
      options: ["Cài cua", "Kẹp mái", "Cặp tóc", "Băng đô", "Chun tóc"],
    },
    {
      id: "size",
      label: "Kích cỡ",
      type: "select",
      options: ["Nhỏ", "Vừa", "Lớn", "Cỡ đại"],
    },
  ],
  bag: [
    {
      id: "material",
      label: "Chất liệu",
      type: "select",
      options: ["Da thật", "Da PU", "Canvas", "Vải dù", "Nylon"],
    },
    { id: "dimensions", label: "Kích thước (D×R×C)", type: "text" },
    { id: "compartments", label: "Số ngăn", type: "number" },
    { id: "has_laptop_slot", label: "Ngăn laptop", type: "boolean" },
  ],
};

const CATEGORY_TABS: {
  key: AccessoryCategory;
  label: string;
  emoji: string;
}[] = [
  { key: "glasses", label: "Kính mắt", emoji: "👓" },
  { key: "watch", label: "Đồng hồ", emoji: "⌚" },
  { key: "hair_clip", label: "Phụ kiện tóc", emoji: "🎀" },
  { key: "bag", label: "Túi xách", emoji: "👜" },
];

const EMPTY_PRODUCT: NewProduct = {
  name: "",
  brand: "",
  gender: "unisex",
  base_price: "",
  description: "",
};

// ── AttrFieldInput ───────────────────────────────────────────────────
function AttrFieldInput({
  field,
  value,
  onChange,
}: {
  field: AttrField;
  value: string | number | boolean | undefined;
  onChange: (val: string | number | boolean) => void;
}) {
  if (field.type === "boolean") {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => onChange(true)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            value === true
              ? "bg-emerald-700 text-white"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Có
        </button>
        <button
          onClick={() => onChange(false)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            value === false
              ? "bg-muted/80 text-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Không
        </button>
      </div>
    );
  }
  if (field.type === "select" && field.options) {
    return (
      <Select
        value={String(value ?? "")}
        onValueChange={(v) => onChange(v)}
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Chọn..." />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      type={field.type === "number" ? "number" : "text"}
      value={String(value ?? "")}
      onChange={(e) =>
        onChange(
          field.type === "number" ? Number(e.target.value) : e.target.value,
        )
      }
      className="h-8"
    />
  );
}

// ── Main component ───────────────────────────────────────────────────
export function AccessoryHub() {
  const { tenantId } = useTenantModules();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] =
    useState<AccessoryCategory>("glasses");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProduct>(EMPTY_PRODUCT);
  const [attrValues, setAttrValues] = useState<AttrValues>({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["fashion_products", tenantId, activeCategory],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fashion_products")
        .select("id, name, brand, category, base_price, is_active")
        .eq("tenant_id", tenantId!)
        .eq("category", activeCategory)
        .order("name");
      if (error) throw error;
      return data as AccessoryProduct[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Chưa xác định doanh nghiệp");
      const { data: product, error: pErr } = await supabase
        .from("fashion_products")
        .insert({
          tenant_id: tenantId,
          name: newProduct.name.trim(),
          brand: newProduct.brand.trim() || null,
          gender: newProduct.gender,
          category: activeCategory,
          description: newProduct.description.trim() || null,
          base_price: Number(newProduct.base_price) || 0,
        })
        .select("id")
        .single();
      if (pErr) throw pErr;

      const { error: vErr } = await supabase.from("fashion_variants").insert({
        tenant_id: tenantId,
        product_id: product.id,
        sku: `${activeCategory.toUpperCase().slice(0, 3)}-${product.id.slice(0, 6)}`,
        size: "FREE",
        attributes: attrValues,
        stock: 0,
      });
      if (vErr) throw vErr;
    },
    onSuccess: () => {
      toast.success("Đã thêm phụ kiện!");
      queryClient.invalidateQueries({
        queryKey: ["fashion_products", tenantId, activeCategory],
      });
      setShowAddForm(false);
      setNewProduct(EMPTY_PRODUCT);
      setAttrValues({});
    },
    onError: (err: Error) => toast.error(`Lỗi: ${err.message}`),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: string;
      is_active: boolean;
    }) => {
      const { error } = await supabase
        .from("fashion_products")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fashion_products", tenantId, activeCategory],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const fields = ATTR_SCHEMA[activeCategory];
  const activeTab = CATEGORY_TABS.find((t) => t.key === activeCategory)!;

  return (
    <div className="space-y-6">
      {/* ── Category tabs ── */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveCategory(tab.key);
              setShowAddForm(false);
              setAttrValues({});
            }}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === tab.key
                ? "border-emerald-500 bg-emerald-900/40 text-emerald-300"
                : "border-border text-muted-foreground hover:border-emerald-700"
            }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Add form ── */}
      {showAddForm && (
        <Card className="border-emerald-900/30 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gem className="h-4 w-4 text-emerald-400" />
              Thêm {activeTab.label} mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tên sản phẩm *</Label>
                <Input
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder={`${activeTab.emoji} Tên ${activeTab.label}...`}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Thương hiệu</Label>
                <Input
                  value={newProduct.brand}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, brand: e.target.value }))
                  }
                  placeholder="SunElite, TimeElite..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giới tính</Label>
                <Select
                  value={newProduct.gender}
                  onValueChange={(v) =>
                    setNewProduct((p) => ({ ...p, gender: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unisex">Unisex</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="male">Nam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Giá gốc (VND) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={newProduct.base_price}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, base_price: e.target.value }))
                  }
                  placeholder="1200000"
                />
              </div>
            </div>

            {/* Category-specific attribute fields */}
            <div className="space-y-3 rounded-lg border border-emerald-900/40 bg-emerald-950/10 p-4">
              <p className="text-sm font-medium text-emerald-400">
                Thông số đặc thù {activeTab.label}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {fields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <Label className="text-xs">{field.label}</Label>
                    <AttrFieldInput
                      field={field}
                      value={
                        attrValues[field.id] as
                          | string
                          | number
                          | boolean
                          | undefined
                      }
                      onChange={(val) =>
                        setAttrValues((p) => ({ ...p, [field.id]: val }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="flex-1"
              >
                Huỷ
              </Button>
              <Button
                className="flex-1 bg-emerald-700 hover:bg-emerald-600"
                onClick={() => addMutation.mutate()}
                disabled={
                  addMutation.isPending ||
                  !newProduct.name.trim() ||
                  !newProduct.base_price
                }
              >
                {addMutation.isPending ? "Đang lưu..." : "Thêm sản phẩm"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Product list ── */}
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">
            {activeTab.emoji} {activeTab.label}
            {!isLoading && (
              <Badge
                variant="outline"
                className="ml-2 text-xs text-muted-foreground"
              >
                {products.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowAddForm((p) => !p)}
            className="bg-emerald-700 hover:bg-emerald-600"
          >
            <Plus className="mr-1 h-4 w-4" />
            Thêm mới
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          )}
          {!isLoading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Gem className="mb-2 h-8 w-8 opacity-30" />
              <p>Chưa có sản phẩm nào trong danh mục này.</p>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border p-4 transition-all ${
                  p.is_active
                    ? "border-border/60 bg-card hover:border-emerald-800"
                    : "border-border/30 bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    {p.brand && (
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      toggleActiveMutation.mutate({
                        id: p.id,
                        is_active: !p.is_active,
                      })
                    }
                    className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                    title={p.is_active ? "Ẩn sản phẩm" : "Hiện sản phẩm"}
                  >
                    {p.is_active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-emerald-800 text-xs text-emerald-400"
                  >
                    {p.base_price.toLocaleString("vi-VN")}₫
                  </Badge>
                  {!p.is_active && (
                    <Badge
                      variant="outline"
                      className="text-xs text-muted-foreground"
                    >
                      Ẩn
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
