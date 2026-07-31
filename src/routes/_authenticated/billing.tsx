import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { vnd, dt } from "@/lib/format";
import {
  BILLING_PLANS,
  BILLING_STATUS_LABEL,
  BILLING_STATUS_COLOR,
  planAmount,
  planMonths,
  daysLeft,
  type PlanKey,
} from "@/lib/billing";
import {
  getStoresBilling,
  getBillingPayment,
  activateStoreManual,
  suspendStore,
} from "@/lib/billing.functions";
import { CreditCard, Lock, Zap, QrCode } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
  component: BillingPage,
});

function BillingPage() {
  const { group } = useAuth();
  const qc = useQueryClient();
  const fetchStores = useServerFn(getStoresBilling);
  const manual = useServerFn(activateStoreManual);
  const suspend = useServerFn(suspendStore);
  const [paying, setPaying] = useState<any | null>(null);

  const isOwner = group === "super_admin";

  const { data, isLoading } = useQuery({
    queryKey: ["stores-billing"],
    queryFn: () => fetchStores(),
    enabled: isOwner,
  });

  if (!isOwner)
    return (
      <div className="text-muted-foreground">
        Chỉ Super Admin (chủ hệ thống) mới truy cập trang Billing & Gói dịch vụ.
      </div>
    );

  const stores = data?.stores ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <CreditCard className="h-6 w-6" /> Super Admin · Billing
        </h1>
        <p className="text-sm text-muted-foreground">
          Vòng đời thuê bao cửa hàng (SaaS + phần cứng)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(BILLING_PLANS) as PlanKey[]).map((k) => (
          <Card key={k} className="p-4">
            <div className="font-semibold">{BILLING_PLANS[k].label}</div>
            <div className="mt-1 text-2xl font-bold text-primary">
              {vnd(BILLING_PLANS[k].monthly)}
              <span className="text-sm font-normal text-muted-foreground">/tháng</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{BILLING_PLANS[k].desc}</div>
            {BILLING_PLANS[k].hardware && (
              <Badge variant="secondary" className="mt-2">
                Kèm phần cứng
              </Badge>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cửa hàng</TableHead>
              <TableHead>Gói</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hạn dùng</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && stores.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có cửa hàng
                </TableCell>
              </TableRow>
            )}
            {stores.map((s: any) => {
              const end = s.paid_until ?? s.trial_ends_at;
              const left = daysLeft(end);
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{s.code}</div>
                  </TableCell>
                  <TableCell className="text-sm capitalize">
                    {s.plan}
                    {s.hardware_combo ? " + HW" : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={BILLING_STATUS_COLOR[s.billing_status]}>
                      {BILLING_STATUS_LABEL[s.billing_status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {dt(end)}
                    {left != null && (
                      <span
                        className={`ml-1 text-xs ${left < 0 ? "text-destructive" : left <= 3 ? "text-warning" : "text-muted-foreground"}`}
                      >
                        ({left < 0 ? `quá ${-left}d` : `còn ${left}d`})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" onClick={() => setPaying(s)}>
                        <Zap className="mr-1 h-3.5 w-3.5" /> Gia hạn
                      </Button>
                      {s.billing_status !== "suspended" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Khóa cửa hàng"
                          onClick={async () => {
                            if (!confirm(`Khóa cửa hàng ${s.name}?`)) return;
                            try {
                              await suspend({ data: { storeId: s.id } });
                              toast.success("Đã khóa");
                              qc.invalidateQueries({ queryKey: ["stores-billing"] });
                            } catch (e: any) {
                              toast.error(e.message);
                            }
                          }}
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {paying && (
        <PayDialog
          store={paying}
          onClose={() => setPaying(null)}
          onDone={() => {
            setPaying(null);
            qc.invalidateQueries({ queryKey: ["stores-billing"] });
          }}
          getPayment={getBillingPayment}
          manual={manual}
        />
      )}
    </div>
  );
}

function PayDialog({ store, onClose, onDone, getPayment, manual }: any) {
  const getPay = useServerFn(getPayment);
  const manualFn = useServerFn(manual);
  const [plan, setPlan] = useState<PlanKey>(
    (store.plan as PlanKey) in BILLING_PLANS ? store.plan : "starter",
  );
  const [months, setMonths] = useState(3);
  const [qr, setQr] = useState<{ url: string; content: string; amount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const isCombo = plan === "combo";
  const effMonths = planMonths(plan, months);
  const amount = planAmount(plan, months);

  async function genQr() {
    setLoading(true);
    try {
      const res: any = await getPay({ data: { storeId: store.id, plan, months } });
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/api/public/billing-webhook?token=${encodeURIComponent(res.token)}&sig=${res.sig}`;
      setQr({ url, content: res.content, amount: res.amount });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function simulatePaid() {
    if (!qr) return;
    setLoading(true);
    try {
      const res: any = await getPay({ data: { storeId: store.id, plan, months } });
      const r = await fetch("/api/public/billing-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: res.token, sig: res.sig }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Lỗi kích hoạt");
      toast.success("Thanh toán thành công · đã kích hoạt");
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gia hạn · {store.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Gói dịch vụ</Label>
            <Select
              value={plan}
              onValueChange={(v) => {
                setPlan(v as PlanKey);
                setQr(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BILLING_PLANS) as PlanKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {BILLING_PLANS[k].label} — {vnd(BILLING_PLANS[k].monthly)}/th
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isCombo && (
            <div className="space-y-1.5">
              <Label>Số tháng</Label>
              <Select
                value={String(months)}
                onValueChange={(v) => {
                  setMonths(Number(v));
                  setQr(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 3, 6, 12].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} tháng
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {isCombo && (
            <p className="text-xs text-muted-foreground">
              Combo trả trước cố định {effMonths} tháng, tặng máy POS.
            </p>
          )}

          <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
            <span className="text-sm">Tổng thanh toán ({effMonths} tháng)</span>
            <span className="text-lg font-bold text-primary">{vnd(amount)}</span>
          </div>

          {!qr ? (
            <Button className="w-full" disabled={loading} onClick={genQr}>
              <QrCode className="mr-1.5 h-4 w-4" /> Tạo mã QR thanh toán
            </Button>
          ) : (
            <div className="space-y-2 text-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qr.url)}`}
                alt="QR thanh toán"
                width={180}
                height={180}
                className="mx-auto rounded-md border bg-white p-2"
              />
              <div className="text-xs text-muted-foreground">
                Nội dung CK: <b>{qr.content}</b>
              </div>
              <Button className="w-full" disabled={loading} onClick={simulatePaid}>
                Giả lập quét mã thành công
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await manualFn({ data: { storeId: store.id, plan, months } });
                toast.success("Đã kích hoạt thủ công");
                onDone();
              } catch (e: any) {
                toast.error(e.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            Kích hoạt ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
