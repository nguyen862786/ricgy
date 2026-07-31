
CREATE TABLE public.customer_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  min_spent numeric NOT NULL DEFAULT 0,
  discount_percent numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#64748b',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tiers read all authed" ON public.customer_tiers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tiers staff manage" ON public.customer_tiers
  FOR ALL TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER customer_tiers_touch
  BEFORE UPDATE ON public.customer_tiers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.customer_tiers (name, min_spent, discount_percent, color, sort_order) VALUES
  ('Standard', 0, 0, '#64748b', 1),
  ('Silver', 5000000, 3, '#94a3b8', 2),
  ('Gold', 20000000, 7, '#eab308', 3),
  ('Diamond', 50000000, 12, '#06b6d4', 4);

-- Function to recompute a customer's tier based on total_spent
CREATE OR REPLACE FUNCTION public.recompute_customer_tier(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric;
  v_tier text;
BEGIN
  SELECT COALESCE(SUM(total), 0) INTO v_total
  FROM public.orders
  WHERE customer_id = _user_id AND status = 'paid';

  SELECT name INTO v_tier
  FROM public.customer_tiers
  WHERE min_spent <= v_total
  ORDER BY min_spent DESC
  LIMIT 1;

  UPDATE public.profiles
  SET total_spent = v_total,
      tier = COALESCE(v_tier, 'standard'),
      updated_at = now()
  WHERE id = _user_id;
END; $$;

-- Trigger on orders to auto-recompute when paid status changes
CREATE OR REPLACE FUNCTION public.orders_recompute_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    IF (TG_OP = 'INSERT' AND NEW.status = 'paid')
       OR (TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.total IS DISTINCT FROM OLD.total)) THEN
      PERFORM public.recompute_customer_tier(NEW.customer_id);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER orders_tier_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_recompute_tier();
