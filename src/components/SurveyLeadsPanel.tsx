import { useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
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
import { Download, ClipboardList } from "lucide-react";
import { listSurveyLeads, type SurveyLeadRow } from "@/lib/survey-leads.functions";
import { SURVEY_STEPS, MODULE_BLOCKS } from "@/lib/survey-audit";

// Bảng tra cứu nhãn dễ đọc cho id đáp án và khối module.
const OPTION_LABELS: Record<string, string> = Object.fromEntries(
  SURVEY_STEPS.flatMap((s) => s.options.map((o) => [o.id, o.label])),
);
const MODULE_LABELS: Record<string, string> = Object.fromEntries(
  MODULE_BLOCKS.map((b) => [b.key, b.tagline]),
);

const optLabel = (id: string | null | undefined) => (id ? OPTION_LABELS[id] ?? id : "");
const optList = (ids: string[]) => ids.map((id) => OPTION_LABELS[id] ?? id).join("; ");
const modList = (ids: string[]) => ids.map((id) => MODULE_LABELS[id] ?? id).join("; ");

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv =
    "\uFEFF" +
    [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsvRows(leads: SurveyLeadRow[]) {
  return leads.map((l) => ({
    "Thời gian": new Date(l.created_at).toLocaleString("vi-VN"),
    "Họ tên": l.contact_name ?? "",
    "Số điện thoại": l.contact_phone ?? "",
    Email: l.contact_email ?? "",
    "Doanh nghiệp": l.contact_company ?? "",
    "Mô hình kinh doanh": optLabel(l.business_model),
    "Nỗi đau vận hành": optList(l.ops_pains),
    "Nỗi đau marketing": optList(l.marketing_pains),
    "Kỳ vọng": optList(l.expectations),
    "Rào cản": optLabel(l.barrier),
    "Module mở khoá": modList(l.unlocked_modules),
  }));
}

export function SurveyLeadsPanel() {
  const fetchLeads = useServerFn(listSurveyLeads);
  const { data, isLoading, error } = useQuery({
    queryKey: ["survey-leads"],
    queryFn: () => fetchLeads(),
  });
  const leads = useMemo(() => data?.leads ?? [], [data]);

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCSV(`survey-leads-${stamp}.csv`, toCsvRows(leads));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5" /> Khảo sát chẩn đoán
          {leads.length > 0 && <Badge variant="secondary">{leads.length} lead</Badge>}
        </h2>
        <Button onClick={handleExport} disabled={leads.length === 0} className="gap-2">
          <Download className="h-4 w-4" /> Xuất CSV
        </Button>
      </div>

      {isLoading && <div className="text-muted-foreground">Đang tải...</div>}
      {error && (
        <Card className="p-4 text-sm text-destructive">
          Không tải được dữ liệu khảo sát: {(error as Error).message}
        </Card>
      )}

      {!isLoading && !error && leads.length === 0 && (
        <Card className="p-4 text-sm text-muted-foreground">Chưa có lead khảo sát nào.</Card>
      )}

      {leads.length > 0 && (
        <Card className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Doanh nghiệp</TableHead>
                <TableHead>Mô hình</TableHead>
                <TableHead>Module mở khoá</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(l.created_at).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="font-medium">{l.contact_name ?? "—"}</TableCell>
                  <TableCell className="text-xs">
                    <div>{l.contact_phone ?? "—"}</div>
                    <div className="text-muted-foreground">{l.contact_email ?? ""}</div>
                  </TableCell>
                  <TableCell>{l.contact_company ?? "—"}</TableCell>
                  <TableCell className="max-w-[220px] text-xs">{optLabel(l.business_model) || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {l.unlocked_modules.map((m) => (
                        <Badge key={m} variant="outline" className="text-[10px]">
                          {MODULE_LABELS[m] ?? m}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
