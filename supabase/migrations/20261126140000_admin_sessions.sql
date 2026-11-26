-- M5: admin quản lý tài khoản trong app + phiên POS (xem / thu hồi).

-- 1. Quyền dữ liệu chỉ còn khi phiên đăng nhập còn sống: thu hồi phiên / khoá tài khoản có hiệu lực NGAY,
--    không đợi access token (1 giờ) hết hạn.
CREATE OR REPLACE FUNCTION public.my_user_id() RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT u.id FROM public.users u
  WHERE u.auth_id = auth.uid() AND u.status = 'active'
    AND EXISTS (SELECT 1 FROM auth.sessions s WHERE s.id = (auth.jwt() ->> 'session_id')::uuid)
$$;

CREATE OR REPLACE FUNCTION public.my_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT u.role FROM public.users u
  WHERE u.auth_id = auth.uid() AND u.status = 'active'
    AND EXISTS (SELECT 1 FROM auth.sessions s WHERE s.id = (auth.jwt() ->> 'session_id')::uuid)
$$;

-- 2. Phiên POS: web-login ghi session_id khi cấp phiên; phiên mất (đăng xuất / thu hồi / hết hạn) → NULL
ALTER TABLE public.web_login_requests
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES auth.sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS web_login_requests_session_idx ON public.web_login_requests (session_id);

-- Phiên POS đang mở: của mình; admin thấy của mọi người
CREATE OR REPLACE FUNCTION public.web_sessions()
RETURNS TABLE (id uuid, user_id bigint, user_name text, user_agent text, ip text, login_at timestamptz, last_seen timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT r.id, u.id, u.name, r.user_agent, r.ip, r.decided_at,
         greatest(s.updated_at, s.refreshed_at AT TIME ZONE 'UTC')
  FROM public.web_login_requests r
  JOIN auth.sessions s ON s.id = r.session_id
  JOIN public.users u ON u.id = r.user_id
  WHERE (s.not_after IS NULL OR s.not_after > now())
    AND (public.my_role() = 'admin' OR r.user_id = public.my_user_id())
  ORDER BY r.decided_at DESC
$$;

-- Thu hồi 1 phiên POS (chủ phiên hoặc admin). true = đã thu hồi.
CREATE OR REPLACE FUNCTION public.web_session_revoke(req_id uuid)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE sid uuid;
BEGIN
  SELECT r.session_id INTO sid FROM public.web_login_requests r
  WHERE r.id = req_id AND r.session_id IS NOT NULL
    AND (public.my_role() = 'admin' OR r.user_id = public.my_user_id());
  IF sid IS NULL THEN RETURN false; END IF;
  DELETE FROM auth.sessions WHERE id = sid; -- refresh token xoá theo; my_role() chặn ngay access token
  RETURN true;
END $$;

-- 3. Admin đổi vai trò / khoá / mở khoá QL, NV. Trả: 'ok' | 'not_allowed' | 'self' | 'not_found' | 'bad_role' | 'no_email'
CREATE OR REPLACE FUNCTION public.admin_set_user(target bigint, new_role text DEFAULT NULL, lock boolean DEFAULT NULL)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE u public.users;
BEGIN
  IF public.my_role() IS DISTINCT FROM 'admin' THEN RETURN 'not_allowed'; END IF;
  IF target = public.my_user_id() THEN RETURN 'self'; END IF; -- không tự khoá / tự hạ quyền
  SELECT * INTO u FROM public.users WHERE id = target FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF u.role = 'admin' THEN RETURN 'not_allowed'; END IF;
  IF u.email IS NULL THEN RETURN 'no_email'; END IF; -- tài khoản cũ: gắn email trước (users_contact_check)
  IF new_role IS NOT NULL AND new_role NOT IN ('manager', 'staff') THEN RETURN 'bad_role'; END IF;

  IF new_role IS NOT NULL THEN UPDATE public.users SET role = new_role WHERE id = target; END IF;

  IF lock IS TRUE AND u.status <> 'locked' THEN
    UPDATE public.users SET status = 'locked' WHERE id = target;
    IF u.auth_id IS NOT NULL THEN DELETE FROM auth.sessions WHERE user_id = u.auth_id; END IF; -- đăng xuất mọi máy
    DELETE FROM public.push_subscriptions WHERE user_id = target;
    DELETE FROM public.passkeys WHERE user_id = target;
  ELSIF lock IS FALSE AND u.status = 'locked' THEN
    -- chưa từng đăng nhập → vẫn phải tạo mật khẩu lần đầu
    UPDATE public.users SET status = CASE WHEN EXISTS
      (SELECT 1 FROM auth.users a WHERE a.id = u.auth_id AND a.last_sign_in_at IS NOT NULL) THEN 'active' ELSE 'invited' END
    WHERE id = target;
  END IF;
  RETURN 'ok';
END $$;

REVOKE EXECUTE ON FUNCTION public.web_sessions(), public.web_session_revoke(uuid), public.admin_set_user(bigint, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.web_sessions(), public.web_session_revoke(uuid), public.admin_set_user(bigint, text, boolean) TO authenticated;
