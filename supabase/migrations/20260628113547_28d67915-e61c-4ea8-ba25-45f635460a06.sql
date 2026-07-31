ALTER TABLE public.survey_leads
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid()
  REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_survey_leads_created_by ON public.survey_leads(created_by);
CREATE INDEX IF NOT EXISTS idx_survey_leads_created_at ON public.survey_leads(created_at);