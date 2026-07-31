import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppConfig } from "@/hooks/useAppConfig";
import { industryOf, IndustryField } from "@/lib/industry";
import { ProductMedia, MediaItem } from "@/components/ProductMedia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vnd } from "@/lib/format";
import { Plus, Pencil, Trash2, Copy, Layers } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/products")({
  component: ProductsPage,
});

type Product = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  image_url: string | null;
  media: MediaItem[];
  list_price: number;
  sale_price: number | null;
  cashback_type: "percent" | "fixed";
  cashback_value: number;
  affiliate_rate_percent: number;
  agent_rate_percent: number;
  stock: number;
  store_id: string | null;
  is_active: boolean;
};

function emptyProduct(storeId: string | null): Partial<Product> {
  return {
    name: "",
    sku: "",
    description: "",
    image_url: "",
    media: [],
    list_price: 0,
    sale_price: null,
    cashback_type: "percent",
    cashback_value: 0,
    affiliate_rate_percent: 0,
    agent_rate_percent: 0,
    stock: 0,
    store_id: storeId,
    is_active: true,
  };
}

function ProductsPage() {
  const { isStaff } = useAuth();
  const { industry, storeId, stores } = useAppConfig();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const cfg = industryOf(industry);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Product[]).map((p) => ({
        ...p,
        media: (p.media ?? []) as MediaItem[],
      }));
    },
  });

  async function save(): Promise<string | null> {
    if (!editing) return null;
    const payload: any = { ...editing };
    delete payload.id;
    delete payload.media; // managed separately by ProductMedia
    if (!payload.name) {
      toast.error("Cần tên sản phẩm");
      return null;
    }
    if (editing.id) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        return null;
      }
      toast.success("Đã lưu");
      qc.invalidateQueries({ queryKey: ["products"] });
      return editing.id;
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error) {
        toast.error(error.message);
        return null;
      }
      toast.success("Đã tạo");
      qc.invalidateQueries({ queryKey: ["products"] });
      setEditing({ ...editing, id: data.id });
      return data.id;
    }
  }

  async function remove(id: string) {
    if (!confirm("Xóa sản phẩm này?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Đã xóa");
      qc.invalidateQueries({ queryKey: ["products"] });
    }
  }

  async function clone(p: Product) {
    const { id, ...rest } = p as any;
    rest.name = `${p.name} (bản sao)`;
    rest.sku = p.sku ? `${p.sku}-COPY` : null;
    const { data, error } = await supabase.from("products").insert(rest).select("id").single();
    if (error) return toast.error(error.message);
    // sao chép biến thể
    const { data: variants } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", p.id);
    if (variants && variants.length > 0) {
      const newVariants = variants.map((v: any) => {
        const { id: _vid, created_at, updated_at, ...vr } = v;
        return { ...vr, product_id: data.id };
      });
      await supabase.from("product_variants").insert(newVariants);
    }
    toast.success("Đã nhân bản sản phẩm");
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  const storeName = (sid: string | null) => stores.find((s) => s.id === sid)?.name ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Sản phẩm</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} sản phẩm · Ngành: {cfg.emoji} {cfg.label}
          </p>
        </div>
        {isStaff && (
          <Button onClick={() => setEditing(emptyProduct(storeId))}>
            <Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Cửa hàng</TableHead>
              <TableHead className="text-right">Giá</TableHead>
              <TableHead className="text-right">Cashback</TableHead>
              <TableHead>Trạng thái</TableHead>
              {isStaff && <TableHead className="w-40" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Chưa có sản phẩm
                </TableCell>
              </TableRow>
            )}
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.sku || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {storeName(p.store_id)}
                </TableCell>
                <TableCell className="text-right">{vnd(p.sale_price ?? p.list_price)}</TableCell>
                <TableCell className="text-right">
                  {p.cashback_type === "percent" ? `${p.cashback_value}%` : vnd(p.cashback_value)}
                </TableCell>
                <TableCell>
                  <Badge variant={p.is_active ? "default" : "secondary"}>
                    {p.is_active ? "Đang bán" : "Tạm ngưng"}
                  </Badge>
                </TableCell>
                {isStaff && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" title="Sửa" onClick={() => setEditing(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Nhân bản" onClick={() => clone(p)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Xóa" onClick={() => remove(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Tên *</Label>
                <Input
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input
                  value={editing.sku ?? ""}
                  onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cửa hàng</Label>
                <Select
                  value={editing.store_id ?? "none"}
                  onValueChange={(v) =>
                    setEditing({ ...editing, store_id: v === "none" ? null : v })
                  }
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
              <div className="space-y-1.5 md:col-span-2">
                <Label>Ảnh URL</Label>
                <Input
                  value={editing.image_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giá niêm yết</Label>
                <Input
                  type="number"
                  value={editing.list_price ?? 0}
                  onChange={(e) => setEditing({ ...editing, list_price: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giá bán</Label>
                <Input
                  type="number"
                  value={editing.sale_price ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      sale_price: e.target.value === "" ? null : +e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Loại Cashback</Label>
                <Select
                  value={editing.cashback_type}
                  onValueChange={(v) => setEditing({ ...editing, cashback_type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Phần trăm (%)</SelectItem>
                    <SelectItem value="fixed">Cố định (VNĐ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Giá trị Cashback</Label>
                <Input
                  type="number"
                  value={editing.cashback_value ?? 0}
                  onChange={(e) => setEditing({ ...editing, cashback_value: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>% Hoa hồng Affiliate</Label>
                <Input
                  type="number"
                  value={editing.affiliate_rate_percent ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, affiliate_rate_percent: +e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>% Hoa hồng Đại lý</Label>
                <Input
                  type="number"
                  value={editing.agent_rate_percent ?? 0}
                  onChange={(e) => setEditing({ ...editing, agent_rate_percent: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tồn kho</Label>
                <Input
                  type="number"
                  value={editing.stock ?? 0}
                  onChange={(e) => setEditing({ ...editing, stock: +e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editing.is_active}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
                <Label>Đang bán</Label>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>

              {editing.id ? (
                <div className="md:col-span-2 border-t pt-3">
                  <ProductMedia productId={editing.id} media={editing.media ?? []} />
                </div>
              ) : (
                <p className="md:col-span-2 text-xs text-muted-foreground border-t pt-3">
                  💡 Lưu sản phẩm trước để thêm thư viện ảnh/video.
                </p>
              )}

              {editing.id ? (
                <div className="md:col-span-2 border-t pt-3">
                  <VariantManager
                    productId={editing.id}
                    fields={cfg.variantFields}
                    hint={cfg.variantHint}
                  />
                </div>
              ) : (
                <p className="md:col-span-2 text-xs text-muted-foreground border-t pt-3">
                  💡 Lưu sản phẩm trước để cấu hình biến thể ({cfg.label}).
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Đóng
            </Button>
            <Button onClick={() => save()}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VariantManager({
  productId,
  fields,
  hint,
}: {
  productId: string;
  fields: IndustryField[];
  hint: string;
}) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState<any>(null);

  const { data: variants = [] } = useQuery({
    queryKey: ["variants", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("created_at");
      return data ?? [];
    },
  });

  function newVariant() {
    setAdding({ name: "", sku: "", price_delta: 0, stock: 0, is_active: true, attributes: {} });
  }

  async function saveVariant() {
    if (!adding.name) return toast.error("Cần tên biến thể");
    const payload = { ...adding, product_id: productId };
    const id = payload.id;
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    const op = id
      ? supabase.from("product_variants").update(payload).eq("id", id)
      : supabase.from("product_variants").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Đã lưu biến thể");
    setAdding(null);
    qc.invalidateQueries({ queryKey: ["variants", productId] });
  }

  async function removeVariant(id: string) {
    await supabase.from("product_variants").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["variants", productId] });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <Layers className="h-4 w-4" /> Biến thể
        </Label>
        <Button size="sm" variant="outline" onClick={newVariant}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Thêm biến thể
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {variants.length > 0 && (
        <div className="rounded-md border divide-y">
          {variants.map((v: any) => (
            <div key={v.id} className="flex items-center gap-2 p-2 text-sm">
              <div className="flex-1">
                <div className="font-medium">{v.name}</div>
                <div className="text-xs text-muted-foreground">
                  {Object.entries(v.attributes || {})
                    .map(([k, val]) => `${k}: ${val}`)
                    .join(" · ") || "—"}
                  {" · "}+{vnd(v.price_delta)} · tồn {v.stock}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setAdding({ ...v })}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => removeVariant(v.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!adding} onOpenChange={(o) => !o && setAdding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Biến thể</DialogTitle>
          </DialogHeader>
          {adding && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Tên biến thể *</Label>
                <Input
                  value={adding.name}
                  onChange={(e) => setAdding({ ...adding, name: e.target.value })}
                  placeholder="VD: Size L - Ít đá"
                />
              </div>
              {fields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  {f.type === "select" ? (
                    <Select
                      value={adding.attributes?.[f.key] ?? ""}
                      onValueChange={(v) =>
                        setAdding({ ...adding, attributes: { ...adding.attributes, [f.key]: v } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        {(f.options ?? []).map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={adding.attributes?.[f.key] ?? ""}
                      onChange={(e) =>
                        setAdding({
                          ...adding,
                          attributes: { ...adding.attributes, [f.key]: e.target.value },
                        })
                      }
                    />
                  )}
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input
                  value={adding.sku ?? ""}
                  onChange={(e) => setAdding({ ...adding, sku: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Chênh giá (+VNĐ)</Label>
                <Input
                  type="number"
                  value={adding.price_delta}
                  onChange={(e) => setAdding({ ...adding, price_delta: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tồn kho</Label>
                <Input
                  type="number"
                  value={adding.stock}
                  onChange={(e) => setAdding({ ...adding, stock: +e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(null)}>
              Hủy
            </Button>
            <Button onClick={saveVariant}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
