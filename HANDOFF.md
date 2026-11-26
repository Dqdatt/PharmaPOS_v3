# HANDOFF — MediPOS (repo PharmaPOS_V3), 26/11/2026 chiều

## Mục tiêu phiên vừa rồi
Chốt PWA ổn; nhận yêu cầu mới: nâng cấp hệ thống đăng nhập + bảo mật (admin/QL/NV, OTP 6 số, Face ID, đăng nhập POS web bằng điện thoại). Đã chốt; xong bước 1 (Supabase local + vai trò + RLS + OTP email).

## Đã xong (nhánh `prototype-mobile`, chưa push, chưa gộp main)
- PWA iOS hết hở đáy (giao 019+020, 03a5931) — người dùng xác nhận "hoạt động ổn như tôi muốn".
- `docs/AUTH_PLAN.md`: yêu cầu, phương án, quyết định đã chốt, thứ tự 6 bước.
- Giao 021 (666b2a0): migration schema gốc + seed 40 hoá đơn/15 thuốc/3 phiếu nhập; `supabase db reset` dựng được.
- Giao 022 (Claude, chưa commit): `supabase/migrations/20261126090000_auth_roles_rls.sql` (role admin/manager/staff, auth_id/email/phone/status, `my_role()`/`my_user_id()`/`my_profile()`, RLS, cấp quyền rõ vì Postgres mới không tự cấp), `scripts/seed-auth.mjs`, `supabase/tests/rls_check.sql`, mẫu mail `supabase/templates/otp.html`, config: tắt tự đăng ký, OTP 10 phút, mật khẩu ≥ 8. `npm run db:reset` + `npm run test:rls` → RLS OK; OTP email → Mailpit → verify thử thật đạt.

## Đang dở
- Giao 023 (nhân viên, `cho_lam`): POS web đổi role 'admin' → 'manager', ẩn admin khỏi POS. Duyệt bằng `giao xem 023`.
- Giao 022 chưa `giao xong` (việc --chi-claude, chờ commit rồi đóng).
- Sau 022, POS web chạy local sẽ không đọc được dữ liệu bằng PIN nữa (RLS cần đăng nhập) cho tới bước 4 (QR). Prod không đổi.
- Màn đăng nhập app (`prototype/screens/auth.js`) đang nhập SĐT → bước 2 đổi sang email (bỏ luôn lỗi ô SĐT "2884 0").
- Chưa commit: toàn bộ việc 022 + `AGENTS.md`, `package.json`, `HANDOFF.md`, `docs/`. Sao lưu config.toml/.gitignore cũ ở scratchpad (bản trong nhánh thay thế).

## Quyết định đã chốt
- **Mọi việc, mọi phiên trong dự án đều qua `giao`** (kể cả sửa nhỏ, góp ý qua lại). Vùng nhạy cảm (auth, quyền, RLS, migration, tiền) vẫn tạo việc `giao --chi-claude` và Claude tự làm.
- Phân quyền ĐƠN GIẢN: 3 vai trò cố định, kiểm `users.role` + RLS vài dòng, không bảng quyền.
- Chỉ 1 cơ sở. Admin cấp toàn bộ tài khoản (QL không cấp). NV xem doanh số cá nhân, QL xem toàn bộ.
- POS web chỉ 1 cách đăng nhập: quét QR bằng app + Face ID (bỏ so số, bỏ mã 6 số dự phòng).
- Admin mới = quản lý toàn hệ thống, chỉ dùng app, bị chặn ở POS. QL khác admin. App PWA KHÔNG bán hàng.
- Đăng nhập chỉ bằng **email** (mã 6 số qua mail, miễn phí); SĐT chỉ để liên hệ, không SMS. Lần đầu OTP → tạo mật khẩu; sau đó Face ID/sinh trắc học HĐH.
- Dev dùng dữ liệu local: Supabase local (`supabase start` → `npm run db:reset` → `npm run test:rls`; Mailpit :54324 đọc mã email; tài khoản test trong `supabase/seed.sql`, mật khẩu test trong `scripts/seed-auth.mjs`).
- Sửa giao diện ở `prototype/`, rồi build lại `pwa/`; không sửa `pwa/dist`. Lỗi chỉ thấy trên máy thật → beacon đo, không đoán.

## Nợ Ponytail
- Không có `shortcut:` mới. `verify:pwa` vẫn chập chờn ~1/5 lần.
- POS web local hiện không chạy được (anon hết quyền, `select('*')` users đụng cột pin) cho tới bước 4 (QR). Prod chưa nhận migration.
- Gửi OTP cho email lạ trả 422 → lộ email nào có tài khoản; chấp nhận được với app nội bộ, xem lại khi lên thật.
- WebAuthn (Face ID) cần HTTPS: test iPhone qua `http://192.168.x` sẽ không chạy → cần GitHub Pages/tunnel HTTPS khi tới bước 3.

## Việc tiếp theo
1. Duyệt giao 023 (đọc diff, `npm run lint && npm test`) — [opus high]
2. Bước 2: Edge Function `admin-create-user` + RPC kích hoạt sau đặt mật khẩu (Claude); `prototype/js/api.js` nối Supabase (Claude, file khung); UI `auth.js` đổi sang email + OTP + tạo mật khẩu (giao) — [opus xhigh]

## File cần đọc đầu tiên
`docs/AUTH_PLAN.md` · `AGENTS.md` · `supabase/migrations/20261126090000_auth_roles_rls.sql` · `prototype/screens/auth.js` · `prototype/js/core.js`
