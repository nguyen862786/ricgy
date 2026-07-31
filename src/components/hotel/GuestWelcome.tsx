import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantModules } from "@/hooks/useTenantModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Thermometer, Lightbulb, Blinds, Snowflake, Minus, Plus,
  Utensils, BedDouble, Shirt, Sparkles, Car, Phone, Coffee,
  Sun, Moon, Sunrise, Leaf, CalendarDays, Users, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { toast } from "sonner";

type Booking = {
  id: string;
  booking_code: string;
  guest_name: string;
  room_id: string;
  check_in: string;
  check_out: string;
  num_adults: number;
  num_children: number;
  status: string;
  hotel_rooms: { room_number: string; name: string; type: string; iot_device_id: string | null } | null;
};

type GuestService = {
  id: string;
  title: string;
  category: string;
  status: string;
  requested_at: string;
};

const QUICK_SERVICES = [
  { id: "food",        label: "Gọi món ăn",   desc: "Thực đơn tại phòng",   icon: Utensils,  category: "room_service" },
  { id: "housekeeping", label: "Dọn phòng",   desc: "Vệ sinh & thay khăn",  icon: BedDouble, category: "housekeeping" },
  { id: "coffee",      label: "Trà & Cà phê", desc: "Đồ uống miễn phí",     icon: Coffee,    category: "room_service" },
  { id: "laundry",     label: "Giặt là",      desc: "Nhận trong 24h",       icon: Shirt,     category: "laundry" },
  { id: "spa",         label: "Spa & Massage", desc: "Đặt lịch trị liệu",   icon: Sparkles,  category: "spa" },
  { id: "transport",   label: "Đưa đón",      desc: "Xe điện sân vườn",     icon: Car,       category: "transport" },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return { text: "Chào buổi sáng", icon: Sunrise };
  if (h < 18) return { text: "Chào buổi chiều", icon: Sun };
  return { text: "Chào buổi tối", icon: Moon };
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function GuestWelcome() {
  const { tenantId } = useTenantModules();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // IoT local state (optimistic) — synced to server on change.
  const [lightOn, setLightOn] = useState(true);
  const [brightness, setBrightness] = useState(75);
  const [blinds, setBlinds] = useState(60);
  const [acOn, setAcOn] = useState(true);
  const [temp, setTemp] = useState(24);

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["guest-stays", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_bookings")
        .select("id,booking_code,guest_name,room_id,check_in,check_out,num_adults,num_children,status,hotel_rooms(room_number,name,type,iot_device_id)")
        .eq("tenant_id", tenantId!)
        .in("status", ["checked_in", "confirmed"])
        .order("status", { ascending: true })
        .order("check_in", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Booking[];
    },
  });

  const activeId = selectedId ?? bookings[0]?.id ?? null;
  const stay = bookings.find(b => b.id === activeId) ?? null;
  const room = stay?.hotel_rooms ?? null;

  const { data: services = [] } = useQuery<GuestService[]>({
    queryKey: ["guest-stay-services", tenantId, activeId],
    enabled: !!tenantId && !!stay,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("hotel_guest_services")
        .select("id,title,category,status,requested_at")
        .eq("tenant_id", tenantId!)
        .eq("room_id", stay!.room_id)
        .neq("category", "iot")
        .order("requested_at", { ascending: false })
        .limit(6);
      return (data ?? []) as GuestService[];
    },
  });

  const sendService = useMutation({
    mutationFn: async ({ label, category }: { label: string; category: string }) => {
      if (!tenantId || !stay) throw new Error("no-stay");
      const { error } = await supabase.from("hotel_guest_services").insert({
        tenant_id: tenantId,
        room_id: stay.room_id,
        booking_id: stay.id,
        title: label,
        category,
        priority: "normal",
      });
      if (error) throw error;
    },
    onSuccess: (_, { label }) => {
      toast.success(`Đã gửi yêu cầu: ${label}`, { description: "Nhân viên sẽ phục vụ quý khách ngay." });
      qc.invalidateQueries({ queryKey: ["guest-stay-services"] });
    },
    onError: () => toast.error("Không thể gửi yêu cầu"),
  });

  const cancelService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hotel_guest_services")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã hủy yêu cầu");
      qc.invalidateQueries({ queryKey: ["guest-stay-services"] });
    },
    onError: () => toast.error("Không thể hủy yêu cầu"),
  });

  const sendIoT = useMutation({
    mutationFn: async ({ control, value }: { control: string; value: number | boolean }) => {
      if (!tenantId || !stay) throw new Error("no-stay");
      const { error } = await supabase.from("hotel_guest_services").insert({
        tenant_id: tenantId,
        room_id: stay.room_id,
        booking_id: stay.id,
        title: `IoT: ${control} → ${value}`,
        category: "iot",
        priority: "low",
        iot_device_id: room?.iot_device_id ?? null,
        iot_command: { control, value },
      });
      if (error) throw error;
    },
  });

  const g = greeting();
  const GreetIcon = g.icon;

  if (!stay) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <Leaf className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>Hiện chưa có lượt lưu trú nào đang hoạt động.</p>
          <p className="text-sm">Khi khách nhận phòng, trải nghiệm sẽ hiển thị tại đây.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Room switcher (demo: choose which guest's screen to preview) */}
      {bookings.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Đang xem màn hình của:</span>
          <Select value={activeId ?? undefined} onValueChange={setSelectedId}>
            <SelectTrigger className="h-8 w-auto gap-2 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {bookings.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.guest_name} · P.{b.hotel_rooms?.room_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Welcome hero ── */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-primary/5 to-background p-6 sm:p-8">
        <Leaf className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 rotate-12 text-primary/10" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <GreetIcon className="h-4 w-4" /> {g.text}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Chào mừng, {stay.guest_name}
            </h2>
            <p className="mt-1 text-muted-foreground">
              Chúc quý khách có kỳ nghỉ an lành tại Oasis Garden Sanctuary 🌿
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroStat icon={BedDouble} label="Bungalow" value={room ? `${room.name}` : "—"} sub={room ? `Phòng #${room.room_number}` : ""} />
            <HeroStat icon={CalendarDays} label="Lưu trú" value={`${fmtDate(stay.check_in)} → ${fmtDate(stay.check_out)}`} sub={stay.booking_code} />
            <HeroStat icon={Users} label="Số khách" value={`${stay.num_adults} người lớn`} sub={stay.num_children > 0 ? `${stay.num_children} trẻ em` : "—"} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Service call buttons ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 text-primary" /> Gọi dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {QUICK_SERVICES.map(svc => (
              <button
                key={svc.id}
                disabled={sendService.isPending}
                onClick={() => sendService.mutate({ label: svc.label, category: svc.category })}
                className="group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <svc.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{svc.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{svc.desc}</span>
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* ── IoT mini dashboard ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Điều khiển bungalow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Lights */}
            <div className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Lightbulb className={cn("h-4 w-4", lightOn ? "text-amber-500" : "text-muted-foreground")} />
                  Đèn phòng
                </div>
                <Switch
                  checked={lightOn}
                  onCheckedChange={(v) => { setLightOn(v); sendIoT.mutate({ control: "light", value: v }); }}
                />
              </div>
              {lightOn && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="w-10 text-right font-mono text-sm font-bold text-primary">{brightness}%</span>
                  <Slider
                    min={10} max={100} step={5}
                    value={[brightness]}
                    onValueChange={([v]) => setBrightness(v)}
                    onValueCommit={([v]) => sendIoT.mutate({ control: "brightness", value: v })}
                  />
                </div>
              )}
            </div>

            {/* Blinds */}
            <div className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Blinds className="h-4 w-4 text-muted-foreground" /> Rèm cửa
                </div>
                <span className="font-mono text-sm font-bold text-primary">{blinds}%</span>
              </div>
              <Slider
                className="mt-3"
                min={0} max={100} step={10}
                value={[blinds]}
                onValueChange={([v]) => setBlinds(v)}
                onValueCommit={([v]) => sendIoT.mutate({ control: "blinds", value: v })}
              />
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>Đóng</span><span>Mở</span>
              </div>
            </div>

            {/* AC */}
            <div className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Snowflake className={cn("h-4 w-4", acOn ? "text-sky-500" : "text-muted-foreground")} />
                  Điều hòa
                </div>
                <Switch
                  checked={acOn}
                  onCheckedChange={(v) => { setAcOn(v); sendIoT.mutate({ control: "ac", value: v }); }}
                />
              </div>
              {acOn && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Button
                    variant="outline" size="icon" className="h-10 w-10 rounded-full"
                    onClick={() => { const v = Math.max(16, temp - 1); setTemp(v); sendIoT.mutate({ control: "temperature", value: v }); }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex items-baseline gap-1">
                    <Thermometer className="h-5 w-5 self-center text-sky-500" />
                    <span className="font-mono text-3xl font-bold text-primary">{temp}</span>
                    <span className="text-sm text-muted-foreground">°C</span>
                  </div>
                  <Button
                    variant="outline" size="icon" className="h-10 w-10 rounded-full"
                    onClick={() => { const v = Math.min(30, temp + 1); setTemp(v); sendIoT.mutate({ control: "temperature", value: v }); }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Request status ── */}
      {services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" /> Yêu cầu gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {services.map(s => {
              const done = s.status === "completed";
              const cancelled = s.status === "cancelled";
              const sent = s.status === "sent";
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                  {done
                    ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    : cancelled
                      ? <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                      : <Clock className="h-5 w-5 shrink-0 text-amber-500" />}
                  <span className="min-w-0 flex-1 truncate font-medium">{s.title}</span>
                  {sent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                      disabled={cancelService.isPending}
                      onClick={() => cancelService.mutate(s.id)}
                    >
                      Hủy
                    </Button>
                  )}
                  <Badge variant={done ? "secondary" : cancelled ? "outline" : "default"} className="shrink-0 text-[11px]">
                    {done ? "Hoàn thành" : cancelled ? "Đã hủy" : s.status === "in_progress" ? "Đang phục vụ" : "Đã tiếp nhận"}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HeroStat({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-background/60 p-3 backdrop-blur-sm">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}