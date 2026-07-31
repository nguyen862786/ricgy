ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS popup_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS popup_title text,
  ADD COLUMN IF NOT EXISTS popup_body text,
  ADD COLUMN IF NOT EXISTS popup_image_url text,
  ADD COLUMN IF NOT EXISTS popup_cta_text text,
  ADD COLUMN IF NOT EXISTS popup_cta_url text,
  ADD COLUMN IF NOT EXISTS popup_dismiss_hours integer NOT NULL DEFAULT 24;

CREATE POLICY "campaigns public popup read"
ON public.campaigns
FOR SELECT
TO anon, authenticated
USING (
  popup_enabled = true
  AND status = 'active'
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);