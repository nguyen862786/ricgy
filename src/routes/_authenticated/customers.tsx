import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { vnd, dt } from "@/lib/format";
import { listCustomers, listTiers, updateCustomerMarketing } from "@/lib/customers.functions";
import { Search, Users, Download, Pencil, X, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

type Segment = "all" | "new" | "no_purchase" | "vip" | "inactive";

const SEGMENTS: { value: Segment; label: string; desc: string }[] = [
  { value: "all", label: "Tất cả", desc: "Toàn bộ khách hàng" },
  { value: "new", label: "Khách mới (30 ngày)", desc: "Đăng ký trong 30 ngày qua" },
  { value: "no_purchase", label: "Chưa mua hàng", desc: "Chưa từng đặt đơn đã thanh toán" },
  { value: "vip", label: "VIP (Gold/Diamond)", desc: "Hạng cao, ưu tiên chăm sóc" },
  {
    value: "inactive",
    label: "Không hoạt động (>90 ngày)",
    desc: "Đã mua nhưng >90 ngày chưa quay lại",
  },
];

function matchSegment(c: any, seg: Segment): boolean {
  const now = Date.now();
  const created = c.created_at ? new Date(c.created_at).getTime() : 0;
  const lastOrder = c.last_order_at ? new Date(c.last_order_at).getTime() : null;
  switch (seg) {
    case "new":
      return now - created <= 30 * 86400000;
    case "no_purchase":
      return (c.order_paid ?? 0) === 0;
    case "vip":
      return ["gold", "diamond"].includes((c.tier || "").toLowerCase());
    case "inactive":
      return lastOrder !== null && now - lastOrder > 90 * 86400000;
    default:
      return true;
  }
}

function toCSV(rows: any[]): string {
  const headers = [
    "Tên",
    "Email",
    "SĐT",
    "Hạng",
    "Tổng chi",
    "Đơn đã TT",
    "Tags",
    "Đơn gần nhất",
    "Tham gia",
    "Ghi chú",
  ];
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.full_name,
        r.email,
        r.phone,
        r.tier,
        r.total_spent || 0,
        r.order_paid || 0,
        (r.tags || []).join("; "),
        r.last_order_at ? new Date(r.last_order_at).toISOString().slice(0, 10) : "",
        r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "",
        r.marketing_notes || "",
      ]
        .map(esc)
        .join(","),
    );
  }
  return "\uFEFF" + lines.join("\n"); // BOM cho Excel mở UTF-8
}

