-- ============================================================
-- Apply pending migrations synced from GitHub (never executed):
-- is_tenant_staff helper + RLS harden, demo tenants seed,
-- hotel PMS tables, fashion POS tables.
-- ============================================================

-- 1) Helper: is_tenant_staff()
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

-- 2) Harden tenant_memberships
DROP POLICY IF EXISTS "Memberships - own tenant read"   ON public.tenant_memberships;
DROP POLICY IF EXISTS "Memberships - own tenant insert" ON public.tenant_memberships;
DROP POLICY IF EXISTS "Memberships - own tenant update" ON public.tenant_memberships;
DROP POLICY IF EXISTS "Memberships - own tenant delete" ON public.tenant_memberships;
DROP POLICY IF EXISTS "tm_select_own_tenant_staff" ON public.tenant_memberships;
DROP POLICY IF EXISTS "tm_insert_own_tenant_staff" ON public.tenant_memberships;
DROP POLICY IF EXISTS "tm_update_own_tenant_staff" ON public.tenant_memberships;
DROP POLICY IF EXISTS "tm_delete_owner_admin_only" ON public.tenant_memberships;

CREATE POLICY "tm_select_own_tenant_staff" ON public.tenant_memberships FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "tm_insert_own_tenant_staff" ON public.tenant_memberships FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "tm_update_own_tenant_staff" ON public.tenant_memberships FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "tm_delete_owner_admin_only" ON public.tenant_memberships FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

-- 3) Harden tenant_modules
DROP POLICY IF EXISTS "Modules - tenant or super admin read" ON public.tenant_modules;
DROP POLICY IF EXISTS "Modules - super admin insert"         ON public.tenant_modules;
DROP POLICY IF EXISTS "Modules - super admin update"         ON public.tenant_modules;
DROP POLICY IF EXISTS "Modules - super admin delete"         ON public.tenant_modules;
DROP POLICY IF EXISTS "tmod_select_own_tenant" ON public.tenant_modules;
DROP POLICY IF EXISTS "tmod_insert_owner_admin" ON public.tenant_modules;
DROP POLICY IF EXISTS "tmod_update_owner_admin" ON public.tenant_modules;
DROP POLICY IF EXISTS "tmod_delete_owner_admin" ON public.tenant_modules;

CREATE POLICY "tmod_select_own_tenant" ON public.tenant_modules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "tmod_insert_owner_admin" ON public.tenant_modules FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));
CREATE POLICY "tmod_update_owner_admin" ON public.tenant_modules FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));
CREATE POLICY "tmod_delete_owner_admin" ON public.tenant_modules FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

-- 4) qiclub_redemptions webhook tracking + qiclub_config seed
ALTER TABLE public.qiclub_redemptions
  ADD COLUMN IF NOT EXISTS webhook_status text,
  ADD COLUMN IF NOT EXISTS webhook_error  text;

