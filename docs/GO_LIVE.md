# Lên DB thật (M9) — làm 1 lần, ngoài giờ bán

DB thật: project `fbppvryvfdeohocsgwtl`. Đã diễn tập trên bản sao (26/11/2026): 12 migration chạy sạch, dữ liệu 12 bảng giống từng byte.
Từ lúc chạy migration (bước 6), **POS cũ (PIN) ngừng chạy** cho tới khi Netlify deploy xong (bước 8) → làm liền một mạch.
**[Bạn]** = bạn tự làm (mật khẩu, khoá bí mật, email). **[Claude]** = Claude làm, hỏi bạn trước từng lệnh.

## Chuẩn bị (không ảnh hưởng POS cũ)
1. **[Bạn]** Có sẵn: email cho **#1 Quốc Đạt (admin)** và **#2 Đoàn Quốc Đường (Quản lý)**; mật khẩu ứng dụng Gmail của hộp thư gửi mã (Google Account → Bảo mật → Mật khẩu ứng dụng).
2. **[Bạn]** Site Netlify `medipos-app` đã tạo (nhánh `main`, build `npm run build:pwa`, publish `pwa/dist`; build lỗi cho tới khi gộp main là bình thường).
3. **[Claude]** Sao lưu: `supabase db dump --linked -f <ngoài repo>/schema.sql` + `--data-only` (giữ ngoài git). Kiểm số dòng.
4. **[Claude]** Tạo khoá VAPID mới cho thông báo đẩy (không dùng khoá local) + Edge Functions + secrets:
   - `supabase functions deploy admin-create-user passkey push web-login dashboard` (web-login, passkey, push: `verify_jwt=false` theo `config.toml`).
   - `supabase secrets set VAPID_SUBJECT=https://medipos-app.netlify.app/ VAPID_PUBLIC_KEY=… VAPID_PRIVATE_KEY=… PASSKEY_ORIGINS=https://medipos-app.netlify.app`
   - Kiểm function có `SUPABASE_ANON_KEY` (legacy anon JWT; `_shared/session.ts`, `dashboard` cần). Nếu project đã tắt legacy key → báo bạn.
   - SQL: `select vault.create_secret('https://fbppvryvfdeohocsgwtl.supabase.co/functions/v1', 'functions_url');` (cron thông báo).
5. **[Bạn]** Dashboard → Authentication (Claude đọc từng mục cùng bạn):
   - Sign In / Providers: tắt "Allow new users to sign up"; Email: bật ("Confirm email" để nguyên — tài khoản do admin tạo đã xác nhận sẵn); Email OTP length 6, expiry 600 giây.
   - Emails → SMTP: bật custom SMTP: host `smtp.gmail.com`, port 465, user = địa chỉ Gmail, pass = mật khẩu ứng dụng, sender name `MediPOS`. Rate limit email: 30/giờ.
   - Emails → Templates → Magic Link: tiêu đề `Mã đăng nhập MediPOS`, nội dung = file `supabase/templates/otp.html`.
   - URL Configuration: Site URL `https://medipos-app.netlify.app/`.

## Lên thật (POS cũ ngừng từ bước 6 tới hết bước 8)
6. **[Claude]** `supabase db push` (12 migration). Kiểm lại số dòng = bước 3.
7. **[Bạn]** Nối tài khoản cũ (Terminal của bạn, dán khoá service role từ Dashboard → Settings → API Keys):
   ```bash
   SUPABASE_URL=https://fbppvryvfdeohocsgwtl.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/link-account.mjs 1 <email Đạt> admin
   SUPABASE_URL=https://fbppvryvfdeohocsgwtl.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/link-account.mjs 2 <email ĐQĐ> manager
   ```
8. **[Claude]** Ghi lại SHA của `main` trước khi gộp; gộp `prototype-mobile` → `main` (fast-forward), push → Netlify tự deploy cùng lúc POS `pharmapos-v3` (biến `VITE_SUPABASE_*` giữ nguyên) và app `medipos-app`.
9. **[Claude]** Kiểm 2 deploy trên Netlify đã Published; mở `https://medipos-app.netlify.app/` thấy màn đăng nhập app; POS mở được màn QR.

## Kiểm sau khi lên (M10)
10. **[Bạn + Claude]** iPhone mở https://medipos-app.netlify.app/ → Thêm vào MH chính → ĐQĐ nhập email → mã 6 số (Gmail) → tạo mật khẩu → bật Face ID + thông báo (cấp 1 lần, link cố định nên không hỏi lại) → POS Netlify quét QR → Face ID → POS mở, thấy 1673+ hoá đơn cũ → đăng xuất POS (app vẫn đăng nhập).
11. Admin (Đạt) đăng nhập app → Quản lý tài khoản → cấp tài khoản NV mới / khoá / mở khoá; Phiên POS đang mở → thu hồi → POS về màn đăng nhập (≤ 30 giây).

## Quay lui nếu hỏng
Tắt site app `medipos-app` trên Netlify (Site configuration → Manage site → Disable site) trước khi khôi phục DB để chặn truy cập từ các phiên PWA đang mở (vì app gọi Supabase trực tiếp); khôi phục DB từ bản sao bước 3 (Dashboard → Database → Backups, hoặc psql nạp lại); tạo commit quay lui toàn bộ thay đổi từ SHA của `main` đã ghi ở bước 8 (`git revert <SHA>..HEAD`) rồi push → Netlify deploy lại POS cũ.
