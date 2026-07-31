
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS marketing_notes text,
  ADD COLUMN IF NOT EXISTS last_order_at timestamptz;

CREATE OR REPLACE FUNCTION public.recompute_customer_tier(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric;
  v_tier text;
  v_last timestamptz;
BEGIN
  SELECT COALESCE(SUM(total), 0), MAX(paid_at)
  INTO v_total, v_last
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
      last_order_at = v_last,
      updated_at = now()
  WHERE id = _user_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.recompute_customer_tier(uuid) FROM PUBLIC, anon, authenticated;
