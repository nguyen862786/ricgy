import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAppConfig } from "@/hooks/useAppConfig";
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
import { vnd, dt } from "@/lib/format";
import { openShift, closeShift } from "@/lib/shifts.functions";
import { Play, Square, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/shifts")({
  component: ShiftsPage,
});

function ShiftsPage() {
  const { storeId, store } = useAppConfig();
  const { user } = useAuth();
  const qc = useQueryClient();
  const open = useServerFn(openShift);
  const close = useServerFn(closeShift);

  const [opening, setOpening] = useState(false);
  const [openingCash, setOpeningCash] = useState("0");
  const [closingShift, setClosingShift] = useState<any | null>(null);

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts", storeId],
    queryFn: async () => {
      let q = supabase
        .from("shifts")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(100);
      if (storeId) q = q.eq("store_id", storeId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

  const myOpen = shifts.find((s) => s.status === "open" && s.staff_id === user?.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chốt ca</h1>
          <p className="text-sm text-muted-foreground">
            {store?.name ?? "Tất cả điểm bán"} · {shifts.length} ca
          </p>
        </div>
        {myOpen ? (
          <Button onClick={() => setClosingShift(myOpen)} variant="destructive">
            <Square className="mr-2 h-4 w-4" /> Đóng ca hiện tại
          </Button>
        ) : (
          <Button onClick={() => setOpening(true)}>
            <Play className="mr-2 h-4 w-4" /> Mở ca
          </Button>
        )}
      </div>

      {myOpen && (
        <Card className="border-success/40 bg-success/5 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-success" />
            <span>
              Ca đang mở từ <b>{dt(myOpen.opened_at)}</b> · Tiền đầu ca:{" "}
              <b>{vnd(myOpen.opening_cash)}</b>
            </span>
          </div>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Mở ca</TableHead>
              <TableHead>Đóng ca</TableHead>
              <TableHead className="text-right">Tiền đầu</TableHead>
              <TableHead className="text-right">DT hệ thống</TableHead>
              <TableHead className="text-right">Đếm thực</TableHead>
              <TableHead className="text-right">Chênh lệch</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Chưa có ca nào
                </TableCell>
              </TableRow>
            )}
            {shifts.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-sm">{s.staff_email ?? "—"}</TableCell>
                <TableCell className="text-sm">{dt(s.opened_at)}</TableCell>
                <TableCell className="text-sm">{s.closed_at ? dt(s.closed_at) : "—"}</TableCell>
                <TableCell className="text-right">{vnd(s.opening_cash)}</TableCell>
                <TableCell className="text-right">
                  {s.status === "closed" ? vnd(s.system_total) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {s.counted_cash != null ? vnd(s.counted_cash) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {s.diff != null ? (
                    <span
                      className={
                        Number(s.diff) === 0
                          ? "text-muted-foreground"
                          : Number(s.diff) > 0
                            ? "text-success"
                            : "text-destructive"
                      }
                    >
                      {Number(s.diff) > 0 ? "+" : ""}
                      {vnd(s.diff)}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={s.status === "open" ? "secondary" : "default"}>
                    {s.status === "open" ? "Đang mở" : "Đã đóng"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mở ca */}
      <Dialog open={opening} onOpenChange={setOpening}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mở ca mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Tiền đầu ca (quỹ tiền mặt)</Label>
            <Input
              type="number"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpening(false)}>
              Hủy
            </Button>
            <Button
              onClick={async () => {
                try {
                  await open({ data: { storeId, openingCash: Number(openingCash) || 0 } });
                  toast.success("Đã mở ca");
                  setOpening(false);
                  qc.invalidateQueries({ queryKey: ["shifts"] });
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            >
              Mở ca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {closingShift && (
        <CloseShiftDialog
          shift={closingShift}
          onClose={() => setClosingShift(null)}
          onDone={() => {
            setClosingShift(null);
            qc.invalidateQueries({ queryKey: ["shifts"] });
          }}
          closeFn={close}
        />
      )}
    </div>
  );
}

function CloseShiftDialog({
  shift,
  onClose,
  onDone,
  closeFn,
}: {
  shift: any;
  onClose: () => void;
  onDone: () => void;
  closeFn: any;
}) {
  const [counted, setCounted] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đóng ca</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            Tiền đầu ca: <b>{vnd(shift.opening_cash)}</b>
            <br />
            Doanh thu sẽ được tính tự động từ các đơn đã thanh toán trong ca.
          </div>
          <div className="space-y-1.5">
            <Label>Tiền mặt đếm thực tế</Label>
            <Input
              type="number"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Lý do (nếu có chênh lệch)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: trả nhầm tiền thừa..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={saving || counted === ""}
            onClick={async () => {
              setSaving(true);
              try {
                const res = await closeFn({
                  data: {
                    shiftId: shift.id,
                    countedCash: Number(counted),
                    reason: reason || undefined,
                  },
                });
                toast.success(`Đã đóng ca. Chênh lệch: ${vnd(res.diff)}`);
                onDone();
              } catch (e: any) {
                toast.error(e.message);
              } finally {
                setSaving(false);
              }
            }}
          >
            Đóng ca
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
