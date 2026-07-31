import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MODULE_CATALOG } from "@/lib/modules";
import {
  listTenants,
  getTenantModules,
  setTenantModule,
  createTenant,
  type TenantRow,
} from "@/lib/tenants.functions";
import {
  getMockTenants,
  addMockTenant,
  isMockTenant,
  getMockModules,
  setMockModule,
} from "@/lib/tenant-mock";
import { Building2, ShieldAlert, Power, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ModuleMap = Record<string, boolean>;

export const Route = createFileRoute("/_authenticated/super-admin/modules")({
  component: SuperAdminModulesPage,
});

function SuperAdminModulesPage() {
  const { group, devMode } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const isSuper = group === "super_admin";

  const listTenantsFn = useServerFn(listTenants);
  const getModulesFn = useServerFn(getTenantModules);
  const setModuleFn = useServerFn(setTenantModule);

  const { data: tenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: ["sa-tenants"],
    enabled: isSuper,
    queryFn: async () => {
      // Trong Dev Mode (thiếu biến môi trường Supabase) server fn có thể lỗi —
      // luôn gộp thêm doanh nghiệp mock từ localStorage.
      let server: TenantRow[] = [];
      try {
        server = (await listTenantsFn()) as TenantRow[];
      } catch (e) {
        if (!devMode) throw e;
      }
      const mock = getMockTenants();
      const seen = new Set(server.map((t) => t.id));
      return [...server, ...mock.filter((m) => !seen.has(m.id))];
    },
  });

  const { data: moduleMap = {}, isLoading: isLoadingModules } = useQuery({
    queryKey: ["sa-tenant-modules", selected],
    enabled: isSuper && !!selected,
    queryFn: async () => {
      if (selected && isMockTenant(selected)) return getMockModules(selected) as ModuleMap;
      return getModulesFn({ data: { tenantId: selected! } }) as Promise<ModuleMap>;
    },
  });

  async function toggle(moduleKey: string, enabled: boolean) {
    if (!selected) return;
    // Doanh nghiệp mock → lưu vào localStorage.
    if (isMockTenant(selected)) {
      setMockModule(selected, moduleKey, enabled);
      toast.success(`${enabled ? "Đã bật" : "Đã tắt"} module`);
      qc.invalidateQueries({ queryKey: ["sa-tenant-modules", selected] });
      return;
    }
    try {
      await setModuleFn({ data: { tenantId: selected, moduleKey, enabled } });
      toast.success(`${enabled ? "Đã bật" : "Đã tắt"} module`);
      qc.invalidateQueries({ queryKey: ["sa-tenant-modules", selected] });
      qc.invalidateQueries({ queryKey: ["tenant-modules"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể cập nhật module");
    }
  }

  if (!isSuper) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Không có quyền truy cập</h1>
        <p className="text-sm text-muted-foreground">Trang này chỉ dành cho Super Admin.</p>
      </div>
    );
  }

  const selectedTenant = tenants.find((t) => t.id === selected);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Doanh nghiệp & Module</h1>
        <p className="text-sm text-muted-foreground">
          Bật/tắt từng tính năng cho mỗi doanh nghiệp thuê. Module bị tắt sẽ ẩn hoàn toàn khỏi
          menu của họ.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Danh sách doanh nghiệp */}
        <Card className="h-fit p-3">
          <Button className="mb-3 w-full" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Thêm doanh nghiệp mới
          </Button>
          <div className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold">
            <Building2 className="h-4 w-4" /> Doanh nghiệp ({tenants.length})
          </div>
          <div className="space-y-1">
            {loadingTenants &&
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                  selected === t.id ? "border-primary bg-accent" : ""
                }`}
              >
                <span className="truncate font-medium">{t.name}</span>
                {!t.is_active && (
                  <Badge variant="outline" className="ml-2 shrink-0">
                    Khoá
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Bảng công tắc module */}
        <Card className="p-4 lg:col-span-2">
          {!selected ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <Power className="h-8 w-8" />
              <p className="text-sm">Chọn một doanh nghiệp để cấu hình module.</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">{selectedTenant?.name}</div>
                <Badge variant="secondary">{MODULE_CATALOG.length} module</Badge>
              </div>
              <div className="divide-y">
                {MODULE_CATALOG.map((m) => {
                  const enabled = moduleMap[m.key] !== false; // absent key → ON by default
                  return (
                    <div key={m.key} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{m.label}</div>
                        <div className="text-xs text-muted-foreground">{m.description}</div>
                      </div>
                      <Switch
                        checked={enabled}
                        disabled={isLoadingModules}
                        onCheckedChange={(v) => void toggle(m.key, v)}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      <AddTenantDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        devMode={devMode}
        onCreated={(t) => {
          qc.invalidateQueries({ queryKey: ["sa-tenants"] });
          setSelected(t.id);
        }}
      />
    </div>
  );
}

// ── Modal thêm doanh nghiệp ──────────────────────────────────────────────────
function AddTenantDialog({
  open,
  onOpenChange,
  devMode,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  devMode: boolean;
  onCreated: (t: TenantRow) => void;
}) {
  const createTenantFn = useServerFn(createTenant);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setCode("");
    setEmail("");
  }

  async function submit() {
    if (name.trim().length < 2) {
      toast.error("Vui lòng nhập tên doanh nghiệp.");
      return;
    }
    setSaving(true);
    try {
      let tenant: TenantRow;
      try {
        tenant = (await createTenantFn({
          data: { name: name.trim(), code: code.trim(), email: email.trim() },
        })) as TenantRow;
      } catch (e) {
        // Dev Mode: thiếu biến môi trường Supabase → lưu tạm vào localStorage.
        if (!devMode) throw e;
        tenant = addMockTenant({ name: name.trim(), code: code.trim(), email: email.trim() });
      }
      toast.success(`Đã khởi tạo doanh nghiệp "${tenant.name}".`);
      onCreated(tenant);
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể tạo doanh nghiệp.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (saving ? null : onOpenChange(v))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm doanh nghiệp mới</DialogTitle>
          <DialogDescription>
            Khởi tạo không gian lưu trữ (tenant isolation) riêng và nạp dữ liệu mẫu ban đầu cho
            Ms. Katty, QiCoffee và Oasis Garden.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="t-name">Tên doanh nghiệp *</Label>
            <Input
              id="t-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Bách hóa chay Ms. Katty"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-code">Mã định danh (Tenant Code)</Label>
            <Input
              id="t-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: ms-katty (để trống sẽ tự sinh)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-email">Email người đại diện</Label>
            <Input
              id="t-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
