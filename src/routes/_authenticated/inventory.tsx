import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vnd, dt } from "@/lib/format";
import { postInventoryDoc } from "@/lib/inventory.functions";
import { Plus, Trash2, PackagePlus, ArrowLeftRight, PackageMinus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventory")({
  component: InventoryPage,
});

type DocType = "purchase" | "transfer" | "writeoff";
type Line = { product_id: string; product_name: string; qty: number; unit_cost: number };

const typeLabel: Record<DocType, string> = {
  purchase: "Nhập kho",
  transfer: "Điều chuyển",
  writeoff: "Xuất hủy",
};
const typeColor: Record<DocType, "default" | "secondary" | "destructive"> = {
  purchase: "default",
  transfer: "secondary",
  writeoff: "destructive",
};

function InventoryPage() {
  const { storeId, store } = useAppConfig();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | DocType>("all");
  const [creating, setCreating] = useState<DocType | null>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ["inventory_docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_docs")
        .select("*, inventory_items(id, product_name, qty, unit_cost)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = tab === "all" ? docs : docs.filter((d) => d.type === tab);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kho vận</h1>
          <p className="text-sm text-muted-foreground">
            {store?.name ?? "Tất cả điểm bán"} · {docs.length} phiếu
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCreating("purchase")}>
            <PackagePlus className="mr-1.5 h-4 w-4" /> Nhập
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setCreating("transfer")}>
            <ArrowLeftRight className="mr-1.5 h-4 w-4" /> Điều chuyển
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setCreating("writeoff")}>
            <PackageMinus className="mr-1.5 h-4 w-4" /> Xuất hủy
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="purchase">Nhập kho</TabsTrigger>
          <TabsTrigger value="transfer">Điều chuyển</TabsTrigger>
          <TabsTrigger value="writeoff">Xuất hủy</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã phiếu</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Số dòng</TableHead>
              <TableHead className="text-right">Giá trị</TableHead>
              <TableHead>Ghi chú</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có phiếu
                </TableCell>
              </TableRow>
            )}
            {filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono font-medium">{d.code}</TableCell>
                <TableCell>
                  <Badge variant={typeColor[d.type as DocType]}>
                    {typeLabel[d.type as DocType]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{dt(d.posted_at ?? d.created_at)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {d.inventory_items?.length ?? 0} dòng
                </TableCell>
                <TableCell className="text-right font-semibold">{vnd(d.total_value)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.note ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {creating && (
        <CreateDocDialog
          type={creating}
          defaultStore={storeId}
          onClose={() => setCreating(null)}
          onDone={() => {
            setCreating(null);
            qc.invalidateQueries({ queryKey: ["inventory_docs"] });
          }}
        />
      )}
    </div>
  );
}

function CreateDocDialog({
  type,
  defaultStore,
  onClose,
  onDone,
}: {
  type: DocType;
  defaultStore: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { stores } = useAppConfig();
  const post = useServerFn(postInventoryDoc);
  const [lines, setLines] = useState<Line[]>([]);
  const [storeId, setStoreId] = useState<string | null>(defaultStore);
  const [toStoreId, setToStoreId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-inv"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, avg_cost, sale_price, list_price")
        .eq("is_active", true);
      return data ?? [];
    },
  });

  function addLine(id: string) {
    const p: any = products.find((x: any) => x.id === id);
    if (!p) return;
    setLines((ls) => [
      ...ls,
      { product_id: p.id, product_name: p.name, qty: 1, unit_cost: Number(p.avg_cost ?? 0) },
    ]);
  }

  const total = lines.reduce((s, l) => s + l.qty * l.unit_cost, 0);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{typeLabel[type]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{type === "transfer" ? "Cửa hàng xuất" : "Cửa hàng"}</Label>
              <Select
                value={storeId ?? "none"}
                onValueChange={(v) => setStoreId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn" />
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
            {type === "transfer" && (
              <div className="space-y-1.5">
                <Label>Cửa hàng nhận</Label>
                <Select
                  value={toStoreId ?? "none"}
                  onValueChange={(v) => setToStoreId(v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Chọn —</SelectItem>
                    {stores
                      .filter((s) => s.id !== storeId)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {lines.length > 0 && (
            <div className="rounded-md border">
              <div className="flex gap-2 border-b bg-muted/40 p-2 text-xs font-medium text-muted-foreground">
                <div className="flex-1">Sản phẩm</div>
                <div className="w-20 text-center">SL</div>
                <div className="w-32 text-center">
                  {type === "purchase" ? "Giá vốn" : "Đơn giá"}
                </div>
                <div className="w-28 text-right">Thành tiền</div>
                <div className="w-8" />
              </div>
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
                    min={0}
                    value={l.unit_cost}
                    onChange={(e) =>
                      setLines((ls) =>
                        ls.map((x, j) => (j === i ? { ...x, unit_cost: +e.target.value } : x)),
                      )
                    }
                  />
                  <div className="w-28 text-right text-sm font-medium">
                    {vnd(l.qty * l.unit_cost)}
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
              <div className="flex justify-between border-t p-2 font-semibold">
                <span>Tổng giá trị</span>
                <span>{vnd(total)}</span>
              </div>
            </div>
          )}

          {type === "purchase" && (
            <p className="text-xs text-muted-foreground">
              Nhập kho sẽ cập nhật tồn kho và tính lại giá vốn bình quân gia quyền.
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={saving || lines.length === 0}
            onClick={async () => {
              setSaving(true);
              try {
                await post({
                  data: {
                    type,
                    storeId,
                    toStoreId,
                    note: note || undefined,
                    items: lines.map((l) => ({
                      product_id: l.product_id,
                      product_name: l.product_name,
                      qty: l.qty,
                      unit_cost: l.unit_cost,
                    })),
                  },
                });
                toast.success("Đã ghi sổ phiếu");
                onDone();
              } catch (e: any) {
                toast.error(e.message);
              } finally {
                setSaving(false);
              }
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Ghi sổ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
