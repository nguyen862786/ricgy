-- 1) Product media gallery
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) Promotions
DO $$ BEGIN
  CREATE TYPE public.promotion_type AS ENUM ('flash_sale','happy_hour','buy_x_get_y','tier_discount');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type public.promotion_type NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  daily_start_min integer,
  daily_end_min integer,
  weekdays integer[],
  discount_percent numeric NOT NULL DEFAULT 0,
  max_discount_amount numeric,
  product_ids uuid[],
  buy_qty integer,
  get_qty integer,
  tier_name text,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_select_authenticated" ON public.promotions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "promotions_staff_insert" ON public.promotions
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "promotions_staff_update" ON public.promotions
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "promotions_staff_delete" ON public.promotions
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER promotions_touch_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Storage policies for the private product-media bucket
DROP POLICY IF EXISTS "product_media_read_authenticated" ON storage.objects;
CREATE POLICY "product_media_read_authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'product-media');

DROP POLICY IF EXISTS "product_media_staff_insert" ON storage.objects;
CREATE POLICY "product_media_staff_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-media' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "product_media_staff_update" ON storage.objects;
CREATE POLICY "product_media_staff_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-media' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "product_media_staff_delete" ON storage.objects;
CREATE POLICY "product_media_staff_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-media' AND public.is_staff(auth.uid()));