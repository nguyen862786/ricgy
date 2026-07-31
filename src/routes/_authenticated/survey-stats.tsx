import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3, ClipboardList, Users, RotateCcw } from "lucide-react";
import { listSurveyLeads, type SurveyLeadRow } from "@/lib/survey-leads.functions";
import { SURVEY_STEPS } from "@/lib/survey-audit";

export const Route = createFileRoute("/_authenticated/survey-stats")({
  component: SurveyStatsPage,
});

// Nhãn dễ đọc cho từng đáp án theo từng bước.
const labelMapFor = (stepId: string): Record<string, string> => {
  const step = SURVEY_STEPS.find((s) => s.id === stepId);
  return Object.fromEntries((step?.options ?? []).map((o) => [o.id, o.label]));
};
const BUSINESS_LABELS = labelMapFor("business_model");
const OPS_LABELS = labelMapFor("ops_pains");
const MKT_LABELS = labelMapFor("marketing_pains");

const ANON = "__anon__";
const ALL = "__all__";

interface CountRow {
  key: string;
  label: string;
  count: number;
}

function tally(
  leads: SurveyLeadRow[],
  pick: (l: SurveyLeadRow) => string[],
  labels: Record<string, string>,
): CountRow[] {
  const map = new Map<string, number>();
  for (const l of leads) for (const id of pick(l)) map.set(id, (map.get(id) ?? 0) + 1);
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, label: labels[key] ?? key, count }))
    .sort((a, b) => b.count - a.count);
}

function BarList({ rows, total }: { rows: CountRow[]; total: number }) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">Không có dữ liệu phù hợp bộ lọc.</p>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.key} className="space-y-1">
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="leading-snug">{r.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {r.count}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({total ? Math.round((r.count / total) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SurveyStatsPage() {
  const fetchLeads = useServerFn(listSurveyLeads);
  const { data, isLoading, error } = useQuery({
    queryKey: ["survey-leads"],
    queryFn: () => fetchLeads(),
  });
  const allLeads = useMemo(() => data?.leads ?? [], [data]);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [staff, setStaff] = useState<string>(ALL);

  // Danh sách nhân sự tạo lead (để lọc).
  const staffOptions = useMemo(() => {
    const map = new Map<string, string>();
    let hasAnon = false;
    for (const l of allLeads) {
      if (l.created_by) map.set(l.created_by, l.created_by_name ?? "Nhân sự");
      else hasAnon = true;
    }
    return {
      list: Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1])),
      hasAnon,
    };
  }, [allLeads]);

  const leads = useMemo(() => {
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toTs = to ? new Date(to + "T23:59:59").getTime() : null;
    return allLeads.filter((l) => {
      const ts = new Date(l.created_at).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      if (staff === ANON && l.created_by) return false;
      if (staff !== ALL && staff !== ANON && l.created_by !== staff) return false;
      return true;
    });
  }, [allLeads, from, to, staff]);

  const industryRows = useMemo(
    () => tally(leads, (l) => (l.business_model ? [l.business_model] : []), BUSINESS_LABELS),
    [leads],
  );
  const opsRows = useMemo(() => tally(leads, (l) => l.ops_pains, OPS_LABELS), [leads]);
  const mktRows = useMemo(() => tally(leads, (l) => l.marketing_pains, MKT_LABELS), [leads]);

  const resetFilters = () => {
    setFrom("");
    setTo("");
    setStaff(ALL);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" /> Thống kê khảo sát chẩn đoán
          </h1>
          <p className="text-sm text-muted-foreground">
            Số lượng lead theo ngành nghề và nhóm nỗi đau từ trang /survey-audit.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {leads.length} / {allLeads.length} lead
        </Badge>
      </div>

      {/* Bộ lọc */}
      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="from">Từ ngày</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">Đến ngày</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Nhân sự tạo lead</Label>
            <Select value={staff} onValueChange={setStaff}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả</SelectItem>
                {staffOptions.hasAnon && (
                  <SelectItem value={ANON}>Khách vãng lai (công khai)</SelectItem>
                )}
                {staffOptions.list.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={resetFilters} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Đặt lại
            </Button>
          </div>
        </div>
      </Card>

      {isLoading && <Card className="p-4 text-muted-foreground">Đang tải dữ liệu...</Card>}
      {error && (
        <Card className="p-4 text-sm text-destructive">
          Không tải được dữ liệu khảo sát: {(error as Error).message}
        </Card>
      )}

      {!isLoading && !error && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5" /> Lead theo ngành nghề
            </h2>
            <BarList rows={industryRows} total={leads.length} />
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5" /> Nhóm nỗi đau vận hành
            </h2>
            <BarList rows={opsRows} total={leads.length} />
          </Card>

          <Card className="p-5 lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5" /> Nhóm nỗi đau marketing & tăng trưởng
            </h2>
            <BarList rows={mktRows} total={leads.length} />
          </Card>
        </div>
      )}
    </div>
  );
}