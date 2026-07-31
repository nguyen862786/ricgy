import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  type AppRole,
  type AccessGroup,
  getAccessGroup,
  canAccessRoute,
  canManageOrderLifecycle,
  isStoreScoped,
  defaultRouteFor,
} from "@/lib/rbac";
import {
  PREVIEW_ENABLED,
  DEV_BYPASS_KEY,
  DEV_BYPASS_OFF_KEY,
  DEV_AUTO_BYPASS,
  DEV_FORCE_BYPASS,
} from "@/lib/preview";
import { isSystemSuperAdmin } from "@/lib/system-admins";

export type { AppRole, AccessGroup };

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  group: AccessGroup;
  assignedStoreId: string | null;
  loading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  hasRole: (r: AppRole) => boolean;
  canAccess: (pathname: string) => boolean;
  canManageOrders: boolean;
  storeScoped: boolean;
  defaultRoute: string;
  signOut: () => Promise<void>;
  previewEnabled: boolean;
  devMode: boolean;
  setDevMode: (on: boolean) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

// ── Dev bypass helpers (client-side only) ───────────────────────────────────

function readDevBypass(): boolean {
  if (!PREVIEW_ENABLED) return false;
  try {
    // FORCE: luôn BẬT, bỏ qua cờ "Thoát" để công tắc không bị kẹt tắt.
    if (DEV_FORCE_BYPASS) {
      localStorage.removeItem(DEV_BYPASS_OFF_KEY);
      return true;
    }
    // Đã chủ động "Thoát" -> dùng đăng nhập thật.
    if (localStorage.getItem(DEV_BYPASS_OFF_KEY) === "1") return false;
    // Tự kích hoạt Dev-Mode, hoặc đã bật thủ công.
    if (DEV_AUTO_BYPASS) return true;
    return localStorage.getItem(DEV_BYPASS_KEY) === "1";
  } catch {
    return DEV_AUTO_BYPASS;
  }
}

function clearDevBypass() {
  try {
    localStorage.removeItem(DEV_BYPASS_KEY);
    // Ghi cờ tắt để lần sau dùng đăng nhập thật thay vì auto-bypass.
    localStorage.setItem(DEV_BYPASS_OFF_KEY, "1");
  } catch {
    /* noop */
  }
}

/** Bật/tắt Dev-Mode bypass ngay lập tức rồi reload để áp dụng. */
function applyDevMode(on: boolean) {
  try {
    if (on) {
      localStorage.removeItem(DEV_BYPASS_OFF_KEY);
      localStorage.setItem(DEV_BYPASS_KEY, "1");
    } else {
      localStorage.removeItem(DEV_BYPASS_KEY);
      localStorage.setItem(DEV_BYPASS_OFF_KEY, "1");
    }
  } catch {
    /* noop */
  }
}

const MOCK_USER_ID = "00000000-0000-0000-0000-preview000001";
const MOCK_ADMIN_EMAIL = "nguyen862786@gmail.com";

function makeMockSession(): Session {
  const now = Math.floor(Date.now() / 1000);
  const user = {
    id: MOCK_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: MOCK_ADMIN_EMAIL,
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: "Super Admin" },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  } as unknown as User;

  return {
    access_token: "preview-mock-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: "preview-mock-refresh",
    user,
  } as unknown as Session;
}

// ── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  // All state starts "safe" for SSR — localStorage is only read in useEffect (client-side).
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [assignedStoreId, setAssignedStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  useEffect(() => {
    // This effect runs only on the client after hydration.
    const bypass = readDevBypass();
    if (bypass) {
      // Inject mock super_admin session — no Supabase calls needed.
      setDevBypass(true);
      setSession(makeMockSession());
      setRoles(["super_admin"]);
      setLoading(false);
      return;
    }

    // Real Supabase auth flow.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadRoles(s.user.id, s.user.email), 0);
      } else {
        setRoles([]);
        setAssignedStoreId(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadRoles(data.session.user.id, data.session.user.email);
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadRoles(uid: string, email?: string | null) {
    const { data } = await supabase.from("user_roles").select("role, store_id").eq("user_id", uid);
    const rows = data ?? [];
    const dbRoles = rows.map((r) => r.role as AppRole);
    // Super-admin khóa cứng: luôn cấp quyền tối cao dù DB chưa có role.
    if (isSystemSuperAdmin(email) && !dbRoles.includes("super_admin")) {
      dbRoles.unshift("super_admin");
    }
    setRoles(dbRoles);
    const scoped = rows.find((r) => (r as { store_id?: string }).store_id);
    setAssignedStoreId((scoped as { store_id?: string } | undefined)?.store_id ?? null);
    setLoading(false);
  }

  const group = getAccessGroup(roles);
  const isStaff = group === "super_admin" || group === "tenant_owner" || group === "store_manager";

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        roles,
        group,
        assignedStoreId,
        loading,
        isStaff,
        isAdmin: roles.includes("admin") || roles.includes("super_admin") || roles.includes("owner") || group === "super_admin" || group === "tenant_owner",
        hasRole: (r) => roles.includes(r),
        canAccess: (pathname) => canAccessRoute(group, pathname),
        canManageOrders: canManageOrderLifecycle(group),
        storeScoped: isStoreScoped(group),
        defaultRoute: defaultRouteFor(group),
        previewEnabled: PREVIEW_ENABLED,
        devMode: devBypass,
        setDevMode: (on: boolean) => {
          applyDevMode(on);
          // Reload để inject mock session (bật) hoặc về luồng đăng nhập thật (tắt).
          window.location.href = on ? "/" : "/login";
        },
        signOut: async () => {
          if (devBypass) {
            clearDevBypass();
            window.location.href = "/login";
            return;
          }
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
