import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantModules } from "@/hooks/useTenantModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BedDouble, Sparkles, Wrench, LogIn, LogOut, ClipboardList,
  CheckCircle2, Circle, Clock, BrushCleaning,
} from "lucide-react";
import { toast } from "sonner";

type Room = {
  id: string;
  room_number: string;
  name: string;
  type: string;
  floor: number | null;
  status: string;
};

type Booking = {
  id: string;
  booking_code: string;
  guest_name: string;
  guest_phone: string | null;
  room_id: string;
  check_in: string;
  check_out: string;
  status: string;
};

type ServiceTask = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  room_id: string | null;
};

// ── Room status presentation ────────────────────────────────────────────────
const ROOM_STATUS: Record<string, { label: string; dot: string; ring: string; chip: string; icon: React.ElementType }> = {
  available:   { label: "Sạch · Trống",  dot: "bg-emerald-500", ring: "border-emerald-500/40 bg-emerald-500/5", chip: "bg-emerald-500/15 text-emerald-600", icon: BedDouble },
  occupied:    { label: "Đang ở",        dot: "bg-blue-500",    ring: "border-blue-500/40 bg-blue-500/5",       chip: "bg-blue-500/15 text-blue-600",       icon: LogIn },
  cleaning:    { label: "Cần dọn dẹp",   dot: "bg-amber-500",   ring: "border-amber-500/40 bg-amber-500/5",     chip: "bg-amber-500/15 text-amber-600",     icon: BrushCleaning },
  maintenance: { label: "Bảo trì",       dot: "bg-rose-500",    ring: "border-rose-500/40 bg-rose-500/5",       chip: "bg-rose-500/15 text-rose-600",       icon: Wrench },
};

const PRIORITY: Record<string, { label: string; chip: string }> = {
  high:   { label: "Gấp",        chip: "bg-rose-500/15 text-rose-600" },
  normal: { label: "Thường",     chip: "bg-muted text-muted-foreground" },
  low:    { label: "Thấp",       chip: "bg-muted text-muted-foreground" },
};

function roomMeta(status: string) {
  return ROOM_STATUS[status] ?? ROOM_STATUS.maintenance;
}