INSERT INTO public.app_settings (key, value)
VALUES ('qiclub_config', '{"enabled":false,"webhook_url":"","secret_key":"","default_prefix":"QIC"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5) Seed demo tenants
INSERT INTO public.tenants (id, name, slug, is_active)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Hệ thống F&B QiCoffee',       'qicoffee',      true),
  ('a2000000-0000-0000-0000-000000000002', 'Chuỗi Farmstay Oasis Garden',  'oasis-garden',  true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenant_modules (tenant_id, module_key, enabled)
VALUES
  ('a1000000-0000-0000-0000-000000000001','pos',true),('a1000000-0000-0000-0000-000000000001','inventory',true),
  ('a1000000-0000-0000-0000-000000000001','bom',true),('a1000000-0000-0000-0000-000000000001','promotions',true),
  ('a1000000-0000-0000-0000-000000000001','reports',true),('a1000000-0000-0000-0000-000000000001','marketing',true),
  ('a1000000-0000-0000-0000-000000000001','tax',true),('a1000000-0000-0000-0000-000000000001','wallet',false),
  ('a1000000-0000-0000-0000-000000000001','hotel',false),('a1000000-0000-0000-0000-000000000001','fashion',false),
  ('a2000000-0000-0000-0000-000000000002','hotel',true),('a2000000-0000-0000-0000-000000000002','pos',true),
  ('a2000000-0000-0000-0000-000000000002','inventory',true),('a2000000-0000-0000-0000-000000000002','reports',true),
  ('a2000000-0000-0000-0000-000000000002','marketing',true),('a2000000-0000-0000-0000-000000000002','wallet',true),
  ('a2000000-0000-0000-0000-000000000002','bom',false),('a2000000-0000-0000-0000-000000000002','promotions',false),
  ('a2000000-0000-0000-0000-000000000002','fashion',false),('a2000000-0000-0000-0000-000000000002','tax',false)
ON CONFLICT (tenant_id, module_key) DO NOTHING;

-- 6) Hotel PMS tables
CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_number text NOT NULL, name text NOT NULL,
  type text NOT NULL DEFAULT 'standard', floor integer,
  capacity integer NOT NULL DEFAULT 2, base_price numeric NOT NULL DEFAULT 0,
  amenities jsonb NOT NULL DEFAULT '[]', images jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'available', iot_device_id text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, room_number)
);
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotel_rooms TO authenticated;
GRANT ALL ON public.hotel_rooms TO service_role;
CREATE POLICY "hrooms_select" ON public.hotel_rooms FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "hrooms_insert" ON public.hotel_rooms FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "hrooms_update" ON public.hotel_rooms FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "hrooms_delete" ON public.hotel_rooms FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

CREATE TABLE IF NOT EXISTS public.hotel_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.hotel_rooms(id),
  booking_code text NOT NULL DEFAULT concat('OG-', upper(substring(gen_random_uuid()::text, 1, 8))),
  guest_name text NOT NULL, guest_phone text, guest_email text, guest_id_number text,
  num_adults integer NOT NULL DEFAULT 1, num_children integer NOT NULL DEFAULT 0,
  check_in date NOT NULL, check_out date NOT NULL,
  check_in_actual timestamptz, check_out_actual timestamptz,
  room_price numeric NOT NULL DEFAULT 0, extra_charges numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0, total_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0, payment_method text,
  source text NOT NULL DEFAULT 'direct', status text NOT NULL DEFAULT 'pending',
  special_requests text, note text, created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_checkout_after_checkin CHECK (check_out > check_in)
);
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotel_bookings TO authenticated;
GRANT ALL ON public.hotel_bookings TO service_role;
CREATE POLICY "hbooking_select" ON public.hotel_bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "hbooking_insert" ON public.hotel_bookings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "hbooking_update" ON public.hotel_bookings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "hbooking_delete" ON public.hotel_bookings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

