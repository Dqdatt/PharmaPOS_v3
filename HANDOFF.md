# HANDOFF — MediPOS (PharmaPOS_V3), 27/11/2026 — ĐÃ LÊN THẬT. origin/main = 225e98d; local prototype-mobile = d9294f3 (chưa push)

## Mục tiêu phiên vừa rồi
Lên DB thật (M9), app sang Netlify, thử iPhone (M10) và sửa lỗi phát sinh.

## Đã xong
- M9 (26/11 23:27–23:34, POS ngừng ~7 phút): sao lưu `~/PharmaPOS_backup/2026-11-26/` (5.655 dòng) → functions + secrets (VAPID mới, `PASSKEY_ORIGINS`) + Vault → `db push` 12 migration (13 bảng khớp từng dòng) → link-account (#1 Đạt admin, #2 ĐQĐ manager) → push main.
- ecd3c2f app = site Netlify riêng `medipos-app.netlify.app` (build `npm run build:pwa`, publish `pwa/dist`, cấu hình UI Netlify, badge "Powered by Netlify" đã tắt). POS = `pharmapos-v3.netlify.app`. Không dùng GitHub Pages.
- 7a7a6b5 POS đọc chia trang `src/utils/selectAll.ts` (trước chỉ thấy 1000 HĐ → doanh thu thiếu, lỗi có từ POS cũ). Người dùng xác nhận Tổng đơn 1.770.
- d9294f3 (CHƯA deploy) màn quét QR app: hiện video trước rồi gắn stream, 3s không lên hình → mở lại (≤3), app quay lại từ nền → mở lại, vẫn đen → báo kèm chẩn đoán.
- M10: OTP Gmail tới, POS đăng nhập QR bằng ĐQĐ OK. Chrome trên iPhone: quét QR + icon đều OK.

## Đang dở
- d9294f3 chưa push main (người dùng chưa chốt). Camera đen chỉ khi mở app thêm từ Safari; app trên server giống hệt bản quét được (VERSION 16b27375e5).
- Giao 034 (tài liệu GO_LIVE/AGENTS/AUTH_PLAN sang Netlify) `cho_duyet` (review chưa đạt lần 2) → `giao xem 034`.
- AGENTS.md "Tiến độ"/"Lưu ý" còn nói chưa M9, còn GitHub Pages → sửa sau khi gộp 034.

## Quyết định đã chốt
- Mọi push lên `main` = deploy thật cả POS lẫn app → hỏi người dùng trước. Mọi thao tác DB thật hỏi trước; báo cáo/sửa POS không được ghi DB thật.
- Người dùng dùng Chrome trên iPhone (quét QR, icon ổn). Mail mã qua Gmail SMTP.
- Admin sửa được TÊN + EMAIL nhân viên ngay trong app, app tự cập nhật Supabase Auth (không thao tác tay).
- Bàn phím đè nội dung / đẩy ô nhập lên sát bàn phím: làm SAU, sửa prototype trước rồi build PWA.

## Nợ Ponytail
- `dashboard/index.ts`: "sắp hết" = tồn ≤ 5 chung; `expiring` rỗng → bước C (min_stock, hạn dùng theo lô).
- `api.js` PK_KEY chỉ nhớ 1 passkey/máy → đổi tài khoản là hỏi bật Face ID lại.

## Việc tiếp theo
1. Admin sửa tên + email NV: Edge Function (service role, chỉ admin, email trùng → lỗi tiếng Việt, tự đổi auth email) + `api.js` — Claude; UI `screens/admin.js` + đổi "Nhà thuốc Tâm An" → "MediPOS" (`data.js:5` Claude, `account.js:887` giao) — [opus xhigh]
2. Face ID nhớ theo từng tài khoản (`api.js` PK_KEY → map theo uid); hỏi push d9294f3 — [opus xhigh]
3. Duyệt giao 034, cập nhật AGENTS.md; icon Safari (thêm `apple-touch-icon.png` gốc pwa) — [sonnet]

## File cần đọc đầu tiên
`docs/TASKS.md` · `AGENTS.md` · `prototype/js/api.js` · `supabase/functions/admin-create-user/index.ts` · `prototype/screens/admin.js`
