-- =====================================================================
-- 1. TENANTS (doanh nghiệp thuê) — lớp phân tách multi-tenant
-- =====================================================================
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

-- Gắn doanh nghiệp vào hồ sơ người dùng và cửa hàng
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;
ALTER TABLE public.stores   ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_stores_tenant ON public.stores (tenant_id);

-- Doanh nghiệp của user hiện tại
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manage tenants - select"
  ON public.tenants FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR id = public.current_tenant_id());
CREATE POLICY "Super admin manage tenants - insert"
  ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin manage tenants - update"
  ON public.tenants FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin manage tenants - delete"
  ON public.tenants FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- 2. TENANT MODULES — bật/tắt tính năng theo doanh nghiệp
-- =====================================================================
CREATE TABLE public.tenant_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, module_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_modules TO authenticated;
GRANT ALL ON public.tenant_modules TO service_role;

-- Tính năng có đang bật cho doanh nghiệp không (mặc định bật nếu chưa có cấu hình)
CREATE OR REPLACE FUNCTION public.is_module_enabled(_tenant uuid, _key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT enabled FROM public.tenant_modules WHERE tenant_id = _tenant AND module_key = _key),
    true
  )
$$;

ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modules - tenant or super admin read"
  ON public.tenant_modules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "Modules - super admin insert"
  ON public.tenant_modules FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Modules - super admin update"
  ON public.tenant_modules FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Modules - super admin delete"
  ON public.tenant_modules FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_tenant_modules_updated BEFORE UPDATE ON public.tenant_modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- 3. QI CLUB GLOBAL MEMBERS — định danh dùng chung toàn hệ thống
--    (KHÔNG chứa lịch sử kinh doanh -> an toàn khi mọi tenant đọc được)
-- =====================================================================
CREATE TABLE public.qiclub_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  qr_code text NOT NULL UNIQUE DEFAULT ('QI' || upper(replace(gen_random_uuid()::text, '-', ''))),
  full_name text,
  total_points numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qiclub_members TO authenticated;
GRANT ALL ON public.qiclub_members TO service_role;

ALTER TABLE public.qiclub_members ENABLE ROW LEVEL SECURITY;

-- Mọi nhân viên đã đăng nhập đều nhận diện được thành viên Qi Club (định danh)
CREATE POLICY "Members - any staff can read identity"
  ON public.qiclub_members FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
-- Cho phép đăng ký thành viên mới khi bán hàng
CREATE POLICY "Members - staff can register"
  ON public.qiclub_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
-- Cập nhật điểm tổng chỉ qua server (service_role) -> không tạo policy update/delete cho authenticated

CREATE TRIGGER trg_qiclub_members_updated BEFORE UPDATE ON public.qiclub_members
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- 4. TENANT MEMBERSHIPS — hạng & lịch sử nội bộ gắn doanh nghiệp
--    (mỗi tenant chỉ thấy dữ liệu của chính mình)
-- =====================================================================
CREATE TABLE public.tenant_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.qiclub_members(id) ON DELETE CASCADE,
  internal_tier text NOT NULL DEFAULT 'standard',
  total_spent numeric NOT NULL DEFAULT 0,
  visit_count integer NOT NULL DEFAULT 0,
  points numeric NOT NULL DEFAULT 0,
  last_purchase_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, member_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_memberships TO authenticated;
GRANT ALL ON public.tenant_memberships TO service_role;
CREATE INDEX idx_tenant_memberships_member ON public.tenant_memberships (member_id);
CREATE INDEX idx_tenant_memberships_tenant ON public.tenant_memberships (tenant_id);

ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memberships - own tenant read"
  ON public.tenant_memberships FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "Memberships - own tenant insert"
  ON public.tenant_memberships FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "Memberships - own tenant update"
  ON public.tenant_memberships FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "Memberships - own tenant delete"
  ON public.tenant_memberships FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());

CREATE TRIGGER trg_tenant_memberships_updated BEFORE UPDATE ON public.tenant_memberships
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();