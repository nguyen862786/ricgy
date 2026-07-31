import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppConfig } from "@/hooks/useAppConfig";
import { INDUSTRY_LIST, industryOf } from "@/lib/industry";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/stores")({
  component: StoresPage,
});

const billingLabel: Record<string, string> = {
  trial: "Dùng thử",
  active: "Đang hoạt động",
  grace_period: "Nhắc nợ",
  suspended: "Đã khóa",
};
const billingColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  trial: "secondary",
  active: "default",
  grace_period: "outline",
  suspended: "destructive",
};

function emptyStore() {
  return {
    name: "",
    code: "",
    industry: "fnb" as const,
    cashflow_mode: "per_store" as const,
    address: "",
    phone: "",
    is_active: true,
  };
}

function StoresPage() {
  const { isStaff } = useAuth();
  const { stores, refreshStores } = useAppConfig();
  const [editing, setEditing] = useState<any>(null);

  if (!isStaff)
    return <div className="text-muted-foreground">Bạn không có quyền truy cập trang này.</div>;

  async function save() {
    const payload = { ...editing };
    delete payload.created_at;
    delete payload.updated_at;
    if (!payload.name || !payload.code) return toast.error("Cần tên và mã cửa hàng");
    payload.code = String(payload.code).toUpperCase();
    const id = payload.id;
    delete payload.id;
    const op = id
      ? supabase.from("stores").update(payload).eq("id", id)
      : supabase.from("stores").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Đã lưu cửa hàng");
    setEditing(null);
    refreshStores();
  }

  async function remove(id: string) {
    if (!confirm("Xóa cửa hàng này?")) return;
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã xóa");
    refreshStores();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <StoreIcon className="h-6 w-6" /> Cửa hàng / Điểm bán
        </h1>
        <Button onClick={() => setEditing(emptyStore())}>
          <Plus className="mr-2 h-4 w-4" /> Thêm cửa hàng
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Mã</TableHead>
              <TableHead>Ngành hàng</TableHead>
              <TableHead>Luồng tiền</TableHead>
              <TableHead>Gói / Billing</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Chưa có cửa hàng. Hãy thêm cửa hàng đầu tiên.
                </TableCell>
              </TableRow>
            )}
            {stores.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="font-mono text-sm">{s.code}</TableCell>
                <TableCell>
                  {industryOf(s.industry).emoji} {industryOf(s.industry).label}
                </TableCell>
                <TableCell className="text-sm">
                  {s.cashflow_mode === "per_store" ? "Về điểm bán" : "Về công ty tổng"}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{s.plan}</div>
                  <Badge variant={billingColor[s.billing_status]}>
                    {billingLabel[s.billing_status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={s.is_active ? "default" : "secondary"}>
                    {s.is_active ? "Hoạt động" : "Tắt"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing({ ...s })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(s.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Sửa cửa hàng" : "Thêm cửa hàng"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Tên cửa hàng *</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mã *</Label>
                <Input
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  placeholder="VD: HCM01"
                />
              </div>
              <div className="space-y-1.5">
                <Label>SĐT</Label>
                <Input
                  value={editing.phone ?? ""}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
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
              <div className="space-y-1.5">
                <Label>Luồng tiền</Label>
                <Select
                  value={editing.cashflow_mode}
                  onValueChange={(v) => setEditing({ ...editing, cashflow_mode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_store">Tiền về từng điểm bán</SelectItem>
                    <SelectItem value="company">Tiền về công ty tổng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Địa chỉ</Label>
                <Input
                  value={editing.address ?? ""}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Switch
                  checked={!!editing.is_active}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
                <Label>Đang hoạt động</Label>
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
