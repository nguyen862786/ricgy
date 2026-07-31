import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantModules } from "@/hooks/useTenantModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BedDouble, CalendarDays, Users, UtensilsCrossed,
  CreditCard, CheckCircle2, ChevronLeft, ChevronRight,
  Wifi, Wind, Tv, Bath,
} from "lucide-react";
import { toast } from "sonner";

type Room = {
  id: string;
  room_number: string;
  name: string;
  type: string;
  capacity: number;
  base_price: number;
  amenities: string[];
  status: string;
};

type FormData = {
  room: Room | null;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestIdNumber: string;
  specialRequests: string;
  extras: string[];
  paymentMethod: string;
};

const STEPS = [
  { id: 1, label: "Chọn phòng",  icon: BedDouble },
  { id: 2, label: "Thời gian",   icon: CalendarDays },
  { id: 3, label: "Khách hàng",  icon: Users },
  { id: 4, label: "Dịch vụ",    icon: UtensilsCrossed },
  { id: 5, label: "Thanh toán",  icon: CreditCard },
  { id: 6, label: "Xác nhận",   icon: CheckCircle2 },
];

const EXTRAS = [
  { id: "breakfast",         label: "Bữa sáng buffet",       price: 150_000 },
  { id: "airport_transfer",  label: "Đưa đón sân bay",       price: 300_000 },
  { id: "spa",               label: "Spa 90 phút",           price: 450_000 },
  { id: "yoga",              label: "Lớp yoga sáng",         price: 100_000 },
  { id: "garden_tour",       label: "Tour vườn hữu cơ",      price:  80_000 },
  { id: "late_checkout",     label: "Late check-out (14h)",  price: 200_000 },
];

const PAYMENT_METHODS = [
  { id: "cash",     label: "Tiền mặt" },
  { id: "card",     label: "Thẻ ngân hàng" },
  { id: "transfer", label: "Chuyển khoản" },
  { id: "ota",      label: "OTA (đã thu)" },
];

const ROOM_TYPE_LABEL: Record<string, string> = {
  standard: "Standard", deluxe: "Deluxe", suite: "Suite",
  villa: "Villa", glamping: "Glamping",
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, ac: Wind, tv: Tv, bathtub: Bath,
};

const TODAY = new Date().toISOString().split("T")[0];

const EMPTY_FORM: FormData = {
  room: null, checkIn: "", checkOut: "", adults: 2, children: 0,
  guestName: "", guestPhone: "", guestEmail: "", guestIdNumber: "",
  specialRequests: "", extras: [], paymentMethod: "cash",
};

function calcNights(ci: string, co: string) {
  if (!ci || !co) return 0;
  return Math.max(0, Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000));
}

function calcExtras(extras: string[], nights: number) {
  return extras.reduce((s, id) => s + (EXTRAS.find(e => e.id === id)?.price ?? 0) * nights, 0);
}

