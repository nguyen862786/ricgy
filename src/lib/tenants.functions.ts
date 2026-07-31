import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MODULE_CATALOG } from "@/lib/modules";

// ============================================================================
// QUẢN TRỊ DOANH NGHIỆP (Tenant) — Super Admin.
// Chạy bằng service-role (admin) vì trang Super Admin có thể hoạt động dưới
// phiên Dev-Mode (không có JWT thật), khi đó RLS sẽ chặn mọi truy vấn client.
// ============================================================================

export interface TenantRow {
  id: string;
  name: string;
  slug: string | null;
  owner_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

// ── Danh sách doanh nghiệp ───────────────────────────────────────────────────
export const listTenants = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id, name, slug, owner_id, is_active, created_at, updated_at")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as TenantRow[];
});

// ── Module map của 1 doanh nghiệp ────────────────────────────────────────────
export const getTenantModules = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ tenantId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("tenant_modules")
      .select("module_key, enabled")
      .eq("tenant_id", data.tenantId);
    if (error) throw new Error(error.message);
    const map: Record<string, boolean> = {};
    (rows ?? []).forEach((r) => {
      map[r.module_key as string] = r.enabled as boolean;
    });
    return map;
  });

// ── Bật/tắt 1 module ─────────────────────────────────────────────────────────
export const setTenantModule = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        moduleKey: z.string().min(1).max(60),
        enabled: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("tenant_modules")
      .upsert(
        { tenant_id: data.tenantId, module_key: data.moduleKey, enabled: data.enabled },
        { onConflict: "tenant_id,module_key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── Tạo doanh nghiệp mới + khởi tạo không gian (tenant isolation) ─────────────
const createInput = z.object({
  name: z.string().trim().min(2, "Tên doanh nghiệp tối thiểu 2 ký tự").max(120),
  code: z.string().trim().max(60).optional().or(z.literal("")),
  email: z.string().trim().email("Email không hợp lệ").max(255).optional().or(z.literal("")),
});

async function ensureModuleRows(
  admin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  tenantId: string,
  enabledKeys?: string[],
) {
  const rows = MODULE_CATALOG.map((m) => ({
    tenant_id: tenantId,
    module_key: m.key,
    enabled: enabledKeys ? enabledKeys.includes(m.key) : true,
  }));
  await admin.from("tenant_modules").upsert(rows, { onConflict: "tenant_id,module_key" });
}

// Mẫu doanh nghiệp khởi tạo kèm khi tạo tenant đầu tiên.
const SAMPLE_TENANTS: { name: string; slug: string; modules: string[] }[] = [
  {
    name: "Bách hóa chay Ms. Katty",
    slug: "ms-katty",
    modules: ["pos", "inventory", "vegan", "promotions", "reports", "marketing", "wallet"],
  },
  {
    name: "Hệ thống F&B QiCoffee",
    slug: "qicoffee",
    modules: ["pos", "inventory", "bom", "promotions", "reports", "marketing", "wallet", "tax"],
  },
  {
    name: "Chuỗi Farmstay Oasis Garden",
    slug: "oasis-garden",
    modules: ["hotel", "pos", "inventory", "reports", "marketing", "wallet"],
  },
];

async function seedSampleTenants(
  admin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
) {
  for (const s of SAMPLE_TENANTS) {
    const { data: existing } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", s.slug)
      .maybeSingle();
    let id = existing?.id as string | undefined;
    if (!id) {
      const { data: inserted, error } = await admin
        .from("tenants")
        .insert({ name: s.name, slug: s.slug, is_active: true })
        .select("id")
        .single();
      if (error) continue;
      id = inserted.id as string;
    }
    if (id) await ensureModuleRows(admin, id, s.modules);
  }
}

export const createTenant = createServerFn({ method: "POST" })
  .inputValidator((d) => createInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const baseSlug = (data.code && slugify(data.code)) || slugify(data.name) || "tenant";
    // Bảo đảm slug không trùng.
    let slug = baseSlug;
    for (let i = 2; i < 50; i++) {
      const { data: clash } = await supabaseAdmin
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      slug = `${baseSlug}-${i}`;
    }

    // Liên kết người đại diện nếu email đã có tài khoản.
    let ownerId: string | null = null;
    if (data.email) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();
      ownerId = (profile?.id as string | undefined) ?? null;
    }

    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .insert({ name: data.name, slug, owner_id: ownerId, is_active: true })
      .select("id, name, slug, owner_id, is_active, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);

    // Khởi tạo không gian lưu trữ: bật toàn bộ module mặc định.
    await ensureModuleRows(supabaseAdmin, tenant.id as string);

    // Nạp dữ liệu mẫu ban đầu cho Ms. Katty / QiCoffee / Oasis Garden.
    await seedSampleTenants(supabaseAdmin);

    return tenant as TenantRow;
  });