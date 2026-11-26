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

## Đang dở
- Chưa bắt đầu A–F. Không có việc `giao` nào đang mở. Cây làm việc sạch.
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
- `api.js:160`: Face ID chỉ là cờ trên máy → làm thật ở bước A.
- `pwa/tools/serve.mjs`: chỉ dùng cho dev.
- `verify:pwa` chập chờn ~1/5 lần. Gửi OTP cho email lạ trả 422, lộ email nào có tài khoản → xem lại ở bước F.
- Thêm Edge Function mới phải `supabase stop && supabase start`. Bảng mới phải tự GRANT quyền (Postgres mới không tự cấp).

## Việc tiếp theo
1. A — Face ID thật = passkey WebAuthn (bảng `passkeys`, Edge Function `passkey`, `API.bio`/`App.faceId()` gọi thật), test qua tunnel — [opus xhigh]
2. B — Push VAPID (`push_subscriptions`, SW `pwa/src/sw.js`, `push-send`, `pg_cron`); C — thêm `min_stock` + hạn dùng theo lô — [opus xhigh]
3. D → E → F theo `docs/AUTH_PLAN.md` (F: chuyển DB thật, hỏi người dùng trước mỗi thao tác) — [opus xhigh]

## File cần đọc đầu tiên
`docs/AUTH_PLAN.md` · `AGENTS.md` · `prototype/js/api.js` · `supabase/functions/web-login/index.ts` · `supabase/migrations/20261126090000_auth_roles_rls.sql`
