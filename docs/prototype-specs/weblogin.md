# Việc: đăng nhập web bằng điện thoại — file `prototype/screens/weblogin.js`

Đây là TÍNH NĂNG CHÍNH của app. Tiền tố CSS: `.wl-`. Màn: `webScan`, `webConfirm`, `webDone`, `webSessions`.

## Luồng (đã chốt thiết kế bảo mật, chỉ dựng UI theo đúng)
1. Trang đăng nhập web hiện mã QR (đổi mỗi 2 phút) + một số 2 chữ số.
2. Điện thoại quét QR (hoặc nhận thông báo đẩy khi người dùng nhập SĐT trên web) → màn xác nhận hiện thông tin máy đang xin đăng nhập.
3. Chủ CHỌN ĐÚNG số đang hiện trên web trong 3 số (chống bấm duyệt nhầm/duyệt hộ kẻ gian) → Face ID → web vào thẳng.
4. Chọn sai số = hủy yêu cầu luôn (không cho thử lại), vì có thể là người khác đang xin đăng nhập.
Dữ liệu mẫu: `DATA.webRequest` (code 47, choices [82, 47, 15], expiresIn 120 giây), `DATA.webSessions`.

## `webScan` (mở bằng `App.go('webScan', {}, 'up')` từ nút quét ở dock)
- `cls: 'dark'`, `statusLight: true`. Nền giả camera: `var(--teal-950)` với lớp nhiễu/hạt rất nhẹ bằng CSS (repeating-radial-gradient mờ), KHÔNG dùng đốm blur màu.
- Trên: nút đóng tròn 44px `.glass-clear` (data-back, icon x), tiêu đề trắng 17px "Quét mã trên web".
- Giữa: khung ngắm 248×248, chỉ 4 góc ngoặc trắng bo tròn (nét 4px, dài 36px), "thở" nhẹ scale .98 ↔ 1; một vạch quét mảnh màu `var(--mint)` chạy lên xuống 2s; ngoài khung tối hơn (box-shadow 0 0 0 999px rgba tối).
- Sau 1800ms giả lập nhận mã: 4 góc co vào ôm lấy mã (transition `var(--pop)`), khung chớp viền `var(--mint)`, 350ms sau → `App.go('webConfirm', { from: 'scan' }, 'push')`. Không nhận nếu người dùng đã rời màn (kiểm `el.isConnected`).
- Đáy: khối `.glass-clear` bo 24: câu 15px trắng "Mở trang đăng nhập PharmaPOS trên máy tính, rồi đưa mã QR vào khung." + nút tròn đèn pin (bật/tắt, đổi icon, toast "Đã bật đèn").
- Biến thể p.state:
  - 'denied' (chưa cấp camera): thay khung bằng `.empty` chữ trắng: "PharmaPOS cần camera để quét mã đăng nhập web. Camera chỉ bật khi bạn mở màn này." + `.btn-primary` "Mở Cài đặt" (toast "Mở Cài đặt của iPhone").
  - 'expired': nhận mã xong mở sheet: "Mã đã hết hạn", "Tải lại trang đăng nhập trên máy tính để lấy mã mới.", nút "Quét lại" (đóng sheet, chạy lại giả lập).

## `webConfirm`
- Nền sáng, header có nút đóng (icon x, data-back), không tab. Tiêu đề lớn "Đăng nhập web quản lý?"
- DẤU ẤN: thẻ thông tin máy làm như tem in A6 của nhà thuốc: `.card` có mép trên răng cưa (mask radial-gradient như `.hm-band` ở home.js nhưng ở cạnh trên), bên trong các dòng nhãn trên/giá trị dưới hoặc 2 cột nhãn trái giá trị phải:
  Trình duyệt "Safari trên macOS", Máy "iMac quầy thuốc", Vị trí "Quận 3, TP.HCM (ước tính theo IP)", Địa chỉ IP, Thời gian "14:36 hôm nay".
