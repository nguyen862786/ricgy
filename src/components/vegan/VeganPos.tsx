import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vnd, num } from "@/lib/format";
import {
  commissionOf,
  charityOf,
  routeNearestTemple,
  estimateDeliveryAt,
  type CharityMode,
} from "@/lib/vegan";
import { Plus, Minus, ShoppingCart, Navigation, Store, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Cart = Record<string, { name: string; price: number; qty: number; available: number }>;

export function VeganPos() {
  const qc = useQueryClient();

  const { data: temples = [] } = useQuery({
    queryKey: ["vegan-temples-pos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vegan_temples")
        .select("id, name, region, status, commission_rate, charity_mode, charity_percent, charity_fixed")
        .eq("status", "signed")
        .order("name");
      return (data ?? []) as any[];
    },
  });

  const { data: stock = [] } = useQuery({
    queryKey: ["vegan-stock-pos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vegan_temple_stock")
        .select("temple_id, quantity, vegan_products(id, name, price, unit)")
        .gt("quantity", 0);
      return (data ?? []) as any[];
    },
  });

  return (
    <Tabs defaultValue="counter" className="space-y-4">
      <TabsList>
        <TabsTrigger value="counter">
          <Store className="mr-1.5 h-4 w-4" /> Bán tại quầy
        </TabsTrigger>
        <TabsTrigger value="route">
          <Navigation className="mr-1.5 h-4 w-4" /> Định tuyến đơn online
        </TabsTrigger>
      </TabsList>

      <TabsContent value="counter">
        <CounterPos temples={temples} stock={stock} qc={qc} />
      </TabsContent>
      <TabsContent value="route">
        <RoutePanel temples={temples} stock={stock} qc={qc} />
      </TabsContent>
    </Tabs>
  );
}

