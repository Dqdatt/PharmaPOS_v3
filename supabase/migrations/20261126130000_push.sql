-- Bước B: thông báo đẩy (Web Push VAPID), docs/AUTH_PLAN.md. Gửi ở Edge Function `push` (service role).
-- Client chỉ đi qua RPC bên dưới + đọc notifications của chính mình.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1. Máy nhận thông báo (endpoint của dịch vụ push trình duyệt; mỗi endpoint thuộc 1 tài khoản)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  endpoint text PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions (user_id);

-- 2. Bật/tắt từng loại theo người (đăng nhập POS luôn báo). Chưa có dòng = mặc định.
CREATE TABLE IF NOT EXISTS public.notif_prefs (
  user_id bigint PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  revenue boolean NOT NULL DEFAULT true,
  debt boolean NOT NULL DEFAULT true,
  low_stock boolean NOT NULL DEFAULT true,
  expiring boolean NOT NULL DEFAULT true,
  expiry_days int NOT NULL DEFAULT 30 CHECK (expiry_days IN (15, 30, 60, 90)),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Thông báo đã gửi: màn Thông báo đọc từ đây; (user_id, kind, ref) chống gửi trùng khi cron chạy lại
CREATE TABLE IF NOT EXISTS public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('web', 'revenue', 'debt', 'stock', 'expiry')),
  title text NOT NULL,
  body text,
  ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  UNIQUE (user_id, kind, ref)
);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

-- 4. Mỗi lần cron chạy tạo 1 mã dùng 1 lần; function `push` chiếm mã rồi mới gửi (không cần secret chung)
CREATE TABLE IF NOT EXISTS public.push_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job text NOT NULL CHECK (job IN ('daily', 'weekly')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notif_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_subscriptions, public.notif_prefs, public.notifications, public.push_jobs FROM anon, authenticated;
GRANT ALL ON public.push_subscriptions, public.notif_prefs, public.notifications, public.push_jobs TO service_role;

GRANT SELECT ON public.notifications TO authenticated;
DROP POLICY IF EXISTS notifications_own ON public.notifications;
CREATE POLICY notifications_own ON public.notifications FOR SELECT TO authenticated USING (user_id = public.my_user_id());

-- Đăng ký máy này cho tài khoản đang đăng nhập. sub = PushSubscription.toJSON().
-- Chỉ nhận endpoint của dịch vụ push thật (function sẽ POST tới đây: chặn SSRF vào mạng nội bộ).
CREATE OR REPLACE FUNCTION public.push_subscribe(sub jsonb, ua text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  uid bigint := public.my_user_id();
  ep text := sub->>'endpoint';
  k1 text := sub->'keys'->>'p256dh';
  k2 text := sub->'keys'->>'auth';
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF ep IS NULL OR length(ep) > 1000 OR ep !~ '^https://(fcm\.googleapis\.com|web\.push\.apple\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.notify\.windows\.com)/'
     OR k1 IS NULL OR k1 !~ '^[A-Za-z0-9_-]{86,88}={0,2}$' OR k2 IS NULL OR k2 !~ '^[A-Za-z0-9_-]{22,24}={0,2}$' THEN
    RETURN false;
  END IF;
  INSERT INTO public.push_subscriptions (endpoint, user_id, p256dh, auth, user_agent)
  VALUES (ep, uid, k1, k2, left(ua, 300))
  ON CONFLICT (endpoint) DO UPDATE SET user_id = uid, p256dh = k1, auth = k2, user_agent = left(ua, 300), created_at = now();
  -- Tối đa 10 máy / tài khoản: bỏ máy cũ nhất
  DELETE FROM public.push_subscriptions WHERE user_id = uid AND endpoint NOT IN (
    SELECT s.endpoint FROM public.push_subscriptions s WHERE s.user_id = uid ORDER BY s.created_at DESC LIMIT 10);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.push_unsubscribe(endpoint text)
RETURNS void LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
  DELETE FROM public.push_subscriptions s WHERE s.endpoint = push_unsubscribe.endpoint AND s.user_id = public.my_user_id()
$$;

-- Đọc ('{}') hoặc đổi cài đặt thông báo của chính mình, trả dòng đầy đủ (mặc định nếu chưa có)
CREATE OR REPLACE FUNCTION public.my_notif_prefs(changes jsonb DEFAULT '{}'::jsonb)
RETURNS public.notif_prefs LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE uid bigint := public.my_user_id(); r public.notif_prefs;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_allowed' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.notif_prefs (user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;
  IF changes = '{}'::jsonb THEN
    SELECT * INTO r FROM public.notif_prefs WHERE user_id = uid;
    RETURN r;
  END IF;
  UPDATE public.notif_prefs SET
    revenue = COALESCE((changes->>'revenue')::boolean, revenue),
    debt = COALESCE((changes->>'debt')::boolean, debt),
    low_stock = COALESCE((changes->>'low_stock')::boolean, low_stock),
    expiring = COALESCE((changes->>'expiring')::boolean, expiring),
    expiry_days = COALESCE((changes->>'expiry_days')::int, expiry_days),
    updated_at = now()
  WHERE user_id = uid RETURNING * INTO r;
  RETURN r;
END $$;

-- Đánh dấu đã đọc (ids NULL = tất cả)
CREATE OR REPLACE FUNCTION public.notifications_read(ids bigint[] DEFAULT NULL)
RETURNS void LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.notifications SET read_at = now()
  WHERE user_id = public.my_user_id() AND read_at IS NULL AND (ids IS NULL OR id = ANY (ids))
$$;

REVOKE EXECUTE ON FUNCTION public.push_subscribe(jsonb, text), public.push_unsubscribe(text),
  public.my_notif_prefs(jsonb), public.notifications_read(bigint[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.push_subscribe(jsonb, text), public.push_unsubscribe(text),
  public.my_notif_prefs(jsonb), public.notifications_read(bigint[]) TO authenticated;

-- 5. Cron gọi function `push`. URL lấy từ Vault 'functions_url' (local: seed.sql; thật: đặt ở bước F).
CREATE OR REPLACE FUNCTION public.push_cron(job text)
RETURNS bigint LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE base text; run uuid;
BEGIN
  SELECT decrypted_secret INTO base FROM vault.decrypted_secrets WHERE name = 'functions_url';
  IF base IS NULL THEN RAISE WARNING 'push_cron: chưa có Vault secret functions_url'; RETURN NULL; END IF;
  DELETE FROM public.push_jobs WHERE created_at < now() - interval '1 day';
  INSERT INTO public.push_jobs (job) VALUES (job) RETURNING id INTO run;
  RETURN net.http_post(url := base || '/push', body := jsonb_build_object('action', 'cron', 'run', run),
    headers := '{"Content-Type": "application/json"}'::jsonb, timeout_milliseconds := 60000);
END $$;
REVOKE EXECUTE ON FUNCTION public.push_cron(text) FROM PUBLIC, anon, authenticated;

-- Giờ cron là UTC: 14:00 UTC = 21:00 VN (doanh thu); 01:00 UTC thứ Hai = 8:00 VN (công nợ NCC)
DO $$ BEGIN
  PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('medipos-push-daily', 'medipos-push-weekly');
  PERFORM cron.schedule('medipos-push-daily', '0 14 * * *', 'SELECT public.push_cron(''daily'')');
  PERFORM cron.schedule('medipos-push-weekly', '0 1 * * 1', 'SELECT public.push_cron(''weekly'')');
END $$;
