-- Fix public.is_staff to include 'super_admin' role
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
      AND role IN ('owner','admin','super_admin')
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
