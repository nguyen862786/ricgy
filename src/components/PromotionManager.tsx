import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppConfig } from "@/hooks/useAppConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Promotion,
  PromotionType,
  PROMO_TYPE_LABEL,
  minutesToHHMM,
  hhmmToMinutes,
} from "@/lib/promotions";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function emptyPromotion(type: PromotionType, storeId: string | null): Partial<Promotion> {
  return {
    name: "",
    type,
    store_id: storeId,
    is_active: true,
    discount_percent: type === "buy_x_get_y" ? 0 : 10,
    weekdays: [],
    product_ids: [],
    priority: 0,
    buy_qty: type === "buy_x_get_y" ? 1 : null,
    get_qty: type === "buy_x_get_y" ? 1 : null,
  };
}

export function PromotionManager() {
  const qc = useQueryClient();
  const { storeId, stores } = useAppConfig();
  const [editing, setEditing] = useState<Partial<Promotion> | null>(null);

  const { data: promotions = [] } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data as unknown as Promotion[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-min"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["tiers-min"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_tiers").select("name").order("sort_order");
      return (data ?? []) as { name: string }[];
    },
  });

  async function save() {
    if (!editing) return;
    const payload: any = { ...editing };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    if (!payload.name) return toast.error("Cần tên chương trình");
    if (!payload.product_ids?.length) payload.product_ids = null;
    if (!payload.weekdays?.length) payload.weekdays = null;
    const op = editing.id
      ? supabase.from("promotions").update(payload).eq("id", editing.id)
      : supabase.from("promotions").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Đã lưu chương trình");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["promotions"] });
  }

  async function remove(id: string) {
    if (!confirm("Xóa chương trình này?")) return;
    await supabase.from("promotions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["promotions"] });
  }

  function toggleWeekday(d: number) {
    if (!editing) return;
    const cur = editing.weekdays ?? [];
    setEditing({
      ...editing,
      weekdays: cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d],
    });
  }

  function toggleProduct(id: string) {
    if (!editing) return;
    const cur = editing.product_ids ?? [];
    setEditing({
      ...editing,
      product_ids: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    });
  }

  const isTimeWindow = editing?.type === "flash_sale" || editing?.type === "happy_hour";
  const storeName = (sid: string | null | undefined) =>
    stores.find((s) => s.id === sid)?.name ?? "Tất cả CH";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {(["flash_sale", "happy_hour", "buy_x_get_y", "tier_discount"] as PromotionType[]).map(
          (t) => (
            <Button
              key={t}
              size="sm"
              variant="outline"
              onClick={() => setEditing(emptyPromotion(t, storeId))}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> {PROMO_TYPE_LABEL[t]}
            </Button>
          ),
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Cửa hàng</TableHead>
              <TableHead>Ưu đãi</TableHead>
              <TableHead>Hiệu lực</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Chưa có chương trình nâng cao
                </TableCell>
              </TableRow>
            )}
            {promotions.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => setEditing(p)}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    {p.name}
                    {p.is_qiclub_synced && (
                      <Badge variant="secondary" className="text-[10px]">
                        QiClub
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{PROMO_TYPE_LABEL[p.type]}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {storeName(p.store_id)}
                </TableCell>
                <TableCell className="text-sm">
                  {p.type === "buy_x_get_y"
                    ? `Mua ${p.buy_qty} tặng ${p.get_qty}`
                    : `-${p.discount_percent}%`}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {p.daily_start_min != null
                    ? `${minutesToHHMM(p.daily_start_min)}–${minutesToHHMM(p.daily_end_min)}`
                    : "Cả ngày"}
                  {p.weekdays?.length ? ` · ${p.weekdays.map((d) => WEEKDAYS[d]).join(",")}` : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={p.is_active ? "default" : "secondary"}>
                    {p.is_active ? "Bật" : "Tắt"}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Sửa" : "Thêm"} ·{" "}
              {editing && PROMO_TYPE_LABEL[editing.type as PromotionType]}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label>Tên chương trình *</Label>
                <Input
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cửa hàng</Label>
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
                  <Label>Ưu tiên</Label>
                  <Input
                    type="number"
                    value={editing.priority ?? 0}
                    onChange={(e) => setEditing({ ...editing, priority: +e.target.value })}
                  />
                </div>
              </div>

              {editing.type === "buy_x_get_y" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Mua (X)</Label>
                    <Input
                      type="number"
                      value={editing.buy_qty ?? 1}
                      onChange={(e) => setEditing({ ...editing, buy_qty: +e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tặng (Y)</Label>
                    <Input
                      type="number"
                      value={editing.get_qty ?? 1}
                      onChange={(e) => setEditing({ ...editing, get_qty: +e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>% Giảm</Label>
                    <Input
                      type="number"
                      value={editing.discount_percent ?? 0}
                      onChange={(e) =>
                        setEditing({ ...editing, discount_percent: +e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Giảm tối đa (VNĐ)</Label>
                    <Input
                      type="number"
                      value={editing.max_discount_amount ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          max_discount_amount: e.target.value === "" ? null : +e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {editing.type === "tier_discount" && (
                <div className="space-y-1.5">
                  <Label>Hạng áp dụng</Label>
                  <Select
                    value={editing.tier_name ?? "all"}
                    onValueChange={(v) =>
                      setEditing({ ...editing, tier_name: v === "all" ? null : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Mọi hạng</SelectItem>
                      {tiers.map((t) => (
                        <SelectItem key={t.name} value={t.name}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Bắt đầu</Label>
                  <Input
                    type="datetime-local"
                    value={editing.starts_at ? editing.starts_at.slice(0, 16) : ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        starts_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Kết thúc</Label>
                  <Input
                    type="datetime-local"
                    value={editing.ends_at ? editing.ends_at.slice(0, 16) : ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        ends_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
              </div>

              {isTimeWindow && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Khung giờ từ</Label>
                    <Input
                      type="time"
                      value={minutesToHHMM(editing.daily_start_min)}
                      onChange={(e) =>
                        setEditing({ ...editing, daily_start_min: hhmmToMinutes(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Đến</Label>
                    <Input
                      type="time"
                      value={minutesToHHMM(editing.daily_end_min)}
                      onChange={(e) =>
                        setEditing({ ...editing, daily_end_min: hhmmToMinutes(e.target.value) })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Ngày trong tuần (trống = mọi ngày)</Label>
                <div className="flex flex-wrap gap-1">
                  {WEEKDAYS.map((w, d) => (
                    <Button
                      key={d}
                      type="button"
                      size="sm"
                      variant={(editing.weekdays ?? []).includes(d) ? "default" : "outline"}
                      onClick={() => toggleWeekday(d)}
                    >
                      {w}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Sản phẩm áp dụng ({(editing.product_ids ?? []).length || "tất cả"})</Label>
                <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                  {products.length === 0 && (
                    <p className="text-xs text-muted-foreground">Chưa có sản phẩm</p>
                  )}
                  {products.map((pr) => (
                    <label
                      key={pr.id}
                      className="flex cursor-pointer items-center gap-2 py-1 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={(editing.product_ids ?? []).includes(pr.id)}
                        onChange={() => toggleProduct(pr.id)}
                      />
                      {pr.name}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Trống = áp dụng toàn bộ sản phẩm.</p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editing.is_active}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
                <Label>Đang bật</Label>
              </div>

              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Đồng bộ hệ sinh thái QiClub</Label>
                    <p className="text-xs text-muted-foreground">
                      Voucher có tiền tố sẽ được xác thực & đối soát với QiClub.
                    </p>
                  </div>
                  <Switch
                    checked={!!editing.is_qiclub_synced}
                    onCheckedChange={(v) => setEditing({ ...editing, is_qiclub_synced: v })}
                  />
                </div>
                {editing.is_qiclub_synced && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Tiền tố mã voucher QiClub</Label>
                      <Input
                        placeholder="VD: QIC"
                        value={editing.qiclub_prefix ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, qiclub_prefix: e.target.value.toUpperCase() })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>% QiClub</Label>
                        <Input
                          type="number"
                          value={editing.qiclub_subsidy_ratio ?? 0}
                          onChange={(e) =>
                            setEditing({ ...editing, qiclub_subsidy_ratio: +e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>% Tổng Cty</Label>
                        <Input
                          type="number"
                          value={editing.company_subsidy_ratio ?? 0}
                          onChange={(e) =>
                            setEditing({ ...editing, company_subsidy_ratio: +e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>% Cửa hàng</Label>
                        <Input
                          type="number"
                          value={editing.store_subsidy_ratio ?? 0}
                          onChange={(e) =>
                            setEditing({ ...editing, store_subsidy_ratio: +e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tổng tỷ lệ tài trợ:{" "}
                      {(editing.qiclub_subsidy_ratio ?? 0) +
                        (editing.company_subsidy_ratio ?? 0) +
                        (editing.store_subsidy_ratio ?? 0)}
                      % (nên bằng 100%).
                    </p>
                  </div>
                )}
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
