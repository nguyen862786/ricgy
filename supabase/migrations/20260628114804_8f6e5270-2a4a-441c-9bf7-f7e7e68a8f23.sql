-- =========================================================
-- 1. Harden SECURITY DEFINER function EXECUTE grants (0028 / 0029)
-- =========================================================
-- Trigger-only functions: never invoked directly, revoke from all callers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.orders_recompute_tier() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_customer_tier(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_locked_super_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.vegan_log_order_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.vegan_receive_shipment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.vegan_stamp_delivered() FROM PUBLIC, anon, authenticated;

-- Staff RPC (has internal authorization guards): authenticated only, never anon/public
REVOKE EXECUTE ON FUNCTION public.restock_fashion_variant(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restock_fashion_variant(uuid, integer) TO authenticated;

-- RLS helper functions: required by policy evaluation for signed-in users only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_tenant_staff() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_module_enabled(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_module_enabled(uuid, text) TO authenticated;

-- =========================================================
-- 2. Stricter management-role check excluding cashier (is_tenant_staff_includes_cashier)
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_tenant_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin','owner','admin','store_manager')
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_tenant_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_manager() TO authenticated;

-- Master-data tables: only managers may insert/update/delete (cashier keeps read)
-- fashion_products
DROP POLICY IF EXISTS fp_insert ON public.fashion_products;
CREATE POLICY fp_insert ON public.fashion_products FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));
DROP POLICY IF EXISTS fp_update ON public.fashion_products;
CREATE POLICY fp_update ON public.fashion_products FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));
DROP POLICY IF EXISTS fp_delete ON public.fashion_products;
CREATE POLICY fp_delete ON public.fashion_products FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));

-- fashion_variants
DROP POLICY IF EXISTS fv_insert ON public.fashion_variants;
CREATE POLICY fv_insert ON public.fashion_variants FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));
DROP POLICY IF EXISTS fv_update ON public.fashion_variants;
CREATE POLICY fv_update ON public.fashion_variants FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));
DROP POLICY IF EXISTS fv_delete ON public.fashion_variants;
CREATE POLICY fv_delete ON public.fashion_variants FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));

-- fashion_combos
DROP POLICY IF EXISTS fco_insert ON public.fashion_combos;
CREATE POLICY fco_insert ON public.fashion_combos FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));
DROP POLICY IF EXISTS fco_update ON public.fashion_combos;
CREATE POLICY fco_update ON public.fashion_combos FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));
DROP POLICY IF EXISTS fco_delete ON public.fashion_combos;
CREATE POLICY fco_delete ON public.fashion_combos FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));

-- hotel_rooms
DROP POLICY IF EXISTS hrooms_insert ON public.hotel_rooms;
CREATE POLICY hrooms_insert ON public.hotel_rooms FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));
DROP POLICY IF EXISTS hrooms_update ON public.hotel_rooms;
CREATE POLICY hrooms_update ON public.hotel_rooms FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));
DROP POLICY IF EXISTS hrooms_delete ON public.hotel_rooms;
CREATE POLICY hrooms_delete ON public.hotel_rooms FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));

-- vegan master data: split single ALL policy into staff-read + manager-write
DROP POLICY IF EXISTS "tenant staff manage vegan_products" ON public.vegan_products;
CREATE POLICY "vegan_products read staff" ON public.vegan_products FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_staff());
CREATE POLICY "vegan_products write manager" ON public.vegan_products FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_manager())
  WITH CHECK (tenant_id = current_tenant_id() AND is_tenant_manager());

DROP POLICY IF EXISTS "tenant staff manage vegan_temples" ON public.vegan_temples;
CREATE POLICY "vegan_temples read staff" ON public.vegan_temples FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_staff());
CREATE POLICY "vegan_temples write manager" ON public.vegan_temples FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_manager())
  WITH CHECK (tenant_id = current_tenant_id() AND is_tenant_manager());

DROP POLICY IF EXISTS "tenant staff manage vegan_batches" ON public.vegan_batches;
CREATE POLICY "vegan_batches read staff" ON public.vegan_batches FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_staff());
CREATE POLICY "vegan_batches write manager" ON public.vegan_batches FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_manager())
  WITH CHECK (tenant_id = current_tenant_id() AND is_tenant_manager());

DROP POLICY IF EXISTS "tenant staff manage vegan_charity_programs" ON public.vegan_charity_programs;
CREATE POLICY "vegan_charity read staff" ON public.vegan_charity_programs FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_staff());
CREATE POLICY "vegan_charity write manager" ON public.vegan_charity_programs FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_manager())
  WITH CHECK (tenant_id = current_tenant_id() AND is_tenant_manager());

-- Transactional tables: cashier keeps insert/update, only managers may delete
DROP POLICY IF EXISTS "tenant staff manage vegan_orders" ON public.vegan_orders;
CREATE POLICY "vegan_orders read staff" ON public.vegan_orders FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_staff());
CREATE POLICY "vegan_orders insert staff" ON public.vegan_orders FOR INSERT TO authenticated
  WITH CHECK (tenant_id = current_tenant_id() AND is_tenant_staff());
