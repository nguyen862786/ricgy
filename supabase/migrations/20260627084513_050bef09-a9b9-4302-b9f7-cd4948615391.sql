CREATE TABLE public.survey_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_model TEXT,
  ops_pains TEXT[] NOT NULL DEFAULT '{}',
  marketing_pains TEXT[] NOT NULL DEFAULT '{}',
  expectations TEXT[] NOT NULL DEFAULT '{}',
  barrier TEXT,
  unlocked_modules TEXT[] NOT NULL DEFAULT '{}',
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_company TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.survey_leads TO anon;
GRANT SELECT, INSERT ON public.survey_leads TO authenticated;
GRANT ALL ON public.survey_leads TO service_role;

ALTER TABLE public.survey_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a survey"
  ON public.survey_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can view survey leads"
  ON public.survey_leads FOR SELECT
  TO authenticated
  USING (public.is_tenant_staff());