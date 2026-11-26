# HANDOFF — MediPOS (repo PharmaPOS_V3), 26/11/2026 — nhánh `prototype-mobile` (chưa push, chưa gộp main)

## Mục tiêu phiên vừa rồi
Bước A: Face ID thật = passkey WebAuthn cho app PWA, duyệt đăng nhập POS bắt buộc Face ID — xong, người dùng test iPhone qua tunnel đạt hết.

## Đã xong
- Trước đó: Supabase local, 3 vai trò + RLS, OTP email + tạo mật khẩu, POS đăng nhập bằng QR, test iPhone qua tunnel (đến d4c608a). Kế hoạch A–F ở `docs/AUTH_PLAN.md`.
- A (7d45767, giao 028 đã đóng): migration `20261126120000_passkeys.sql` (bảng `passkeys`, `passkey_challenges` dùng 1 lần/2 phút, `web_login_approve` chỉ service role, `web_login_decide` chỉ còn từ chối → `need_passkey`). Edge Function `passkey` (`@simplewebauthn/server@13`: register / login cấp phiên / approve POS / delete), `_shared/session.ts` cấp phiên dùng chung với `web-login`. `api.js`: `API.bio.enable/unlock/disable`, `API.webLogin.approve`; nối `auth.js`, `account.js`, `weblogin.js`.
- Kiểm tự động đạt: `test:rls`, `test:web-login`, `test:passkey` (authenticator giả ES256), `npm test`, `lint`, `check:pwa`, `verify:pwa`. Cây làm việc sạch.

## Đang dở
- Không có. Không việc `giao` nào mở.

## Quyết định đã chốt
- Mọi việc qua `giao`; auth/quyền/RLS/migration/tiền → `giao them --chi-claude`, Claude tự làm. 3 vai trò cố định, 1 cơ sở.
- Admin chỉ dùng app, bị chặn khỏi POS, là người duy nhất cấp tài khoản. NV xem doanh số của mình, QL xem toàn bộ. App không bán hàng.
- Đăng nhập app chỉ bằng email (OTP, không SMS); lần đầu tạo mật khẩu, sau đó Face ID. POS chỉ 1 cách: quét QR + Face ID.
- Duyệt đăng nhập POS BẮT BUỘC Face ID (chưa bật → app báo bật trong Tài khoản). Không có mật khẩu dự phòng.
- Push 4 loại: đăng nhập POS mới, doanh thu cuối ngày, thuốc sắp hết/sắp hết hạn, công nợ NCC. App thật trên GitHub Pages (RP ID `dqdatt.github.io`, secret `PASSKEY_ORIGINS=https://dqdatt.github.io`). OTP thật qua Gmail SMTP, người dùng tự nhập mật khẩu ứng dụng.
- Test trên bản PWA build qua tunnel, không dùng trang QA. Sửa ở `prototype/`, build lại `pwa/`. Việc có UI: Claude chạy thật trước khi `giao xong`.

## Nợ Ponytail
- `api.js:11`: URL + anon key Supabase local viết cứng → bước F đọc từ cấu hình build.
- `pwa/tools/serve.mjs`: chỉ dùng cho dev. `verify:pwa` chập chờn ~1/5 lần.
- Bước F: OTP email lạ trả 422 (lộ email nào có tài khoản); `passkey` `login-options` chưa giới hạn tần suất theo IP.
- `test:rls` phải chạy ngay sau `db:reset` (test khác kích hoạt NV 3). Edge Function mới cần `supabase stop && supabase start`. Bảng mới phải tự GRANT.
- Trình duyệt trong app Claude không chạy được WebAuthn → Face ID chỉ test trên iPhone qua tunnel. Passkey tạo trên link tunnel mất khi đổi link.

## Việc tiếp theo
1. B — Push Web Push VAPID: `push_subscriptions`, SW `pwa/src/sw.js` (`push` + `notificationclick`), Edge Function `push-send`, gửi khi duyệt web-login + cron `pg_cron`/`pg_net` (doanh thu cuối ngày, tồn kho/hạn dùng sáng, công nợ); UI bật thông báo giao — [opus xhigh]
2. C — `products.min_stock` + `purchase_items.expiry_date` + ô nhập ở màn Nhập hàng POS (UI giao) — [opus xhigh]
3. D → E → F theo `docs/AUTH_PLAN.md` (F: hỏi người dùng trước mỗi thao tác trên DB thật) — [opus xhigh]

## File cần đọc đầu tiên
`docs/AUTH_PLAN.md` · `AGENTS.md` · `prototype/js/api.js` · `supabase/functions/passkey/index.ts` · `pwa/build.mjs`
