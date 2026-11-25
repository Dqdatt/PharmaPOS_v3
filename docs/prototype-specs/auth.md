# Việc: màn đăng nhập app, OTP, bật Face ID, tạo PIN, khóa app — file `prototype/screens/auth.js`

Tiền tố CSS: `.au-`. Màn: `login`, `otp`, `bioSetup`, `pinSetup`, `lock`. Splash tự chuyển sang `login` khi màn này tồn tại.

## `login` (nền sáng, không tab)
- Trên: `App.appIcon()` 72px bo góc, hiện bằng `.rise`; tiêu đề 28px bold "Đăng nhập PharmaPOS"; 1 dòng phụ 15px: "Dùng tài khoản chủ nhà thuốc, giống trên web."
- Form 1 cột, nhãn ở TRÊN ô (15px semibold), ô cao 52, bo 14, viền 1.5px `var(--line)`, focus viền `var(--teal-600)` 2px, chữ 16px:
  - "Số điện thoại": `inputmode="numeric"`, tự định dạng nhóm 4-3-3 ("0903 128 466"), tối đa 10 số.
  - "Mật khẩu": nút hiện/ẩn mật khẩu (icon mắt, tự thêm vào `App.icons`), `autocomplete="current-password"`.
- Nút chính ở đáy vùng ngón cái, `.btn-primary.block` "Đăng nhập". Bấm → `App.busy(btn, 'Đang đăng nhập...')` 900ms →
  - SĐT chưa đủ 10 số: lỗi ngay dưới ô (13px, màu `var(--bad)`, có icon alert): "Số điện thoại cần đủ 10 số. Kiểm tra lại rồi thử."; viền ô đỏ; ô rung nhẹ (keyframes shake trong app.css).
  - Mật khẩu trống: lỗi dưới ô mật khẩu "Nhập mật khẩu để tiếp tục."
  - Hợp lệ: `App.go('otp', { phone })`.
- Link "Quên mật khẩu?" → `App.sheet`: tiêu đề "Đặt lại mật khẩu", câu "Chủ nhà thuốc đặt lại mật khẩu trên web, mục Nhân viên. Cần hỗ trợ thì gọi 1900 6868." + nút `.btn-secondary.block` data-close "Đã hiểu".
- Lỗi biến mất khi người dùng gõ lại ô đó.

## `otp` (push)
- `App.header({ title: '' })`, tiêu đề lớn "Nhập mã xác thực", câu "Mã 6 số đã gửi tới 0903 *** 466" (che giữa, lấy từ p.phone hoặc DATA.owner.phone).
- 6 ô vuông 48×56 bo 14, ô đang nhập viền teal + con trỏ nhấp nháy; một `<input>` ẩn `inputmode="numeric" autocomplete="one-time-code"` nhận phím, tự focus khi vào màn và khi chạm vào hàng ô.
- Đủ 6 số → tự kiểm (không cần nút): mã "000000" là sai → hàng ô rung + lỗi "Mã không đúng. Còn 4 lần thử." + xóa ô; mã khác là đúng → các ô chuyển xanh lần lượt (stagger 40ms) → 400ms → `App.go('bioSetup')`.
- Dòng gửi lại: "Gửi lại mã sau 0:45" đếm ngược mỗi giây (chữ `.num`), hết giờ thành link "Gửi lại mã" → toast "Đã gửi mã mới" và đếm lại. Dọn interval khi rời màn (kiểm `el.isConnected`).

## `bioSetup` (push, không có nút back — đã đăng nhập)
- Giữa màn: ô 112px bo 32 nền `var(--teal-50)` chứa icon faceid 56px màu `var(--teal-700)`, nhịp thở nhẹ (scale 1 → .96, 2.4s).
- Tiêu đề 24px "Mở app bằng Face ID"; câu 15px "Dùng Face ID để mở app và duyệt đăng nhập web. Tắt được trong Tài khoản."
- Đáy: `.btn-primary.block` "Bật Face ID" → `App.faceId()`: đúng → toast "Đã bật Face ID" → `App.go('pinSetup')`; sai → dòng lỗi dưới tiêu đề "Face ID không khớp. Thử lại hoặc để sau.". `.btn-ghost.block` "Để sau" → `App.go('pinSetup')`.

## `pinSetup` (push)
- Tiêu đề "Tạo mã PIN 6 số", câu "Dùng khi Face ID không nhận ra bạn."; bước 2 đổi thành "Nhập lại mã PIN" (chuyển chữ bằng fade, không nhảy).
- 6 vòng tròn 14px: trống = viền `var(--ink-3)`, đã nhập = đặc `var(--teal-700)` + pop scale.
- Bàn phím số tự vẽ kiểu iOS: lưới 3×4, nút tròn 76px, số 28px + dòng chữ phụ (ABC, DEF... như iOS) 12px; hàng cuối: trống, 0, nút xóa (icon). Nhấn: nền `var(--soft)` thoáng qua. Hỗ trợ gõ phím số trên máy tính.
- Bước 1 đủ 6 số: mã yếu (6 số giống nhau, hoặc dãy tăng/giảm liên tiếp như 123456/654321) → rung + "Mã quá dễ đoán. Chọn mã khác." xóa ô; ngược lại sang bước 2.
- Bước 2 khác bước 1 → rung + "Hai lần nhập không giống nhau. Nhập lại từ đầu." về bước 1. Giống → các chấm chuyển `var(--ok)` → màn hoàn tất: icon check vẽ nét (stroke-dashoffset) trong vòng tròn `var(--ok-soft)`, tiêu đề "Đã sẵn sàng", câu "Từ giờ bạn duyệt đăng nhập web ngay trên điện thoại." → sau 1200ms `App.reset('home', {}, 'fade')`.
- p.mode === 'change' (mở từ Tài khoản): tiêu đề "Đổi mã PIN", có nút back, hoàn tất thì toast "Đã đổi mã PIN" + `App.back()`.

## `lock` (mở lại app khi đã đăng nhập; App.reset('lock'))
- Nền `var(--brand-grad)`, `statusLight: true`, `cls: 'dark'`. Giữa trên: `App.logoMark()` 64px màu `var(--on-dark)`, chữ "Chào anh Khoa" (lấy tên cuối từ DATA.owner.name) 22px, dòng "Nhà thuốc Tâm An" `var(--on-dark-2)`.
- Mount: sau 400ms tự gọi `App.faceId()` → đúng: `App.reset('home', {}, 'fade')`; sai: hiện 6 chấm PIN + bàn phím (dùng lại bàn phím của pinSetup, chữ trắng, nút `.glass-clear`). PIN đúng là "246810" (mẫu) → vào home; sai → rung + "Sai mã PIN. Còn 4 lần thử.".
- Dưới cùng: nút chữ "Dùng Face ID" (gọi lại) và "Đăng nhập tài khoản khác" → `App.reset('login')`.

## State QA (nhóm 'Đăng nhập')
"Đăng nhập", "Đăng nhập: lỗi số điện thoại" (điền sẵn 0903 12 rồi hiện lỗi), "Nhập OTP", "OTP sai", "Bật Face ID", "Tạo mã PIN", "Tạo mã PIN: hai lần khác nhau", "Hoàn tất cài đặt", "Khóa app (Face ID)", "Khóa app (nhập PIN)".

Lệnh kiểm tra: `node prototype/tools/check.mjs login,otp,bioSetup,pinSetup,lock`
