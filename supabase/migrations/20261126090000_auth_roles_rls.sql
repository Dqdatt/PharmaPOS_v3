-- Auth bước 1: 3 vai trò cố định + nối Supabase Auth + RLS đơn giản (docs/AUTH_PLAN.md).
-- admin = quản lý hệ thống (chỉ app) · manager = quản lý nhà thuốc (role 'admin' cũ) · staff = nhân viên.

-- 1. Vai trò + cột tài khoản
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE public.users SET role = 'manager' WHERE role = 'admin';
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'staff'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email text UNIQUE,
  ADD COLUMN IF NOT EXISTS phone text UNIQUE,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'invited';
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_status_check CHECK (status IN ('invited', 'active', 'locked'));
-- email chữ thường; phone 84 + 9 số (không dấu +)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_check;
ALTER TABLE public.users ADD CONSTRAINT users_email_check CHECK (email IS NULL OR email = lower(email));
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_check;
ALTER TABLE public.users ADD CONSTRAINT users_phone_check CHECK (phone IS NULL OR phone ~ '^84[0-9]{9}$');
-- đăng nhập chỉ bằng email (mã OTP qua mail, miễn phí); SĐT chỉ để liên hệ.
-- NOT VALID để không chặn dòng PIN cũ chưa có email
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_contact_check;
ALTER TABLE public.users ADD CONSTRAINT users_contact_check CHECK (email IS NOT NULL) NOT VALID;

-- 2. Hàm đọc tài khoản đang đăng nhập (chỉ tài khoản active mới có quyền dữ liệu)
CREATE OR REPLACE FUNCTION public.my_user_id() RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() AND status = 'active'
$$;

CREATE OR REPLACE FUNCTION public.my_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid() AND status = 'active'
$$;

-- Hồ sơ của chính mình, kể cả khi còn 'invited' (app cần biết để bắt đặt mật khẩu)
CREATE OR REPLACE FUNCTION public.my_profile()
RETURNS TABLE (id bigint, name text, role text, status text, email text, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT u.id, u.name, u.role, u.status, u.email, u.phone FROM public.users u WHERE u.auth_id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.my_user_id(), public.my_role(), public.my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_user_id(), public.my_role(), public.my_profile() TO authenticated;

-- 3. Bỏ mọi policy "Allow public all" (anon hết quyền)
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies
           WHERE schemaname = 'public' AND policyname LIKE 'Allow public all on %'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- 4. Quyền bảng: Postgres mới không tự cấp cho role API → cấp rõ; anon không có gì. RLS lọc dòng.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Bảng nghiệp vụ chung: mọi tài khoản active
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['products', 'suppliers', 'purchases', 'purchase_items', 'inventory_history',
                           'export_orders', 'export_order_items', 'payment_orders', 'payment_transactions']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS "active all" ON public.%I', t);
    EXECUTE format('CREATE POLICY "active all" ON public.%I FOR ALL TO authenticated
                    USING (public.my_role() IS NOT NULL) WITH CHECK (public.my_role() IS NOT NULL)', t);
  END LOOP;
END $$;

-- 5. Hoá đơn: NV chỉ của mình, QL/admin toàn bộ
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices, public.invoice_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.staff_logs TO authenticated;

DROP POLICY IF EXISTS "own or manager" ON public.invoices;
CREATE POLICY "own or manager" ON public.invoices FOR ALL TO authenticated
  USING (public.my_role() IN ('admin', 'manager') OR employee_id = public.my_user_id())
  WITH CHECK (public.my_role() IN ('admin', 'manager') OR employee_id = public.my_user_id());

-- dòng hàng theo quyền của hoá đơn (subquery cũng chịu RLS invoices)
DROP POLICY IF EXISTS "via invoice" ON public.invoice_items;
CREATE POLICY "via invoice" ON public.invoice_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id));

-- 6. Nhật ký ca: ghi của mình, QL/admin xem hết
DROP POLICY IF EXISTS "own or manager read" ON public.staff_logs;
CREATE POLICY "own or manager read" ON public.staff_logs FOR SELECT TO authenticated
  USING (public.my_role() IN ('admin', 'manager') OR user_id = public.my_user_id());
DROP POLICY IF EXISTS "own write" ON public.staff_logs;
CREATE POLICY "own write" ON public.staff_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = public.my_user_id());
DROP POLICY IF EXISTS "own update" ON public.staff_logs;
CREATE POLICY "own update" ON public.staff_logs FOR UPDATE TO authenticated
  USING (user_id = public.my_user_id()) WITH CHECK (user_id = public.my_user_id());

-- 7. users: chỉ đọc (QL/admin thấy hết, NV thấy mình); ghi chỉ qua Edge Function (service role).
-- Không cấp cột pin/auth_id cho client.
DROP POLICY IF EXISTS "self or manager read" ON public.users;
CREATE POLICY "self or manager read" ON public.users FOR SELECT TO authenticated
  USING (public.my_role() IN ('admin', 'manager') OR id = public.my_user_id());
REVOKE ALL ON public.users FROM anon, authenticated;
GRANT SELECT (id, name, role, email, phone, status, created_at) ON public.users TO authenticated;
