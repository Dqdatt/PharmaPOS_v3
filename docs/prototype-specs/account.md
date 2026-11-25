# Việc: tab Tài khoản, thông báo, cài đặt — file `prototype/screens/account.js`

Tiền tố CSS: `.ac-`. Màn: `account` (tab: 'account'), `notifications`, `notifSettings`, `storeInfo`.

## `account`
- Đầu màn (không card): vòng tròn 72px nền `var(--teal-100)` chữ cái đầu "MK" 26px `var(--teal-800)`; tên 22px 700; "Chủ nhà thuốc, Nhà thuốc Tâm An" 14px `var(--ink-2)`. Padding trên `calc(var(--sat) + 16px)`.
- Nhóm `.card` + `.row` (section-head 15px):
  - "Bảo mật": "Face ID" với công tắc (tự vẽ `.ac-switch` 51×31 kiểu iOS, núm trượt bằng var(--spring)); bật → gọi `App.faceId()`, khớp mới bật; tắt → bật luôn không hỏi. "Đổi mã PIN" → data-go pinSetup với data-p '{"mode":"change"}'. "Phiên web đang mở" + số phiên bên phải → webSessions.
  - "Cửa hàng": "Thông tin nhà thuốc" → storeInfo. "Cài đặt thông báo" → notifSettings.
  - "Hỗ trợ": "Gọi hỗ trợ 1900 6868" → sheet có 2 nút "Gọi 1900 6868" và "Nhắn Zalo" (toast). "Phiên bản" bên phải "0.1 (prototype)", không bấm.
- Nút `.btn-danger.block` "Đăng xuất khỏi điện thoại" → sheet: "Đăng xuất khỏi điện thoại này?", "Các máy tính đang đăng nhập web vẫn mở. Muốn tắt hết thì đăng xuất chúng ở Phiên web trước." [Ở lại] [Đăng xuất] → busy → `App.reset('login')` (màn login có thể chưa có, core tự hiện màn chờ).

## `notifications` (push, từ chuông ở home)
- `App.header({ title: 'Thông báo', right: nút chữ "Đọc hết" })`. Nhóm "Hôm nay"/"Trước đó" theo `DATA.notifications` (time 'Hôm qua' = trước đó).
- Dòng: tile icon theo kind (web: monitor, stock: box warn, revenue: chart, expiry: clock warn), tiêu đề (chưa đọc: 600 + nền dòng `var(--teal-50)`; đã đọc: 500 nền thường) — KHÔNG dùng chấm "chưa đọc", giờ bên phải 13px.
- Tap: web → `App.go('webConfirm', { from: 'push' }, 'up')`, stock → lowStock, revenue → `App.tab('revenue')`, expiry → expiring; đánh dấu đã đọc.
- "Đọc hết" → mọi dòng về đã đọc (transition nền), toast "Đã đọc hết". Rỗng → `.empty` "Chưa có thông báo nào." (state riêng).

## `notifSettings` (push)
- Header "Cài đặt thông báo". `.card` các dòng có công tắc: "Yêu cầu đăng nhập web" (luôn bật, công tắc mờ khóa, dòng phụ "Luôn bật để không bỏ lỡ ai đang đăng nhập web."), "Thuốc sắp hết hàng", "Hàng cận hạn", "Tổng kết doanh thu cuối ngày" (dòng phụ "Gửi lúc 21:00"). Đổi công tắc → toast "Đã lưu".

## `storeInfo` (push)
- Header "Thông tin nhà thuốc". `.card` dạng nhãn trên, giá trị dưới: Tên, Chi nhánh, Địa chỉ (xuống hàng tự nhiên), Chủ nhà thuốc, Số điện thoại. Câu cuối 13px: "Sửa thông tin trên web, mục Cài đặt."

## State QA (nhóm 'Tài khoản')
"Tài khoản", "Tài khoản: xác nhận đăng xuất", "Thông báo", "Thông báo: rỗng", "Cài đặt thông báo", "Thông tin nhà thuốc".

Lệnh kiểm tra: `node prototype/tools/check.mjs account,notifications,notifSettings,storeInfo`
