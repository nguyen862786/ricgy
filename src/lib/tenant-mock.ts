// ============================================================================
// DEV-MODE MOCK STORE — khi bật Dev Mode (không có biến môi trường Supabase /
// service-role), các thao tác Thêm doanh nghiệp & bật/tắt module được lưu vào
// localStorage để test luồng cấu hình mà không cần backend thật.
// ============================================================================
import type { TenantRow } from "@/lib/tenants.functions";

const TENANTS_KEY = "dev_mock_tenants";
const MODULES_KEY = "dev_mock_tenant_modules";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Tất cả doanh nghiệp mock đang lưu trong localStorage. */
export function getMockTenants(): TenantRow[] {
  if (typeof localStorage === "undefined") return [];
  return safeParse<TenantRow[]>(localStorage.getItem(TENANTS_KEY), []);
}

function saveMockTenants(rows: TenantRow[]) {
  localStorage.setItem(TENANTS_KEY, JSON.stringify(rows));
}

export function isMockTenant(id: string): boolean {
  return getMockTenants().some((t) => t.id === id);
}

/** Thêm 1 doanh nghiệp mock và trả về bản ghi vừa tạo. */
export function addMockTenant(input: {
  name: string;
  code?: string;
  email?: string;
}): TenantRow {
  const now = new Date().toISOString();
  const slug = (input.code && slugify(input.code)) || slugify(input.name) || "tenant";
  const tenant: TenantRow = {
    id: newId(),
    name: input.name.trim(),
    slug,
    owner_id: null,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
  const rows = getMockTenants();
  rows.push(tenant);
  saveMockTenants(rows);
  return tenant;
}

type ModuleStore = Record<string, Record<string, boolean>>;

function getModuleStore(): ModuleStore {
  if (typeof localStorage === "undefined") return {};
  return safeParse<ModuleStore>(localStorage.getItem(MODULES_KEY), {});
}

/** Map module của 1 doanh nghiệp mock (key vắng mặt = BẬT mặc định). */
export function getMockModules(tenantId: string): Record<string, boolean> {
  return getModuleStore()[tenantId] ?? {};
}

/** Bật/tắt 1 module cho doanh nghiệp mock. */
export function setMockModule(tenantId: string, moduleKey: string, enabled: boolean) {
  const store = getModuleStore();
  store[tenantId] = { ...(store[tenantId] ?? {}), [moduleKey]: enabled };
  localStorage.setItem(MODULES_KEY, JSON.stringify(store));
}