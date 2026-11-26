-- Kiểm RLS (chạy sau npm run db:reset): npm run test:rls. Lỗi = RAISE EXCEPTION, psql thoát mã ≠ 0.
-- Chạy trong transaction rồi ROLLBACK, không đổi dữ liệu.
BEGIN;

-- Kích hoạt tạm NV 2 và QL 1 để thử (seed để 'invited')
UPDATE public.users SET status = 'active' WHERE id IN (1, 2);

-- Giả lập đăng nhập: tạo 1 phiên thật trong auth.sessions (my_role() đòi phiên còn sống)
CREATE FUNCTION pg_temp.as_user(uid bigint) RETURNS void LANGUAGE plpgsql AS $$
DECLARE a uuid := (SELECT auth_id FROM public.users WHERE id = uid); sid uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.sessions (id, user_id, created_at, updated_at) VALUES (sid, a, now(), now());
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', a, 'role', 'authenticated', 'session_id', sid)::text, true);
  SET LOCAL ROLE authenticated;
END $$;

CREATE FUNCTION pg_temp.check(ok boolean, msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF NOT coalesce(ok, false) THEN RAISE EXCEPTION 'RLS FAIL: %', msg; END IF; END $$;

-- anon: không thấy gì
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM 1 FROM public.invoices LIMIT 1; RAISE EXCEPTION 'RLS FAIL: anon đọc được invoices';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

-- NV 2: chỉ hoá đơn của mình, không thấy users khác, không đọc pin
SELECT pg_temp.as_user(2);
SELECT pg_temp.check((SELECT count(*) > 0 FROM public.invoices), 'NV không thấy hoá đơn của mình');
SELECT pg_temp.check((SELECT bool_and(employee_id = 2) FROM public.invoices), 'NV thấy hoá đơn người khác');
SELECT pg_temp.check((SELECT bool_and(i.employee_id = 2) FROM public.invoice_items it JOIN public.invoices i ON i.id = it.invoice_id)
  AND (SELECT count(*) FROM public.invoice_items) = (SELECT count(*) FROM public.invoice_items it JOIN public.invoices i ON i.id = it.invoice_id),
  'NV thấy dòng hàng của hoá đơn người khác');
SELECT pg_temp.check((SELECT count(*) = 1 FROM public.users), 'NV thấy tài khoản khác');
SELECT pg_temp.check((SELECT count(*) > 0 FROM public.products), 'NV không thấy sản phẩm');
DO $$ BEGIN
  BEGIN PERFORM pin FROM public.users; RAISE EXCEPTION 'RLS FAIL: NV đọc được pin';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN UPDATE public.users SET role = 'admin' WHERE id = 2; RAISE EXCEPTION 'RLS FAIL: NV tự nâng quyền';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.invoices (id, time, employee_name, employee_id, method, total)
        VALUES ('HDFAKE', '00:00:00 01/01/2026', 'x', 1, 'cash', 0);
        RAISE EXCEPTION 'RLS FAIL: NV tạo hoá đơn đứng tên người khác';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

-- QL 1: thấy toàn bộ hoá đơn và tài khoản
SELECT pg_temp.as_user(1);
SELECT pg_temp.check((SELECT count(*) FROM public.invoices) = 40, 'QL không thấy đủ hoá đơn');
SELECT pg_temp.check((SELECT count(*) FROM public.users) = 4, 'QL không thấy đủ tài khoản');
RESET ROLE;

-- NV 3 còn 'invited': chưa có quyền dữ liệu, nhưng đọc được hồ sơ của mình
SELECT pg_temp.as_user(3);
SELECT pg_temp.check((SELECT count(*) FROM public.invoices) = 0, 'tài khoản invited đọc được hoá đơn');
SELECT pg_temp.check((SELECT status FROM public.my_profile()) = 'invited', 'my_profile không trả hồ sơ invited');
RESET ROLE;

-- Phiên bị thu hồi: access token còn hạn cũng mất quyền ngay
SELECT pg_temp.as_user(1);
RESET ROLE;
DELETE FROM auth.sessions WHERE id = (current_setting('request.jwt.claims')::json ->> 'session_id')::uuid;
SET LOCAL ROLE authenticated;
SELECT pg_temp.check((SELECT count(*) FROM public.invoices) = 0, 'phiên đã thu hồi vẫn đọc được hoá đơn');
SELECT pg_temp.check(public.my_role() IS NULL, 'phiên đã thu hồi vẫn có vai trò');
RESET ROLE;

-- Quản lý tài khoản: chỉ admin, không tự khoá, không đụng admin; khoá = đăng xuất mọi máy
SELECT pg_temp.as_user(1);
SELECT pg_temp.check(public.admin_set_user(2, NULL, true) = 'not_allowed', 'QL khoá được tài khoản');
RESET ROLE;
SELECT pg_temp.as_user(2); -- phiên của NV 2 (để thử khoá → xoá phiên)
RESET ROLE;
SELECT pg_temp.as_user(4);
SELECT pg_temp.check(public.admin_set_user(4, NULL, true) = 'self', 'admin tự khoá được mình');
SELECT pg_temp.check(public.admin_set_user(2, 'admin') = 'bad_role', 'admin cấp được vai trò admin');
SELECT pg_temp.check(public.admin_set_user(2, 'manager') = 'ok', 'admin không đổi được vai trò');
SELECT pg_temp.check(public.admin_set_user(2, NULL, true) = 'ok', 'admin không khoá được');
RESET ROLE;
SELECT pg_temp.check((SELECT role || status FROM public.users WHERE id = 2) = 'managerlocked', 'khoá / đổi vai trò không lưu');
SELECT pg_temp.check(NOT EXISTS (SELECT 1 FROM auth.sessions s JOIN public.users u ON u.auth_id = s.user_id WHERE u.id = 2),
  'khoá tài khoản không xoá phiên');
SELECT pg_temp.as_user(4);
SELECT pg_temp.check(public.admin_set_user(2, NULL, false) = 'ok', 'admin không mở khoá được');
RESET ROLE;
SELECT pg_temp.check((SELECT status FROM public.users WHERE id = 2) = 'invited', 'mở khoá tài khoản chưa đăng nhập lần nào phải về invited');

-- Phiên POS: chỉ chủ phiên hoặc admin thấy / thu hồi
INSERT INTO public.web_login_requests (id, secret_hash, status, user_id, decided_at, session_id)
  SELECT '00000000-0000-0000-0000-0000000000a1', 'x', 'used', 1, now(), s.id
  FROM auth.sessions s JOIN public.users u ON u.auth_id = s.user_id WHERE u.id = 1 LIMIT 1;
UPDATE public.users SET status = 'active' WHERE id = 3;
SELECT pg_temp.as_user(3);
SELECT pg_temp.check((SELECT count(*) FROM public.web_sessions()) = 0, 'NV thấy phiên POS người khác');
SELECT pg_temp.check(NOT public.web_session_revoke('00000000-0000-0000-0000-0000000000a1'), 'NV thu hồi được phiên người khác');
RESET ROLE;
SELECT pg_temp.as_user(4);
SELECT pg_temp.check((SELECT count(*) FROM public.web_sessions()) = 1, 'admin không thấy phiên POS');
SELECT pg_temp.check(public.web_session_revoke('00000000-0000-0000-0000-0000000000a1'), 'admin không thu hồi được phiên POS');
SELECT pg_temp.check((SELECT count(*) FROM public.web_sessions()) = 0, 'phiên POS đã thu hồi vẫn hiện');
RESET ROLE;
SELECT pg_temp.check((SELECT session_id FROM public.web_login_requests WHERE id = '00000000-0000-0000-0000-0000000000a1') IS NULL,
  'xoá phiên không gỡ session_id');

ROLLBACK;
\echo RLS OK
