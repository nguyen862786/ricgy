-- Bundle/combo promotions
CREATE TABLE public.product_bundles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  industry text NOT NULL DEFAULT 'fnb',
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  bundle_price numeric NOT NULL DEFAULT 0,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bundle_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id uuid NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bundle_items_bundle ON public.bundle_items(bundle_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_bundles TO authenticated;
GRANT ALL ON public.product_bundles TO service_role;
GRANT SELECT ON public.product_bundles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle_items TO authenticated;
GRANT ALL ON public.bundle_items TO service_role;
GRANT SELECT ON public.bundle_items TO anon;

ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read active bundles; staff manage all
CREATE POLICY "Public can view bundles" ON public.product_bundles FOR SELECT USING (true);
CREATE POLICY "Staff manage bundles" ON public.product_bundles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Public can view bundle items" ON public.bundle_items FOR SELECT USING (true);
CREATE POLICY "Staff manage bundle items" ON public.bundle_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_product_bundles_updated_at BEFORE UPDATE ON public.product_bundles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();