import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantModules } from "@/hooks/useTenantModules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Send, Loader2, CheckCircle2, Clock, RefreshCw, Bell, ListChecks, XCircle,
  Utensils, BedDouble, Shirt, Sparkles, Car, Cpu, ConciergeBell,
} from "lucide-react";

type ServiceRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string | null;
  requested_at: string;
  scheduled_at: string | null;
  completed_at: string | null;
  staff_note: string | null;
  room_id: string | null;
  hotel_rooms: { room_number: string; name: string } | null;
};

/** Lifecycle stages in display order. */
const STAGES = [
  { key: "sent",       label: "Đã gửi",     icon: Send,        tone: "text-sky-500",     dot: "bg-sky-500" },
  { key: "processing", label: "Đang xử lý", icon: Loader2,     tone: "text-amber-500",   dot: "bg-amber-500" },
  { key: "completed",  label: "Hoàn tất",   icon: CheckCircle2, tone: "text-emerald-500", dot: "bg-emerald-500" },
  { key: "cancelled",  label: "Đã hủy",     icon: XCircle,     tone: "text-rose-500",    dot: "bg-rose-500" },
] as const;

/** Map raw DB status → one of the canonical stages. */
function stageOf(status: string): (typeof STAGES)[number]["key"] {
  const s = (status || "").toLowerCase();
  if (["completed", "done", "delivered", "resolved"].includes(s)) return "completed";
  if (["in_progress", "processing", "working", "assigned", "accepted"].includes(s)) return "processing";
  if (["cancelled", "canceled", "revoked"].includes(s)) return "cancelled";
  return "sent";
}

function stageIndex(key: string) {
  return STAGES.findIndex(st => st.key === key);
}

const CATEGORY_META: Record<string, { label: string; icon: typeof Utensils }> = {
  room_service: { label: "Đồ ăn / Đồ uống", icon: Utensils },
  housekeeping: { label: "Dọn phòng",       icon: BedDouble },
  laundry:      { label: "Giặt là",         icon: Shirt },
  spa:          { label: "Spa & Massage",   icon: Sparkles },
  transport:    { label: "Đưa đón",         icon: Car },
  iot:          { label: "Thiết bị phòng",  icon: Cpu },
};
function catMeta(c: string) {
  return CATEGORY_META[c] ?? { label: c || "Khác", icon: ConciergeBell };
}

function fmtTime(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("vi-VN", {
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit",
  });
}
function ago(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Khẩn", cls: "border-red-500/40 text-red-500" },
  high:   { label: "Cao",  cls: "border-orange-500/40 text-orange-500" },
  normal: { label: "",     cls: "" },
  low:    { label: "",     cls: "" },
};

export function ServiceTimeline() {
  const { tenantId } = useTenantModules();
  const qc = useQueryClient();

  const { data: rows = [], isFetching } = useQuery<ServiceRow[]>({
    queryKey: ["service-timeline", tenantId],
    enabled: !!tenantId,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_guest_services")
        .select("id,title,category,status,priority,requested_at,scheduled_at,completed_at,staff_note,room_id,hotel_rooms(room_number,name)")
        .eq("tenant_id", tenantId!)
        .neq("category", "iot")
        .order("requested_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as ServiceRow[];
    },
  });

  const cancelRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hotel_guest_services")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã hủy yêu cầu dịch vụ");
      qc.invalidateQueries({ queryKey: ["service-timeline"] });
    },
    onError: () => toast.error("Không thể hủy yêu cầu"),
  });

  const stats = useMemo(() => {
    const c = { sent: 0, processing: 0, completed: 0, cancelled: 0 };
    rows.forEach(r => { c[stageOf(r.status)]++; });
    return c;
  }, [rows]);

  // Active requests first; completed / cancelled last.
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ca = ["completed", "cancelled"].includes(stageOf(a.status)) ? 1 : 0;
      const cb = ["completed", "cancelled"].includes(stageOf(b.status)) ? 1 : 0;
      if (ca !== cb) return ca - cb;
      return new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime();
    });
  }, [rows]);

  return (
    <div className="space-y-5">
      {/* Header + summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ListChecks className="h-5 w-5 text-primary" /> Theo dõi yêu cầu dịch vụ
          </h2>
          <p className="text-sm text-muted-foreground">
            Trạng thái thời gian thực từ lúc khách gửi đến khi hoàn tất.
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => qc.invalidateQueries({ queryKey: ["service-timeline"] })}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} /> Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAGES.map(st => {
          const Icon = st.icon;
          return (
            <Card key={st.key}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-muted", st.tone)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-2xl font-bold tabular-nums">{stats[st.key]}</div>
                  <div className="text-xs text-muted-foreground">{st.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Timeline list */}
      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Bell className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>Chưa có yêu cầu dịch vụ nào.</p>
            <p className="text-sm">Yêu cầu của khách sẽ xuất hiện và được theo dõi tại đây.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map(r => {
            const stage = stageOf(r.status);
            const idx = stageIndex(stage);
            const cm = catMeta(r.category);
            const CatIcon = cm.icon;
            const prio = PRIORITY_META[r.priority ?? "normal"];
            const done = stage === "completed";
            return (
              <Card key={r.id} className={cn(!done && "border-primary/30")}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <CatIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{r.title}</span>
                          {prio?.label && (
                            <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", prio.cls)}>
                              {prio.label}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {cm.label}
                          {r.hotel_rooms && ` · Phòng ${r.hotel_rooms.room_number}`}
                          {` · ${ago(r.requested_at)}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge
                        variant={done ? "secondary" : stage === "cancelled" ? "outline" : "default"}
                        className={cn("shrink-0", !done && stage !== "cancelled" && "animate-pulse")}
                      >
                        {STAGES[idx].label}
                      </Badge>
                      {stage === "sent" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[11px] text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                          disabled={cancelRequest.isPending}
                          onClick={() => cancelRequest.mutate(r.id)}
                        >
                          Hủy
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress stepper */}
                  <div className="flex items-center">
                    {STAGES.map((st, i) => {
                      const reached = i <= idx;
                      const active = i === idx && !done;
                      const StIcon = st.icon;
                      return (
                        <div key={st.key} className="flex flex-1 items-center last:flex-none">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={cn(
                                "grid h-8 w-8 place-items-center rounded-full border-2 transition-colors",
                                reached
                                  ? "border-transparent text-white " + st.dot
                                  : "border-muted-foreground/30 text-muted-foreground/40",
                              )}
                            >
                              <StIcon className={cn("h-4 w-4", active && st.key === "processing" && "animate-spin")} />
                            </span>
                            <span className={cn("text-[10px] font-medium", reached ? st.tone : "text-muted-foreground/50")}>
                              {st.label}
                            </span>
                          </div>
                          {i < STAGES.length - 1 && (
                            <div className={cn("mx-1 h-0.5 flex-1 rounded", i < idx ? st.dot : "bg-muted")} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Timestamps + note */}
                  <div className="grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-3">
                    <span className="flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5 text-sky-500" /> Gửi: {fmtTime(r.requested_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" /> Hẹn: {fmtTime(r.scheduled_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Xong: {fmtTime(r.completed_at)}
                    </span>
                  </div>
                  {r.staff_note && (
                    <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
                      <span className="font-medium">Ghi chú nhân viên: </span>{r.staff_note}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}