import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vnd, dt } from "@/lib/format";
import { processWithdrawal } from "@/lib/withdrawals.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/withdrawals")({
  component: WithdrawalsPage,
});

function WithdrawalsPage() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const process = useServerFn(processWithdrawal);

  const { data: rows = [] } = useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("withdrawal_requests")
        .select("*, profiles:user_id(email, full_name)")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  if (!isStaff) return <div className="text-muted-foreground">Không có quyền truy cập.</div>;

  async function act(id: string, action: "approve" | "reject") {
    try {
      await process({ data: { requestId: id, action } });
      toast.success(action === "approve" ? "Đã duyệt và trừ ví" : "Đã từ chối");
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Duyệt rút tiền</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead>Ngân hàng</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-44" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Chưa có yêu cầu
                </TableCell>
              </TableRow>
            )}
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm">{dt(r.created_at)}</TableCell>
                <TableCell className="text-sm">
                  {r.profiles?.full_name || r.profiles?.email || r.user_id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-sm">
                  <div>{r.bank_info?.bank_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.bank_info?.account_number} — {r.bank_info?.account_holder}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">{vnd(r.amount)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === "pending"
                        ? "secondary"
                        : r.status === "approved"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => act(r.id, "approve")}>
                        Duyệt
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => act(r.id, "reject")}>
                        Từ chối
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
