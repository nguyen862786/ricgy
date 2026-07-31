-- =====================================================================
-- Hotel PMS: hotel_rooms, hotel_bookings, hotel_guest_services
-- RLS theo tenant_id, pattern khớp với rls_tenant_harden_qiclub_config.sql
-- =====================================================================

-- -----------------------------------------------------------------
-- hotel_rooms: kho phòng của khách sạn / farmstay
-- -----------------------------------------------------------------
CREATE TABLE public.hotel_rooms (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_number    text        NOT NULL,
  name           text        NOT NULL,
  type           text        NOT NULL DEFAULT 'standard', -- standard|deluxe|suite|villa|glamping
  floor          integer,
  capacity       integer     NOT NULL DEFAULT 2,
  base_price     numeric     NOT NULL DEFAULT 0,
  amenities      jsonb       NOT NULL DEFAULT '[]',
  images         jsonb       NOT NULL DEFAULT '[]',
  status         text        NOT NULL DEFAULT 'available', -- available|occupied|maintenance|cleaning
  iot_device_id  text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, room_number)
);

ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hrooms_select" ON public.hotel_rooms
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());

CREATE POLICY "hrooms_insert" ON public.hotel_rooms
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  );

CREATE POLICY "hrooms_update" ON public.hotel_rooms
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  );

CREATE POLICY "hrooms_delete" ON public.hotel_rooms
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id())
  );

-- -----------------------------------------------------------------
-- hotel_bookings: đặt phòng
-- -----------------------------------------------------------------
CREATE TABLE public.hotel_bookings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_id          uuid        NOT NULL REFERENCES public.hotel_rooms(id),
  booking_code     text        NOT NULL DEFAULT concat('OG-', upper(substring(gen_random_uuid()::text, 1, 8))),
  guest_name       text        NOT NULL,
  guest_phone      text,
  guest_email      text,
  guest_id_number  text,
  num_adults       integer     NOT NULL DEFAULT 1,
  num_children     integer     NOT NULL DEFAULT 0,
  check_in         date        NOT NULL,
  check_out        date        NOT NULL,
  check_in_actual  timestamptz,
  check_out_actual timestamptz,
  room_price       numeric     NOT NULL DEFAULT 0,
  extra_charges    numeric     NOT NULL DEFAULT 0,
  discount         numeric     NOT NULL DEFAULT 0,
  total_amount     numeric     NOT NULL DEFAULT 0,
  paid_amount      numeric     NOT NULL DEFAULT 0,
  payment_method   text,                          -- cash|card|transfer|ota
  source           text        NOT NULL DEFAULT 'direct', -- direct|booking_com|agoda|airbnb|expedia
  status           text        NOT NULL DEFAULT 'pending', -- pending|confirmed|checked_in|checked_out|cancelled|no_show
  special_requests text,
  note             text,
  created_by       uuid        REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_checkout_after_checkin CHECK (check_out > check_in)
);

ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hbooking_select" ON public.hotel_bookings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());

CREATE POLICY "hbooking_insert" ON public.hotel_bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  );

CREATE POLICY "hbooking_update" ON public.hotel_bookings
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  );

CREATE POLICY "hbooking_delete" ON public.hotel_bookings
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id())
  );

-- -----------------------------------------------------------------
-- hotel_guest_services: yêu cầu dịch vụ & lệnh IoT
-- -----------------------------------------------------------------
CREATE TABLE public.hotel_guest_services (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_id    uuid        REFERENCES public.hotel_bookings(id) ON DELETE SET NULL,
  room_id       uuid        REFERENCES public.hotel_rooms(id) ON DELETE SET NULL,
  category      text        NOT NULL DEFAULT 'housekeeping', -- housekeeping|room_service|laundry|spa|transport|iot|other
  title         text        NOT NULL,
  description   text,
  requested_at  timestamptz NOT NULL DEFAULT now(),
  scheduled_at  timestamptz,
  completed_at  timestamptz,
  status        text        NOT NULL DEFAULT 'pending',  -- pending|in_progress|completed|cancelled
  priority      text        NOT NULL DEFAULT 'normal',   -- low|normal|high|urgent
  staff_id      uuid        REFERENCES auth.users(id),
  staff_note    text,
  charge        numeric     NOT NULL DEFAULT 0,
  iot_device_id text,
  iot_command   jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hotel_guest_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hgserv_select" ON public.hotel_guest_services
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR tenant_id = public.current_tenant_id());

CREATE POLICY "hgserv_insert" ON public.hotel_guest_services
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  );

CREATE POLICY "hgserv_update" ON public.hotel_guest_services
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_tenant_staff() AND tenant_id = public.current_tenant_id())
  );

CREATE POLICY "hgserv_delete" ON public.hotel_guest_services
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.is_staff(auth.uid()) AND tenant_id = public.current_tenant_id())
  );

-- -----------------------------------------------------------------
-- Seed demo phòng cho Oasis Garden (tenant a2...)
-- -----------------------------------------------------------------
INSERT INTO public.hotel_rooms (tenant_id, room_number, name, type, floor, capacity, base_price, amenities, status)
VALUES
  ('a2000000-0000-0000-0000-000000000002', '01', 'Villa Đồi Thông',    'villa',     1, 4, 2500000, '["wifi","ac","bathtub","tv"]'::jsonb, 'available'),
  ('a2000000-0000-0000-0000-000000000002', '02', 'Suite Vườn Hữu Cơ', 'suite',     1, 2, 1800000, '["wifi","ac","tv"]'::jsonb,           'available'),
  ('a2000000-0000-0000-0000-000000000002', '03', 'Glamping Sao Đêm',  'glamping',  0, 2, 1200000, '["wifi","fan"]'::jsonb,               'available'),
  ('a2000000-0000-0000-0000-000000000002', '04', 'Deluxe Suối Trong', 'deluxe',    2, 3, 1500000, '["wifi","ac","tv"]'::jsonb,           'occupied'),
  ('a2000000-0000-0000-0000-000000000002', '05', 'Standard Tre Xanh', 'standard',  2, 2, 900000,  '["wifi","fan"]'::jsonb,               'available')
ON CONFLICT (tenant_id, room_number) DO NOTHING;
