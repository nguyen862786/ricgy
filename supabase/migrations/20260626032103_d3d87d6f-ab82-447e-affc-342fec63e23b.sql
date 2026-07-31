
-- ============================================================================
-- SUPER ADMIN CỐ ĐỊNH & VĨNH VIỄN
-- Idempotent: chạy lại an toàn sau mỗi lần build / re-sync / --force push.
-- ============================================================================

-- 1) Bảng cấu hình gốc chứa danh sách email super-admin được "khóa cứng".
CREATE TABLE IF NOT EXISTS public.system_super_admins (
  email text PRIMARY KEY,
  note  text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_super_admins TO authenticated;
GRANT ALL ON public.system_super_admins TO service_role;
ALTER TABLE public.system_super_admins ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='system_super_admins' AND policyname='Staff can read system super admins') THEN
    CREATE POLICY "Staff can read system super admins" ON public.system_super_admins
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

INSERT INTO public.system_super_admins (email, note)
VALUES ('nguyen862786@gmail.com', 'Owner tối cao - khóa cứng, không bao giờ bị hạ quyền')
ON CONFLICT (email) DO NOTHING;

-- 2) Tạo / cập nhật tài khoản auth thật với mật khẩu cố định.
DO $$
DECLARE
  v_email text := 'nguyen862786@gmail.com';
  v_pass  text := 'Ndquang7777#';
  v_uid   uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email;

  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, extensions.crypt(v_pass, extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Admin"}'::jsonb,
      false
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at
    ) VALUES (
      gen_random_uuid(), v_uid, v_uid::text,
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  ELSE
    -- Đảm bảo mật khẩu & trạng thái xác nhận luôn đúng cấu hình cố định.
    UPDATE auth.users
      SET encrypted_password = extensions.crypt(v_pass, extensions.gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = v_uid;
  END IF;

  -- Profile + wallet (idempotent).
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_uid, v_email, 'Super Admin')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id) VALUES (v_uid)
  ON CONFLICT DO NOTHING;

  -- Quyền super_admin vĩnh viễn; gỡ role 'customer' tự gán (nếu có).
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  DELETE FROM public.user_roles WHERE user_id = v_uid AND role = 'customer';
END $$;

-- 3) Tạo user mới: nếu email thuộc danh sách cố định -> luôn super_admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_first BOOLEAN;
  is_locked_admin BOOLEAN;
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

  SELECT EXISTS (SELECT 1 FROM public.system_super_admins WHERE email = NEW.email)
    INTO is_locked_admin;

  IF is_locked_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
  END IF;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'owner') INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  END IF;

  RETURN NEW;
END; $function$;

-- 4) Bảo vệ: KHÔNG cho xoá vai trò super_admin của tài khoản cố định.
CREATE OR REPLACE FUNCTION public.protect_locked_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
BEGIN
  IF OLD.role = 'super_admin' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = OLD.user_id;
    IF v_email IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.system_super_admins WHERE email = v_email
    ) THEN
      RAISE EXCEPTION 'Không thể xoá/hạ quyền Super Admin cố định (%).', v_email;
    END IF;
  END IF;
  RETURN OLD;
END; $function$;

DROP TRIGGER IF EXISTS trg_protect_locked_super_admin ON public.user_roles;
CREATE TRIGGER trg_protect_locked_super_admin
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.protect_locked_super_admin();
