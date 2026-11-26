# HANDOFF — MediPOS (repo PharmaPOS_V3), 26/11/2026 — nhánh `prototype-mobile` (chưa push, chưa gộp main)

## Mục tiêu phiên vừa rồi
Hoàn thiện MVP (đăng nhập/đăng xuất, admin, dữ liệu thật, email) trước bước tồn kho C, chuẩn bị lên DB thật không mất dữ liệu.

## Đã xong (M1–M8 trong `docs/TASKS.md`, mọi test đạt: rls, web-login, passkey, push, npm test, lint, build, check.mjs, check:pwa)
- f009ff4 M1 diễn tập trên bản sao DB thật (12 bảng giống từng byte) + M2 `scripts/link-account.mjs` + M8 `api.js` host `dqdatt.github.io` = DB thật.
- 85e3bc0 M5 server: migration `20261126140000_admin_sessions.sql` (my_role/my_user_id đòi phiên sống; `web_sessions`, `web_session_revoke`, `admin_set_user`), signOut `scope:'local'` (trước đây đăng xuất POS đá cả app), POS tự kiểm phiên 30s/focus.
- b42ba89 M6 server: function `dashboard` (doanh thu = reportRevenue, khớp SQL độc lập trên dữ liệu thật), `API.invoice`, `API.searchProducts`.
- 7d459d3 M7: mail mã tiếng Việt `supabase/templates/otp.html`, `verify_jwt=false` cho web-login/passkey, `docs/GO_LIVE.md`.
- Giao 030 (khoá app khi mở, mặc định tắt), 031 (nút Đăng xuất màn chốt tồn QL), 032 (UI admin + phiên POS thật), 033 (UI số liệu thật) — đã chạy thật live, đã gộp.

## Đang dở
- Không có việc `giao` mở, cây làm việc sạch. DB local đang là dữ liệu seed (+ vài tài khoản test do Claude tạo) → `npm run db:reset` trước khi test.

## Quyết định đã chốt
- Hoãn C (tồn kho) sau MVP. #1 Quốc Đạt → admin (chỉ app), #2 Đoàn Quốc Đường → Quản lý (POS, 1673 hoá đơn). Người dùng tự điền email khi chạy link-account.
- Quét QR giữ quét trực tiếp (iOS hỏi camera 1 lần/lần mở, giới hạn Apple). Face ID không tự bật khi mở app.
- POS thật = Netlify `pharmapos-v3.netlify.app`, tự deploy từ `main` → KHÔNG gộp main / KHÔNG deploy gh-pages trước M9. DB thật chưa có bảng supabase_migrations → `db push` chạy cả 12 file.
- Mail mã qua Gmail SMTP (người dùng tự nhập mật khẩu ứng dụng). Mọi thao tác DB thật hỏi trước.

## Nợ Ponytail
- `supabase/functions/dashboard/index.ts`: "sắp hết" = tồn ≤ 5 chung (thay bằng `products.min_stock` ở C); `expiring` rỗng (cần `purchase_items.expiry_date` ở C).
- Tài khoản cũ không email: CHECK `users_contact_check` (NOT VALID) chặn UPDATE → admin gắn email trước (`admin_set_user` trả 'no_email').
- `supabase start` có thể treo keychain lần đầu (đã "Luôn cho phép" 26/11). Function MỚI cần `supabase stop && supabase start` mới được phục vụ.

## Việc tiếp theo
1. M9 lên DB thật theo `docs/GO_LIVE.md`, ngoài giờ bán, hỏi người dùng từng bước — [opus xhigh]
2. M10 thử iPhone trên link Pages: OTP Gmail, Face ID, thông báo, QR POS, admin — [opus high]
3. Việc vặt: nút "In lại"/"Gửi Zalo" chi tiết hoá đơn còn giả lập; tra tồn kho nháy kết quả cũ; tên/địa chỉ nhà thuốc thật cho `DATA.store` — [sonnet] giao

## File cần đọc đầu tiên
`docs/GO_LIVE.md` · `docs/TASKS.md` · `AGENTS.md` · `supabase/migrations/20261126140000_admin_sessions.sql` · `prototype/js/api.js`
