-- Kiểm RLS (chạy sau npm run db:reset): npm run test:rls. Lỗi = RAISE EXCEPTION, psql thoát mã ≠ 0.
-- Chạy trong transaction rồi ROLLBACK, không đổi dữ liệu.
BEGIN;

-- Kích hoạt tạm NV 2 và QL 1 để thử (seed để 'invited')
UPDATE public.users SET status = 'active' WHERE id IN (1, 2);

CREATE FUNCTION pg_temp.as_user(uid bigint) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', (SELECT auth_id FROM public.users WHERE id = uid), 'role', 'authenticated')::text, true);
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

ROLLBACK;
\echo RLS OK
