-- Enums
DO $$ BEGIN
  CREATE TYPE public.app_industry AS ENUM ('fnb','beverage','hotel','fashion');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.cashflow_mode AS ENUM ('per_store','company');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_status AS ENUM ('trial','active','grace_period','suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Stores
CREATE TABLE public.stores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  industry public.app_industry NOT NULL DEFAULT 'fnb',
  cashflow_mode public.cashflow_mode NOT NULL DEFAULT 'per_store',
  address text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  billing_status public.billing_status NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  grace_ends_at timestamptz,
  plan text NOT NULL DEFAULT 'starter',
  hardware_combo boolean NOT NULL DEFAULT false,
  paid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view stores" ON public.stores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage stores" ON public.stores
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_stores_updated BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- store_id + avg_cost on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS avg_cost numeric NOT NULL DEFAULT 0;

-- store_id + cashflow on orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashflow_mode public.cashflow_mode NOT NULL DEFAULT 'per_store';

-- Product variants
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  price_delta numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view variants" ON public.product_variants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);

CREATE TRIGGER trg_variants_updated BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();