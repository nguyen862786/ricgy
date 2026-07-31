-- ============================================================================
-- MODULE: VEGAN SUPPLY CHAIN & POS (Chuỗi cung ứng & Bán hàng Thực phẩm Chay)
-- Mô hình: Xưởng sản xuất -> Kho vệ tinh (Chùa) -> Người tiêu dùng
-- ============================================================================

-- 1) DANH MỤC SẢN PHẨM & SKU --------------------------------------------------
CREATE TABLE public.vegan_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
  sku text NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'cha_chay' CHECK (category IN ('cha_chay','nhu_yeu_pham')),
  storage_condition text NOT NULL DEFAULT 'frozen' CHECK (storage_condition IN ('frozen','dry')),
  unit text NOT NULL DEFAULT 'cái',
  price numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vegan_products TO authenticated;
GRANT ALL ON public.vegan_products TO service_role;
ALTER TABLE public.vegan_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant staff manage vegan_products" ON public.vegan_products
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_staff())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_staff());

-- 2) LÔ SẢN XUẤT (NSX / HSD / BATCH) ------------------------------------------
CREATE TABLE public.vegan_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
  product_id uuid NOT NULL REFERENCES public.vegan_products(id) ON DELETE CASCADE,
  batch_number text NOT NULL,
  mfg_date date NOT NULL DEFAULT now(),
  exp_date date NOT NULL,
  quantity_produced integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vegan_batches TO authenticated;
GRANT ALL ON public.vegan_batches TO service_role;
ALTER TABLE public.vegan_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant staff manage vegan_batches" ON public.vegan_batches
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_staff())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_staff());

-- 3) KHO VỆ TINH / ĐIỂM BÁN (CHÙA) --------------------------------------------
CREATE TABLE public.vegan_temples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
  name text NOT NULL,
  region text,
  address text,
  contact_name text,
  contact_phone text,
  status text NOT NULL DEFAULT 'negotiating' CHECK (status IN ('signed','negotiating')),
  commission_rate numeric NOT NULL DEFAULT 10,
  charity_mode text NOT NULL DEFAULT 'percent' CHECK (charity_mode IN ('percent','fixed')),
  charity_percent numeric NOT NULL DEFAULT 5,
  charity_fixed numeric NOT NULL DEFAULT 0,
  lat numeric,
  lng numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vegan_temples TO authenticated;
GRANT ALL ON public.vegan_temples TO service_role;
ALTER TABLE public.vegan_temples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant staff manage vegan_temples" ON public.vegan_temples
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_staff())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_staff());

-- 4) TỒN KHO THEO CHÙA --------------------------------------------------------
CREATE TABLE public.vegan_temple_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
  temple_id uuid NOT NULL REFERENCES public.vegan_temples(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.vegan_products(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.vegan_batches(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vegan_temple_stock TO authenticated;
GRANT ALL ON public.vegan_temple_stock TO service_role;
ALTER TABLE public.vegan_temple_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant staff manage vegan_temple_stock" ON public.vegan_temple_stock
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_staff())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_staff());

-- 5) PHIẾU XUẤT SỈ: XƯỞNG -> CHÙA --------------------------------------------
CREATE TABLE public.vegan_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
  temple_id uuid NOT NULL REFERENCES public.vegan_temples(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT ('SHIP-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','shipped','received')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vegan_shipments TO authenticated;
GRANT ALL ON public.vegan_shipments TO service_role;
ALTER TABLE public.vegan_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant staff manage vegan_shipments" ON public.vegan_shipments
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_staff())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_staff());

CREATE TABLE public.vegan_shipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.vegan_shipments(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.vegan_products(id),
  batch_id uuid REFERENCES public.vegan_batches(id),
  quantity integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vegan_shipment_items TO authenticated;
GRANT ALL ON public.vegan_shipment_items TO service_role;
ALTER TABLE public.vegan_shipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant staff manage vegan_shipment_items" ON public.vegan_shipment_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vegan_shipments s WHERE s.id = shipment_id
                 AND s.tenant_id = public.current_tenant_id() AND public.is_tenant_staff()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vegan_shipments s WHERE s.id = shipment_id
                 AND s.tenant_id = public.current_tenant_id() AND public.is_tenant_staff()));

-- 6) ĐƠN BÁN LẺ B2B2C ---------------------------------------------------------
CREATE TABLE public.vegan_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
  temple_id uuid REFERENCES public.vegan_temples(id),
  code text NOT NULL DEFAULT ('VO-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  channel text NOT NULL DEFAULT 'pos' CHECK (channel IN ('pos','online')),
  customer_name text,
  customer_phone text,
  customer_address text,
  subtotal numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  charity_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','routed','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vegan_orders TO authenticated;
GRANT ALL ON public.vegan_orders TO service_role;
ALTER TABLE public.vegan_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant staff manage vegan_orders" ON public.vegan_orders
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_staff())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_staff());

CREATE TABLE public.vegan_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.vegan_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.vegan_products(id),
  name text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vegan_order_items TO authenticated;
GRANT ALL ON public.vegan_order_items TO service_role;
ALTER TABLE public.vegan_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant staff manage vegan_order_items" ON public.vegan_order_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vegan_orders o WHERE o.id = order_id
                 AND o.tenant_id = public.current_tenant_id() AND public.is_tenant_staff()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vegan_orders o WHERE o.id = order_id
                 AND o.tenant_id = public.current_tenant_id() AND public.is_tenant_staff()));

-- 7) QUỸ TỪ THIỆN "ĂN CHAY MIỄN PHÍ / THÁNG" ---------------------------------
CREATE TABLE public.vegan_charity_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
  temple_id uuid NOT NULL REFERENCES public.vegan_temples(id) ON DELETE CASCADE,
  period_month text NOT NULL,
  budget numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done')),
  executed_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (temple_id, period_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vegan_charity_programs TO authenticated;
GRANT ALL ON public.vegan_charity_programs TO service_role;
ALTER TABLE public.vegan_charity_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant staff manage vegan_charity_programs" ON public.vegan_charity_programs
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.is_tenant_staff())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_staff());

-- TRIGGERS: updated_at -------------------------------------------------------
CREATE TRIGGER trg_vegan_products_touch BEFORE UPDATE ON public.vegan_products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_vegan_temples_touch BEFORE UPDATE ON public.vegan_temples
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_vegan_temple_stock_touch BEFORE UPDATE ON public.vegan_temple_stock
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TRIGGER: nhận hàng -> tự động cộng kho cho Chùa ----------------------------
CREATE OR REPLACE FUNCTION public.vegan_receive_shipment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rec RECORD;
BEGIN
  IF NEW.status = 'received' AND (OLD.status IS DISTINCT FROM 'received') THEN
    FOR rec IN
      SELECT product_id, batch_id, quantity
      FROM public.vegan_shipment_items WHERE shipment_id = NEW.id
    LOOP
      UPDATE public.vegan_temple_stock
        SET quantity = quantity + rec.quantity, updated_at = now()
        WHERE temple_id = NEW.temple_id
          AND product_id = rec.product_id
          AND batch_id IS NOT DISTINCT FROM rec.batch_id;
      IF NOT FOUND THEN
        INSERT INTO public.vegan_temple_stock (tenant_id, temple_id, product_id, batch_id, quantity)
        VALUES (NEW.tenant_id, NEW.temple_id, rec.product_id, rec.batch_id, rec.quantity);
      END IF;
    END LOOP;
    NEW.received_at = now();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_vegan_receive_shipment BEFORE UPDATE ON public.vegan_shipments
  FOR EACH ROW EXECUTE FUNCTION public.vegan_receive_shipment();