CREATE TABLE IF NOT EXISTS public.hotel_guest_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.hotel_bookings(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.hotel_rooms(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'housekeeping', title text NOT NULL, description text,
  requested_at timestamptz NOT NULL DEFAULT now(), scheduled_at timestamptz, completed_at timestamptz,
  status text NOT NULL DEFAULT 'pending', priority text NOT NULL DEFAULT 'normal',
  staff_id uuid REFERENCES auth.users(id), staff_note text, charge numeric NOT NULL DEFAULT 0,
  iot_device_id text, iot_command jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hotel_guest_services ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotel_guest_services TO authenticated;
GRANT ALL ON public.hotel_guest_services TO service_role;
CREATE POLICY "hgserv_select" ON public.hotel_guest_services FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "hgserv_insert" ON public.hotel_guest_services FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "hgserv_update" ON public.hotel_guest_services FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "hgserv_delete" ON public.hotel_guest_services FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

INSERT INTO public.hotel_rooms (tenant_id, room_number, name, type, floor, capacity, base_price, amenities, status)
VALUES
  ('a2000000-0000-0000-0000-000000000002', '01', 'Villa Đồi Thông',    'villa',     1, 4, 2500000, '["wifi","ac","bathtub","tv"]'::jsonb, 'available'),
  ('a2000000-0000-0000-0000-000000000002', '02', 'Suite Vườn Hữu Cơ', 'suite',     1, 2, 1800000, '["wifi","ac","tv"]'::jsonb,           'available'),
  ('a2000000-0000-0000-0000-000000000002', '03', 'Glamping Sao Đêm',  'glamping',  0, 2, 1200000, '["wifi","fan"]'::jsonb,               'available'),
  ('a2000000-0000-0000-0000-000000000002', '04', 'Deluxe Suối Trong', 'deluxe',    2, 3, 1500000, '["wifi","ac","tv"]'::jsonb,           'occupied'),
  ('a2000000-0000-0000-0000-000000000002', '05', 'Standard Tre Xanh', 'standard',  2, 2, 900000,  '["wifi","fan"]'::jsonb,               'available')
ON CONFLICT (tenant_id, room_number) DO NOTHING;

-- 7) Fashion POS tables
CREATE TABLE IF NOT EXISTS public.fashion_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL, brand text, gender text NOT NULL DEFAULT 'unisex',
  category text NOT NULL DEFAULT 'clothing', description text,
  base_price numeric NOT NULL DEFAULT 0, images jsonb NOT NULL DEFAULT '[]',
  tags text[] NOT NULL DEFAULT '{}', is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fashion_products ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fashion_products TO authenticated;
GRANT ALL ON public.fashion_products TO service_role;
CREATE POLICY "fp_select" ON public.fashion_products FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "fp_insert" ON public.fashion_products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fp_update" ON public.fashion_products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fp_delete" ON public.fashion_products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

CREATE TABLE IF NOT EXISTS public.fashion_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.fashion_products(id) ON DELETE CASCADE,
  sku text NOT NULL, size text NOT NULL DEFAULT 'FREE',
  color_name text, color_hex text, color_image_url text,
  chest_cm numeric, waist_cm numeric, hip_cm numeric, length_cm numeric,
  height_min_cm numeric, height_max_cm numeric, weight_min_kg numeric, weight_max_kg numeric,
  price_delta numeric NOT NULL DEFAULT 0, stock integer NOT NULL DEFAULT 0,
  images jsonb NOT NULL DEFAULT '[]', attributes jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sku)
);
ALTER TABLE public.fashion_variants ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fashion_variants TO authenticated;
GRANT ALL ON public.fashion_variants TO service_role;
CREATE POLICY "fv_select" ON public.fashion_variants FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "fv_insert" ON public.fashion_variants FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fv_update" ON public.fashion_variants FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fv_delete" ON public.fashion_variants FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

CREATE TABLE IF NOT EXISTS public.fashion_combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL, description text, items jsonb NOT NULL DEFAULT '[]',
  combo_price numeric NOT NULL DEFAULT 0, original_price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true, starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fashion_combos ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fashion_combos TO authenticated;
GRANT ALL ON public.fashion_combos TO service_role;
CREATE POLICY "fco_select" ON public.fashion_combos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "fco_insert" ON public.fashion_combos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fco_update" ON public.fashion_combos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fco_delete" ON public.fashion_combos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

CREATE TABLE IF NOT EXISTS public.order_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL, order_code text,
  variant_id uuid REFERENCES public.fashion_variants(id) ON DELETE SET NULL,
  product_name text NOT NULL, qty integer NOT NULL DEFAULT 1, unit_price numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT 'wrong_size', reason_detail text,
  has_tags boolean, is_clean boolean, is_not_torn boolean, condition_notes text,
  status text NOT NULL DEFAULT 'requested', resolution text,
  refund_amount numeric NOT NULL DEFAULT 0,
  exchange_variant_id uuid REFERENCES public.fashion_variants(id), exchange_product_name text,
  created_by uuid REFERENCES auth.users(id), processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_returns TO authenticated;
GRANT ALL ON public.order_returns TO service_role;
CREATE POLICY "or_select" ON public.order_returns FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "or_insert" ON public.order_returns FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "or_update" ON public.order_returns FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "or_delete" ON public.order_returns FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

