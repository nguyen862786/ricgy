import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface SurveyLeadRow {
  id: string;
  created_at: string;
  business_model: string | null;
  ops_pains: string[];
  marketing_pains: string[];
  expectations: string[];
  barrier: string | null;
  unlocked_modules: string[];
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_company: string | null;
  created_by: string | null;
  created_by_name: string | null;
}

// Lấy toàn bộ lead khảo sát để xuất CSV. Chỉ nhân sự (super_admin/owner/admin)
// mới có quyền. Dùng client của user (RLS) để tôn trọng chính sách is_tenant_staff().
export const listSurveyLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["super_admin", "owner", "admin"]);
    if (!roles || roles.length === 0) throw new Error("Không có quyền xem dữ liệu khảo sát");

    const { data, error } = await supabase
      .from("survey_leads")
      .select(
        "id, created_at, business_model, ops_pains, marketing_pains, expectations, barrier, unlocked_modules, contact_name, contact_phone, contact_email, contact_company, created_by",
      )
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Omit<SurveyLeadRow, "created_by_name">[];

    // Gắn tên nhân sự tạo lead (nếu có) từ bảng profiles.
    const creatorIds = Array.from(
      new Set(rows.map((r) => r.created_by).filter((v): v is string => !!v)),
    );
    const nameById = new Map<string, string>();
    if (creatorIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", creatorIds);
      for (const p of profs ?? []) {
        nameById.set(p.id, (p.full_name as string) || (p.email as string) || "Nhân sự");
      }
    }

    const leads: SurveyLeadRow[] = rows.map((r) => ({
      ...r,
      created_by_name: r.created_by ? nameById.get(r.created_by) ?? null : null,
    }));

    return { leads };
  });
