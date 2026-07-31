import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vnd } from "@/lib/format";
import { listTiers, upsertTier, deleteTier } from "@/lib/customers.functions";
import { Plus, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tiers")({
  component: TiersPage,
});

type TierForm = {
  id?: string;
  name: string;
  min_spent: number;
  discount_percent: number;
  color: string;
  sort_order: number;
};

function TiersPage() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const fetchTiers = useServerFn(listTiers);
  const saveTier = useServerFn(upsertTier);
  const removeTier = useServerFn(deleteTier);
  const [editing, setEditing] = useState<TierForm | null>(null);

  const { data: tiers = [] } = useQuery({
    queryKey: ["tiers"],
    queryFn: () => fetchTiers(),
  });

  if (!isStaff) return <div className="text-muted-foreground">Không có quyền.</div>;

  async function save() {
    if (!editing) return;
    try {
      await saveTier({ data: editing as any });
      toast.success("Đã lưu hạng");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["tiers"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Xoá hạng này?")) return;
    try {
      await removeTier({ data: { id } });
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["tiers"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="h-6 w-6" /> Hạng khách hàng
        </h1>
        <Button
          onClick={() =>
            setEditing({
              name: "",
              min_spent: 0,
              discount_percent: 0,
              color: "#64748b",
              sort_order: tiers.length + 1,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Thêm hạng
        </Button>
      </div>

      <Card className="p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          Hạng khách hàng được <strong>tự động cập nhật</strong> dựa trên tổng chi tiêu (đơn đã
          thanh toán). Khách thuộc hạng có mức chi tối thiểu cao nhất mà họ đạt được.
        </p>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên hạng</TableHead>
              <TableHead className="text-right">Mức chi tối thiểu</TableHead>
              <TableHead className="text-right">% Giảm giá</TableHead>
              <TableHead>Màu</TableHead>
              <TableHead className="text-right">Thứ tự</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((t: any) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => setEditing(t)}>
                <TableCell className="font-medium flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: t.color }}
                  />
                  {t.name}
                </TableCell>
                <TableCell className="text-right">{vnd(t.min_spent)}</TableCell>
                <TableCell className="text-right">{t.discount_percent}%</TableCell>
                <TableCell>
                  <code className="text-xs">{t.color}</code>
                </TableCell>
                <TableCell className="text-right">{t.sort_order}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Sửa hạng" : "Thêm hạng"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Tên hạng</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mức chi tối thiểu (₫)</Label>
                  <Input
                    type="number"
                    value={editing.min_spent}
                    onChange={(e) => setEditing({ ...editing, min_spent: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>% Giảm giá</Label>
                  <Input
                    type="number"
                    value={editing.discount_percent}
                    onChange={(e) =>
                      setEditing({ ...editing, discount_percent: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Màu (hex)</Label>
                  <Input
                    type="color"
                    value={editing.color}
                    onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Thứ tự</Label>
                  <Input
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Huỷ
            </Button>
            <Button onClick={save}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