export function StaffOperations() {
  const { tenantId } = useTenantModules();
  const qc = useQueryClient();
  const [checkInBooking, setCheckInBooking] = useState("");
  const [checkOutBooking, setCheckOutBooking] = useState("");

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["staff-rooms", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_rooms")
        .select("id,room_number,name,type,floor,status")
        .eq("tenant_id", tenantId!)
        .order("room_number");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["staff-bookings", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_bookings")
        .select("id,booking_code,guest_name,guest_phone,room_id,check_in,check_out,status")
        .eq("tenant_id", tenantId!)
        .in("status", ["confirmed", "checked_in"])
        .order("check_in");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: tasks = [] } = useQuery<ServiceTask[]>({
    queryKey: ["staff-tasks", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_guest_services")
        .select("id,title,description,category,priority,status,room_id")
        .eq("tenant_id", tenantId!)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const roomLabel = (id: string | null) =>
    rooms.find((r) => r.id === id)?.room_number ?? "—";

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["staff-rooms"] });
    qc.invalidateQueries({ queryKey: ["staff-bookings"] });
    qc.invalidateQueries({ queryKey: ["staff-tasks"] });
    qc.invalidateQueries({ queryKey: ["hotel-rooms"] });
    qc.invalidateQueries({ queryKey: ["hotel-bookings"] });
  };

  const setRoomStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("hotel_rooms").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Đã cập nhật trạng thái phòng"); },
    onError: () => toast.error("Không thể cập nhật phòng"),
  });

  const doCheckIn = useMutation({
    mutationFn: async (bookingId: string) => {
      const b = bookings.find((x) => x.id === bookingId);
      if (!b) throw new Error("missing");
      const { error } = await supabase.from("hotel_bookings")
        .update({ status: "checked_in", check_in_actual: new Date().toISOString() })
        .eq("id", bookingId);
      if (error) throw error;
      await supabase.from("hotel_rooms").update({ status: "occupied" }).eq("id", b.room_id);
    },
    onSuccess: () => { invalidate(); setCheckInBooking(""); toast.success("Check-in thành công"); },
    onError: () => toast.error("Không thể check-in"),
  });

  const doCheckOut = useMutation({
    mutationFn: async (bookingId: string) => {
      const b = bookings.find((x) => x.id === bookingId);
      if (!b) throw new Error("missing");
      const { error } = await supabase.from("hotel_bookings")
        .update({ status: "checked_out", check_out_actual: new Date().toISOString() })
        .eq("id", bookingId);
      if (error) throw error;
      await supabase.from("hotel_rooms").update({ status: "cleaning" }).eq("id", b.room_id);
    },
    onSuccess: () => { invalidate(); setCheckOutBooking(""); toast.success("Check-out thành công · phòng cần dọn"); },
    onError: () => toast.error("Không thể check-out"),
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("hotel_guest_services")
        .update({
          status: done ? "completed" : "pending",
          completed_at: done ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-tasks"] }),
    onError: () => toast.error("Không thể cập nhật công việc"),
  });

  const arrivals = bookings.filter((b) => b.status === "confirmed");
  const inHouse = bookings.filter((b) => b.status === "checked_in");
  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const doneTasks = tasks.filter((t) => t.status === "completed");
  const needCleaning = rooms.filter((r) => r.status === "cleaning").length;

  return (
    <div className="space-y-6">
      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={BedDouble} label="Phòng trống" value={rooms.filter(r => r.status === "available").length} tone="text-emerald-600" />
        <StatCard icon={LogIn} label="Đang ở" value={inHouse.length} tone="text-blue-600" />
        <StatCard icon={BrushCleaning} label="Cần dọn" value={needCleaning} tone="text-amber-600" />
        <StatCard icon={ClipboardList} label="Việc cần làm" value={pendingTasks.length} tone="text-primary" />
      </div>

      {/* ── Room map (Bento Grid) ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BedDouble className="h-4 w-4" /> Sơ đồ buồng phòng
          </CardTitle>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {Object.entries(ROOM_STATUS).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", v.dot)} /> {v.label}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {rooms.map((room) => {
              const meta = roomMeta(room.status);
              const Icon = meta.icon;
              return (
                <div
                  key={room.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl border p-3 transition-all",
                    meta.ring,
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">#{room.room_number}</p>
                      <p className="truncate text-xs text-muted-foreground">{room.name}</p>
                    </div>
                    <Icon className={cn("h-4 w-4 shrink-0", meta.dot.replace("bg-", "text-"))} />
                  </div>
                  <span className={cn("inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.chip)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} /> {meta.label}
                  </span>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {room.status === "cleaning" && (
                      <Button size="sm" variant="secondary" className="h-7 flex-1 text-xs"
                        onClick={() => setRoomStatus.mutate({ id: room.id, status: "available" })}>
                        <Sparkles className="mr-1 h-3 w-3" /> Đã dọn
                      </Button>
                    )}
                    {room.status === "available" && (
                      <Button size="sm" variant="ghost" className="h-7 flex-1 text-xs"
                        onClick={() => setRoomStatus.mutate({ id: room.id, status: "cleaning" })}>
                        <BrushCleaning className="mr-1 h-3 w-3" /> Cần dọn
                      </Button>
                    )}
                    {room.status === "maintenance" && (
                      <Button size="sm" variant="ghost" className="h-7 flex-1 text-xs"
                        onClick={() => setRoomStatus.mutate({ id: room.id, status: "available" })}>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Xong
                      </Button>
                    )}
                    {room.status !== "maintenance" && room.status !== "occupied" && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 shrink-0 p-0 text-xs"
                        title="Báo bảo trì"
                        onClick={() => setRoomStatus.mutate({ id: room.id, status: "maintenance" })}>
                        <Wrench className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {rooms.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <BedDouble className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>Chưa có phòng nào trong hệ thống</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Quick check-in / check-out ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-emerald-600">
              <LogIn className="h-4 w-4" /> Check-in nhanh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={checkInBooking} onValueChange={setCheckInBooking}>
              <SelectTrigger>
                <SelectValue placeholder={arrivals.length ? "Chọn khách sắp đến…" : "Không có khách chờ check-in"} />
              </SelectTrigger>
              <SelectContent>
                {arrivals.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.guest_name} · P.{roomLabel(b.room_id)} · {b.booking_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full" disabled={!checkInBooking || doCheckIn.isPending}
              onClick={() => doCheckIn.mutate(checkInBooking)}>
              <LogIn className="mr-1 h-4 w-4" /> Xác nhận check-in
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-600">
              <LogOut className="h-4 w-4" /> Check-out nhanh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={checkOutBooking} onValueChange={setCheckOutBooking}>
              <SelectTrigger>
                <SelectValue placeholder={inHouse.length ? "Chọn khách đang ở…" : "Không có khách đang ở"} />
              </SelectTrigger>
              <SelectContent>
                {inHouse.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.guest_name} · P.{roomLabel(b.room_id)} · {b.booking_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full" variant="secondary" disabled={!checkOutBooking || doCheckOut.isPending}
              onClick={() => doCheckOut.mutate(checkOutBooking)}>
              <LogOut className="mr-1 h-4 w-4" /> Xác nhận check-out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Daily to-do list ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4" /> Công việc hôm nay
          </CardTitle>
          <Badge variant="secondary">{doneTasks.length}/{tasks.length} hoàn thành</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingTasks.map((t) => (
            <TaskRow key={t.id} task={t} room={roomLabel(t.room_id)}
              onToggle={(done) => toggleTask.mutate({ id: t.id, done })} />
          ))}
          {doneTasks.map((t) => (
            <TaskRow key={t.id} task={t} room={roomLabel(t.room_id)} done
              onToggle={(done) => toggleTask.mutate({ id: t.id, done })} />
          ))}
          {tasks.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>Chưa có công việc nào — tuyệt vời!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: {
  icon: React.ElementType; label: string; value: number; tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted/60", tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className={cn("text-2xl font-bold leading-none", tone)}>{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({ task, room, done, onToggle }: {
  task: ServiceTask; room: string; done?: boolean; onToggle: (done: boolean) => void;
}) {
  const pri = PRIORITY[task.priority] ?? PRIORITY.normal;
  return (
    <button
      onClick={() => onToggle(!done)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-sm",
        done && "opacity-60",
      )}
    >
      {done
        ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
        : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", done && "line-through")}>{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.room_id && <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" /> P.{room}</span>}
          {task.description && <span className="truncate">{task.description}</span>}
        </div>
      </div>
      {!done && (
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", pri.chip)}>
          {task.priority === "high" ? <Clock className="mr-0.5 inline h-3 w-3" /> : null}{pri.label}
        </span>
      )}
    </button>
  );
}