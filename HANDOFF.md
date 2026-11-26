# HANDOFF — MediPOS (repo PharmaPOS_V3), 26/11/2026 chiều

## Mục tiêu phiên vừa rồi
Chốt PWA ổn; nhận yêu cầu mới: nâng cấp hệ thống đăng nhập + bảo mật (admin/QL/NV, OTP 6 số, Face ID, đăng nhập POS web bằng điện thoại). Xong bước 1, 2, 4 (đăng nhập POS bằng QR), đã chạy thật đầu–cuối trên máy Mac. Chờ người dùng test iPhone (cần HTTPS).

## Đã xong (nhánh `prototype-mobile`, chưa push, chưa gộp main)
- PWA iOS hết hở đáy (giao 019+020, 03a5931) — người dùng xác nhận "hoạt động ổn như tôi muốn".
- `docs/AUTH_PLAN.md`: yêu cầu, phương án, quyết định đã chốt, thứ tự 6 bước.
- Giao 021 (666b2a0): migration schema gốc + seed 40 hoá đơn/15 thuốc/3 phiếu nhập; `supabase db reset` dựng được.
- Giao 022 (Claude, 1fcdc12): `supabase/migrations/20261126090000_auth_roles_rls.sql` (role admin/manager/staff, auth_id/email/phone/status, `my_role()`/`my_user_id()`/`my_profile()`, RLS, cấp quyền rõ vì Postgres mới không tự cấp), `scripts/seed-auth.mjs`, `supabase/tests/rls_check.sql`, mẫu mail `supabase/templates/otp.html`, config: tắt tự đăng ký, OTP 10 phút, mật khẩu ≥ 8. `npm run db:reset` + `npm run test:rls` → RLS OK; OTP email → Mailpit → verify thử thật đạt.

- Bước 4 (99e96ad máy chủ; giao 026 app quét QR, 027 POS màn QR + phiên theo tài khoản): `web_login_requests`, RPC `web_login_info/decide` (admin bị chặn), Edge Function `web-login` (create/poll, secret băm, phiên cấp 1 lần), `src/lib/webLogin.ts`, `API.webLogin`. `npm run test:web-login` đạt. Chạy thật: POS hiện QR → giải mã đúng → app xác nhận (Chrome/macOS, IP, đếm ngược) → duyệt → POS vào bằng quản lý, ghi nhật ký ca → đăng xuất về QR.

## Đang dở
- Bước 2 máy chủ (e415938): Edge Function `admin-create-user` (chỉ admin, rollback khi lỗi), trigger `medipos_password_set` (đổi mật khẩu lần đầu → invited thành active; GoTrue gán hash ngẫu nhiên nên KHÔNG dò qua encrypted_password), `prototype/js/api.js` (live ở localhost/LAN, mock nơi khác, mã mock 123456), splash chọn màn theo phiên. Đã thử thật bằng script + trình duyệt.
- Giao 023 (gộp): POS web role admin→manager, ẩn admin khỏi POS; đã bỏ qua góp ý review siết PIN/localStorage (luồng PIN là tạm).
- Giao 024+025 (gộp): app đăng nhập email + mã 6 số + tạo mật khẩu, bỏ PIN app, màn khoá kiểm phiên, công tắc Face ID nối `API.bio`. Claude sửa `splash.js`: phiên 'invited' → màn Tạo mật khẩu.
- Đã test trên PWA build (preview `pwa`, Supabase local): lần đầu (mã Mailpit → tạo mật khẩu, DB invited→active), sai/đúng mật khẩu, Face ID → mở lại vào màn khoá, tắt Face ID → vào thẳng Trang chủ, đăng xuất/Ở lại, tải lại giữa bước tạo mật khẩu.
- Sau 022, POS web chạy local sẽ không đọc được dữ liệu bằng PIN nữa (RLS cần đăng nhập) cho tới bước 4 (QR). Prod không đổi.
- Màn đăng nhập app (`prototype/screens/auth.js`) đang nhập SĐT → bước 2 đổi sang email (bỏ luôn lỗi ô SĐT "2884 0").

## Quyết định đã chốt
- **Mọi việc, mọi phiên trong dự án đều qua `giao`** (kể cả sửa nhỏ, góp ý qua lại). Vùng nhạy cảm (auth, quyền, RLS, migration, tiền) vẫn tạo việc `giao --chi-claude` và Claude tự làm.
- Phân quyền ĐƠN GIẢN: 3 vai trò cố định, kiểm `users.role` + RLS vài dòng, không bảng quyền.
- Chỉ 1 cơ sở. Admin cấp toàn bộ tài khoản (QL không cấp). NV xem doanh số cá nhân, QL xem toàn bộ.
- POS web chỉ 1 cách đăng nhập: quét QR bằng app + Face ID (bỏ so số, bỏ mã 6 số dự phòng).
- Admin mới = quản lý toàn hệ thống, chỉ dùng app, bị chặn ở POS. QL khác admin. App PWA KHÔNG bán hàng.
- Đăng nhập chỉ bằng **email** (mã 6 số qua mail, miễn phí); SĐT chỉ để liên hệ, không SMS. Lần đầu OTP → tạo mật khẩu; sau đó Face ID/sinh trắc học HĐH.
- Dev dùng dữ liệu local: Supabase local (`supabase start` → `npm run db:reset` → `npm run test:rls`; Mailpit :54324 đọc mã email; tài khoản test trong `supabase/seed.sql`, mật khẩu test trong `scripts/seed-auth.mjs`).
- Test bằng bản PWA build (preview `pwa`), không dùng trang QA prototype. Mã nguồn vẫn ở `prototype/` → `npm run build:pwa`; không sửa `pwa/dist`.
- Review tự động của giao hay đòi hoàn nguyên phần Claude chỉ đạo → đặc tả mới tách việc riêng thay vì `giao sua` lặp. Lỗi chỉ thấy trên máy thật → beacon đo, không đoán.

## Nợ Ponytail
- Không có `shortcut:` mới. `verify:pwa` vẫn chập chờn ~1/5 lần.
- POS web local hiện không chạy được (anon hết quyền, `select('*')` users đụng cột pin) cho tới bước 4 (QR). Prod chưa nhận migration.
- Edge Function mới phải `supabase stop && supabase start` mới được nạp.
- Gửi OTP cho email lạ trả 422 → lộ email nào có tài khoản; chấp nhận được với app nội bộ, xem lại khi lên thật.
- WebAuthn (Face ID) cần HTTPS: test iPhone qua `http://192.168.x` sẽ không chạy → cần GitHub Pages/tunnel HTTPS khi tới bước 3.

## Việc tiếp theo
1. Cho người dùng test iPhone: cần HTTPS cho camera → cloudflared tunnel + server PWA proxy Supabase cùng origin + api.js nhận origin tunnel — [opus high]
2. Bước 5: app đọc dữ liệu thật (Trang chủ/Doanh thu/NV đang là DATA mẫu) theo RLS — [opus xhigh] + UI giao
3. Bước 3: Face ID = passkey WebAuthn (cần HTTPS) — [opus xhigh]


## File cần đọc đầu tiên
`docs/AUTH_PLAN.md` · `AGENTS.md` · `supabase/migrations/20261126090000_auth_roles_rls.sql` · `prototype/screens/auth.js` · `prototype/js/core.js`
