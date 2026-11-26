-- Bước A: Face ID thật = passkey WebAuthn. Chỉ Edge Function `passkey` (service role) đọc/ghi 2 bảng này.
CREATE TABLE IF NOT EXISTS public.passkeys (
  id text PRIMARY KEY,                       -- credential id (base64url)
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  public_key text NOT NULL,                  -- khoá công khai COSE (base64url)
  counter bigint NOT NULL DEFAULT 0,
  rp_id text NOT NULL,                       -- host đăng ký (tunnel khi test, dqdatt.github.io khi thật)
  transports text[],
  device text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
CREATE INDEX IF NOT EXISTS passkeys_user_idx ON public.passkeys (user_id);

-- Challenge dùng 1 lần (xoá khi xác minh), hết hạn 2 phút
CREATE TABLE IF NOT EXISTS public.passkey_challenges (
  challenge text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('register', 'login', 'approve')),
  user_id bigint REFERENCES public.users(id) ON DELETE CASCADE,
  req_id uuid REFERENCES public.web_login_requests(id) ON DELETE CASCADE,
  rp_id text NOT NULL,
  origin text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '2 minutes'
);

ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.passkeys, public.passkey_challenges FROM anon, authenticated;
GRANT ALL ON public.passkeys, public.passkey_challenges TO service_role;

-- Duyệt đăng nhập POS: chỉ Edge Function `passkey` gọi, SAU khi đã xác minh passkey của uid.
CREATE OR REPLACE FUNCTION public.web_login_approve(req_id uuid, uid bigint)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE r text; n int;
BEGIN
  SELECT role INTO r FROM public.users WHERE id = uid AND status = 'active';
  IF r IS NULL THEN RETURN 'not_allowed'; END IF;
  IF r = 'admin' THEN RETURN 'admin_blocked'; END IF; -- admin chỉ dùng app, không vào POS
  UPDATE public.web_login_requests SET status = 'approved', user_id = uid, decided_at = now()
   WHERE id = req_id AND status = 'pending' AND expires_at > now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN CASE WHEN n = 0 THEN 'expired' ELSE 'approved' END;
END $$;
REVOKE EXECUTE ON FUNCTION public.web_login_approve(uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.web_login_approve(uuid, bigint) TO service_role;

-- App chỉ còn TỪ CHỐI qua RPC; duyệt bắt buộc qua passkey (Face ID) ở Edge Function.
CREATE OR REPLACE FUNCTION public.web_login_decide(req_id uuid, approve boolean)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE n int;
BEGIN
  IF public.my_role() IS NULL THEN RETURN 'not_allowed'; END IF;
  IF approve THEN RETURN 'need_passkey'; END IF;
  UPDATE public.web_login_requests SET status = 'rejected', decided_at = now()
   WHERE id = req_id AND status = 'pending' AND expires_at > now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN CASE WHEN n = 0 THEN 'expired' ELSE 'rejected' END;
END $$;