- Đếm ngược: "Hết hạn sau 1:58" (`.num`, mỗi giây). Hết giờ → các nút khóa xám, khối báo "Yêu cầu đã hết hạn. Tải lại trang web để thử lại." + nút "Về trang chủ".
- Chọn số: nhãn "Chọn số đang hiện trên màn hình máy tính"; 3 nút số lớn (ô 96×88, bo 20, số 34px 700 `.num`), nền `.card`.
  - Đúng (47): ô chuyển `var(--teal-700)` chữ trắng + pop → `App.faceId()` → đúng: `App.go('webDone', {}, 'fade')`; Face ID sai: ô trở lại, dòng "Face ID không khớp." + nút "Thử lại Face ID".
  - Sai: ô rung, chuyển `var(--bad-soft)`; 500ms sau cả khối thay bằng trạng thái hủy: icon shield trong `.tile.bad` lớn, "Đã hủy yêu cầu đăng nhập", "Số bạn chọn không khớp với máy tính. Nếu không phải bạn đang đăng nhập, hãy đổi mật khẩu web." + `.btn-primary.block` "Về trang chủ" (App.reset('home')) + `.btn-ghost` "Đổi mật khẩu" (toast "Đổi mật khẩu trên web, mục Tài khoản").
- Dưới cùng: `.btn-danger.block` "Không phải tôi, từ chối" → sheet xác nhận: "Từ chối yêu cầu này?", "Máy tính sẽ không đăng nhập được. Bạn có thể đăng nhập lại bất cứ lúc nào." nút "Quay lại" (data-close) và "Từ chối" (danger) → busy 600ms → toast "Đã từ chối đăng nhập" → App.reset('home').
- Biến thể p.unusual = true: khối cảnh báo `var(--warn-soft)` icon alert ngay trên thẻ: "Vị trí này khác nơi bạn thường đăng nhập. Chỉ duyệt nếu chính bạn đang ngồi ở máy đó."

## `webDone`
- Giữa màn: vòng 120px `var(--ok-soft)`, icon check vẽ nét (stroke-dashoffset 1 → 0, 450ms) + gợn sóng lan ra 1 lần (ring scale 1 → 1.6, mờ dần).
- "Đã đăng nhập trên iMac quầy thuốc" (24px), "Trang web sẽ tự mở trong vài giây. Phiên tự đăng xuất sau 12 giờ không dùng." (15px `var(--ink-2)`).
- Nút `.btn-primary.block` "Xong" → App.reset('home'); `.btn-ghost.block` "Xem các phiên web" → App.reset('webSessions').
- Thêm phiên mới vào danh sách hiển thị của `webSessions` (biến trong file, không sửa DATA gốc).

## `webSessions` (push từ home, account)
- `App.header({ title: 'Phiên web đang mở' })`. Mỗi phiên một `.card`: tile icon laptop; dòng 1 "Chrome trên MacBook Pro" (16px 600); dòng 2 "Quận 3, TP.HCM"; dòng 3 "Đăng nhập lúc 08:12 hôm nay, hoạt động 2 phút trước" (13px `var(--ink-3)`); nút `.btn-danger` nhỏ (cao 40) "Đăng xuất máy này".
- Đăng xuất → sheet: "Đăng xuất Chrome trên MacBook Pro?", "Trang web trên máy đó quay về màn đăng nhập ngay." [Giữ lại] [Đăng xuất] → busy "Đang đăng xuất..." 700ms → thẻ co lại và mờ đi (height → 0, 350ms) → toast "Đã đăng xuất MacBook Pro".
- Có ≥ 2 phiên → nút dưới cùng `.btn-secondary.block` "Đăng xuất tất cả máy tính" (cùng kiểu xác nhận).
- Rỗng: `.empty` với tile monitor: "Chưa có máy tính nào đăng nhập.", "Mở trang đăng nhập PharmaPOS trên máy tính rồi quét mã.", nút `.btn-primary` "Quét mã" (data-go="webScan" data-mode="up").
- Skeleton lần đầu bằng `App.load(el, 'webSessions')` + `data-skel`.

## Thông báo đẩy
State QA "Web xin đăng nhập (thông báo đẩy)": `App.reset('home')` rồi 700ms sau `App.notify({ title: 'Yêu cầu đăng nhập web', body: 'Safari trên iMac quầy thuốc, Quận 3. Chạm để duyệt.', onTap: () => App.go('webConfirm', { from: 'push' }, 'up') })`.

## State QA (nhóm 'Đăng nhập web')
"Quét mã", "Quét mã: chưa cấp camera", "Quét mã: mã hết hạn", "Xác nhận đăng nhập", "Xác nhận: vị trí lạ", "Xác nhận: hết hạn" (đếm ngược bắt đầu từ 3 giây), "Đăng nhập web thành công", "Web xin đăng nhập (thông báo đẩy)", "Phiên web đang mở", "Phiên web: chưa có".

Lệnh kiểm tra: `node prototype/tools/check.mjs webScan,webConfirm,webDone,webSessions`
