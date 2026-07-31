-- Seed 2 demo tenants for /super-admin/modules testing
-- Uses ON CONFLICT DO NOTHING for idempotency (safe to re-run).
-- Bypasses RLS because migrations run as postgres superuser.

INSERT INTO public.tenants (id, name, slug, is_active)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Hệ thống F&B QiCoffee',       'qicoffee',      true),
  ('a2000000-0000-0000-0000-000000000002', 'Chuỗi Farmstay Oasis Garden',  'oasis-garden',  true)
ON CONFLICT (id) DO NOTHING;

-- QiCoffee (F&B): POS, inventory, BOM, promotions, reports, marketing, tax ON; wallet, hotel, fashion OFF
INSERT INTO public.tenant_modules (tenant_id, module_key, enabled)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'pos',         true),
  ('a1000000-0000-0000-0000-000000000001', 'inventory',   true),
  ('a1000000-0000-0000-0000-000000000001', 'bom',         true),
  ('a1000000-0000-0000-0000-000000000001', 'promotions',  true),
  ('a1000000-0000-0000-0000-000000000001', 'reports',     true),
  ('a1000000-0000-0000-0000-000000000001', 'marketing',   true),
  ('a1000000-0000-0000-0000-000000000001', 'tax',         true),
  ('a1000000-0000-0000-0000-000000000001', 'wallet',      false),
  ('a1000000-0000-0000-0000-000000000001', 'hotel',       false),
  ('a1000000-0000-0000-0000-000000000001', 'fashion',     false)
ON CONFLICT (tenant_id, module_key) DO NOTHING;

-- Oasis Garden (Farmstay): hotel, pos, inventory, reports, marketing, wallet ON; bom, promotions, fashion, tax OFF
INSERT INTO public.tenant_modules (tenant_id, module_key, enabled)
VALUES
  ('a2000000-0000-0000-0000-000000000002', 'hotel',       true),
  ('a2000000-0000-0000-0000-000000000002', 'pos',         true),
  ('a2000000-0000-0000-0000-000000000002', 'inventory',   true),
  ('a2000000-0000-0000-0000-000000000002', 'reports',     true),
  ('a2000000-0000-0000-0000-000000000002', 'marketing',   true),
  ('a2000000-0000-0000-0000-000000000002', 'wallet',      true),
  ('a2000000-0000-0000-0000-000000000002', 'bom',         false),
  ('a2000000-0000-0000-0000-000000000002', 'promotions',  false),
  ('a2000000-0000-0000-0000-000000000002', 'fashion',     false),
  ('a2000000-0000-0000-0000-000000000002', 'tax',         false)
ON CONFLICT (tenant_id, module_key) DO NOTHING;
