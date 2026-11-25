# Việc: tab Doanh thu + hóa đơn, tab Tiện ích + các màn kho — file `prototype/screens/revenue.js` và `prototype/screens/tools.js`

Tiền tố CSS: `.rv-` (revenue.js), `.tl-` (tools.js). Dữ liệu: `DATA.today`, `DATA.week`, `DATA.month`, `DATA.invoices`, `DATA.lowStock`, `DATA.expiring`, `DATA.payables`, `DATA.shifts`.

## revenue.js — màn `revenue` (tab: 'revenue'), `invoices`, `invoiceDetail`

### `revenue`
- Không header nav; `.page-title` "Doanh thu" có padding trên `calc(var(--sat) + 12px)`.
- `.seg` 3 lựa chọn "Hôm nay" / "7 ngày" / "Tháng này", `.seg-thumb` trượt (đặt left/width theo nút được chọn). Đổi lựa chọn KHÔNG nhảy layout: khung số và khung biểu đồ cao cố định.
- Khối chính (không phải card, đặt thẳng trên nền trang): nhãn 15px `var(--ink-2)`, số to 40px 800 `.num` (₫ nhỏ 22px mờ), đếm lên `App.countUp` mỗi lần đổi lựa chọn; câu so sánh có icon up/downRight màu `var(--ok)`/`var(--bad)`:
  - Hôm nay: "Cao hơn hôm qua 8,2%" (tính từ DATA). Biểu đồ cột theo giờ 7h–22h như home nhưng nền sáng (cột `var(--teal-200)`, giờ hiện tại `var(--teal-700)`, giờ chưa tới `var(--soft)`).
  - 7 ngày: tổng 7 ngày, "Trung bình 12,6 tr mỗi ngày" (tính); 7 cột có nhãn T5…T4 bên dưới, hôm nay `var(--teal-700)`. CHẠM một cột → bong bóng nhỏ phía trên cột ghi "T7 21/11" + số tiền, cột đó đậm lên; chạm chỗ khác bỏ chọn.
  - Tháng này: số tháng + "Cao hơn cùng kỳ tháng trước 7,5%" (tính từ lastMonthSameDay); thay biểu đồ bằng thanh tiến độ mục tiêu: "Mục tiêu 400 tr", thanh dày 12 bo tròn chạy tới 80% (animation width), dưới: "Còn 81,4 tr, 5 ngày nữa hết tháng".
  - Cột mọc từ dưới lên (scaleY, var(--spring), stagger 30ms) mỗi lần đổi.
- `.section` "Hình thức thanh toán": một `.card`, mỗi dòng: tên, số tiền phải, dưới là thanh mảnh 6px theo tỷ lệ (màu `var(--teal-600)` trên nền `var(--soft)`) và "% tổng" 13px. KHÔNG dùng chấm màu chú thích.
- `.section` "Theo nhân viên": `.card`, dòng: chữ cái đầu trong vòng tròn 36px `var(--teal-50)`, tên + "41 hóa đơn", số tiền phải; dùng số liệu Hôm nay (ghi rõ "Hôm nay" ở section-head khi đang xem 7 ngày/tháng).
- `.section` "Hóa đơn" link "Xem tất cả" → `invoices`.
- Skeleton lần đầu `App.load(el, 'revenue')`.

### `invoices` (push)
- Header "Hóa đơn hôm nay"; ô tìm (nền `var(--card)`, icon search, placeholder "Tìm theo mã hoặc tên thuốc") lọc ngay khi gõ trên id + tên thuốc; dòng giống "Bán gần đây" ở home (giờ, các món, người bán + hình thức, số tiền). Không có kết quả → `.empty` "Không thấy hóa đơn khớp với "xyz"." Tap → `invoiceDetail`.

### `invoiceDetail` (push, p.id)
- DẤU ẤN: hóa đơn trông như cuộn giấy in: `.card` mép trên và dưới răng cưa, đầu: tên nhà thuốc + địa chỉ (13px, giữa), mã HD + giờ; các dòng thuốc: tên, "2 x 35.000 ₫" phải (giá mẫu tự sinh ổn định từ tổng, tổng các dòng PHẢI bằng total); đường kẻ đứt; "Tổng cộng" 20px 700; hình thức thanh toán; người bán.
- Nút `.btn-secondary.block` "In lại hóa đơn" → busy "Đang gửi tới máy in..." 1000ms → toast "Đã in hóa đơn" icon printer.
- id không tồn tại → `.empty` "Không tìm thấy hóa đơn này."

