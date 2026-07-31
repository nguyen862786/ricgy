import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { splitSubsidy } from "@/lib/qiclub";
import { vnd } from "@/lib/format";
import { Building2, Store, Coins, Handshake, Save } from "lucide-react";
import { toast } from "sonner";

interface AllianceConfig {
  enabled: boolean;
  prefix: string;
  qiclub: number;
  company: number;
  store: number;
}

const DEFAULTS: AllianceConfig = {
  enabled: false,
  prefix: "QIC",
  qiclub: 60,
  company: 30,
  store: 10,
};
const SAMPLE_AMOUNT = 100_000;

export function QiClubAllianceSettings() {
  const qc = useQueryClient();
  const [cfg, setCfg] = useState<AllianceConfig>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["qiclub-alliance"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "qiclub_alliance")
        .maybeSingle();
      return (data?.value as Partial<AllianceConfig>) ?? null;
    },
  });

  useEffect(() => {
    if (data) setCfg({ ...DEFAULTS, ...data });
  }, [data]);

  const total = cfg.qiclub + cfg.company + cfg.store;
  const split = splitSubsidy(SAMPLE_AMOUNT, cfg.qiclub, cfg.company, cfg.store);

  function setRatio(key: "qiclub" | "company" | "store", value: number) {
    setCfg((c) => ({ ...c, [key]: Math.max(0, Math.min(100, value)) }));
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key: "qiclub_alliance", value: cfg as any, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Đã lưu cấu hình Liên minh QiClub");
    qc.invalidateQueries({ queryKey: ["qiclub-alliance"] });
  }

  const ROWS = [
    {
      key: "qiclub" as const,
      label: "QiClub chịu",
      icon: Coins,
      color: "bg-chart-1",
      value: cfg.qiclub,
      amount: split.qiclub,
    },
    {
      key: "company" as const,
      label: "Tổng công ty chịu",
      icon: Building2,
      color: "bg-chart-2",
      value: cfg.company,
      amount: split.company,
    },
    {
      key: "store" as const,
      label: "Cửa hàng chịu",
      icon: Store,
      color: "bg-chart-3",
      value: cfg.store,
      amount: split.store,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <Handshake className="h-4 w-4 text-primary" /> Đồng bộ hệ sinh thái QiClub
            </div>
            <p className="text-sm text-muted-foreground">
              Bật để xác thực &amp; đối soát mọi voucher có tiền tố QiClub theo tỷ lệ tài trợ 3 bên.
            </p>
          </div>
          <Switch
            checked={cfg.enabled}
            onCheckedChange={(v) => setCfg((c) => ({ ...c, enabled: v }))}
          />
        </div>

        <div className="grid gap-2 max-w-xs">
          <Label>Tiền tố mã Voucher (Prefix)</Label>
          <Input
            value={cfg.prefix}
            onChange={(e) => setCfg((c) => ({ ...c, prefix: e.target.value.toUpperCase() }))}
            placeholder="VD: QIC"
            className="font-mono"
          />
        </div>
      </Card>

      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Tỷ lệ tài trợ 3 bên</div>
          <Badge variant={total === 100 ? "default" : "destructive"}>Tổng: {total}%</Badge>
        </div>

        {/* Visual stacked bar */}
        <div className="flex h-6 w-full overflow-hidden rounded-full border">
          {ROWS.map((r) => (
            <div
              key={r.key}
              className={`${r.color} flex items-center justify-center text-[10px] font-semibold text-white transition-all`}
              style={{ width: `${total > 0 ? (r.value / total) * 100 : 0}%` }}
            >
              {r.value > 0 ? `${r.value}%` : ""}
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {ROWS.map((r) => (
            <div key={r.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <r.icon className="h-4 w-4 text-muted-foreground" /> {r.label}
                </span>
                <span className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={r.value}
                    onChange={(e) => setRatio(r.key, +e.target.value)}
                    className="h-8 w-20 text-right"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </span>
              </div>
              <Slider
                value={[r.value]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setRatio(r.key, v[0])}
              />
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted/40 p-3 text-sm">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Ví dụ phân rã trên voucher mẫu {vnd(SAMPLE_AMOUNT)}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ROWS.map((r) => (
              <div key={r.key} className="rounded-md bg-card p-2 text-center">
                <div className="text-xs text-muted-foreground">{r.label}</div>
                <div className="font-semibold">{vnd(r.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
