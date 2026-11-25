# HANDOFF — MediPOS (repo PharmaPOS_V3), 25/11/2026

## Mục tiêu phiên vừa rồi
Rút gu UI/UX của người dùng từ Kavor, đưa dự án vào workflow (`/batdau`) và dựng prototype app điện thoại MediPOS (liquid glass, đủ màn, splash, logo) có dùng `giao`.

## Đã xong (nhánh `prototype-mobile`, chưa gộp main, chưa push)
- `/batdau`: `AGENTS.md` (quy tắc dự án + luật UI prototype), `CLAUDE.md` = `@AGENTS.md`, `docs/TASKS.md` — 678c736.
- Khung `prototype/` (core, token, router, kính, splash, Trang chủ) — 678c736, fa9d907. Xem: preview `prototype` (http.server 4173), bảng QA bên trái nhảy tới mọi màn.
- Giao 011–014: đăng nhập/OTP/Face ID/PIN, đăng nhập web (QR + chọn số), doanh thu + tiện ích, tài khoản; sửa sau review — 0d329dc.
- Vòng góp ý: nền `--wash` (d0799b6), tab bar (ed3dbe2), đăng nhập có dải thương hiệu, OTP có bàn phím số iOS, PIN không tràn (7d37c79), giao 015/016 làm đầy 10 màn trống (6a7900f).
- Logo + tên như web: MediPOS, icon notes-medical; `prototype/logo.html`, file SVG/PNG ở `prototype/assets/` — 91036aa.
- Kiểm: `node prototype/tools/check.mjs` đạt (24 màn, 48 state); bấm trọn luồng trên preview, console sạch.

## Đang dở
Không có. Prototype chờ người dùng góp ý tiếp. Chưa commit: `HANDOFF.md`, `supabase/.gitignore`, `supabase/config.toml` (2 file supabase có từ trước phiên, không đụng).

## Quyết định đã chốt
- Tên hiển thị **MediPOS**, logo = icon web (`public/favicon.svg`, Font Awesome Free CC BY 4.0), teal như web. Chỉ giao diện sáng.
- Đăng nhập web: web hiện QR + số 2 chữ số → app quét → chọn đúng số trong 3 → Face ID. Chọn sai = hủy luôn. Dự phòng: nhập SĐT trên web → app nhận thông báo đẩy để duyệt.
- Kính chỉ ở lớp nổi; không nét "AI" ("·", chấm màu, đốm blur, chữ gradient); chữ ≥ 12px; màn sáng có nền `--wash`; màn ít nội dung thì thêm nội dung có ích, không để trống nửa dưới.
- Màn mẫu: `prototype/screens/home.js`. Khung (core, app.css, data, splash, home) Claude giữ; mỗi nhóm màn một file để giao không đụng nhau.
- Dữ liệu mẫu: 14:36 thứ Tư 25/11, ca sáng hết 14:00, đơn sau 14:00 do Thu Trang bán.

## Nợ Ponytail
- Không có `shortcut:` mới. Lỗi vặt chưa sửa: Enter ở form đăng nhập không gửi; bấm "Ở lại" trong 800ms đăng xuất vẫn đăng xuất; vài bóng đổ rgba cứng; ô mật khẩu chưa có bàn phím chữ mô phỏng — sửa khi port native hoặc khi người dùng thấy.
- SVG logo kèm chữ để chữ dạng font (chưa chuyển nét) — gửi ra ngoài dùng PNG.

## Việc tiếp theo
1. Góp ý prototype vòng sau, sửa trên `prototype-mobile` — [opus high]
2. Thiết kế thật đăng nhập web bằng điện thoại (API, token, QR hết hạn 2 phút, thu hồi phiên) + bỏ so PIN ở trình duyệt trong `src/views/Login.tsx` — [opus xhigh]
3. Chốt nền tảng app (Expo/React Native như Kavor), port prototype 1:1 có so ảnh — [opus high]

## File cần đọc đầu tiên
`AGENTS.md` · `prototype/js/core.js` · `prototype/screens/home.js` · `docs/prototype-specs/_chung.md` · `docs/TASKS.md`