function CounterPos({ temples, stock, qc }: { temples: any[]; stock: any[]; qc: any }) {
  const [templeId, setTempleId] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [customer, setCustomer] = useState("");
  const [saving, setSaving] = useState(false);

  const temple = temples.find((t) => t.id === templeId);

  // Gộp tồn kho theo sản phẩm cho Chùa đang chọn
  const items = useMemo(() => {
    const map = new Map<string, { id: string; name: string; price: number; unit: string; qty: number }>();
    stock
      .filter((s) => s.temple_id === templeId && s.vegan_products)
      .forEach((s) => {
        const p = s.vegan_products;
        const cur = map.get(p.id);
        if (cur) cur.qty += s.quantity;
        else map.set(p.id, { id: p.id, name: p.name, price: Number(p.price), unit: p.unit, qty: s.quantity });
      });
    return Array.from(map.values());
  }, [stock, templeId]);

  const subtotal = Object.values(cart).reduce((s, l) => s + l.price * l.qty, 0);
  const commission = temple ? commissionOf(subtotal, Number(temple.commission_rate)) : 0;
  const charity = temple
    ? charityOf(
        subtotal,
        temple.charity_mode as CharityMode,
        Number(temple.charity_percent),
        Number(temple.charity_fixed),
      )
    : 0;

  function add(it: { id: string; name: string; price: number; qty: number }) {
    setCart((c) => {
      const cur = c[it.id];
      const qty = Math.min((cur?.qty ?? 0) + 1, it.qty);
      return { ...c, [it.id]: { name: it.name, price: it.price, qty, available: it.qty } };
    });
  }
  function dec(id: string) {
    setCart((c) => {
      const cur = c[id];
      if (!cur) return c;
      const qty = cur.qty - 1;
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = { ...cur, qty };
      return next;
    });
  }

  async function checkout() {
    if (!templeId || subtotal <= 0) return;
    setSaving(true);
    const { error } = await supabase.from("vegan_orders").insert({
      temple_id: templeId,
      channel: "pos",
      customer_name: customer || "Khách lẻ",
      subtotal,
      commission_amount: commission,
      charity_amount: charity,
      status: "delivered",
      delivered_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Đã thu ${vnd(subtotal)} · Hoa hồng ${vnd(commission)} · Quỹ ${vnd(charity)}`);
    setCart({});
    setCustomer("");
    qc.invalidateQueries({ queryKey: ["vegan-dashboard"] });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="p-4">
        <div className="mb-3 max-w-xs">
          <Label className="mb-1.5 block">Chùa bán hàng</Label>
          <Select value={templeId} onValueChange={(v) => { setTempleId(v); setCart({}); }}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn Chùa..." />
            </SelectTrigger>
            <SelectContent>
              {temples.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!templeId ? (
          <div className="grid h-48 place-items-center text-sm text-muted-foreground">
            Chọn Chùa để hiển thị sản phẩm còn trong kho
          </div>
        ) : items.length === 0 ? (
          <div className="grid h-48 place-items-center text-sm text-muted-foreground">
            Chùa này chưa có tồn kho
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => add(it)}
                className="rounded-2xl border bg-card p-3 text-left transition-all hover:border-accent hover:shadow-sm"
              >
                <div className="line-clamp-2 text-sm font-medium">{it.name}</div>
                <div className="mt-1 font-semibold text-accent">{vnd(it.price)}</div>
                <div className="text-xs text-muted-foreground">Tồn: {num(it.qty)} {it.unit}</div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex flex-col p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <ShoppingCart className="h-4 w-4" /> Giỏ hàng
        </h3>
        <div className="flex-1 space-y-2">
          {Object.keys(cart).length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Chưa có sản phẩm</p>
          )}
          {Object.entries(cart).map(([id, l]) => (
            <div key={id} className="flex items-center gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{l.name}</div>
                <div className="text-xs text-muted-foreground">{vnd(l.price)}</div>
              </div>
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => dec(id)}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center">{l.qty}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => add({ id, name: l.name, price: l.price, qty: l.available })}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <Input
            placeholder="Tên khách (tuỳ chọn)"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="mb-2"
          />
          <Row label="Tạm tính" value={vnd(subtotal)} bold />
          <Row label="Hoa hồng Sư kết nối" value={vnd(commission)} muted />
          <Row label="Trích quỹ từ thiện" value={vnd(charity)} muted />
        </div>
        <Button className="mt-3" disabled={saving || subtotal <= 0} onClick={checkout}>
          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Thanh toán
        </Button>
      </Card>
    </div>
  );
}

function RoutePanel({ temples, stock, qc }: { temples: any[]; stock: any[]; qc: any }) {
  const [region, setRegion] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState(300000);
  const [saving, setSaving] = useState(false);

  const stockByTemple = useMemo(() => {
    const m: Record<string, number> = {};
    stock.forEach((s) => {
      m[s.temple_id] = (m[s.temple_id] ?? 0) + s.quantity;
    });
    return m;
  }, [stock]);

  const routed = region ? routeNearestTemple(temples, region, stockByTemple) : null;
  const regions = Array.from(new Set(temples.map((t) => t.region).filter(Boolean)));

  async function createOrder() {
    if (!routed) return;
    setSaving(true);
    const commission = commissionOf(amount, Number(routed.commission_rate));
    const charity = charityOf(
      amount,
      routed.charity_mode as CharityMode,
      Number(routed.charity_percent),
      Number(routed.charity_fixed),
    );
    const { error } = await supabase.from("vegan_orders").insert({
      temple_id: routed.id,
      channel: "online",
      customer_name: customer || "Khách online",
      customer_phone: phone || null,
      customer_address: address || null,
      subtotal: amount,
      commission_amount: commission,
      charity_amount: charity,
      status: "placed",
      estimated_delivery_at: estimateDeliveryAt("online"),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Đã đẩy đơn về ${routed.name} để giao chặng cuối`);
    setCustomer("");
    setPhone("");
    setAddress("");
    qc.invalidateQueries({ queryKey: ["vegan-dashboard"] });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3 p-4">
        <h3 className="font-semibold">Thông tin đơn online</h3>
        <div className="space-y-1.5">
          <Label>Khu vực khách hàng</Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn khu vực giao..." />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Tên khách</Label>
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Điện thoại</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Địa chỉ giao</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Giá trị đơn (đ)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <Navigation className="h-4 w-4 text-accent" /> Tự động định tuyến
        </h3>
        {!region ? (
          <p className="text-sm text-muted-foreground">
            Chọn khu vực để hệ thống tìm Chùa gần nhất còn hàng đi giao chặng cuối.
          </p>
        ) : routed ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-accent/40 bg-accent/5 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Chùa được chọn (Hub giao hàng)
              </div>
              <div className="mt-1 text-lg font-bold">{routed.name}</div>
              <div className="text-sm text-muted-foreground">{routed.region}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">Tồn kho: {num(stockByTemple[routed.id] ?? 0)}</Badge>
                <Badge variant="outline">Hoa hồng {routed.commission_rate}%</Badge>
              </div>
            </div>
            <Button className="w-full" disabled={saving} onClick={createOrder}>
              Đẩy đơn về Chùa này
            </Button>
          </div>
        ) : (
          <p className="text-sm text-destructive">
            Không có Chùa đã ký kết còn hàng tại khu vực này.
          </p>
        )}
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <span>{label}</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </div>
  );
}