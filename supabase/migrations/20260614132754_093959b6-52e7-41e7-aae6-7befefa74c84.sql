-- Extend the role system with the 4-tier RBAC model
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'store_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cashier';

-- Allow scoping a role assignment to a single store (used by store managers & cashiers)
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_store ON public.user_roles (store_id);