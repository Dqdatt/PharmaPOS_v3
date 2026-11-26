-- Auth bước 2: tài khoản 'invited' thành 'active' khi người dùng tự đặt mật khẩu lần đầu
-- (sau khi xác minh mã OTP email, app gọi supabase.auth.updateUser({ password })).
-- Không dò được "đã có mật khẩu" qua encrypted_password: GoTrue gán hash ngẫu nhiên khi admin tạo tài khoản
-- không mật khẩu → bắt sự kiện ĐỔI mật khẩu bằng trigger. 'locked' không bị mở lại.
CREATE OR REPLACE FUNCTION public.on_auth_password_set() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users SET status = 'active' WHERE auth_id = NEW.id AND status = 'invited';
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.on_auth_password_set() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS medipos_password_set ON auth.users;
CREATE TRIGGER medipos_password_set
  AFTER UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW WHEN (OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password)
  EXECUTE FUNCTION public.on_auth_password_set();
