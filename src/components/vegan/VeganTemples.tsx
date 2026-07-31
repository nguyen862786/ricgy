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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vnd, dt } from "@/lib/format";
import {
  TEMPLE_STATUS_LABEL,
  type TempleStatus,
  type CharityMode,
} from "@/lib/vegan";
import { Plus, Truck, MapPin, Phone, Pencil, PackageCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

const SHIP_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> =
  {
    pending: { label: "Chờ xuất", variant: "outline" },
    shipped: { label: "Đang giao", variant: "secondary" },
    received: { label: "Đã nhận", variant: "default" },
  };

export function VeganTemples() {
  const qc = useQueryClient();
  const [editTemple, setEditTemple] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);
  const [creatingShip, setCreatingShip] = useState(false);

  const { data: temples = [] } = useQuery({
    queryKey: ["vegan-temples"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vegan_temples").select("*").order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ["vegan-shipments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vegan_shipments")
        .select("*, vegan_temples(name), vegan_shipment_items(id, quantity)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  async function receive(id: string) {
    const { error } = await supabase
      .from("vegan_shipments")
      .update({ status: "received" })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã nhận hàng — tồn kho Chùa được cộng tự động");
    qc.invalidateQueries({ queryKey: ["vegan-shipments"] });
    qc.invalidateQueries({ queryKey: ["vegan-dashboard"] });
  }

  return (
    <Tabs defaultValue="temples" className="space-y-4">
      <TabsList>
        <TabsTrigger value="temples">Danh sách Chùa ({temples.length})</TabsTrigger>
        <TabsTrigger value="ship">Phiếu xuất sỉ ({shipments.length})</TabsTrigger>
      </TabsList>

      {/* TEMPLES */}
      <TabsContent value="temples" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Thêm Chùa / Kho vệ tinh
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {temples.map((t) => (
            <Card key={t.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{t.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {t.region ?? "—"}
                  </div>
                </div>
                <Badge variant={t.status === "signed" ? "default" : "secondary"}>
                  {TEMPLE_STATUS_LABEL[t.status as TempleStatus]}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="truncate">{t.contact_name ?? "—"}</div>
                {t.contact_phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {t.contact_phone}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">
                  Hoa hồng {t.commission_rate}%
                </span>
                <span className="rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
                  Quỹ:{" "}
                  {t.charity_mode === "percent"
                    ? `${t.charity_percent}% DT`
                    : `${vnd(t.charity_fixed)}/tháng`}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setEditTemple(t)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Cấu hình tài chính
              </Button>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* SHIPMENTS */}
      <TabsContent value="ship" className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Xưởng xuất hàng số lượng lớn (Bulk) → giao về từng Chùa. Khi đánh dấu “Đã nhận”, hệ thống
            tự động cộng kho cho Chùa.
          </p>
          <Button size="sm" onClick={() => setCreatingShip(true)}>
            <Truck className="mr-1.5 h-4 w-4" /> Tạo phiếu xuất
          </Button>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phiếu</TableHead>
                <TableHead>Chùa nhận</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-center">Số dòng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Chưa có phiếu xuất
                  </TableCell>
                </TableRow>
              )}
              {shipments.map((s) => {
                const st = SHIP_STATUS[s.status] ?? SHIP_STATUS.pending;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs font-medium">{s.code}</TableCell>
                    <TableCell>{s.vegan_temples?.name}</TableCell>
                    <TableCell className="text-sm">{dt(s.created_at)}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {s.vegan_shipment_items?.length ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {s.status !== "received" ? (
                        <Button size="sm" variant="secondary" onClick={() => receive(s.id)}>
                          <PackageCheck className="mr-1.5 h-4 w-4" /> Đã nhận
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{dt(s.received_at)}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>

      {(adding || editTemple) && (
        <TempleDialog
          temple={editTemple}
          onClose={() => {
            setAdding(false);
            setEditTemple(null);
          }}
          onDone={() => {
            setAdding(false);
            setEditTemple(null);
            qc.invalidateQueries({ queryKey: ["vegan-temples"] });
            qc.invalidateQueries({ queryKey: ["vegan-dashboard"] });
          }}
        />
      )}
      {creatingShip && (
        <ShipmentDialog
          temples={temples}
          onClose={() => setCreatingShip(false)}
          onDone={() => {
            setCreatingShip(false);
            qc.invalidateQueries({ queryKey: ["vegan-shipments"] });
          }}
        />
      )}
    </Tabs>
  );
}

function TempleDialog({
  temple,
  onClose,
  onDone,
}: {
  temple: any | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    name: temple?.name ?? "",
    region: temple?.region ?? "",
    address: temple?.address ?? "",
    contact_name: temple?.contact_name ?? "",
    contact_phone: temple?.contact_phone ?? "",
    status: (temple?.status ?? "negotiating") as TempleStatus,
    commission_rate: Number(temple?.commission_rate ?? 10),
    charity_mode: (temple?.charity_mode ?? "percent") as CharityMode,
    charity_percent: Number(temple?.charity_percent ?? 5),
    charity_fixed: Number(temple?.charity_fixed ?? 0),
  });
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{temple ? "Cấu hình Chùa" : "Thêm Chùa / Kho vệ tinh"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tên Chùa">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Khu vực">
            <Input
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="TP. Thủ Đức, Quận 3..."
            />
          </Field>
          <Field label="Địa chỉ" full>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Sư / Trụ trì kết nối">
            <Input
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
            />
          </Field>
          <Field label="Điện thoại">
            <Input
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            />
          </Field>
          <Field label="Trạng thái">
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as TempleStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="signed">Đã ký kết</SelectItem>
                <SelectItem value="negotiating">Đang thương thảo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Hoa hồng kết nối (%)">
            <Input
              type="number"
              value={form.commission_rate}
              onChange={(e) => setForm({ ...form, commission_rate: +e.target.value })}
            />
          </Field>
          <Field label="Hình thức quỹ từ thiện">
            <Select
              value={form.charity_mode}
              onValueChange={(v) => setForm({ ...form, charity_mode: v as CharityMode })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">% doanh thu</SelectItem>
                <SelectItem value="fixed">Ngân sách cố định/tháng</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {form.charity_mode === "percent" ? (
            <Field label="Tỷ lệ trích quỹ (%)">
              <Input
                type="number"
                value={form.charity_percent}
                onChange={(e) => setForm({ ...form, charity_percent: +e.target.value })}
              />
            </Field>
          ) : (
            <Field label="Ngân sách quỹ/tháng (đ)">
              <Input
                type="number"
                value={form.charity_fixed}
                onChange={(e) => setForm({ ...form, charity_fixed: +e.target.value })}
              />
            </Field>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={saving || !form.name}
            onClick={async () => {
              setSaving(true);
              const { error } = temple
                ? await supabase.from("vegan_temples").update(form).eq("id", temple.id)
                : await supabase.from("vegan_temples").insert(form);
              setSaving(false);
              if (error) return toast.error(error.message);
              toast.success("Đã lưu");
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

type ShipLine = { product_id: string; name: string; batch_id: string | null; quantity: number };

function ShipmentDialog({
  temples,
  onClose,
  onDone,
}: {
  temples: any[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [templeId, setTempleId] = useState<string>("");
  const [lines, setLines] = useState<ShipLine[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["vegan-products-with-batches"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vegan_products")
        .select("id, name, vegan_batches(id, batch_number, exp_date)")
        .eq("active", true)
        .order("sku");
      return (data ?? []) as any[];
    },
  });

  function addLine(pid: string) {
    const p = products.find((x) => x.id === pid);
    if (!p) return;
    const batch = (p.vegan_batches ?? [])[0];
    setLines((ls) => [
      ...ls,
      { product_id: p.id, name: p.name, batch_id: batch?.id ?? null, quantity: 50 },
    ]);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo phiếu xuất sỉ (Xưởng → Chùa)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Chùa nhận hàng">
            <Select value={templeId} onValueChange={setTempleId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn Chùa..." />
              </SelectTrigger>
              <SelectContent>
                {temples.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · {t.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Thêm sản phẩm">
            <Select onValueChange={addLine}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn sản phẩm..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {lines.length > 0 && (
            <div className="rounded-md border">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2 border-b p-2 last:border-b-0">
                  <div className="flex-1 text-sm">{l.name}</div>
                  <Input
                    className="w-24"
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) =>
                      setLines((ls) =>
                        ls.map((x, j) => (j === i ? { ...x, quantity: +e.target.value } : x)),
                      )
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Field label="Ghi chú">
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={saving || !templeId || lines.length === 0}
            onClick={async () => {
              setSaving(true);
              const { data: ship, error } = await supabase
                .from("vegan_shipments")
                .insert({ temple_id: templeId, status: "shipped", note: note || null })
                .select("id")
                .single();
              if (error || !ship) {
                setSaving(false);
                return toast.error(error?.message ?? "Lỗi tạo phiếu");
              }
              const { error: itErr } = await supabase.from("vegan_shipment_items").insert(
                lines.map((l) => ({
                  shipment_id: ship.id,
                  product_id: l.product_id,
                  batch_id: l.batch_id,
                  quantity: l.quantity,
                })),
              );
              setSaving(false);
              if (itErr) return toast.error(itErr.message);
              toast.success("Đã tạo phiếu xuất (Đang giao)");
              onDone();
            }}
          >
            Tạo phiếu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}