# HANDOFF — MediPOS (repo PharmaPOS_V3), 26/11/2026 23:40 — ĐÃ LÊN THẬT (M9 xong), `main` = `prototype-mobile` = ecd3c2f

## Đã lên thật (M9, 26/11 23:27–23:34, POS ngừng ~7 phút)
- Sao lưu trước khi đổi: `~/PharmaPOS_backup/2026-11-26/` (schema.sql, data.sql, so_dong.txt; ngoài repo, quyền 700). 5.655 dòng, 1.678 hoá đơn.
- DB thật: `db push` 12 migration; 13 bảng khớp từng dòng với bản sao lưu; RLS bật 20 bảng; 2 cron push; Vault `functions_url`.
- 5 Edge Functions deploy (web-login/passkey/push `verify_jwt=false`); secrets: VAPID mới (khác local), `VAPID_SUBJECT`, `PASSKEY_ORIGINS=https://medipos-app.netlify.app`.
- Auth Dashboard (người dùng làm): tắt sign up, OTP 6 số/600s, SMTP Gmail (mật khẩu ứng dụng), mẫu Magic Link = `supabase/templates/otp.html`, rate 30 mail/giờ, Site URL Netlify.
- Tài khoản: #1 Quốc Đạt = admin, #2 Đoàn Quốc Đường = manager, đã gắn email, trạng thái `invited` (mở app → "Đăng nhập lần đầu").
- Deploy: push `prototype-mobile` → `main` (fast-forward 63e6cb3 → ecd3c2f). POS `pharmapos-v3.netlify.app` hiện QR OK; app = site Netlify RIÊNG `medipos-app.netlify.app` (build `npm run build:pwa`, publish `pwa/dist`, cấu hình trong UI Netlify, KHÔNG thêm netlify.toml). Không dùng GitHub Pages nữa.
- Quay lui POS cũ: khôi phục DB từ bản sao lưu + `main` về `63e6cb3` (xem GO_LIVE sau khi gộp giao 034).

## Đang dở (M10 đã thử 27/11: OTP Gmail tới, POS đăng nhập QR bằng ĐQĐ chạy; badge Netlify đã tắt)
- 7a7a6b5 (chưa push main lúc viết): POS đọc chia trang `src/utils/selectAll.ts` — trước đó POS chỉ thấy 1000 hoá đơn mới nhất (lỗi có từ POS cũ). Kỳ vọng sau deploy, Báo cáo: Tổng doanh thu 1.055.569.095 = bán lẻ 927.591.123 + xuất kho 127.977.972; Tổng đơn 1.770 (1.641 HĐ hợp lệ + 129 phiếu xuất paid). Người dùng xem POS đối chiếu.
- Góp ý M10 còn lại:
  1. Icon màn hình chính iPhone hiện chữ "M": server đúng (apple-touch-icon 180 trả 200) → nghi iOS nhớ lúc site còn 404; thử xoá icon + Cài đặt → Safari → Nâng cao → Dữ liệu trang web → xoá medipos-app.netlify.app → thêm lại. Không được thì thêm `apple-touch-icon.png` ở gốc pwa.
  2. Admin sửa tên + email NV từ app (tự cập nhật Supabase Auth): Edge Function (service role, chỉ admin, email trùng → lỗi tiếng Việt) + `api.js` — Claude; UI `screens/admin.js` — giao.
  3. "Nhà thuốc Tâm An" → "MediPOS": `prototype/js/data.js:5` (Claude) + fallback `screens/account.js:887` (giao).
  5. Face ID hỏi bật lại khi đổi tài khoản trên cùng máy: `api.js` `PK_KEY` chỉ nhớ 1 passkey/máy, dòng 55 xoá khi uid khác → đổi thành map theo uid — Claude.
  6+7. Bàn phím đè nội dung (lỗi hiển thị, gõ vẫn được) + đẩy ô nhập/nút lên sát bàn phím: làm SAU, sửa prototype trước rồi build PWA — giao.
- Giao 034 (tài liệu GO_LIVE/AGENTS/AUTH_PLAN sang Netlify) đang sửa lần 2 theo review → duyệt, `giao xong 034`, rồi cập nhật AGENTS.md "Tiến độ" (M9 xong).

## Quyết định đã chốt
- Hoãn C (tồn kho) sau MVP. Mail mã qua Gmail SMTP. Mọi thao tác DB thật hỏi người dùng trước.
- Quét QR giữ quét trực tiếp (iOS hỏi camera 1 lần/lần mở). Face ID không tự bật khi mở app.
- Từ nay mọi push lên `main` = deploy thật cả POS lẫn app.

## Nợ Ponytail
- `supabase/functions/dashboard/index.ts`: "sắp hết" = tồn ≤ 5 chung (thay bằng `products.min_stock` ở C); `expiring` rỗng (cần `purchase_items.expiry_date` ở C).
- Tài khoản cũ không email: CHECK `users_contact_check` (NOT VALID) chặn UPDATE → admin gắn email trước (`admin_set_user` trả 'no_email').
- `supabase start` có thể treo keychain lần đầu. Function MỚI cần `supabase stop && supabase start` mới được phục vụ. Supabase CLI 2.108 (có 3.4).

## Việc tiếp theo
1. Sửa góp ý M10 theo mục "Đang dở" (thứ tự: 5 Face ID, 2 admin sửa NV, 3 chữ MediPOS, 1 icon), push main, người dùng thử lại iPhone: admin khoá/mở khoá, thu hồi phiên POS (≤30s) — [opus xhigh]
2. Việc vặt: nút "In lại"/"Gửi Zalo" chi tiết hoá đơn còn giả lập; tra tồn kho nháy kết quả cũ; tên/địa chỉ nhà thuốc thật cho `DATA.store` — [sonnet] giao
3. Xoá bản PWA cũ trên GitHub Pages (nhánh `gh-pages`) nếu người dùng đồng ý — [haiku]

## File cần đọc đầu tiên
`docs/GO_LIVE.md` · `docs/TASKS.md` · `AGENTS.md` · `prototype/js/api.js`
