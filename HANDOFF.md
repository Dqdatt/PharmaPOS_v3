# HANDOFF — MediPOS (repo PharmaPOS_V3), 26/11/2026 — nhánh `prototype-mobile` (chưa push, chưa gộp main)

## Mục tiêu phiên vừa rồi
Nâng cấp đăng nhập + bảo mật (admin/QL/NV, OTP email, đăng nhập POS bằng QR qua app) trên Supabase local; người dùng đã test iPhone qua tunnel: chạy ổn.

## Đã xong
- Supabase local dựng được: schema gốc + seed (giao 021, 666b2a0). Vai trò admin/manager/staff, `my_role()`/`my_user_id()`/`my_profile()`, RLS: NV thấy hoá đơn của mình, QL/admin thấy hết (1fcdc12).
- Cấp tài khoản: Edge Function `admin-create-user` (chỉ admin). Trigger `medipos_password_set`: đặt mật khẩu lần đầu → invited thành active (e415938).
- App: đăng nhập email + mã 6 số + tạo mật khẩu, Face ID mô phỏng, khoá app, bỏ PIN (giao 024/025, 725e197).
- POS: đăng nhập chỉ bằng QR do app duyệt; dữ liệu tải theo tài khoản; màn Nhân viên chỉ xem; role admin→manager (giao 023/026/027, 99e96ad, 435d95d).
- Test iPhone qua HTTPS: `pwa/tools/serve.mjs` + cloudflared (d4c608a). Kế hoạch A–F ghi trong `docs/AUTH_PLAN.md` (673a043).
- Kiểm tự động đều đạt: `npm run test:rls`, `npm run test:web-login`, `npm test`, `npm run lint`, `npm run check:pwa`.

## Bước A (passkey) — XONG, người dùng test iPhone qua tunnel đạt hết (giao 028)
- Migration `20261126120000_passkeys.sql`: bảng `passkeys`, `passkey_challenges` (dùng 1 lần, 2 phút); `web_login_approve` (chỉ service role); `web_login_decide` chỉ còn từ chối (duyệt → `need_passkey`).
- Edge Function `passkey` (`@simplewebauthn/server@13`): register / login (cấp phiên) / approve (duyệt POS) / delete. Origin: secret `PASSKEY_ORIGINS`; chưa đặt thì chỉ Supabase local nhận `http://localhost:*` + `https://*.trycloudflare.com`. `_shared/session.ts` cấp phiên dùng chung với `web-login`.
- `api.js`: `API.bio.enable/unlock/disable`, `API.webLogin.approve`; localStorage `medipos.passkey` = {id, uid}, đăng xuất / đổi tài khoản thì quên. Mock + trang QA vẫn `App.faceId()`. Đã nối `auth.js` (bật Face ID, màn khoá), `account.js` (công tắc), `weblogin.js` (duyệt).
- Người dùng chốt: duyệt POS BẮT BUỘC Face ID (chưa bật → báo bật trong Tài khoản).
- Kiểm: `npm run test:passkey` (authenticator giả ES256) + web-login + rls + npm test + lint + check:pwa + verify:pwa đều đạt. `test:rls` phải chạy ngay sau `db:reset` (test khác kích hoạt NV 3).
- Trình duyệt trong app không làm được WebAuthn (treo ở hộp thoại hệ thống) → Face ID thật chỉ thử được trên iPhone qua tunnel.
- DB thật (Supabase cloud) và POS đang chạy thật vẫn là bản cũ dùng PIN; chưa áp migration nào.

## Quyết định đã chốt
- Mọi việc, mọi phiên đều qua `giao`. Việc auth/quyền/RLS/migration/tiền → `giao them --chi-claude`, Claude tự làm. Phân quyền đơn giản: 3 vai trò cố định, 1 cơ sở.
- Admin: chỉ dùng app, bị chặn khỏi POS, là người duy nhất cấp tài khoản. NV xem doanh số của mình, QL xem toàn bộ. App không bán hàng.
- Đăng nhập chỉ bằng email (OTP miễn phí, không SMS); lần đầu tạo mật khẩu, sau đó dùng Face ID. POS chỉ 1 cách: quét QR + Face ID trên app.
- Push 4 loại: đăng nhập POS mới, doanh thu cuối ngày, thuốc sắp hết/sắp hết hạn, công nợ NCC. App thật trên GitHub Pages (passkey RP ID `dqdatt.github.io`). Gửi OTP thật qua Gmail SMTP; người dùng tự nhập mật khẩu ứng dụng.
- Test trên bản PWA build, không dùng trang QA của prototype. Mã nguồn sửa ở `prototype/`, build lại `pwa/`.
- Review tự động của `giao` hay bắt hoàn nguyên phần Claude chỉ đạo → tách thành việc mới có đặc tả rõ, không `giao sua` lặp. Việc có UI: Claude chạy thật trước khi `giao xong`.

## Nợ Ponytail
- `api.js:11`: URL + anon key Supabase local viết cứng → bước F đọc từ cấu hình build.
- Edge Function `passkey`: `login-options` không giới hạn tần suất (challenge hết hạn 2 phút, dọn mỗi lần gọi) → thêm giới hạn theo IP ở bước F nếu cần.
- `pwa/tools/serve.mjs`: chỉ dùng cho dev.
- `verify:pwa` chập chờn ~1/5 lần. Gửi OTP cho email lạ trả 422, lộ email nào có tài khoản → xem lại ở bước F.
- Thêm Edge Function mới phải `supabase stop && supabase start`. Bảng mới phải tự GRANT quyền (Postgres mới không tự cấp).

## Việc tiếp theo
1. B — Push VAPID (`push_subscriptions`, SW `pwa/src/sw.js`, `push-send`, `pg_cron`); C — thêm `min_stock` + hạn dùng theo lô — [opus xhigh]
2. D → E → F theo `docs/AUTH_PLAN.md` (F: chuyển DB thật, hỏi người dùng trước mỗi thao tác) — [opus xhigh]

## File cần đọc đầu tiên
`docs/AUTH_PLAN.md` · `AGENTS.md` · `prototype/js/api.js` · `supabase/functions/web-login/index.ts` · `supabase/migrations/20261126090000_auth_roles_rls.sql`
