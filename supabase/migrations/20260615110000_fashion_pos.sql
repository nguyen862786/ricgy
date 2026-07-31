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
