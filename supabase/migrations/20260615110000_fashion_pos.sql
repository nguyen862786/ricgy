-- ====================================================================
-- Fashion PMS: fashion_products, fashion_variants, fashion_combos, order_returns
-- RLS theo tenant_id — pattern thống nhất toàn hệ thống.
-- Lưu ý: bảng product_variants đã tồn tại (generic). fashion_variants
--        là bảng riêng cho module thời trang với schema chuyên sâu hơn.
-- ====================================================================

-- ----------------------------------------------------------------
-- fashion_products: thông tin sản phẩm gốc
-- ----------------------------------------------------------------
CREATE TABLE public.fashion_products (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  brand       text,
  gender      text        NOT NULL DEFAULT 'unisex',   -- male|female|kids|unisex
  category    text        NOT NULL DEFAULT 'clothing',  -- clothing|glasses|watch|hair_clip|bag|accessories
  description text,
  base_price  numeric     NOT NULL DEFAULT 0,
  images      jsonb       NOT NULL DEFAULT '[]',
  tags        text[]      NOT NULL DEFAULT '{}',
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fashion_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fp_select" ON public.fashion_products FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "fp_insert" ON public.fashion_products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fp_update" ON public.fashion_products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fp_delete" ON public.fashion_products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

-- ----------------------------------------------------------------
-- fashion_variants: ma trận SKU với số đo chi tiết + gợi ý AI
-- ----------------------------------------------------------------
CREATE TABLE public.fashion_variants (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id      uuid        NOT NULL REFERENCES public.fashion_products(id) ON DELETE CASCADE,
  sku             text        NOT NULL,
  size            text        NOT NULL DEFAULT 'FREE', -- XS|S|M|L|XL|XXL|FREE|ONE
  color_name      text,
  color_hex       text,                                -- #RRGGBB
  color_image_url text,
  -- Thông số kỹ thuật (clothing)
  chest_cm        numeric,                             -- Vòng 1
  waist_cm        numeric,                             -- Vòng 2
  hip_cm          numeric,                             -- Vòng 3
  length_cm       numeric,                             -- Chiều dài váy/quần
  -- Nhân khẩu học — cho thuật toán gợi ý size
  height_min_cm   numeric,
  height_max_cm   numeric,
  weight_min_kg   numeric,
  weight_max_kg   numeric,
  -- Commerce
  price_delta     numeric     NOT NULL DEFAULT 0,
  stock           integer     NOT NULL DEFAULT 0,
  images          jsonb       NOT NULL DEFAULT '[]',
  -- Thuộc tính đặc thù theo danh mục (frames, movement, material, …)
  attributes      jsonb       NOT NULL DEFAULT '{}',
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sku)
);

ALTER TABLE public.fashion_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fv_select" ON public.fashion_variants FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "fv_insert" ON public.fashion_variants FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fv_update" ON public.fashion_variants FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fv_delete" ON public.fashion_variants FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

-- ----------------------------------------------------------------
-- fashion_combos: gói combo sản phẩm (váy + phụ kiện đi kèm, …)
-- ----------------------------------------------------------------
CREATE TABLE public.fashion_combos (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  description     text,
  -- [{variant_id, product_name, color_name, size, qty, unit_price}]
  items           jsonb       NOT NULL DEFAULT '[]',
  combo_price     numeric     NOT NULL DEFAULT 0,
  original_price  numeric     NOT NULL DEFAULT 0,
  is_active       boolean     NOT NULL DEFAULT true,
  starts_at       timestamptz,
  ends_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fashion_combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fco_select" ON public.fashion_combos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "fco_insert" ON public.fashion_combos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fco_update" ON public.fashion_combos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "fco_delete" ON public.fashion_combos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

-- ----------------------------------------------------------------
-- order_returns: luồng đổi trả hàng chuyên nghiệp
-- ----------------------------------------------------------------
CREATE TABLE public.order_returns (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id              uuid        REFERENCES public.orders(id) ON DELETE SET NULL,
  order_code            text,
  variant_id            uuid        REFERENCES public.fashion_variants(id) ON DELETE SET NULL,
  product_name          text        NOT NULL,
  qty                   integer     NOT NULL DEFAULT 1,
  unit_price            numeric     NOT NULL DEFAULT 0,
  -- Lý do đổi trả
  reason                text        NOT NULL DEFAULT 'wrong_size', -- wrong_size|not_as_pictured|defect|other
  reason_detail         text,
  -- Kiểm định (mác, sạch, nguyên vẹn)
  has_tags              boolean,
  is_clean              boolean,
  is_not_torn           boolean,
  condition_notes       text,
  -- Trạng thái luồng
  status                text        NOT NULL DEFAULT 'requested', -- requested|received|inspected|resolved|rejected
  -- Phương thức xử lý
  resolution            text,        -- wallet_refund|exchange|invoice_credit
  refund_amount         numeric     NOT NULL DEFAULT 0,
  exchange_variant_id   uuid        REFERENCES public.fashion_variants(id),
  exchange_product_name text,
  -- Meta
  created_by            uuid        REFERENCES auth.users(id),
  processed_by          uuid        REFERENCES auth.users(id),
  processed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "or_select" ON public.order_returns FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());
CREATE POLICY "or_insert" ON public.order_returns FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "or_update" ON public.order_returns FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id()));
CREATE POLICY "or_delete" ON public.order_returns FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id()));

