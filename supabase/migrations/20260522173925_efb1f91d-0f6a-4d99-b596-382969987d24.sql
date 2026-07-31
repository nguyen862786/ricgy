
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  landing_path text,
  user_agent text,
  referer text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliate_clicks_referrer ON public.affiliate_clicks(referrer_id, created_at DESC);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert click"
ON public.affiliate_clicks FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "own clicks or staff read"
ON public.affiliate_clicks FOR SELECT
TO authenticated
USING (referrer_id = auth.uid() OR is_staff(auth.uid()));

-- Update handle_new_user to read referrer_id from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_first BOOLEAN;
  v_ref uuid;
BEGIN
  BEGIN
    v_ref := NULLIF(NEW.raw_user_meta_data->>'referrer_id', '')::uuid;
  EXCEPTION WHEN others THEN
    v_ref := NULL;
  END;

  INSERT INTO public.profiles (id, email, full_name, referrer_id)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), v_ref);

  INSERT INTO public.wallets (user_id) VALUES (NEW.id);

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'owner') INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  END IF;

  RETURN NEW;
END; $function$;