export function BookingEngine() {
  const [step, setStep] = useState(1);
  const [bookingCode, setBookingCode] = useState("");
  const { tenantId } = useTenantModules();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const nights = calcNights(form.checkIn, form.checkOut);
  const extraTotal = calcExtras(form.extras, nights);
  const roomTotal = (form.room?.base_price ?? 0) * nights;
  const grandTotal = roomTotal + extraTotal;

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["hotel-rooms", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_rooms")
        .select("id,room_number,name,type,capacity,base_price,amenities,status")
        .eq("tenant_id", tenantId!)
        .order("room_number");
      if (error) throw error;
      return (data ?? []).map(r => ({
        ...r,
        amenities: Array.isArray(r.amenities) ? (r.amenities as string[]) : [],
      }));
    },
  });

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!tenantId || !form.room) throw new Error("Missing data");
      const code = `OG-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("hotel_bookings").insert({
        tenant_id: tenantId,
        room_id: form.room.id,
        booking_code: code,
        guest_name: form.guestName,
        guest_phone: form.guestPhone || null,
        guest_email: form.guestEmail || null,
        guest_id_number: form.guestIdNumber || null,
        num_adults: form.adults,
        num_children: form.children,
        check_in: form.checkIn,
        check_out: form.checkOut,
        room_price: form.room.base_price,
        extra_charges: extraTotal,
        total_amount: grandTotal,
        payment_method: form.paymentMethod,
        status: "confirmed",
        special_requests: form.specialRequests || null,
      });
      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      setBookingCode(code);
      setStep(6);
      qc.invalidateQueries({ queryKey: ["hotel-rooms"] });
      qc.invalidateQueries({ queryKey: ["hotel-bookings"] });
    },
    onError: () => toast.error("Không thể tạo đặt phòng"),
  });

  const canNext = () => {
    if (step === 1) return !!form.room;
    if (step === 2) return !!form.checkIn && !!form.checkOut && nights > 0;
    if (step === 3) return !!form.guestName && !!form.guestPhone;
    return true;
  };

  const patch = (delta: Partial<FormData>) => setForm(f => ({ ...f, ...delta }));

  return (
    <div className="space-y-6">
      {/* ── Stepper ── */}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done   = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex flex-1 items-center">
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                done   ? "border-primary bg-primary text-primary-foreground"
                : active ? "border-primary bg-primary/10 text-primary"
                : "border-muted bg-muted/40 text-muted-foreground",
              )}>
                <Icon className="h-4 w-4" />
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("mx-1 h-0.5 flex-1 transition-colors", done ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm font-medium text-muted-foreground">{STEPS[step - 1]?.label}</p>

      {/* ── Step 1: Room selection ── */}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map(room => (
            <Card
              key={room.id}
              onClick={() => room.status === "available" && patch({ room })}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                room.status !== "available" && "cursor-not-allowed opacity-50",
                form.room?.id === room.id && "ring-2 ring-primary",
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{room.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">#{room.room_number}</p>
                  </div>
                  <Badge variant={room.status === "available" ? "default" : "secondary"} className="shrink-0">
                    {room.status === "available" ? "Trống" : room.status === "occupied" ? "Đang ở" : "Bảo trì"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {ROOM_TYPE_LABEL[room.type] ?? room.type} · {room.capacity} người
                  </span>
                  <span className="font-bold text-primary">
                    {room.base_price.toLocaleString("vi-VN")}₫/đêm
                  </span>
                </div>
                {room.amenities.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {room.amenities.slice(0, 4).map(a => {
                      const Icon = AMENITY_ICONS[a];
                      return Icon ? <Icon key={a} className="h-3.5 w-3.5 text-muted-foreground" /> : null;
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {rooms.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <BedDouble className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>Chưa có phòng nào trong hệ thống</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Dates ── */}
      {step === 2 && (
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ngày nhận phòng</Label>
              <Input type="date" value={form.checkIn} min={TODAY}
                onChange={e => patch({ checkIn: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ngày trả phòng</Label>
              <Input type="date" value={form.checkOut} min={form.checkIn || TODAY}
                onChange={e => patch({ checkOut: e.target.value })} />
            </div>
            {nights > 0 && (
              <div className="col-span-full rounded-lg bg-primary/5 px-4 py-3 text-sm">
                <span className="font-semibold">{nights} đêm</span>
                {form.room && (
                  <span className="ml-2 text-muted-foreground">
                    · {roomTotal.toLocaleString("vi-VN")}₫
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Guest info ── */}
      {step === 3 && (
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Họ và tên khách *</Label>
              <Input placeholder="Nguyễn Văn A" value={form.guestName}
                onChange={e => patch({ guestName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại *</Label>
              <Input placeholder="0901234567" value={form.guestPhone}
                onChange={e => patch({ guestPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="guest@email.com" value={form.guestEmail}
                onChange={e => patch({ guestEmail: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>CCCD / Hộ chiếu</Label>
              <Input placeholder="0123456789" value={form.guestIdNumber}
                onChange={e => patch({ guestIdNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Người lớn</Label>
              <Input type="number" min={1} max={form.room?.capacity ?? 10} value={form.adults}
                onChange={e => patch({ adults: +e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Trẻ em</Label>
              <Input type="number" min={0} value={form.children}
                onChange={e => patch({ children: +e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Yêu cầu đặc biệt</Label>
              <Input placeholder="Phòng tầng cao, giường đôi, …" value={form.specialRequests}
                onChange={e => patch({ specialRequests: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Extra services ── */}
      {step === 4 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {EXTRAS.map(ex => {
            const selected = form.extras.includes(ex.id);
            return (
              <div
                key={ex.id}
                onClick={() => patch({
                  extras: selected
                    ? form.extras.filter(e => e !== ex.id)
                    : [...form.extras, ex.id],
                })}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all hover:shadow-sm",
                  selected && "border-primary bg-primary/5",
                )}
              >
                <span className="font-medium">{ex.label}</span>
                <span className={cn("text-sm font-bold", selected ? "text-primary" : "text-muted-foreground")}>
                  {ex.price.toLocaleString("vi-VN")}₫/đêm
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Step 5: Payment summary ── */}
      {step === 5 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Tóm tắt đặt phòng</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Phòng"      value={form.room?.name ?? ""} />
              <Row label="Nhận phòng" value={form.checkIn} />
              <Row label="Trả phòng"  value={form.checkOut} />
              <Row label="Số đêm"     value={String(nights)} />
              <Row label="Khách"      value={`${form.adults} NL + ${form.children} TE`} />
              <div className="border-t pt-2">
                <Row label="Tiền phòng"    value={`${roomTotal.toLocaleString("vi-VN")}₫`} />
                {extraTotal > 0 && <Row label="Dịch vụ thêm" value={`${extraTotal.toLocaleString("vi-VN")}₫`} />}
              </div>
              <div className="border-t pt-2 flex items-center justify-between text-base font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary">{grandTotal.toLocaleString("vi-VN")}₫</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Phương thức thanh toán</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.id}
                  onClick={() => patch({ paymentMethod: pm.id })}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left text-sm font-medium transition-all hover:border-primary",
                    form.paymentMethod === pm.id && "border-primary bg-primary/5",
                  )}
                >
                  <div className={cn(
                    "h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                    form.paymentMethod === pm.id ? "border-primary bg-primary" : "border-muted-foreground",
                  )} />
                  {pm.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step 6: Confirmation ── */}
      {step === 6 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h3 className="text-xl font-bold">Đặt phòng thành công!</h3>
            <p className="mt-1 text-muted-foreground">Mã đặt phòng của bạn</p>
            <div className="mt-4 inline-block rounded-xl bg-primary/10 px-6 py-3 font-mono text-2xl font-bold tracking-widest text-primary">
              {bookingCode}
            </div>
            <div className="mt-5 space-y-1 text-sm text-muted-foreground">
              <p>Phòng: <strong className="text-foreground">{form.room?.name}</strong></p>
              <p>Khách: <strong className="text-foreground">{form.guestName}</strong></p>
              <p>{form.checkIn} → {form.checkOut} ({nights} đêm)</p>
            </div>
            <Button className="mt-8" onClick={() => { setStep(1); setForm(EMPTY_FORM); setBookingCode(""); }}>
              Đặt phòng mới
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Navigation ── */}
      {step < 6 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Quay lại
          </Button>
          {step < 5 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              Tiếp tục <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => createBooking.mutate()} disabled={!canNext() || createBooking.isPending}>
              {createBooking.isPending ? "Đang xử lý…" : "Xác nhận đặt phòng"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
