-- Enums
CREATE TYPE public.einvoice_status AS ENUM ('pending','issued','cancelled');
CREATE TYPE public.einvoice_provider AS ENUM ('misa','viettel');
CREATE TYPE public.shift_status AS ENUM ('open','closed');
CREATE TYPE public.inv_doc_type AS ENUM ('purchase','transfer','writeoff');
CREATE TYPE public.inv_doc_status AS ENUM ('draft','posted');

-- E-Invoices
CREATE TABLE public.einvoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  provider public.einvoice_provider NOT NULL DEFAULT 'misa',
  status public.einvoice_status NOT NULL DEFAULT 'pending',
  invoice_no text,
  is_batch boolean NOT NULL DEFAULT false,
  amount numeric NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  issued_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.einvoices TO authenticated;
GRANT ALL ON public.einvoices TO service_role;
ALTER TABLE public.einvoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage einvoices" ON public.einvoices FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Shifts
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  staff_id uuid NOT NULL,
  staff_email text,
  opening_cash numeric NOT NULL DEFAULT 0,
  system_total numeric NOT NULL DEFAULT 0,
  counted_cash numeric,
  diff numeric,
  reason text,
  note text,
  status public.shift_status NOT NULL DEFAULT 'open',
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage shifts" ON public.shifts FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Inventory documents
CREATE TABLE public.inventory_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  type public.inv_doc_type NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  to_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  status public.inv_doc_status NOT NULL DEFAULT 'draft',
  note text,
  total_value numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  posted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_docs TO authenticated;
GRANT ALL ON public.inventory_docs TO service_role;
ALTER TABLE public.inventory_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage inventory_docs" ON public.inventory_docs FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Inventory items
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id uuid NOT NULL REFERENCES public.inventory_docs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name text,
  qty numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage inventory_items" ON public.inventory_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));