-- Fashion seed: Boutique Élite tenant + modules + products + variants
INSERT INTO public.tenants (id, name, slug, is_active)
VALUES ('a3000000-0000-0000-0000-000000000003', 'Boutique Élite', 'boutique-elite', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenant_modules (tenant_id, module_key, enabled)
VALUES
  ('a3000000-0000-0000-0000-000000000003','fashion',true),('a3000000-0000-0000-0000-000000000003','pos',true),
  ('a3000000-0000-0000-0000-000000000003','inventory',true),('a3000000-0000-0000-0000-000000000003','reports',true),
  ('a3000000-0000-0000-0000-000000000003','marketing',true),('a3000000-0000-0000-0000-000000000003','promotions',true),
  ('a3000000-0000-0000-0000-000000000003','wallet',true),('a3000000-0000-0000-0000-000000000003','hotel',false),
  ('a3000000-0000-0000-0000-000000000003','bom',false),('a3000000-0000-0000-0000-000000000003','tax',false)
ON CONFLICT (tenant_id, module_key) DO NOTHING;

INSERT INTO public.fashion_products (id, tenant_id, name, brand, gender, category, base_price, is_active)
VALUES
  ('b1000000-fa00-0000-0000-000000000001','a3000000-0000-0000-0000-000000000003','Đầm Hoa Mùa Hè','Élite Collection','female','clothing',850000,true),
  ('b1000000-fa00-0000-0000-000000000002','a3000000-0000-0000-0000-000000000003','Quần Âu Nam Classic','Élite Men','male','clothing',650000,true),
  ('b1000000-fa00-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','Kính Mát Polarized UV400','SunElite','unisex','glasses',1200000,true),
  ('b1000000-fa00-0000-0000-000000000004','a3000000-0000-0000-0000-000000000003','Đồng Hồ Quartz Sapphire','TimeElite','unisex','watch',3500000,true),
  ('b1000000-fa00-0000-0000-000000000005','a3000000-0000-0000-0000-000000000003','Kẹp Tóc Resin Butterfly','AccessElite','female','hair_clip',120000,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fashion_variants
  (tenant_id, product_id, sku, size, color_name, color_hex, chest_cm, waist_cm, hip_cm, length_cm, height_min_cm, height_max_cm, weight_min_kg, weight_max_kg, stock)
VALUES
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-PINK-S','S','Hồng Nhạt','#FFB6C1',80,62,88,100,150,158,45,52,15),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-PINK-M','M','Hồng Nhạt','#FFB6C1',84,66,92,102,158,165,52,60,20),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-PINK-L','L','Hồng Nhạt','#FFB6C1',88,70,96,104,162,170,58,68,12),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-BLUE-S','S','Xanh Pastel','#AED6F1',80,62,88,100,150,158,45,52,10),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-BLUE-M','M','Xanh Pastel','#AED6F1',84,66,92,102,158,165,52,60,18),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-BLUE-L','L','Xanh Pastel','#AED6F1',88,70,96,104,162,170,58,68,8)
ON CONFLICT (tenant_id, sku) DO NOTHING;

INSERT INTO public.fashion_variants (tenant_id, product_id, sku, size, color_name, color_hex, stock, attributes)
VALUES
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000003','EL-KM-BLK-FREE','FREE','Đen','#000000',25,
   '{"frame_material":"Acetate","lens_type":"Polarized","uv_protection":"UV400","frame_width_mm":140}'::jsonb),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000003','EL-KM-GLD-FREE','FREE','Vàng','#D4AC0D',18,
   '{"frame_material":"Kim loại","lens_type":"Polarized","uv_protection":"UV400","frame_width_mm":138}'::jsonb),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000004','EL-DH-SLV-FREE','FREE','Bạc','#C0C0C0',12,
   '{"movement":"Quartz","water_resistance_m":50,"case_material":"Stainless Steel","strap_material":"Da thật"}'::jsonb),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000005','EL-KT-PNK-LRG','FREE','Hồng','#FF69B4',50,
   '{"material":"Nhựa resin","style":"Cài cua","size":"Lớn"}'::jsonb)
ON CONFLICT (tenant_id, sku) DO NOTHING;