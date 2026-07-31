import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_QICLUB_CONFIG, type QiClubConfig } from "@/lib/qiclub";
import { Link2, KeyRound, Plug } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

const KEYS = [
  {
    key: "agent_tier_enabled",
    label: "Bật hệ thống Đại lý (3 cấp)",
    desc: "Khi tắt, không tính hoa hồng cho đại lý.",
  },
  {
    key: "affiliate_enabled",
    label: "Bật Affiliate / Cộng tác viên",
    desc: "Cho phép affiliate hưởng hoa hồng theo đơn.",
  },
  {
    key: "cashback_enabled",
    label: "Bật Cashback cho khách",
    desc: "Khách hàng nhận cashback vào ví.",
  },
];

function SettingsPage() {
  const { isStaff } = useAuth();
  const qc = useQueryClient();

  const { data: settings = {} } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("*");
      const map: Record<string, any> = {};
      (data ?? []).forEach((r) => (map[r.key] = r.value));
      return map;
    },
  });

  const [qiclub, setQiclub] = useState<QiClubConfig>(DEFAULT_QICLUB_CONFIG);
  useEffect(() => {
    if (settings?.qiclub_config) setQiclub({ ...DEFAULT_QICLUB_CONFIG, ...settings.qiclub_config });
  }, [settings]);

  if (!isStaff) return <div className="text-muted-foreground">Không có quyền.</div>;

  async function toggle(key: string, on: boolean) {
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key, value: { enabled: on }, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) toast.error(error.message);
    else {
      toast.success("Đã lưu");
      qc.invalidateQueries({ queryKey: ["app_settings"] });
    }
  }

  async function saveQiclub() {
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key: "qiclub_config", value: qiclub as any, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) toast.error(error.message);
    else {
      toast.success("Đã lưu cấu hình QiClub");
      qc.invalidateQueries({ queryKey: ["app_settings"] });
    }
  }

  function generateSecret() {
    const s =
      "qisk_" +
      Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    setQiclub((c) => ({ ...c, secret_key: s }));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cấu hình hệ thống</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tính năng phễu doanh thu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {KEYS.map((k) => {
            const on = !!settings[k.key]?.enabled;
            return (
              <div key={k.key} className="flex items-start justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="font-medium">{k.label}</Label>
                  <p className="text-xs text-muted-foreground">{k.desc}</p>
                </div>
                <Switch checked={on} onCheckedChange={(v) => toggle(k.key, v)} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4" /> Kết nối API QiClub
            <Badge variant={qiclub.enabled ? "default" : "secondary"}>
              {qiclub.enabled ? "Đang bật" : "Tắt"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="font-medium">Bật đồng bộ QiClub</Label>
              <p className="text-xs text-muted-foreground">
                Xác thực (VerifyCode) & đóng mã (ClaimCode) real-time tại POS.
              </p>
            </div>
            <Switch
              checked={qiclub.enabled}
              onCheckedChange={(v) => setQiclub({ ...qiclub, enabled: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> Webhook URL
            </Label>
            <Input
              placeholder="https://api.qiclub.vn/webhook/voucher"
              value={qiclub.webhook_url}
              onChange={(e) => setQiclub({ ...qiclub, webhook_url: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Secret Key
            </Label>
            <div className="flex gap-2">
              <Input
                className="font-mono"
                placeholder="qisk_..."
                value={qiclub.secret_key}
                onChange={(e) => setQiclub({ ...qiclub, secret_key: e.target.value })}
              />
              <Button type="button" variant="outline" onClick={generateSecret}>
                Tạo mới
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tiền tố mã mặc định</Label>
            <Input
              className="max-w-40"
              value={qiclub.default_prefix}
              onChange={(e) =>
                setQiclub({ ...qiclub, default_prefix: e.target.value.toUpperCase() })
              }
            />
            <p className="text-xs text-muted-foreground">
              Mã quét tại POS bắt đầu bằng tiền tố này sẽ được nhận diện là voucher QiClub.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveQiclub}>Lưu cấu hình QiClub</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
