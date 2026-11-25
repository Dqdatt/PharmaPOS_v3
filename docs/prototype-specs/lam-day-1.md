# Việc: làm đầy các màn còn trống phía dưới — `prototype/screens/weblogin.js` và `prototype/screens/revenue.js`

Người dùng góp ý: nhiều màn trống nửa dưới. Thêm NỘI DUNG CÓ ÍCH (không trang trí, không chữ độn) để nội dung kéo tới gần đáy màn 844px (mục tiêu đáy nội dung ≥ 700px).
Giữ nguyên phần đang có, chỉ thêm. Dữ liệu mẫu mới khai báo hằng trong file màn. Theo đúng luật chung ở trên (chữ ≥ 12px, không "·", không chấm màu, `App.esc`, token màu).

## weblogin.js — `webSessions`
- Dưới danh sách phiên: `.section` "Lịch sử đăng nhập web" một `.card` 5 dòng `.row`, mỗi dòng: tile icon (duyệt: `check` tile ok; từ chối: `x` tile bad; hết hạn: `clock` tile thường), tiêu đề "Đã duyệt Chrome trên MacBook Pro" / "Đã từ chối Edge trên Windows" / "Yêu cầu hết hạn, Safari trên iPhone", dòng phụ "Quận 3, TP.HCM, 08:12 hôm nay" (hoặc "Quận 7, TP.HCM, 22:41 hôm qua"...). Khi duyệt xong ở webDone thì thêm 1 dòng "Đã duyệt Safari trên iMac quầy thuốc" lên đầu.
- Cuối cùng một khối ghi chú (không phải card, chữ 13px `var(--ink-3)`, icon shield) : "Mỗi lần đăng nhập web đều cần điện thoại này duyệt. Phiên tự đăng xuất sau 12 giờ không dùng."
- Trạng thái rỗng (state "Phiên web: chưa có") vẫn hiện phần Lịch sử bên dưới.

## revenue.js — `invoices`
- Trên ô tìm: dòng tóm tắt 2 cột (không card): trái "86 hóa đơn" (20px 700) + "hôm nay" (13px), phải `App.money(12480000)` (20px 700 `.num`) + "tổng tiền".
- Dưới ô tìm: hàng chip lọc cuộn ngang 1 dòng: "Tất cả", "Chuyển khoản", "Tiền mặt", "Thẻ" (`.chip`, chip đang chọn nền `var(--teal-700)` chữ `var(--on-dark)`), lọc danh sách ngay, kết hợp với ô tìm. Không có kết quả → `.empty` như hiện tại.
- Thêm 7 hóa đơn mẫu nữa (HD2511-081 → 075, giờ lùi dần từ 13:28 tới 11:05, tên thuốc thật như Panadol, Efferalgan, Decolgen, Vitamin C, Oresol, Telfast, Smecta, Berberin; tổng 45.000–320.000 ₫, đủ 3 hình thức thanh toán) — gộp với `DATA.invoices` trong file này.
- Nhóm theo khung giờ bằng tiêu đề nhỏ 13px 600 `var(--ink-2)`: "Chiều" (từ 13:00) và "Sáng".

## revenue.js — `invoiceDetail`
- Mỗi dòng thuốc trong hóa đơn thêm dòng phụ 13px `var(--ink-3)` về cách dùng (tính năng có sẵn trên web: sáng/trưa/chiều-tối): vd "Sáng 1, tối 1 viên, sau ăn"; "Khi sốt, cách 4 đến 6 giờ"; "Pha 1 gói với 200 ml nước". Sinh ổn định theo tên thuốc (bảng tra nhỏ trong file, thuốc lạ thì "Theo chỉ dẫn của dược sĩ").
- Dưới hóa đơn, trên nút In lại: khối "Khách hàng" `.card`: "Khách lẻ" + "Không lưu thông tin khách" (hóa đơn HD2511-085 thì có khách: "Chị Lan, 0912 *** 208, mua lần thứ 6").
- Thay 1 nút thành hàng 2 nút ngang bằng nhau: `.btn-secondary` "In lại" (icon printer, giữ hành vi cũ) và `.btn-secondary` "Gửi Zalo" (busy "Đang gửi..." → toast "Đã gửi hóa đơn qua Zalo").

Lệnh kiểm tra: `node prototype/tools/check.mjs webSessions,invoices,invoiceDetail,revenue`
