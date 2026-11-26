# Kế hoạch nâng cấp đăng nhập + bảo mật (26/11/2026, người dùng đã chốt)

Vùng nhạy cảm: mọi việc ở đây Claude phiên chính làm (Opus xhigh), vẫn ghi vào `giao` bằng `--chi-claude`.
Phần UI thuần (màn prototype/PWA, màn POS web không đụng token) thì đặc tả rồi giao nhân viên.

## Yêu cầu người dùng (nguyên ý)
- 1 tài khoản **admin** quản lý chung hệ thống, khác **quản lý (QL)**. Admin chỉ dùng app, KHÔNG vào POS.
- Cấp tài khoản cho NV/QL → họ đăng nhập trên app PWA. App xem thông tin NV, doanh số. **App PWA KHÔNG bán hàng**, bán hàng ở POS web.
- Đăng nhập POS web phải qua điện thoại (QR kiểu Zalo, hoặc mã...). Dữ liệu bán hàng tải theo tài khoản khi login.
- Tài khoản cấp bằng email hoặc SĐT, gửi mã 6 số → người dùng chốt chọn cách miễn phí: **chỉ email** (SĐT chỉ để liên hệ). Lần đầu: verify → tạo mật khẩu. Lần sau: Face ID / sinh trắc học của HĐH.
- Giai đoạn dev: test bằng dữ liệu **local**.

## Đề xuất kỹ thuật
1. **Môi trường local**: `supabase start` (đã có `supabase/config.toml`, Docker + CLI có sẵn). Email OTP đọc ở Mailpit http://localhost:54324 (mẫu mail `supabase/templates/otp.html`). Không dùng SMS. `.env.local` trỏ `http://127.0.0.1:54321`. Seed: 1 admin, 1 QL, 2 NV, hoá đơn mẫu.
2. **Supabase Auth thay PIN**: bảng `users` thêm `auth_id uuid unique references auth.users`, `email`, `phone`, `status` (`invited|active|locked`); role thành `admin|manager|staff` (role `admin` cũ trên POS = chủ nhà thuốc → đổi thành `manager`, migration có kiểm tra). Tắt tự đăng ký (`enable_signup=false`); tài khoản chỉ tạo qua Edge Function `admin-create-user` (service role, chỉ **admin** được gọi, tạo cả QL và NV). Chỉ 1 nhà thuốc → không cần `store_id`.
3. **Lần đầu đăng nhập app**: nhập email → `signInWithOtp({shouldCreateUser:false})` → nhập mã 6 số `verifyOtp` → bắt buộc `updateUser({password})` → `status=active`. Lần sau: mật khẩu, hoặc Face ID.
4. **Face ID trên PWA = passkey WebAuthn** (platform authenticator, iOS 16+ chạy được trong PWA). Đăng ký passkey sau khi đặt mật khẩu; đăng nhập bằng passkey xác minh ở Edge Function (`@simplewebauthn/server`), đúng thì cấp phiên Supabase (generateLink magiclink → verifyOtp token_hash). **Cần HTTPS** (localhost thì được): iPhone test qua `http://192.168.x` sẽ không chạy WebAuthn → dùng link Netlify thật hoặc tunnel HTTPS.
5. **Đăng nhập POS web bằng điện thoại — 1 phương thức duy nhất: quét QR rồi xác nhận bằng Face ID** (như Zalo):
   - Web tạo yêu cầu (`web_login_requests`: id, secret băm, trình duyệt/IP, hết hạn 120s, `pending|approved|rejected|used`), hiện QR (id + nonce), tự làm mới khi hết hạn.
   - App quét QR (camera + `jsQR`, iOS không có BarcodeDetector) → màn xác nhận hiện trình duyệt, IP, giờ → Face ID → duyệt.
   - Web nghe Realtime/poll → đổi `secret` lấy phiên qua Edge Function (dùng 1 lần) → POS tải dữ liệu theo tài khoản.
   - Admin bị chặn ở bước đổi phiên (không vào POS). Thu hồi phiên web từ app (đã có UI ở `account.js`).
   - Bỏ bước chọn số khớp và mã 6 số dự phòng của prototype `weblogin.js` (người dùng muốn 1 phương thức). Chống lừa quét QR giả bằng: hết hạn ngắn, màn xác nhận hiện rõ trình duyệt/IP.
6. **Phân quyền dữ liệu bằng RLS** theo `auth.uid()` → `users.role`: NV thấy doanh số/hoá đơn có `employee_id` của mình, QL và admin thấy toàn bộ. Bỏ đọc PIN về client trong `Login.tsx`.

