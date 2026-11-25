# HANDOFF — MediPOS (repo PharmaPOS_V3), 25/11/2026 tối

## Mục tiêu phiên vừa rồi
Dựng PWA MediPOS giống 100% prototype đã chốt, cấu hình PWA và khóa xoay dọc, đưa link cho người dùng test trên điện thoại.

## Đã xong (nhánh `prototype-mobile`, chưa push, chưa gộp main)
- `pwa/` chạy NGUYÊN file prototype (build copy byte `css/js/screens/assets`), không có giao diện riêng — giao 017 (50ad01a): `pwa/src/` (index.html bỏ bảng QA + meta iOS, `pwa.css`, manifest portrait/standalone, icon 192/512, `sw.js` precache theo hash + HTML network-first + font stale-while-revalidate), `pwa/build.mjs`, `pwa/tools/check.mjs`.
- Kiểm chứng giao 018 (e5a359b): `npm run verify:pwa` (Playwright) so ảnh 48 state prototype vs PWA ở 390×844, ngưỡng 0, + xoay ngang/offline/manifest. Đạt 4/5 lần chạy.
- Sửa lỗi prototype: `App.appIcon()` trùng id gradient nên icon banner thông báo mất màu (60e0b77).
- Đã thử trên preview: luồng đăng nhập → OTP chạy, SW cài được, màn xoay ngang hiện, console sạch.
- Preview `pwa` trong `.claude/launch.json` (python http.server 4174 -d pwa/dist).
- Luật mới trong `AGENTS.md`: mọi yêu cầu sửa (kể cả góp ý qua lại) → đặc tả + chia qua `giao`.

## Đang dở
- Người dùng test qua LINK LOCAL: http://192.168.1.30:4174/ (cùng Wi-Fi, Mac bật; IP có thể đổi → `ipconfig getifaddr en0`). Đầu phiên: `npm run build:pwa` rồi preview_start `pwa`. Http nên SW/offline không chạy — bình thường.
- GitHub Pages: nhánh `gh-pages` đã đẩy, Pages đã bật nhưng 2 lượt deploy bị GitHub lỗi 500. Người dùng nói KHÔNG cần đợi Pages nữa.
- Chưa commit: `supabase/.gitignore`, `supabase/config.toml` (có từ trước, không đụng).

## Quyết định đã chốt
- Sửa giao diện ở `prototype/` rồi build lại `pwa/`; không sửa màn trong `pwa/`.
- Status bar iOS `black-translucent` (chữ giờ/pin luôn trắng, nhạt trên màn sáng — đã chấp nhận). iOS bỏ qua `orientation`, khóa dọc bằng màn che `.rotate-lock`.
- Link HTTPS (khi cần) = GitHub Pages https://dqdatt.github.io/PharmaPOS_v3/ (repo public).
- Mọi việc sửa chia qua `giao`; Claude đặc tả, duyệt, chạy preview thật trước `giao xong`.

## Nợ Ponytail
- Không có `shortcut:` mới. `verify:pwa` còn chập chờn ~1/5 lần (chuyển màn theo giờ thật vs đồng hồ giả) — gặp lại thì lưu log và xem state nào.
- Trên màn > 520px `html/body` bị khóa cuộn, khung máy cao 844px có thể bị cắt nếu cửa sổ thấp — chỉ ảnh hưởng máy tính bảng/desktop.
- Nhân viên Gemini (agy) từng đọc ngược chỉ dẫn và hoàn tác file Claude → luôn `git diff prototype-mobile giao/ID -- prototype` trước `giao xong`.

## Việc tiếp theo
1. Nhận góp ý của người dùng khi test link local → đặc tả, giao sửa ở `prototype/`, build lại, kiểm `verify:pwa` — [opus high]
2. Khi cần HTTPS: đẩy lại `gh-pages` (build, copy `pwa/dist` ra thư mục tạm, commit, push) — [haiku]
3. Thiết kế thật đăng nhập web bằng điện thoại + bỏ so PIN ở trình duyệt — [opus xhigh]

## File cần đọc đầu tiên
`AGENTS.md` · `pwa/src/index.html` · `pwa/src/sw.js` · `prototype/js/core.js` · `docs/TASKS.md`
