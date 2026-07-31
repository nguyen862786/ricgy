-- Chỉ cho phép user đã đăng nhập gọi các hàm helper (không cho anon/public)
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_module_enabled(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_module_enabled(uuid, text) TO authenticated, service_role;

-- Siết quyền đăng ký thành viên Qi Club: chỉ nhân viên/quản lý/chủ DN/super admin
DROP POLICY IF EXISTS "Members - staff can register" ON public.qiclub_members;
CREATE POLICY "Members - staff can register"
  ON public.qiclub_members FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'store_manager')
    OR public.has_role(auth.uid(), 'cashier')
  );