import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantModules } from "@/hooks/useTenantModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Thermometer, Lightbulb, Wind, BedDouble,
  Utensils, Shirt, Sparkles, Car, Wifi, Phone, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

type HotelRoom = {
  id: string;
  room_number: string;
  name: string;
  status: string;
  iot_device_id: string | null;
};

type GuestService = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  requested_at: string;
  room_id: string | null;
};

const IOT_CONTROLS = [
  { id: "temperature", label: "Nhiệt độ", icon: Thermometer, unit: "°C", min: 16, max: 30, defaultVal: 23 },
  { id: "brightness",  label: "Đèn",      icon: Lightbulb,   unit: "%",  min: 0,  max: 100, defaultVal: 80 },
  { id: "blinds",      label: "Rèm cửa",  icon: Wind,        unit: "%",  min: 0,  max: 100, defaultVal: 50 },
] as const;

const QUICK_SERVICES = [
  { id: "room_service",  label: "Dọn phòng",    icon: BedDouble,  category: "housekeeping" },
  { id: "food",          label: "Room Service",  icon: Utensils,   category: "room_service" },
  { id: "laundry",       label: "Giặt là",       icon: Shirt,      category: "laundry" },
  { id: "spa",           label: "Spa & Massage", icon: Sparkles,   category: "spa" },
  { id: "transport",     label: "Đưa đón",       icon: Car,        category: "transport" },
  { id: "wifi_support",  label: "Hỗ trợ WiFi",  icon: Wifi,       category: "other" },
  { id: "reception",     label: "Lễ tân",        icon: Phone,      category: "other" },
] as const;

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "secondary", normal: "outline", high: "default", urgent: "destructive",
};

export function GuestPortal() {
  const { tenantId } = useTenantModules();
  const qc = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [iotValues, setIotValues] = useState<Record<string, number>>({
    temperature: 23, brightness: 80, blinds: 50,
  });

  const { data: rooms = [] } = useQuery<HotelRoom[]>({
    queryKey: ["hotel-rooms-portal", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data } = await supabase
        .from("hotel_rooms")
        .select("id,room_number,name,status,iot_device_id")
        .eq("tenant_id", tenantId!)
        .order("room_number");
      return (data ?? []) as HotelRoom[];
    },
  });

  const activeRoomId = selectedRoomId ?? rooms[0]?.id ?? null;
  const activeRoom = rooms.find(r => r.id === activeRoomId);

  const { data: services = [] } = useQuery<GuestService[]>({
    queryKey: ["hotel-services", tenantId, activeRoomId],
    enabled: !!tenantId,
    refetchInterval: 15_000,
    queryFn: async () => {
      let q = supabase
        .from("hotel_guest_services")
        .select("id,title,category,status,priority,requested_at,room_id")
        .eq("tenant_id", tenantId!)
        .in("status", ["pending", "in_progress"])
        .order("requested_at", { ascending: false });
      if (activeRoomId) q = q.eq("room_id", activeRoomId);
      const { data } = await q;
      return (data ?? []) as GuestService[];
    },
  });

  const sendService = useMutation({
    mutationFn: async ({ label, category }: { label: string; category: string }) => {
      if (!tenantId || !activeRoom) throw new Error("Chọn phòng trước");
      const { error } = await supabase.from("hotel_guest_services").insert({
        tenant_id: tenantId,
        room_id: activeRoom.id,
        title: label,
        category,
        priority: "normal",
      });
      if (error) throw error;
    },
    onSuccess: (_, { label }) => {
      toast.success(`Đã gửi: ${label}`);
      qc.invalidateQueries({ queryKey: ["hotel-services"] });
    },
    onError: () => toast.error("Không thể gửi yêu cầu"),
  });

  const sendIoT = useMutation({
    mutationFn: async ({ control, value }: { control: string; value: number }) => {
      if (!tenantId || !activeRoom) throw new Error("Chọn phòng trước");
      const { error } = await supabase.from("hotel_guest_services").insert({
        tenant_id: tenantId,
        room_id: activeRoom.id,
        title: `IoT: ${control} → ${value}`,
        category: "iot",
        priority: "normal",
        iot_device_id: activeRoom.iot_device_id,
        iot_command: { control, value },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Lệnh IoT đã gửi"),
  });

  const completeService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hotel_guest_services")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã hoàn thành");
      qc.invalidateQueries({ queryKey: ["hotel-services"] });
    },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr_280px]">
      {/* ── Column 1: Room list ── */}
      <Card className="h-fit">
        <CardHeader className="px-3 pb-2 pt-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Danh sách phòng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                activeRoomId === room.id && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              <span className="font-mono text-xs font-bold">#{room.room_number}</span>
              <span className="flex-1 truncate font-medium">{room.name}</span>
              <span className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                room.status === "occupied" ? "bg-green-400" : "bg-muted-foreground/30",
              )} />
            </button>
          ))}
          {rooms.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">Chưa có phòng</p>
          )}
        </CardContent>
      </Card>

      {/* ── Column 2: IoT controls + quick services ── */}
      <div className="space-y-4">
        {activeRoom ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Phòng {activeRoom.room_number} — {activeRoom.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {IOT_CONTROLS.map(ctrl => (
                <div key={ctrl.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <ctrl.icon className="h-4 w-4 text-muted-foreground" />
                      {ctrl.label}
                    </div>
                    <span className="font-mono font-bold text-primary">
                      {iotValues[ctrl.id]}{ctrl.unit}
                    </span>
                  </div>
                  <Slider
                    min={ctrl.min}
                    max={ctrl.max}
                    step={1}
                    value={[iotValues[ctrl.id] ?? ctrl.defaultVal]}
                    onValueChange={([v]) => setIotValues(prev => ({ ...prev, [ctrl.id]: v }))}
                    onValueCommit={([v]) => sendIoT.mutate({ control: ctrl.id, value: v })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BedDouble className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Chọn phòng để điều khiển IoT</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dịch vụ một chạm</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {QUICK_SERVICES.map(svc => (
              <button
                key={svc.id}
                disabled={sendService.isPending || !activeRoom}
                onClick={() => sendService.mutate({ label: svc.label, category: svc.category })}
                className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center text-xs font-medium transition-all hover:border-primary hover:bg-primary/5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svc.icon className="h-6 w-6 text-primary" />
                {svc.label}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Column 3: Active service requests ── */}
      <Card className="h-fit">
        <CardHeader className="px-3 pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Yêu cầu đang chờ
            {services.length > 0 && (
              <Badge className="h-5 min-w-5 px-1.5 text-[10px]">{services.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-2">
          {services.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">Không có yêu cầu nào</p>
          )}
          {services.map(s => (
            <div key={s.id} className="space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex items-start justify-between gap-1">
                <p className="font-medium leading-tight">{s.title}</p>
                <Badge variant={PRIORITY_VARIANT[s.priority]} className="shrink-0 text-[10px]">
                  {s.status === "in_progress" ? "Đang xử lý" : "Chờ"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(s.requested_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-full text-xs"
                onClick={() => completeService.mutate(s.id)}
                disabled={completeService.isPending}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Hoàn thành
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
