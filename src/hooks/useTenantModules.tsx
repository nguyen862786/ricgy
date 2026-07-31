import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { moduleForRoute } from "@/lib/modules";

interface TenantModulesCtx {
  tenantId: string | null;
  modules: Record<string, boolean>;
  isModuleEnabled: (key: string) => boolean;
  canAccessModule: (pathname: string) => boolean;
  loading: boolean;
}

const TenantModulesContext = createContext<TenantModulesCtx | null>(null);

/**
 * Đặt ở root layout đã xác thực — query chạy đúng 1 lần, mọi component con
 * gọi useTenantModules() đều đọc từ Context (không re-fetch).
 */
export function TenantModulesProvider({ children }: { children: ReactNode }) {
  const { user, group } = useAuth();
  const isSuper = group === "super_admin";

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-modules", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user!.id)
        .maybeSingle();
      const tenantId = prof?.tenant_id ?? null;
      if (!tenantId) return { tenantId: null as string | null, map: {} as Record<string, boolean> };
      const { data: rows } = await supabase
        .from("tenant_modules")
        .select("module_key, enabled")
        .eq("tenant_id", tenantId);
      const map: Record<string, boolean> = {};
      (rows ?? []).forEach((r) => {
        map[r.module_key] = r.enabled;
      });
      return { tenantId, map };
    },
  });

  const map = data?.map ?? {};

  const isModuleEnabled = (key: string) => isSuper || map[key] !== false;
  const canAccessModule = (pathname: string) => {
    if (isSuper) return true;
    const key = moduleForRoute(pathname);
    if (!key) return true;
    return map[key] !== false;
  };

  return (
    <TenantModulesContext.Provider
      value={{
        tenantId: data?.tenantId ?? null,
        modules: map,
        isModuleEnabled,
        canAccessModule,
        loading: isLoading,
      }}
    >
      {children}
    </TenantModulesContext.Provider>
  );
}

export function useTenantModules() {
  const ctx = useContext(TenantModulesContext);
  if (!ctx) throw new Error("useTenantModules must be used inside TenantModulesProvider");
  return ctx;
}
