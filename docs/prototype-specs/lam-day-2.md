# Việc: làm đầy các màn còn trống phía dưới — `prototype/screens/tools.js` và `prototype/screens/account.js`

Người dùng góp ý: nhiều màn trống nửa dưới. Thêm NỘI DUNG CÓ ÍCH (không trang trí, không chữ độn) để nội dung kéo tới gần đáy màn 844px (mục tiêu đáy nội dung ≥ 700px).
Giữ nguyên phần đang có, chỉ thêm. Dữ liệu mẫu mới khai báo hằng trong file màn. Theo đúng luật chung ở trên.

## tools.js
### `expiring`
- Đầu màn (dưới header, không card): "Giá trị hàng cận hạn" 13px, số tiền 28px 700 `.num` (tổng giá trị, tự đặt giá mẫu từng lô), dòng "3 lô trong 30 ngày, 4 lô từ 31 đến 90 ngày".
- Danh sách chia 2 nhóm có section-head: "Trong 30 ngày" (3 lô hiện có) và "Từ 31 đến 90 ngày" (thêm 4 lô mẫu: Hapacol 250, Vitamin C 500 DHG, Gaviscon, Strepsils; chip `.chip` thường, không màu cảnh báo).
- Cuối: `.btn-secondary.block` "Xuất danh sách cho nhà cung cấp" → busy → toast "Đã tạo danh sách, mở trên web để in".
### `payables`
- Giữ tổng nợ + danh sách. Thêm `.section` "Đã trả gần đây": 4 dòng (nhà cung cấp, "Trả ngày 20/11, chuyển khoản", số tiền phải màu `var(--ink-2)`): Dược Hậu Giang 6.850.000 ₫, Dược Phúc Long 3.200.000 ₫, Zuellig Pharma 12.400.000 ₫, Dược Tâm Đức 1.980.000 ₫.
- Trạng thái rỗng (sau khi trả hết) vẫn hiện "Đã trả gần đây" (có thêm dòng vừa trả lên đầu).
### `shifts`
- Trên danh sách: dải thời gian ngày 7h → 22h (không card, cao ~56px): 2 thanh ngang bo tròn cho Ca sáng (7–14) và Ca chiều (14–22) đặt theo tỷ lệ giờ, ca đang chạy `var(--teal-600)`, ca đã xong `var(--teal-200)`; vạch dọc mảnh "Bây giờ 14:36" `var(--ink)`; nhãn giờ 12px bên dưới 7h, 12h, 17h, 22h.
- Dưới danh sách: `.section` "Doanh thu theo ca": `.card` 2 dòng: "Ca sáng, đã xong" 9.860.000 ₫ + "58 hóa đơn, Ngọc Hân và Minh Tuấn"; "Ca chiều, đang chạy" 2.620.000 ₫ + "28 hóa đơn, Thu Trang". (tổng khớp 12.480.000 ₫).
### `stockSearch`
- Khi chưa gõ: dưới "Tìm gần đây" thêm `.section` "Bán chạy hôm nay": `.card` 5 dòng: hạng số 1–5 (14px 700 `var(--ink-3)`, cột 24px), tên thuốc, dòng phụ "Đã bán 18 hộp, còn 3" , bên phải doanh thu `.num`.

## account.js
### `notifications`
- Thêm 5 thông báo mẫu nhóm "Trước đó" (trộn loại): "Đã từ chối đăng nhập web, Edge trên Windows" (web), "Tổng kết doanh thu thứ Hai 9.870.000 ₫" (revenue), "Oresol 245 sắp hết" (stock), "Phiếu nhập Dược Hậu Giang đã thanh toán" (revenue, icon wallet), "Lô Smecta SM118 còn 25 ngày" (expiry). Thời gian "Thứ Hai", "23/11"...
### `notifSettings`
- Thêm `.section` "Giờ yên lặng": dòng công tắc "Tắt tiếng từ 22:00 đến 7:00" + dòng phụ "Yêu cầu đăng nhập web vẫn báo bình thường."
- Thêm `.section` "Ngưỡng cảnh báo": dòng "Báo hết hàng khi còn dưới" bên phải "mức tối thiểu" + chevron (toast "Chỉnh trên web, mục Kho"); dòng "Báo cận hạn trước" bên phải "30 ngày" + chevron (mở sheet chọn 15 / 30 / 60 / 90 ngày dạng `.seg`, chọn xong toast "Đã lưu" và cập nhật chữ bên phải).
### `storeInfo`
- Thêm `.section` "Giờ mở cửa": `.card` 2 dòng: "Thứ Hai đến Thứ Bảy" 7:00 đến 22:00; "Chủ nhật" 7:30 đến 21:00.
- Thêm `.section` "Gói PharmaPOS": `.card`: "Gói Nhà thuốc", dòng phụ "3 nhân viên, 1 chi nhánh. Gia hạn ngày 15/01/2027".

Lệnh kiểm tra: `node prototype/tools/check.mjs expiring,payables,shifts,stockSearch,notifications,notifSettings,storeInfo`
