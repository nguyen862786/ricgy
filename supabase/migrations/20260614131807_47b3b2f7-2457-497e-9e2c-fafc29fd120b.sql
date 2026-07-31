ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS is_qiclub_synced boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qiclub_prefix text,
  ADD COLUMN IF NOT EXISTS qiclub_subsidy_ratio integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS company_subsidy_ratio integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS store_subsidy_ratio integer NOT NULL DEFAULT 0;

CREATE TABLE public.qiclub_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL,
  promotion_name text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'verified',
  voucher_amount numeric(14,2) NOT NULL DEFAULT 0,
  qiclub_amount numeric(14,2) NOT NULL DEFAULT 0,
  company_amount numeric(14,2) NOT NULL DEFAULT 0,
  store_amount numeric(14,2) NOT NULL DEFAULT 0,
  qiclub_ref text,
  verified_at timestamp with time zone,
  claimed_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX qiclub_redemptions_code_key ON public.qiclub_redemptions (lower(code));
CREATE INDEX idx_qiclub_redemptions_store ON public.qiclub_redemptions (store_id);
CREATE INDEX idx_qiclub_redemptions_promo ON public.qiclub_redemptions (promotion_id);
CREATE INDEX idx_qiclub_redemptions_status ON public.qiclub_redemptions (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qiclub_redemptions TO authenticated;
GRANT ALL ON public.qiclub_redemptions TO service_role;

ALTER TABLE public.qiclub_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qiclub_redemptions staff manage"
  ON public.qiclub_redemptions
  FOR ALL
  TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER qiclub_redemptions_touch_updated_at
  BEFORE UPDATE ON public.qiclub_redemptions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();