function CustomersPage() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const fetchCustomers = useServerFn(listCustomers);
  const fetchTiers = useServerFn(listTiers);
  const saveMarketing = useServerFn(updateCustomerMarketing);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [segment, setSegment] = useState<Segment>("all");
  const [editing, setEditing] = useState<any>(null);
  const [tagInput, setTagInput] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => fetchCustomers(),
  });
  const { data: tiers = [] } = useQuery({
    queryKey: ["tiers"],
    queryFn: () => fetchTiers(),
  });

  const tierMap = useMemo(() => {
    const m = new Map<string, any>();
    tiers.forEach((t: any) => m.set(t.name.toLowerCase(), t));
    return m;
  }, [tiers]);

  const filtered = useMemo(() => {
    return customers.filter((c: any) => {
      const q = search.trim().toLowerCase();
      const matchQ =
        !q ||
        c.email?.toLowerCase().includes(q) ||
        c.full_name?.toLowerCase().includes(q) ||
        c.phone?.includes(q);
      const matchT =
        tierFilter === "all" || (c.tier || "").toLowerCase() === tierFilter.toLowerCase();
      return matchQ && matchT && matchSegment(c, segment);
    });
  }, [customers, search, tierFilter, segment]);

  const stats = useMemo(() => {
    const byTier = new Map<string, number>();
    customers.forEach((c: any) => {
      const k = (c.tier || "standard").toLowerCase();
      byTier.set(k, (byTier.get(k) ?? 0) + 1);
    });
    const totalRevenue = customers.reduce((s: number, c: any) => s + Number(c.total_spent || 0), 0);
    return { byTier, totalRevenue };
  }, [customers]);

  if (!isStaff) return <div className="text-muted-foreground">Không có quyền.</div>;

  function exportCSV() {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `khach-hang-${segment}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${filtered.length} khách hàng`);
  }

  function openEdit(c: any) {
    setEditing({ ...c, tags: [...(c.tags || [])], marketing_notes: c.marketing_notes || "" });
    setTagInput("");
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || !editing) return;
    if (editing.tags.includes(t)) return;
    setEditing({ ...editing, tags: [...editing.tags, t] });
    setTagInput("");
  }

  function removeTag(t: string) {
    if (!editing) return;
    setEditing({ ...editing, tags: editing.tags.filter((x: string) => x !== t) });
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await saveMarketing({
        data: {
          customerId: editing.id,
          tags: editing.tags,
          marketing_notes: editing.marketing_notes || null,
        },
      });
      toast.success("Đã lưu");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["customers"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" /> Khách hàng
        </h1>
        <div className="text-sm text-muted-foreground">
          {customers.length} khách · Tổng chi:{" "}
          <span className="font-semibold text-foreground">{vnd(stats.totalRevenue)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiers.map((t: any) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: t.color }} />
              <span className="text-sm font-medium">{t.name}</span>
            </div>
            <div className="text-2xl font-bold">{stats.byTier.get(t.name.toLowerCase()) ?? 0}</div>
            <div className="text-xs text-muted-foreground">
              Từ {vnd(t.min_spent)} · -{t.discount_percent}%
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Tìm tên, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={segment} onValueChange={(v) => setSegment(v as Segment)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEGMENTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <div>
                  <div>{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hạng</SelectItem>
            {tiers.map((t: any) => (
              <SelectItem key={t.id} value={t.name}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Xuất CSV ({filtered.length})
        </Button>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Hạng</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Tổng chi</TableHead>
              <TableHead className="text-right">Đơn (đã TT)</TableHead>
              <TableHead>Mua gần nhất</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Không có khách hàng
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c: any) => {
              const tierKey = (c.tier || "standard").toLowerCase();
              const t = tierMap.get(tierKey);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      to="/customers/$id"
                      params={{ id: c.id }}
                      className="font-medium hover:underline"
                    >
                      {c.full_name || "—"}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      style={t ? { background: t.color, color: "white" } : undefined}
                      variant={t ? "default" : "secondary"}
                    >
                      {c.tier || "standard"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {(c.tags || []).slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {(c.tags || []).length > 3 && (
                        <span className="text-xs text-muted-foreground">+{c.tags.length - 3}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {vnd(c.total_spent || 0)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {c.order_paid}/{c.order_total}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.last_order_at ? dt(c.last_order_at) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button asChild variant="ghost" size="icon" title="Xem Customer 360">
                        <Link to="/customers/$id" params={{ id: c.id }}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(c)}
                        title="Sửa tag/ghi chú"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.full_name || editing?.email}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Tags marketing</Label>
                <div className="flex flex-wrap gap-1 mb-2 mt-1">
                  {editing.tags.map((t: string) => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t}
                      <button onClick={() => removeTag(t)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {editing.tags.length === 0 && (
                    <span className="text-xs text-muted-foreground">Chưa có tag</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ví dụ: vip, sinh-nhat-thang-5, da-tu-van..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Thêm
                  </Button>
                </div>
              </div>
              <div>
                <Label>Ghi chú nội bộ</Label>
                <Textarea
                  rows={4}
                  value={editing.marketing_notes}
                  onChange={(e) => setEditing({ ...editing, marketing_notes: e.target.value })}
                  placeholder="Sở thích, lịch sử tương tác, lưu ý chăm sóc..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Huỷ
            </Button>
            <Button onClick={saveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
