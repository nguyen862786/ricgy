import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BundleManager } from "@/components/BundleManager";
import { PromotionManager } from "@/components/PromotionManager";
import { QiClubAllianceSettings } from "@/components/QiClubAllianceSettings";
import { vnd } from "@/lib/format";
import { Plus, Trash2, Ticket, Package, Zap, Handshake } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/promos")({
  component: PromosPage,
});

function PromosPage() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);

  const { data: promos = [] } = useQuery({
    queryKey: ["promos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!isStaff) {
    return <div className="text-muted-foreground">Bạn không có quyền truy cập trang này.</div>;
  }

  async function save() {
    const payload = { ...editing };
    delete payload.id;
    delete payload.created_at;
    delete payload.used_count;
    if (!payload.code) return toast.error("Cần mã");
    payload.code = payload.code.toUpperCase();
    const op = editing.id
      ? supabase.from("promo_codes").update(payload).eq("id", editing.id)
      : supabase.from("promo_codes").insert(payload);
    const { error } = await op;
    if (error) toast.error(error.message);
    else {
      toast.success("Đã lưu");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["promos"] });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Khuyến mãi</h1>
      <Tabs defaultValue="codes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="codes">
            <Ticket className="mr-2 h-4 w-4" /> Mã giảm giá
          </TabsTrigger>
          <TabsTrigger value="bundles">
            <Package className="mr-2 h-4 w-4" /> Combo / Bundle
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Zap className="mr-2 h-4 w-4" /> Nâng cao
          </TabsTrigger>
          <TabsTrigger value="qiclub">
            <Handshake className="mr-2 h-4 w-4" /> Liên minh QiClub
          </TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button
              onClick={() =>
                setEditing({ code: "", discount_percent: 10, min_order_amount: 0, is_active: true })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm mã
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead className="text-right">% Giảm</TableHead>
                  <TableHead className="text-right">Đơn tối thiểu</TableHead>
                  <TableHead className="text-right">Đã dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Chưa có mã
                    </TableCell>
                  </TableRow>
                )}
                {promos.map((p: any) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setEditing(p)}>
                    <TableCell className="font-mono font-semibold">{p.code}</TableCell>
                    <TableCell className="text-right">{p.discount_percent}%</TableCell>
                    <TableCell className="text-right">{vnd(p.min_order_amount)}</TableCell>
                    <TableCell className="text-right">
                      {p.used_count}
                      {p.usage_limit ? ` / ${p.usage_limit}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "default" : "secondary"}>
                        {p.is_active ? "Hoạt động" : "Tắt"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          if (!confirm("Xóa mã?")) return;
                          await supabase.from("promo_codes").delete().eq("id", p.id);
                          qc.invalidateQueries({ queryKey: ["promos"] });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="bundles">
          <BundleManager />
        </TabsContent>

        <TabsContent value="advanced">
          <PromotionManager />
        </TabsContent>

        <TabsContent value="qiclub">
          <QiClubAllianceSettings />
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Sửa mã" : "Thêm mã"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label>Mã *</Label>
                <Input
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>% Giảm</Label>
                <Input
                  type="number"
                  value={editing.discount_percent}
                  onChange={(e) => setEditing({ ...editing, discount_percent: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Đơn tối thiểu</Label>
                <Input
                  type="number"
                  value={editing.min_order_amount}
                  onChange={(e) => setEditing({ ...editing, min_order_amount: +e.target.value })}
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
              <div className="space-y-1.5">
                <Label>Giới hạn lượt dùng</Label>
                <Input
                  type="number"
                  value={editing.usage_limit ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      usage_limit: e.target.value === "" ? null : +e.target.value,
                    })
                  }
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
