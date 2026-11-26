-- Auth bước 4: đăng nhập POS web bằng app (quét QR + Face ID). Một phương thức duy nhất.
-- Web tạo yêu cầu qua Edge Function `web-login` (giữ secret), app duyệt qua RPC, web đổi secret lấy phiên (1 lần).
CREATE TABLE IF NOT EXISTS public.web_login_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_hash text NOT NULL,                 -- sha256(secret) hex; secret chỉ web giữ
  user_agent text,
  ip text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'used')),
  user_id bigint REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '2 minutes',
  decided_at timestamptz
);
CREATE INDEX IF NOT EXISTS web_login_requests_created_idx ON public.web_login_requests (created_at);

-- Không client nào đọc/ghi thẳng bảng: chỉ Edge Function (service role) và RPC bên dưới.
ALTER TABLE public.web_login_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.web_login_requests FROM anon, authenticated;
GRANT ALL ON public.web_login_requests TO service_role;

-- App xem yêu cầu vừa quét (chỉ khi còn chờ và chưa hết hạn)
CREATE OR REPLACE FUNCTION public.web_login_info(req_id uuid)
RETURNS TABLE (user_agent text, ip text, created_at timestamptz, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT r.user_agent, r.ip, r.created_at, r.expires_at FROM public.web_login_requests r
  WHERE r.id = req_id AND r.status = 'pending' AND r.expires_at > now() AND public.my_role() IS NOT NULL
$$;

-- App duyệt / từ chối. Trả: 'approved' | 'rejected' | 'expired' | 'admin_blocked' | 'not_allowed'
CREATE OR REPLACE FUNCTION public.web_login_decide(req_id uuid, approve boolean)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE r text := public.my_role(); n int;
BEGIN
  IF r IS NULL THEN RETURN 'not_allowed'; END IF;
  IF approve AND r = 'admin' THEN RETURN 'admin_blocked'; END IF; -- admin chỉ dùng app, không vào POS
  UPDATE public.web_login_requests
     SET status = CASE WHEN approve THEN 'approved' ELSE 'rejected' END,
         user_id = CASE WHEN approve THEN public.my_user_id() END,
         decided_at = now()
   WHERE id = req_id AND status = 'pending' AND expires_at > now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN CASE WHEN n = 0 THEN 'expired' WHEN approve THEN 'approved' ELSE 'rejected' END;
END $$;

REVOKE EXECUTE ON FUNCTION public.web_login_info(uuid), public.web_login_decide(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.web_login_info(uuid), public.web_login_decide(uuid, boolean) TO authenticated;
