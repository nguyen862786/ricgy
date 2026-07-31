import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppConfig } from "@/hooks/useAppConfig";
import { industryOf, INDUSTRY_LIST } from "@/lib/industry";
import { vnd } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Package, X } from "lucide-react";
import { toast } from "sonner";

interface BundleItemDraft {
  product_id: string;
  quantity: number;
}
interface BundleDraft {
  id?: string;
  name: string;
  description: string;
  industry: string;
  store_id: string | null;
  bundle_price: number;
  is_active: boolean;
  items: BundleItemDraft[];
}

function emptyBundle(industry: string, storeId: string | null): BundleDraft {
  return {
    name: "",
    description: "",
    industry,
    store_id: storeId,
    bundle_price: 0,
    is_active: true,
    items: [],
  };
}

export function BundleManager() {
  const qc = useQueryClient();
  const { industry, storeId, stores } = useAppConfig();
  const [editing, setEditing] = useState<BundleDraft | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, list_price, sale_price, store_id")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ["bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bundles")
        .select("*, bundle_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const productMap = useMemo(() => {
    const m = new Map<string, any>();
    for (const p of products as any[]) m.set(p.id, p);
    return m;
  }, [products]);

  function priceOf(id: string): number {
    const p = productMap.get(id);
    if (!p) return 0;
    return Number(p.sale_price ?? p.list_price ?? 0);
  }

  function originalTotal(items: BundleItemDraft[]): number {
    return items.reduce((sum, it) => sum + priceOf(it.product_id) * (it.quantity || 0), 0);
  }

  function openEdit(b: any) {
    setEditing({
      id: b.id,
      name: b.name,
      description: b.description ?? "",
      industry: b.industry ?? industry,
      store_id: b.store_id ?? null,
      bundle_price: Number(b.bundle_price ?? 0),
      is_active: b.is_active,
      items: (b.bundle_items ?? []).map((i: any) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      })),
    });
  }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Cần tên combo");
    if (editing.items.length === 0) return toast.error("Combo cần ít nhất 1 sản phẩm bắt buộc");
    if (editing.items.some((i) => !i.product_id)) return toast.error("Vui lòng chọn đủ sản phẩm");

    const payload = {
      name: editing.name.trim(),
      description: editing.description || null,
      industry: editing.industry,
      store_id: editing.store_id,
      bundle_price: editing.bundle_price,
      is_active: editing.is_active,
    };

    let bundleId = editing.id;
    if (bundleId) {
      const { error } = await supabase.from("product_bundles").update(payload).eq("id", bundleId);
      if (error) return toast.error(error.message);
      await supabase.from("bundle_items").delete().eq("bundle_id", bundleId);
    } else {
      const { data, error } = await supabase
        .from("product_bundles")
        .insert(payload)
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      bundleId = data.id;
    }

    const itemsPayload = editing.items.map((i) => ({
      bundle_id: bundleId,
      product_id: i.product_id,
      quantity: i.quantity,
    }));
    const { error: itemsErr } = await supabase.from("bundle_items").insert(itemsPayload);
    if (itemsErr) return toast.error(itemsErr.message);

    toast.success("Đã lưu combo");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["bundles"] });
  }

  async function remove(id: string) {
    if (!confirm("Xóa combo này?")) return;
    await supabase.from("product_bundles").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["bundles"] });
  }

  const editTotal = editing ? originalTotal(editing.items) : 0;
  const savings = editing ? editTotal - editing.bundle_price : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Tạo combo bán kèm: chọn sản phẩm bắt buộc và đặt giá combo theo ngành hàng.
        </p>
        <Button onClick={() => setEditing(emptyBundle(industry, storeId))}>
          <Plus className="mr-2 h-4 w-4" /> Thêm combo
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Combo</TableHead>
              <TableHead>Ngành</TableHead>
              <TableHead className="text-right">Số SP</TableHead>
              <TableHead className="text-right">Giá gốc</TableHead>
              <TableHead className="text-right">Giá combo</TableHead>
              <TableHead className="text-right">Tiết kiệm</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bundles.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Chưa có combo
                </TableCell>
              </TableRow>
            )}
            {bundles.map((b) => {
              const items: BundleItemDraft[] = (b.bundle_items ?? []).map((i: any) => ({
                product_id: i.product_id,
                quantity: i.quantity,
              }));
              const orig = originalTotal(items);
              const save = orig - Number(b.bundle_price ?? 0);
              return (
                <TableRow key={b.id} className="cursor-pointer" onClick={() => openEdit(b)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {b.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {industryOf(b.industry).emoji} {industryOf(b.industry).label}
                  </TableCell>
                  <TableCell className="text-right">{items.length}</TableCell>
                  <TableCell className="text-right text-muted-foreground line-through">
                    {vnd(orig)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{vnd(b.bundle_price)}</TableCell>
                  <TableCell className="text-right text-success">
                    {save > 0 ? vnd(save) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.is_active ? "default" : "secondary"}>
                      {b.is_active ? "Hoạt động" : "Tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" onClick={() => remove(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Sửa combo" : "Thêm combo"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tên combo *</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="VD: Combo cà phê + bánh"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ngành hàng</Label>
                  <Select
                    value={editing.industry}
                    onValueChange={(v) => setEditing({ ...editing, industry: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_LIST.map((i) => (
                        <SelectItem key={i.key} value={i.key}>
                          {i.emoji} {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Cửa hàng áp dụng</Label>
                <Select
                  value={editing.store_id ?? "all"}
                  onValueChange={(v) =>
                    setEditing({ ...editing, store_id: v === "all" ? null : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả cửa hàng</SelectItem>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Mô tả</Label>
                <Textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Sản phẩm bắt buộc</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        items: [...editing.items, { product_id: "", quantity: 1 }],
                      })
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Thêm SP
                  </Button>
                </div>
                {editing.items.length === 0 && (
                  <p className="text-sm text-muted-foreground">Chưa có sản phẩm nào.</p>
                )}
                {editing.items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={it.product_id}
                      onValueChange={(v) => {
                        const items = [...editing.items];
                        items[idx] = { ...items[idx], product_id: v };
                        setEditing({ ...editing, items });
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Chọn sản phẩm" />
                      </SelectTrigger>
                      <SelectContent>
                        {(products as any[]).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {vnd(p.sale_price ?? p.list_price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      className="w-20"
                      value={it.quantity}
                      onChange={(e) => {
                        const items = [...editing.items];
                        items[idx] = { ...items[idx], quantity: Math.max(1, +e.target.value) };
                        setEditing({ ...editing, items });
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setEditing({ ...editing, items: editing.items.filter((_, i) => i !== idx) })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Giá combo (VNĐ) *</Label>
                  <Input
                    type="number"
                    value={editing.bundle_price}
                    onChange={(e) => setEditing({ ...editing, bundle_price: +e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tổng giá gốc</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
                    {vnd(editTotal)}
                  </div>
                </div>
              </div>
              <div className="rounded-md bg-muted/40 p-3 text-sm">
                Khách tiết kiệm:{" "}
                <span
                  className={
                    savings > 0 ? "font-semibold text-success" : "font-semibold text-destructive"
                  }
                >
                  {vnd(savings)}
                </span>
                {editTotal > 0 && savings > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({Math.round((savings / editTotal) * 100)}%)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Kích hoạt combo</Label>
                <Switch
                  checked={editing.is_active}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Hủy
            </Button>
            <Button onClick={save}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
