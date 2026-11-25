# Luật chung cho mọi việc prototype (đọc kỹ trước khi làm)

Bối cảnh: `prototype/` là prototype app điện thoại PharmaPOS (HTML/CSS/JS thuần, không build, không thư viện ngoài) cho chủ nhà thuốc:
duyệt đăng nhập web bằng điện thoại, xem doanh thu, tiện ích. Sau này port 1:1 sang app native, nên từng chi tiết phải chỉn chu.
Đọc `AGENTS.md` mục "Prototype app" (luật UI bắt buộc) và `prototype/screens/home.js` (MÀN MẪU — làm theo đúng phong cách này).

## Phạm vi file
- CHỈ sửa file màn được giao trong `prototype/screens/`. KHÔNG sửa `index.html`, `css/app.css`, `js/core.js`, `js/data.js`, `screens/home.js`, `screens/splash.js`, hay file màn của việc khác.
- CSS riêng viết trong file màn qua `App.css(\`...\`)`, tiền tố lớp riêng (vd `.au-` cho auth) để không đụng màn khác.
- Icon thiếu thì thêm trong file màn: `App.icons.ten = '<path .../>'` (lưới 24, nét theo core: stroke 1.8, bo tròn).
- Dữ liệu mẫu đọc từ `DATA` (js/data.js). Cần thêm dữ liệu thì khai báo hằng trong file màn.

## API có sẵn (js/core.js)
- `App.screen(name, { render(p) -> chuỗi HTML, mount(el, p), tab, statusLight, cls })` — `tab` ('home'|'revenue'|'tools'|'account') chỉ cho màn gốc của tab; `statusLight: true` khi đầu màn nền tối; `cls: 'dark'` cho view nền tối.
- Điều hướng: `App.go(name, p, mode)` mode 'push' (mặc định) | 'up' (trình bày từ dưới lên, đóng bằng back) | 'fade' | 'reveal'; `App.back()`; `App.reset(name, p, mode)` (xóa ngăn xếp); `App.tab(name)`.
  Trong HTML: `data-go="ten"` (+ `data-p='{"id":"..."}'`, `data-mode="up"`), `data-back`, `data-tab="revenue"` — core tự bắt sự kiện.
- Khối dựng sẵn: `App.header({ title, back, right })` (thanh trên, tự thành kính khi cuộn), `.page-title` (tiêu đề lớn 28px), `.card`, `.row` + `.row-main/.row-title/.row-sub/.row-end`, `.tile` (+ `.warn/.bad/.ok`),
  `.section` + `.section-head`, `.btn .btn-primary|btn-secondary|btn-ghost|btn-danger` (+ `.block`), `.seg` + `.seg-thumb`, `.chip`, `.empty`, `.num` (số canh cột), `.ell` (nhãn 1 dòng), `.tap` (nhún khi bấm), `.rise` (hiện lên).
- `App.load(el, key, ms)` → skeleton lần đầu: phần tử có `data-skel` thành khối mờ CÙNG KÍCH THƯỚC (không nhảy layout). `App.skeleton(n)` cho danh sách chưa có hình.
- `App.busy(btn, 'Đang ...')` → nút xám + chữ trạng thái, trả hàm khôi phục. `App.toast(text, icon)`, `App.sheet(html, { onMount(sheetEl, close) })` (nút trong sheet có `data-close` để đóng),
  `App.notify({ title, body, onTap })` (banner thông báo đẩy), `App.faceId()` → Promise<boolean> (mô phỏng hộp thoại Face ID HỆ THỐNG; bảng QA có công tắc "không khớp").
- `App.money(n)` → "12.480.000 ₫", `App.num`, `App.pct`, `App.short`, `App.countUp(el, to, ms, fmt)`, `App.esc(text)` (BẮT BUỘC cho mọi chữ lấy từ dữ liệu), `App.icon(name, size)`, `App.appIcon()`, `App.logoMark()`.
- `App.state(nhãn, () => ..., 'Nhóm')` — đăng ký MỌI màn và MỌI trạng thái (lỗi, rỗng, hết hạn...) để hiện ở bảng QA bên trái.

## Luật UI (vi phạm = trả về)
- Khung 390×844. Màu chỉ dùng `var(--...)` trong app.css, không mã màu hex. Chữ ≥ 12px (body 15–16px). Font đã nạp sẵn.
- Liquid glass (`.glass`, `.glass-strong`, `.glass-clear`) CHỈ cho lớp nổi: nút trên ảnh/camera, thanh dưới cố định, sheet. Nội dung đọc dùng `.card` nền đặc. Không lồng kính trong kính.
- Không nét "AI": không dấu "·", "•", " | " để nối chữ (viết câu có dấu phẩy hoặc tách dòng); không chấm tròn màu trạng thái; không chip có chấm; không emoji; không chữ gradient; không lưới ô giống hệt nhau; không chữ uppercase giãn chữ trên mỗi mục.
- Không rớt chữ: nhãn 1 dòng dùng `.ell`; câu dài xuống hàng tự nhiên; thử với chuỗi dài nhất.
- Không nhảy layout khi đổi tab/trạng thái: giữ chiều cao khung, đổi nội dung bên trong.
- Bấm là phản hồi ngay (`App.busy`), thao tác giả lập chờ 600–1200ms bằng setTimeout.
- Animation dùng `var(--ease)`, `var(--spring)`, `var(--pop)`; thời lượng 200–600ms; không fade-up mọi khối.
- Chữ tiếng Việt cụ thể, ngắn: lỗi = chuyện gì + cách sửa; nút = động từ + đối tượng ("Đăng xuất máy này", không "OK").
- Danh sách cuối màn có tab bar: view đã tự chừa đáy (`.with-dock`) cho màn có `tab`.

## Kiểm tra trước khi báo xong
- Chạy lệnh kiểm tra ở cuối đặc tả, phải ĐẠT.
- Mở thử: `python3 -m http.server 4173 -d prototype` rồi vào http://localhost:4173, bấm qua mọi state của mình, console không lỗi.