-- ----------------------------------------------------------------
-- Seed: Demo tenant Boutique Élite (fashion)
-- ----------------------------------------------------------------
INSERT INTO public.tenants (id, name, slug, is_active)
VALUES ('a3000000-0000-0000-0000-000000000003', 'Boutique Élite', 'boutique-elite', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenant_modules (tenant_id, module_key, enabled)
VALUES
  ('a3000000-0000-0000-0000-000000000003', 'fashion',    true),
  ('a3000000-0000-0000-0000-000000000003', 'pos',        true),
  ('a3000000-0000-0000-0000-000000000003', 'inventory',  true),
  ('a3000000-0000-0000-0000-000000000003', 'reports',    true),
  ('a3000000-0000-0000-0000-000000000003', 'marketing',  true),
  ('a3000000-0000-0000-0000-000000000003', 'promotions', true),
  ('a3000000-0000-0000-0000-000000000003', 'wallet',     true),
  ('a3000000-0000-0000-0000-000000000003', 'hotel',      false),
  ('a3000000-0000-0000-0000-000000000003', 'bom',        false),
  ('a3000000-0000-0000-0000-000000000003', 'tax',        false)
ON CONFLICT (tenant_id, module_key) DO NOTHING;

-- Seed: sản phẩm mẫu cho Boutique Élite
INSERT INTO public.fashion_products (id, tenant_id, name, brand, gender, category, base_price, is_active)
VALUES
  ('b1000000-fa00-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Đầm Hoa Mùa Hè',          'Élite Collection', 'female',  'clothing',  850000, true),
  ('b1000000-fa00-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000003', 'Quần Âu Nam Classic',      'Élite Men',        'male',    'clothing',  650000, true),
  ('b1000000-fa00-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'Kính Mát Polarized UV400', 'SunElite',         'unisex',  'glasses',  1200000, true),
  ('b1000000-fa00-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000003', 'Đồng Hồ Quartz Sapphire', 'TimeElite',        'unisex',  'watch',    3500000, true),
  ('b1000000-fa00-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000003', 'Kẹp Tóc Resin Butterfly', 'AccessElite',      'female',  'hair_clip', 120000, true)
ON CONFLICT (id) DO NOTHING;

-- Seed: biến thể cho Đầm Hoa Mùa Hè (nữ, với đầy đủ số đo)
INSERT INTO public.fashion_variants
  (tenant_id, product_id, sku, size, color_name, color_hex, chest_cm, waist_cm, hip_cm, length_cm, height_min_cm, height_max_cm, weight_min_kg, weight_max_kg, stock)
VALUES
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-PINK-S', 'S','Hồng Nhạt','#FFB6C1', 80,62,88,100, 150,158, 45,52, 15),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-PINK-M', 'M','Hồng Nhạt','#FFB6C1', 84,66,92,102, 158,165, 52,60, 20),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-PINK-L', 'L','Hồng Nhạt','#FFB6C1', 88,70,96,104, 162,170, 58,68, 12),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-BLUE-S', 'S','Xanh Pastel','#AED6F1',80,62,88,100, 150,158, 45,52, 10),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-BLUE-M', 'M','Xanh Pastel','#AED6F1',84,66,92,102, 158,165, 52,60, 18),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000001','EL-DHH-BLUE-L', 'L','Xanh Pastel','#AED6F1',88,70,96,104, 162,170, 58,68,  8)
ON CONFLICT (tenant_id, sku) DO NOTHING;

-- Seed: biến thể phụ kiện (glasses, watch) với attributes jsonb
INSERT INTO public.fashion_variants (tenant_id, product_id, sku, size, color_name, color_hex, stock, attributes)
VALUES
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000003','EL-KM-BLK-FREE','FREE','Đen','#000000', 25,
   '{"frame_material":"Acetate","lens_type":"Polarized","uv_protection":"UV400","frame_width_mm":140}'::jsonb),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000003','EL-KM-GLD-FREE','FREE','Vàng','#D4AC0D', 18,
   '{"frame_material":"Kim loại","lens_type":"Polarized","uv_protection":"UV400","frame_width_mm":138}'::jsonb),
  ('a3000000-0000-0000-0000-000000000003','b1000000-fa00-0000-0000-000000000004','EL-DH-SLV-FREE','FREE','Bạc','#C0C0C0', 12,
   '{"movement":"Quartz","water_resistance_m":50,"case_material":"Stainless Steel","strap_material":"Da thật"}'::jsonb),
  ('a3000000-0000-0000-0000-000000000005','b1000000-fa00-0000-0000-000000000005','EL-KT-PNK-LRG','FREE','Hồng','#FF69B4', 50,
   '{"material":"Nhựa resin","style":"Cài cua","size":"Lớn"}'::jsonb)
ON CONFLICT (tenant_id, sku) DO NOTHING;
