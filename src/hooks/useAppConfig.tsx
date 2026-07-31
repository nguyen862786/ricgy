import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IndustryKey } from "@/lib/industry";

export interface StoreRow {
  id: string;
  name: string;
  code: string;
  industry: IndustryKey;
  cashflow_mode: "per_store" | "company";
  is_active: boolean;
  billing_status: "trial" | "active" | "grace_period" | "suspended";
  trial_ends_at: string;
  grace_ends_at: string | null;
  plan: string;
  hardware_combo: boolean;
  paid_until: string | null;
  address: string | null;
  phone: string | null;
}

interface AppConfigCtx {
  industry: IndustryKey;
  storeId: string | null;
  store: StoreRow | null;
  stores: StoreRow[];
  loading: boolean;
  setIndustry: (i: IndustryKey) => void;
  setStoreId: (id: string | null) => void;
  refreshStores: () => Promise<void>;
}

const Ctx = createContext<AppConfigCtx | null>(null);

const LS_INDUSTRY = "active_industry";
const LS_STORE = "active_store";

function lsGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function lsSet(k: string, v: string | null) {
  try {
    if (v === null) {
      localStorage.removeItem(k);
    } else {
      localStorage.setItem(k, v);
    }
  } catch (error) {
    console.error("LocalStorage Error:", error);
  }
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [industry, setIndustryState] = useState<IndustryKey>(
    (lsGet(LS_INDUSTRY) as IndustryKey) || "fnb",
  );
  const [storeId, setStoreIdState] = useState<string | null>(lsGet(LS_STORE));
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshStores = useCallback(async () => {
    const { data } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as unknown as StoreRow[];
    setStores(rows);
    // Nếu chưa chọn store, mặc định store đầu tiên + đồng bộ ngành theo store
    setStoreIdState((cur) => {
      if (cur && rows.some((s) => s.id === cur)) return cur;
      const first = rows[0];
      if (first) {
        lsSet(LS_STORE, first.id);
        return first.id;
      }
      return null;
    });
  }, []);

  useEffect(() => {
    refreshStores().finally(() => setLoading(false));
  }, [refreshStores]);

  const setIndustry = useCallback((i: IndustryKey) => {
    setIndustryState(i);
    lsSet(LS_INDUSTRY, i);
    supabase
      .from("app_settings")
      .upsert(
        { key: "active_industry", value: { industry: i }, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      )
      .then(() => {});
  }, []);

  const setStoreId = useCallback((id: string | null) => {
    setStoreIdState(id);
    lsSet(LS_STORE, id);
    supabase
      .from("app_settings")
      .upsert(
        { key: "active_store", value: { store_id: id }, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      )
      .then(() => {});
  }, []);

  const store = stores.find((s) => s.id === storeId) ?? null;
  // Ngành hàng hiệu lực ưu tiên theo cửa hàng đang chọn
  const effectiveIndustry = store?.industry ?? industry;

  return (
    <Ctx.Provider
      value={{
        industry: effectiveIndustry,
        storeId,
        store,
        stores,
        loading,
        setIndustry,
        setStoreId,
        refreshStores,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAppConfig() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAppConfig must be used inside AppConfigProvider");
  return c;
}