CREATE POLICY "vegan_orders update staff" ON public.vegan_orders FOR UPDATE TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_staff())
  WITH CHECK (tenant_id = current_tenant_id() AND is_tenant_staff());
CREATE POLICY "vegan_orders delete manager" ON public.vegan_orders FOR DELETE TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_manager());

DROP POLICY IF EXISTS "tenant staff manage vegan_shipments" ON public.vegan_shipments;
CREATE POLICY "vegan_shipments read staff" ON public.vegan_shipments FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_staff());
CREATE POLICY "vegan_shipments insert staff" ON public.vegan_shipments FOR INSERT TO authenticated
  WITH CHECK (tenant_id = current_tenant_id() AND is_tenant_staff());
CREATE POLICY "vegan_shipments update staff" ON public.vegan_shipments FOR UPDATE TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_staff())
  WITH CHECK (tenant_id = current_tenant_id() AND is_tenant_staff());
CREATE POLICY "vegan_shipments delete manager" ON public.vegan_shipments FOR DELETE TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_manager());

-- hotel transactional delete restricted to managers
DROP POLICY IF EXISTS hbooking_delete ON public.hotel_bookings;
CREATE POLICY hbooking_delete ON public.hotel_bookings FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));
DROP POLICY IF EXISTS hgserv_delete ON public.hotel_guest_services;
CREATE POLICY hgserv_delete ON public.hotel_guest_services FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_manager() AND tenant_id = current_tenant_id()));

-- =========================================================
-- 3. Restrict booking & return reads to tenant staff (hbooking_select_*, hotel_bookings_any_tenant_read, order_returns_select_*)
-- =========================================================
DROP POLICY IF EXISTS hbooking_select ON public.hotel_bookings;
CREATE POLICY hbooking_select ON public.hotel_bookings FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_staff() AND tenant_id = current_tenant_id()));

DROP POLICY IF EXISTS or_select ON public.order_returns;
CREATE POLICY or_select ON public.order_returns FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR (is_tenant_staff() AND tenant_id = current_tenant_id()));

-- =========================================================
-- 4. einvoices explicit staff SELECT policy (einvoices_no_select_policy)
-- =========================================================
DROP POLICY IF EXISTS "Staff read einvoices" ON public.einvoices;
CREATE POLICY "Staff read einvoices" ON public.einvoices FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));

-- =========================================================
-- 5. shifts: tenant-scoped access, no cross-tenant email exposure (shifts_staff_email_exposed)
-- =========================================================
DROP POLICY IF EXISTS "Staff manage shifts" ON public.shifts;
CREATE POLICY "Staff manage shifts in tenant" ON public.shifts FOR ALL TO authenticated
  USING (
    has_role(auth.uid(),'super_admin')
    OR staff_id = auth.uid()
    OR (is_staff(auth.uid()) AND store_id IN (SELECT id FROM public.stores WHERE tenant_id = current_tenant_id()))
  )
  WITH CHECK (
    has_role(auth.uid(),'super_admin')
    OR staff_id = auth.uid()
    OR (is_staff(auth.uid()) AND store_id IN (SELECT id FROM public.stores WHERE tenant_id = current_tenant_id()))
  );

-- =========================================================
-- 6. survey_leads: restrict reads to super admin or lead creator (survey_leads_staff_read_no_tenant_scope)
-- =========================================================
DROP POLICY IF EXISTS "Staff can view survey leads" ON public.survey_leads;
CREATE POLICY "Staff can view survey leads" ON public.survey_leads FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR created_by = auth.uid());

-- =========================================================
-- 7. system_super_admins: only super admins may read (system_super_admins_public_read)
-- =========================================================
DROP POLICY IF EXISTS "Staff can read system super admins" ON public.system_super_admins;
CREATE POLICY "Super admins read system super admins" ON public.system_super_admins FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'super_admin'));

-- =========================================================
-- 8. wallets: explicit staff INSERT/UPDATE policies (wallets_no_staff_update)
-- =========================================================
DROP POLICY IF EXISTS "Staff insert wallets" ON public.wallets;
CREATE POLICY "Staff insert wallets" ON public.wallets FOR INSERT TO authenticated
  WITH CHECK (is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff update wallets" ON public.wallets;
CREATE POLICY "Staff update wallets" ON public.wallets FOR UPDATE TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- =========================================================
-- 9. Replace always-true write policies (SUPA_rls_policy_always_true)
-- =========================================================
DROP POLICY IF EXISTS "anyone can insert click" ON public.affiliate_clicks;
CREATE POLICY "anyone can insert click" ON public.affiliate_clicks FOR INSERT
  WITH CHECK (referrer_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can submit a survey" ON public.survey_leads;
CREATE POLICY "Anyone can submit a survey" ON public.survey_leads FOR INSERT
  WITH CHECK (created_by IS NULL OR created_by = auth.uid());