## Đã chốt với người dùng (26/11/2026)
- Chỉ 1 cơ sở (không đa chi nhánh).
- Admin cấp toàn bộ tài khoản; QL không cấp.
- NV xem doanh số cá nhân; QL xem toàn bộ.
- Đăng nhập POS web chỉ 1 phương thức: QR + Face ID trên app.
- Mã xác minh chỉ gửi qua email (miễn phí); lên thật dùng SMTP free (Gmail/Resend). Không SMS.
- Phân quyền đơn giản: 3 vai trò cố định.

## Thứ tự làm (mỗi bước một việc `giao`)
1. ✅ Supabase local (giao 021) + migration vai trò/auth_id/RLS + seed-auth + test RLS (giao 022)
2. Edge Function tạo tài khoản + OTP + đặt mật khẩu; nối màn `auth.js` (UI giao) — [opus xhigh]
3. Passkey Face ID (Edge Function đăng ký/xác minh) — [opus xhigh]
4. `web_login_requests` + Edge Function duyệt/đổi phiên; màn POS web hiện QR thay PIN + rút gọn `weblogin.js` bỏ so số (UI giao) — [opus xhigh]
5. RLS dữ liệu bán hàng; màn app xem NV/doanh số đọc dữ liệu thật (UI giao [sonnet]) — [opus xhigh]
6. Màn app quản lý tài khoản (chỉ admin: cấp, khoá, đổi quyền) — UI giao [sonnet], logic quyền [opus xhigh]

## Giai đoạn hoàn thiện app → DB thật (người dùng chốt 26/11/2026, sau khi test iPhone đạt bước 1–4)
Quyết định:
- Push báo cả 4 việc: đăng nhập POS mới (cho chính tài khoản đó), doanh thu cuối ngày (QL + admin), thuốc sắp hết / sắp hết hạn (mỗi sáng), công nợ nhà cung cấp.
- App chạy thật trên **Netlify** (`https://medipos-app.netlify.app/`) → passkey RP ID = `medipos-app.netlify.app`. Passkey tạo trên link tunnel chỉ để test, không dùng được trên host Netlify.
- Mail mã OTP khi lên thật: **Gmail SMTP** (người dùng tự nhập mật khẩu ứng dụng Gmail vào Supabase, Claude không nhập).

Thứ tự (mỗi bước = việc `giao`; máy chủ/bảo mật `--chi-claude`):
A. **Face ID thật = passkey WebAuthn**: bảng `passkeys`, Edge Function `passkey` (đăng ký / xác minh, `@simplewebauthn/server`), đăng nhập bằng passkey → cấp phiên (generateLink như web-login); `API.bio` + `App.faceId()` gọi `navigator.credentials` thật khi có. RP ID theo host (tunnel khi test, Netlify khi thật). — Claude + UI giao
B. **Push (Web Push VAPID)**: bảng `push_subscriptions` / `notif_prefs` / `notifications` / `push_jobs`, SW `pwa/src/sw.js` nhận `push` + `notificationclick`, Edge Function `push` + `_shared/push.ts`; gửi khi: POS nhận phiên (ngay, cho chính tài khoản), 21:00 doanh thu bán lẻ (= ô POS, QL + admin), 8:00 thứ Hai công nợ NCC (QL + admin); tồn kho / hạn dùng gửi ở bước C. Cron = `pg_cron` + `pg_net` (URL ở Vault `functions_url`, mã chạy dùng 1 lần). Bỏ giờ yên lặng. Đăng xuất xoá đăng ký push của máy. iOS chỉ nhận khi PWA đã thêm vào Màn hình chính và người dùng cho phép. — Claude + UI giao
C. **Dữ liệu cho cảnh báo**: thêm `products.min_stock`, hạn dùng theo lô ở `purchase_items.expiry_date` + ô nhập ở màn Nhập hàng POS. — Claude migration, UI POS giao
D. **App đọc dữ liệu thật**: Trang chủ/Doanh thu/Hoá đơn/Nhân viên/Tiện ích theo RLS (NV xem của mình, QL/admin toàn bộ); tính doanh thu dùng chung logic `reportRevenue.ts`. — Claude API tiền, UI giao
E. **Admin trong app**: cấp / khoá / đổi vai trò tài khoản (Edge Function `admin-update-user`), danh sách + thu hồi phiên web (đọc `auth.sessions`). — Claude + UI giao
F. **Chuyển DB thật** (project Supabase hiện có): sao lưu → áp migration → điền email cho nhân viên cũ → deploy Edge Functions + secrets (VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT, khoá mới, không dùng khoá local) + Vault `functions_url` = `https://<ref>.supabase.co/functions/v1` → SMTP Gmail → deploy PWA lên Netlify (site `medipos-app.netlify.app`) + POS mới CÙNG LÚC (RLS bật là POS cũ dùng PIN ngừng chạy). Mỗi thao tác trên DB thật hỏi người dùng trước. — Claude