## tools.js — màn `tools` (tab: 'tools'), `lowStock`, `expiring`, `payables`, `shifts`, `stockSearch`

### `tools`
- `.page-title` "Tiện ích" (padding trên như revenue). Ô tìm giả (chạm → `stockSearch`): "Tìm thuốc, số lô".
- Khối đầu: 2 thẻ cạnh nhau KHÁC NHAU về nội dung: trái "Sắp hết hàng" số lớn 32px "5" + "thuốc", phải "Cận hạn" số lớn "3" + "lô trong 30 ngày"; tile màu warn; tap → màn tương ứng.
- Phía dưới các nhóm danh sách `.card` + `.row`: "Bán hàng": Hóa đơn hôm nay (86) → invoices, Công nợ nhà cung cấp (4.200.000 ₫) → payables. "Nhân viên": Ca làm hôm nay (3 người) → shifts. "Cửa hàng": In tem A6 → toast "Dùng trên web, mục In tem", Máy in và máy quét → toast tương tự.

### `lowStock` (push)
- Header "Sắp hết hàng"; mỗi dòng: tên thuốc, "Còn 3 hộp, tối thiểu 10" + thanh mảnh tỷ lệ left/min (màu `var(--warn)`, ≤ 25% thì `var(--bad)`).
- Thanh dưới cố định `.glass-strong` (đáy, bo 28, cách mép 8): "Tạo phiếu nhập 5 thuốc" `.btn-primary.block` → busy "Đang tạo phiếu..." → toast "Đã tạo phiếu nháp, hoàn tất trên web". Màn chừa đáy để không che dòng cuối.

### `expiring` (push)
- Header "Hàng cận hạn"; sắp theo số ngày; dòng: tên, "Lô L2304, 6 hộp", bên phải chip "17 ngày" (`.chip.warn`, ≤ 7 ngày `.chip.bad`). Tap → sheet chi tiết lô: hạn dùng, số lượng, gợi ý "Ưu tiên bán trước hoặc trả nhà cung cấp."

### `payables` (push)
- Header "Công nợ nhà cung cấp"; tổng nợ lớn ở đầu; dòng: nhà cung cấp, "Hạn trả 28/11", số tiền. Tap → sheet chi tiết + nút "Đánh dấu đã trả" → sheet xác nhận "Đánh dấu đã trả 4.200.000 ₫ cho Công ty Dược Phúc Long?" [Hủy] [Đã trả] → toast "Đã ghi nhận thanh toán". Sau đó danh sách rỗng → `.empty` "Không còn công nợ."

### `shifts` (push)
- Header "Ca làm hôm nay"; dòng: vòng chữ cái đầu, tên, ca, trạng thái dạng chữ màu (`var(--ok)` cho "Đang làm"), không chấm màu.

### `stockSearch` (push)
- Header có ô tìm tự focus; kết quả lọc từ tên thuốc có trong DATA (lowStock, expiring, invoices items, khử trùng lặp), mỗi dòng tên + tồn (thuốc không có trong lowStock thì tồn mẫu cố định, vd "Còn 40"). Chưa gõ → gợi ý "Tìm gần đây" 3 dòng. Không có kết quả → `.empty`.

## State QA
Nhóm 'Doanh thu': "Doanh thu hôm nay", "Doanh thu 7 ngày", "Doanh thu tháng", "Hóa đơn hôm nay", "Hóa đơn: không tìm thấy", "Chi tiết hóa đơn".
Nhóm 'Tiện ích': "Tiện ích", "Sắp hết hàng", "Hàng cận hạn", "Công nợ", "Ca làm", "Tìm thuốc".

Lệnh kiểm tra: `node prototype/tools/check.mjs revenue,invoices,invoiceDetail,tools,lowStock,expiring,payables,shifts,stockSearch`
