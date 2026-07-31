import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getQiClubReconciliation } from "@/lib/reports.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { vnd, num } from "@/lib/format";
import { FileSpreadsheet, Building2, Store, Coins, Hash } from "lucide-react";

const RANGES = [
  { v: 30, l: "30 ngày" },
  { v: 90, l: "Quý này" },
  { v: 180, l: "6 tháng" },
  { v: 365, l: "1 năm" },
];

function exportXLS(
  filename: string,
  title: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const esc = (v: string | number) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const thead = `<tr>${headers.map((h) => `<th style="background:#1f2937;color:#fff;border:1px solid #999;padding:4px">${esc(h)}</th>`).join("")}</tr>`;
  const tbody = rows
    .map(
      (r) =>
        `<tr>${r.map((c, i) => `<td style="border:1px solid #ccc;padding:4px;${i === 0 ? "" : "text-align:right"}">${esc(c)}</td>`).join("")}</tr>`,
    )
    .join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><h3>${esc(title)}</h3><table>${thead}${tbody}</table></body></html>`;
  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function QiClubReconciliation() {
  const [days, setDays] = useState(90);
  const [promotionId, setPromotionId] = useState<string>("all");
  const [storeId, setStoreId] = useState<string>("all");
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);

  const fetchRecon = useServerFn(getQiClubReconciliation);
  const { data, isLoading, error } = useQuery({
    queryKey: ["qiclub-recon", days, promotionId, storeId],
    queryFn: () =>
      fetchRecon({
        data: {
          days,
          promotionId: promotionId === "all" ? null : promotionId,
          storeId: storeId === "all" ? null : storeId,
        },
      }),
    enabled: hasSession === true,
  });

  const t = data?.totals;

  function doExport() {
    if (!data) return;
    const headers = [
      "Mã voucher",
      "QiClub Ref",
      "Chiến dịch",
      "Cửa hàng",
      "Đơn hàng",
      "Giá trị voucher",
      "QiClub trả",
      "Tổng Cty trả",
      "Cửa hàng trả",
      "Thời gian",
    ];
    const rows = data.detail.map((r) => [
      r.code,
      r.qiclub_ref ?? "",
      r.campaign,
      r.store,
      r.order_code,
      r.voucher_amount,
      r.qiclub_amount,
      r.company_amount,
      r.store_amount,
      r.claimed_at ? new Date(r.claimed_at).toLocaleString("vi-VN") : "",
    ]);
    if (t)
      rows.push([
        "TỔNG CỘNG",
        "",
        "",
        "",
        String(t.count) + " mã",
        t.voucher,
        t.qiclub,
        t.company,
        t.store,
        "",
      ]);
    const month = new Date().toISOString().slice(0, 7);
    exportXLS(`doi-soat-qiclub-${month}.xls`, `Đối soát công nợ QiClub — ${month}`, headers, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Kỳ đối soát</div>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.v} value={String(r.v)}>
                  {r.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Chiến dịch voucher</div>
          <Select value={promotionId} onValueChange={setPromotionId}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chiến dịch</SelectItem>
              {(data?.campaigns ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Cửa hàng</div>
          <Select value={storeId} onValueChange={setStoreId}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả cửa hàng</SelectItem>
              {(data?.stores ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" disabled={!data || data.detail.length === 0} onClick={doExport}>
          <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Xuất Excel
        </Button>
      </div>

      {hasSession === false && (
        <Card className="p-4 text-sm text-muted-foreground">
          Chế độ xem trước — cần đăng nhập thực để tải dữ liệu đối soát.
        </Card>
      )}
      {error && (
        <Card className="p-4 text-sm text-destructive">
          Không tải được: {(error as Error).message}
        </Card>
      )}
      {isLoading && <div className="text-muted-foreground">Đang tải...</div>}

      {t && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Hash className="h-4 w-4" /> Số mã đã dùng
              </div>
              <div className="text-xl font-bold mt-1">{num(t.count)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Coins className="h-4 w-4" /> Tổng giá trị
              </div>
              <div className="text-xl font-bold mt-1">{vnd(t.voucher)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="px-1 text-[10px]">
                  QiClub
                </Badge>{" "}
                Phải thu
              </div>
              <div className="text-xl font-bold mt-1 text-primary">{vnd(t.qiclub)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-4 w-4" /> Tổng Cty
              </div>
              <div className="text-xl font-bold mt-1">{vnd(t.company)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Store className="h-4 w-4" /> Cửa hàng
              </div>
              <div className="text-xl font-bold mt-1">{vnd(t.store)}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <div className="p-4 border-b font-semibold">Theo chiến dịch</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chiến dịch</TableHead>
                    <TableHead className="text-right">Mã</TableHead>
                    <TableHead className="text-right">QiClub</TableHead>
                    <TableHead className="text-right">Tổng Cty</TableHead>
                    <TableHead className="text-right">CH</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byCampaign.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Chưa có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                  {data.byCampaign.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.campaign}</TableCell>
                      <TableCell className="text-right">{num(c.count)}</TableCell>
                      <TableCell className="text-right">{vnd(c.qiclub)}</TableCell>
                      <TableCell className="text-right">{vnd(c.company)}</TableCell>
                      <TableCell className="text-right">{vnd(c.store)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card>
              <div className="p-4 border-b font-semibold">Theo cửa hàng</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cửa hàng</TableHead>
                    <TableHead className="text-right">Mã</TableHead>
                    <TableHead className="text-right">QiClub</TableHead>
                    <TableHead className="text-right">Tổng Cty</TableHead>
                    <TableHead className="text-right">CH</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byStore.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Chưa có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                  {data.byStore.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{s.store}</TableCell>
                      <TableCell className="text-right">{num(s.count)}</TableCell>
                      <TableCell className="text-right">{vnd(s.qiclub)}</TableCell>
                      <TableCell className="text-right">{vnd(s.company)}</TableCell>
                      <TableCell className="text-right">{vnd(s.store_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <Card>
            <div className="p-4 border-b font-semibold">Chi tiết lượt sử dụng voucher</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã voucher</TableHead>
                  <TableHead>Chiến dịch</TableHead>
                  <TableHead>Cửa hàng</TableHead>
                  <TableHead>Đơn</TableHead>
                  <TableHead className="text-right">Giá trị</TableHead>
                  <TableHead className="text-right">QiClub</TableHead>
                  <TableHead className="text-right">Tổng Cty</TableHead>
                  <TableHead className="text-right">CH</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.detail.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Chưa có voucher QiClub nào được sử dụng
                    </TableCell>
                  </TableRow>
                )}
                {data.detail.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell>{r.campaign}</TableCell>
                    <TableCell>{r.store}</TableCell>
                    <TableCell className="font-mono text-xs">{r.order_code}</TableCell>
                    <TableCell className="text-right">{vnd(r.voucher_amount)}</TableCell>
                    <TableCell className="text-right">{vnd(r.qiclub_amount)}</TableCell>
                    <TableCell className="text-right">{vnd(r.company_amount)}</TableCell>
                    <TableCell className="text-right">{vnd(r.store_amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.claimed_at ? new Date(r.claimed_at).toLocaleString("vi-VN") : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
