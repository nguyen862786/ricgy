-- =====================================================================
-- Harden RLS: tenant_memberships & tenant_modules
-- Thêm helper is_tenant_staff(), siết quyền ghi theo vai trò + tenant.
-- Seed qiclub_config vào app_settings.
-- =====================================================================

-- ----------------------------------------------------------------
-- Helper mới: true khi user hiện tại có bất kỳ vai trò nhân viên nào
-- (bao gồm cashier, store_manager — cần cho thao tác POS)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_tenant_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'owner', 'admin', 'store_manager', 'cashier')
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_tenant_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_staff() TO authenticated, service_role;

-- =====================================================================
-- tenant_memberships
-- Vấn đề cũ: INSERT/UPDATE/DELETE chỉ kiểm tra tenant_id khớp nhưng
-- KHÔNG yêu cầu user phải là nhân viên → bất kỳ authenticated user
-- nào được gán cùng tenant đều có thể ghi dữ liệu thành viên.
-- =====================================================================
DROP POLICY IF EXISTS "Memberships - own tenant read"   ON public.tenant_memberships;
DROP POLICY IF EXISTS "Memberships - own tenant insert" ON public.tenant_memberships;
DROP POLICY IF EXISTS "Memberships - own tenant update" ON public.tenant_memberships;
DROP POLICY IF EXISTS "Memberships - own tenant delete" ON public.tenant_memberships;

-- SELECT: super_admin hoặc bất kỳ nhân viên nào (kể cả cashier) của đúng tenant
CREATE POLICY "tm_select_own_tenant_staff"
  ON public.tenant_memberships FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  );

-- INSERT: super_admin hoặc nhân viên ghi vào đúng tenant của mình
-- Ràng buộc cả USING + WITH CHECK để chặn ghi nhầm sang tenant khác
CREATE POLICY "tm_insert_own_tenant_staff"
  ON public.tenant_memberships FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  );

-- UPDATE: super_admin hoặc nhân viên cập nhật đúng tenant
CREATE POLICY "tm_update_own_tenant_staff"
  ON public.tenant_memberships FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  );

-- DELETE: chỉ super_admin hoặc owner/admin (không cho cashier/store_manager xóa)
CREATE POLICY "tm_delete_owner_admin_only"
  ON public.tenant_memberships FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id())
  );

-- =====================================================================
-- tenant_modules
-- Vấn đề cũ: chỉ super_admin mới INSERT/UPDATE/DELETE được, chặn cả
-- owner của tenant tự quản lý tính năng của mình.
-- =====================================================================
DROP POLICY IF EXISTS "Modules - tenant or super admin read" ON public.tenant_modules;
DROP POLICY IF EXISTS "Modules - super admin insert"         ON public.tenant_modules;
DROP POLICY IF EXISTS "Modules - super admin update"         ON public.tenant_modules;
DROP POLICY IF EXISTS "Modules - super admin delete"         ON public.tenant_modules;

-- SELECT: super_admin hoặc bất kỳ user thuộc tenant đó
-- (FE cần đọc danh sách module để ẩn/hiện menu — không cần phải là staff)
CREATE POLICY "tmod_select_own_tenant"
  ON public.tenant_modules FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR tenant_id = public.current_tenant_id()
  );

-- INSERT: super_admin hoặc owner/admin của đúng tenant
CREATE POLICY "tmod_insert_owner_admin"
  ON public.tenant_modules FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id())
  );

-- UPDATE: super_admin hoặc owner/admin của đúng tenant
CREATE POLICY "tmod_update_owner_admin"
  ON public.tenant_modules FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id())
  );

-- DELETE: super_admin hoặc owner/admin của đúng tenant
CREATE POLICY "tmod_delete_owner_admin"
  ON public.tenant_modules FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id())
  );

-- =====================================================================
-- Theo dõi trạng thái webhook trên qiclub_redemptions
-- =====================================================================
ALTER TABLE public.qiclub_redemptions
  ADD COLUMN IF NOT EXISTS webhook_status text,
  ADD COLUMN IF NOT EXISTS webhook_error  text;

-- =====================================================================
-- Seed default qiclub_config vào app_settings
-- =====================================================================
INSERT INTO public.app_settings (key, value)
VALUES (
  'qiclub_config',
  '{"enabled":false,"webhook_url":"","secret_key":"","default_prefix":"QIC"}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
