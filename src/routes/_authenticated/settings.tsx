import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
    </div>
  );
}
