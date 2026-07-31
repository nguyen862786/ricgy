-- 1. New columns on vegan_orders
ALTER TABLE public.vegan_orders
  ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- 2. Expand status lifecycle (keep legacy statuses for compatibility)
ALTER TABLE public.vegan_orders DROP CONSTRAINT IF EXISTS vegan_orders_status_check;
ALTER TABLE public.vegan_orders ADD CONSTRAINT vegan_orders_status_check
  CHECK (status = ANY (ARRAY[
    'placed','confirmed','preparing','delivering','delivered',
    'pending','routed','completed','cancelled'
  ]));

-- 3. Order event history table
CREATE TABLE IF NOT EXISTS public.vegan_order_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.vegan_orders(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL DEFAULT current_tenant_id(),
  status text NOT NULL,
  note text,
  actor_id uuid,
  actor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vegan_order_events_order_idx ON public.vegan_order_events (order_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vegan_order_events TO authenticated;
GRANT ALL ON public.vegan_order_events TO service_role;

ALTER TABLE public.vegan_order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant staff manage vegan_order_events"
  ON public.vegan_order_events
  TO authenticated
  USING (tenant_id = current_tenant_id() AND is_tenant_staff())
  WITH CHECK (tenant_id = current_tenant_id() AND is_tenant_staff());

-- 4. BEFORE UPDATE: stamp delivered_at when reaching delivered/completed
CREATE OR REPLACE FUNCTION public.vegan_stamp_delivered()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('delivered','completed')
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at := now();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_vegan_stamp_delivered ON public.vegan_orders;
CREATE TRIGGER trg_vegan_stamp_delivered
  BEFORE UPDATE ON public.vegan_orders
  FOR EACH ROW EXECUTE FUNCTION public.vegan_stamp_delivered();

-- 5. AFTER INSERT/UPDATE: log status events
CREATE OR REPLACE FUNCTION public.vegan_log_order_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_name text;
BEGIN
  SELECT full_name INTO v_name FROM public.profiles WHERE id = v_actor;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.vegan_order_events(order_id, tenant_id, status, note, actor_id, actor_name)
    VALUES (NEW.id, NEW.tenant_id, NEW.status, 'Khởi tạo đơn', v_actor, v_name);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.vegan_order_events(order_id, tenant_id, status, note, actor_id, actor_name)
    VALUES (NEW.id, NEW.tenant_id, NEW.status, NULL, v_actor, v_name);
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_vegan_log_order_event ON public.vegan_orders;
CREATE TRIGGER trg_vegan_log_order_event
  AFTER INSERT OR UPDATE ON public.vegan_orders
  FOR EACH ROW EXECUTE FUNCTION public.vegan_log_order_event();