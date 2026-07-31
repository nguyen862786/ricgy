
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'ended');

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  segment text NOT NULL DEFAULT 'all',
  tier_filter text,
  tag_filter text,
  promo_code text,
  starts_at timestamptz,
  ends_at timestamptz,
  status campaign_status NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns read authed" ON public.campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "campaigns staff manage" ON public.campaigns
  FOR ALL TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER campaigns_touch
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
