# HANDOFF — MediPOS (repo PharmaPOS_V3), 26/11/2026 sáng

## Mục tiêu phiên vừa rồi
Sửa lỗi PWA trên iPhone: đáy màn hở dải teal ~48pt khi mở app từ màn hình chính (Kavor cũng dính lỗi y hệt).

## Đã xong (nhánh `prototype-mobile`, chưa push, chưa gộp main)
- Giao 019 (a28dfcf): khi `navigator.standalone`, `.phone` cao `screen.height` (`--app-h`) + `focusout` → `scrollTo(0,0)`. Đoán là lỗi bàn phím → KHÔNG ăn.
- Đo bằng beacon trên iPhone thật (iOS 18.5): ngay từ lúc mở `innerHeight` 848 / `screen.height` 896 (thiếu status bar); `html, body { position: fixed }` cắt trang ở 848.
- Giao 020 (03a5931): `html.ios-standalone, html.ios-standalone body { position: static; height: var(--app-h) }` + `.phone` absolute. Người dùng xác nhận hết hở trên máy thật; đo lại `innerHeight` = 896. `check:pwa` có kiểm tra giữ cách sửa này.
- Bộ nhớ `ios-pwa-viewport-fix`: nguyên nhân + cách sửa + cách đo bằng beacon, để áp cho Kavor/PWA sau.
- `docs/TASKS.md` đã cập nhật.

## Đang dở
- Ô SĐT trong ảnh người dùng hiện "2884 0" kèm lỗi "cần đủ 10 số" — chưa rõ người dùng gõ thiếu hay `formatPhone` (`prototype/screens/auth.js:139`) làm mất số. Cần hỏi.
- Test qua link local http://192.168.1.30:4174/ (preview `pwa`, http.server bind mọi IP). Http nên SW không chạy trên iPhone. Preview trên localhost CÓ SW → sửa tay `pwa/dist` phải xoá SW + cache mới thấy.
- Chưa commit: `HANDOFF.md`, `docs/TASKS.md`; `supabase/.gitignore`, `supabase/config.toml` (có từ trước, không đụng).

## Quyết định đã chốt
- Sửa giao diện ở `prototype/`; lớp vỏ PWA riêng ở `pwa/src/` (index.html, pwa.css). Không sửa `pwa/dist` (trừ debug tạm, build lại là mất).
- Mọi việc sửa chia qua `giao`; Claude đặc tả, duyệt diff, chạy preview thật trước `giao xong`.
- Lỗi chỉ thấy trên máy thật → gắn beacon `fetch('/__dbg?...')` vào `pwa/dist`, đọc `preview_logs` — đo, không đoán.
- Status bar `black-translucent`; khóa dọc bằng `.rotate-lock`; cách sửa chiều cao dựa vào app khóa dọc.

## Nợ Ponytail
- Không có `shortcut:` mới. `verify:pwa` vẫn chập chờn ~1/5 lần. Trang iOS dài hơn viewport báo về 48pt — người dùng chưa báo bị trôi khi vuốt, theo dõi.

## Việc tiếp theo
1. Hỏi người dùng lỗi ô SĐT "2884 0"; nếu mất số → đặc tả sửa `formatPhone`/con trỏ trong `prototype/screens/auth.js`, giao — [sonnet]
2. Nhận góp ý tiếp khi test PWA trên iPhone → đặc tả, giao, build, `verify:pwa` — [opus high]
3. Thiết kế thật đăng nhập web bằng điện thoại + bỏ so PIN ở trình duyệt — [opus xhigh]

## File cần đọc đầu tiên
`AGENTS.md` · `pwa/src/index.html` · `pwa/src/pwa.css` · `prototype/screens/auth.js` · `docs/TASKS.md`
