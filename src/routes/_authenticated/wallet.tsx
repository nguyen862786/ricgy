import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { vnd, dt, num } from "@/lib/format";
import { Wallet, Gift, Banknote, ArrowDownUp } from "lucide-react";
import { requestWithdrawal } from "@/lib/withdrawals.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/wallet")({
  component: WalletPage,
});

const typeLabel: Record<string, string> = {
  cashback: "Cashback",
  commission: "Hoa hồng",
  withdraw: "Rút tiền",
  adjust: "Điều chỉnh",
  redeem: "Đổi quà",
};

function WalletPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const reqWithdraw = useServerFn(requestWithdrawal);

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: txns = [] } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ví của tôi</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Số dư
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vnd(wallet?.balance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="h-4 w-4" /> Điểm thưởng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{num(wallet?.reward_points)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Yêu cầu rút
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setWithdrawOpen(true)}
              disabled={!wallet?.balance || Number(wallet.balance) < 10000}
            >
              Rút tiền
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4" /> Lịch sử giao dịch
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Chưa có giao dịch
                  </TableCell>
                </TableRow>
              )}
              {txns.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{dt(t.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabel[t.type] ?? t.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.note ?? "—"}</TableCell>
                  <TableCell
                    className={`text-right font-semibold ${Number(t.amount) >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    {Number(t.amount) >= 0 ? "+" : ""}
                    {vnd(t.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === "completed" ? "default" : "secondary"}>
                      {t.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yêu cầu rút tiền</DialogTitle>
          </DialogHeader>
          <WithdrawForm
            balance={Number(wallet?.balance || 0)}
            onDone={() => {
              setWithdrawOpen(false);
              qc.invalidateQueries({ queryKey: ["wallet"] });
              qc.invalidateQueries({ queryKey: ["transactions"] });
            }}
            submit={reqWithdraw}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WithdrawForm({
  balance,
  onDone,
  submit,
}: {
  balance: number;
  onDone: () => void;
  submit: any;
}) {
  const [amount, setAmount] = useState(0);
  const [bank, setBank] = useState("");
  const [accNum, setAccNum] = useState("");
  const [accHolder, setAccHolder] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    if (amount < 10000) return toast.error("Tối thiểu 10.000 VNĐ");
    if (amount > balance) return toast.error("Số dư không đủ");
    if (!bank || !accNum || !accHolder) return toast.error("Điền đủ thông tin ngân hàng");
    setBusy(true);
    try {
      await submit({
        data: {
          amount,
          bank_info: { bank_name: bank, account_number: accNum, account_holder: accHolder },
        },
      });
      toast.success("Đã gửi yêu cầu, chờ duyệt");
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Số tiền (VNĐ) — tối đa {vnd(balance)}</Label>
          <Input type="number" value={amount || ""} onChange={(e) => setAmount(+e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Ngân hàng</Label>
          <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Vietcombank" />
        </div>
        <div className="space-y-1.5">
          <Label>Số tài khoản</Label>
          <Input value={accNum} onChange={(e) => setAccNum(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Chủ tài khoản</Label>
          <Input value={accHolder} onChange={(e) => setAccHolder(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Hủy
        </Button>
        <Button onClick={go} disabled={busy}>
          Gửi yêu cầu
        </Button>
      </DialogFooter>
    </>
  );
}
