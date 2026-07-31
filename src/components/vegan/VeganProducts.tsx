import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vnd } from "@/lib/format";
import {
  CATEGORY_LABEL,
  STORAGE_LABEL,
  expiryLevel,
  daysUntil,
  type VeganCategory,
  type StorageCondition,
} from "@/lib/vegan";
import { Plus, Snowflake, Sun, Boxes } from "lucide-react";
import { toast } from "sonner";

export function VeganProducts() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | VeganCategory>("all");
  const [addProduct, setAddProduct] = useState(false);
  const [batchFor, setBatchFor] = useState<{ id: string; name: string } | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["vegan-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vegan_products")
        .select("*, vegan_batches(id, batch_number, mfg_date, exp_date, quantity_produced)")
        .order("sku");
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = tab === "all" ? products : products.filter((p) => p.category === tab);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{products.length} SKU thực phẩm chay</p>
        <Button size="sm" onClick={() => setAddProduct(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Thêm sản phẩm
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="cha_chay">Chả chay (mít)</TabsTrigger>
          <TabsTrigger value="nhu_yeu_pham">Nhu yếu phẩm</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Bảo quản</TableHead>
              <TableHead className="text-right">Giá bán</TableHead>
              <TableHead>Lô mới nhất (NSX → HSD)</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Chưa có sản phẩm
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const batches = (p.vegan_batches ?? []) as any[];
              const latest = batches
                .slice()
                .sort((a, b) => new Date(b.exp_date).getTime() - new Date(a.exp_date).getTime())[0];
              const lvl = latest ? expiryLevel(latest.exp_date) : "ok";
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs font-medium">{p.sku}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{CATEGORY_LABEL[p.category as VeganCategory]}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm">
                      {p.storage_condition === "frozen" ? (
                        <Snowflake className="h-3.5 w-3.5 text-sky-500" />
                      ) : (
                        <Sun className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      {STORAGE_LABEL[p.storage_condition as StorageCondition]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{vnd(p.price)}</TableCell>
                  <TableCell className="text-sm">
                    {latest ? (
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{latest.batch_number}</span>
                        <span
                          className={
                            lvl === "expired"
                              ? "text-destructive"
                              : lvl === "soon"
                                ? "text-warning"
                                : "text-muted-foreground"
                          }
                        >
                          {latest.mfg_date} → {latest.exp_date}
                          {lvl !== "ok" &&
                            ` (${daysUntil(latest.exp_date) < 0 ? "hết hạn" : `${daysUntil(latest.exp_date)}d`})`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Chưa có lô</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setBatchFor({ id: p.id, name: p.name })}
                    >
                      <Boxes className="mr-1 h-4 w-4" /> Lô ({batches.length})
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {addProduct && (
        <AddProductDialog
          onClose={() => setAddProduct(false)}
          onDone={() => {
            setAddProduct(false);
            qc.invalidateQueries({ queryKey: ["vegan-products"] });
          }}
        />
      )}
      {batchFor && (
        <AddBatchDialog
          product={batchFor}
          onClose={() => setBatchFor(null)}
          onDone={() => {
            setBatchFor(null);
            qc.invalidateQueries({ queryKey: ["vegan-products"] });
          }}
        />
      )}
    </div>
  );
}

function AddProductDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "cha_chay" as VeganCategory,
    storage_condition: "frozen" as StorageCondition,
    unit: "cây",
    price: 0,
    cost: 0,
  });
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm chay</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="SKU">
            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </Field>
          <Field label="Tên sản phẩm">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Danh mục">
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v as VeganCategory })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cha_chay">Chả chay (mít)</SelectItem>
                <SelectItem value="nhu_yeu_pham">Nhu yếu phẩm</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Điều kiện bảo quản">
            <Select
              value={form.storage_condition}
              onValueChange={(v) => setForm({ ...form, storage_condition: v as StorageCondition })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frozen">Hàng đông lạnh</SelectItem>
                <SelectItem value="dry">Hàng khô</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Đơn vị">
            <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </Field>
          <Field label="Giá bán">
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: +e.target.value })}
            />
          </Field>
          <Field label="Giá vốn">
            <Input
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: +e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={saving || !form.sku || !form.name}
            onClick={async () => {
              setSaving(true);
              const { error } = await supabase.from("vegan_products").insert(form);
              setSaving(false);
              if (error) return toast.error(error.message);
              toast.success("Đã thêm sản phẩm");
              onDone();
            }}
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddBatchDialog({
  product,
  onClose,
  onDone,
}: {
  product: { id: string; name: string };
  onClose: () => void;
  onDone: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const [form, setForm] = useState({
    batch_number: "",
    mfg_date: today,
    exp_date: in30,
    quantity_produced: 0,
  });
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm lô sản xuất · {product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Số lô (Batch)">
            <Input
              value={form.batch_number}
              onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
            />
          </Field>
          <Field label="Sản lượng">
            <Input
              type="number"
              value={form.quantity_produced}
              onChange={(e) => setForm({ ...form, quantity_produced: +e.target.value })}
            />
          </Field>
          <Field label="Ngày sản xuất (NSX)">
            <Input
              type="date"
              value={form.mfg_date}
              onChange={(e) => setForm({ ...form, mfg_date: e.target.value })}
            />
          </Field>
          <Field label="Hạn sử dụng (HSD)">
            <Input
              type="date"
              value={form.exp_date}
              onChange={(e) => setForm({ ...form, exp_date: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={saving || !form.batch_number}
            onClick={async () => {
              setSaving(true);
              const { error } = await supabase
                .from("vegan_batches")
                .insert({ ...form, product_id: product.id });
              setSaving(false);
              if (error) return toast.error(error.message);
              toast.success("Đã thêm lô sản xuất");
              onDone();
            }}
          >
            Lưu lô
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}