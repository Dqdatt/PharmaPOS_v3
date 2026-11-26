# PharmaPOS V3 — quy tắc dự án (Claude, Codex, Antigravity cùng đọc)

Phần mềm bán hàng + quản lý nhà thuốc chạy trên web (bán lẻ, kho, nhập/xuất, báo cáo, nhân viên, in tem/hóa đơn).
Tên hiển thị cho người dùng là **MediPOS** (web và app), logo là icon notes-medical (`public/favicon.svg`). Đang làm thêm **app điện thoại cho chủ nhà thuốc**: duyệt đăng nhập web bằng điện thoại, xem doanh thu, tiện ích. Bước hiện tại là prototype HTML ở `prototype/`.

## Stack
- Web: React 19 + Vite 6 + TypeScript 5.8, Tailwind 4 (`@tailwindcss/vite`), `motion`, `lucide-react`, `recharts`, `react-router-dom` 7.
- Dữ liệu: Supabase (`src/lib/supabase.ts`, gọi `supabase.from('<bảng>')` thẳng trong context/view). Bảng chính: products, invoices, purchases, purchase_items, export_orders, suppliers, users, staff_logs, payment_orders, inventory_history.
- Schema: `supabase/schema.sql` + `supabase/migrations/`.

## Lệnh
- `npm run dev` → http://localhost:3000 (preview tên `dev` trong `.claude/launch.json`)
- Supabase local: `supabase start` → `npm run db:reset` (schema + seed + tài khoản auth test, mật khẩu test trong `scripts/seed-auth.mjs`) → `npm run test:rls`. Mã OTP email đọc ở Mailpit http://localhost:54324. `.env.local` trỏ `http://127.0.0.1:54321` + ANON_KEY từ `supabase status`.
- Test iPhone (camera/Face ID cần HTTPS): preview `pwa-tunnel` (`npm run serve:pwa`, cổng 4176, chuyển tiếp Supabase cùng origin) + `cloudflared tunnel --url http://localhost:4176` → link `https://*.trycloudflare.com` (đổi mỗi lần chạy).
- `npm run build` · `npm run lint` (= `tsc --noEmit`) · `npm test` (node:test, `src/__tests__/*.test.ts`)
- Prototype app: `python3 -m http.server 4173 -d prototype` → http://localhost:4173 (preview tên `prototype`); kiểm tự động `node prototype/tools/check.mjs`
- PWA (`pwa/`, chạy nguyên file prototype): `npm run build:pwa` → `pwa/dist/`; `npm run check:pwa`; `npm run verify:pwa` (so ảnh 0 pixel với prototype). Link test: GitHub Pages nhánh `gh-pages` (https://dqdatt.github.io/PharmaPOS_v3/)

## Cấu trúc
- `src/views/` — mỗi màn web một file (POS, Inventory, Imports, Exports, Reports, Employees, LabelMaker, Login, MainApp, CustomerView)
- `src/contexts/PosContext.tsx` — state chung + gọi Supabase
- `src/components/` (autocomplete, liều dùng) · `src/components/modals/` · `src/utils/` (hàm thuần, có test)
- `prototype/` — prototype app điện thoại (HTML/CSS/JS thuần, không build)

## Quy ước
- Giao diện tiếng Việt; màu thương hiệu teal (`teal-600/700` trên web). Thông báo qua `showNotification` (`src/utils/toast.ts`).
- Lỗi DB đọc qua `getDbErrorMessage`; cột mới có fallback payload cũ (`src/utils/dbFallback.ts`).
- Commit dạng `v3.x.y - mô tả ngắn không dấu`.

## Chia việc
- Mọi yêu cầu sửa/dựng (kể cả góp ý qua lại trong phiên) → Claude viết đặc tả, chia qua `giao`; Claude chỉ tự làm vùng nhạy cảm và file khung.
- PWA không có giao diện riêng: sửa giao diện ở `prototype/`, rồi build lại `pwa/`.

## Vùng nhạy cảm (chỉ Claude phiên chính làm, effort xhigh)
- Tiền: doanh thu/báo cáo (`reportRevenue.ts`), thanh toán nhập hàng (`purchasePayment.ts`), VietQR/ngân hàng.
- Đăng nhập + phân quyền (`docs/AUTH_PLAN.md`): Supabase Auth (OTP email), 3 vai trò `admin|manager|staff`, RLS ở `supabase/migrations/20261126090000_auth_roles_rls.sql`. `Login.tsx` còn so PIN (cũ, sẽ thay bằng QR). Mọi việc đụng auth, đăng nhập web bằng điện thoại, MFA.
- Tồn kho/trigger DB, migration.

## Prototype app (`prototype/`) — quy tắc UI bắt buộc
Nguồn chuẩn để sau này port 1:1 sang app native. Khung `index.html`, `css/app.css`, `js/core.js`, `js/data.js` do Claude giữ — nhân viên KHÔNG sửa; mỗi nhóm màn là một file `screens/<nhóm>.js` (+ CSS riêng của màn viết trong chính file đó qua `App.css(...)`).
- Khung iPhone 390×844. Dùng token trong `css/app.css` (`var(--...)`), không viết mã màu cứng trong màn.
- Liquid glass CHỈ ở lớp nổi (tab bar, nút nổi, sheet, banner, chip trên ảnh): lớp `.glass`. Nội dung để đọc dùng `.card` nền đặc. Không lồng kính trong kính.
- Không nét "AI": không chip có chấm ở mọi mục, không ô icon nghiêng, không đốm blur nền, không chữ gradient, không lưới thẻ giống hệt nhau; mỗi khối một bố cục.
- Chữ ≥ 12px. Không rớt chữ: nhãn 1 dòng dùng `.ell`, câu dài xuống hàng tự nhiên. Ít chữ giải thích, bỏ subtext thừa.
- Không nhảy layout khi đổi tab/trạng thái (giữ chiều cao cố định). Tải dữ liệu → `App.skeleton()`, không để màn trống.
- Bấm là phản hồi ngay: nút chuyển trạng thái xử lý (xám + chữ trạng thái), không để bấm lại.
- Sinh trắc học: gọi `App.faceId()` (mô phỏng hộp thoại hệ thống iOS), không tự vẽ modal Face ID.
- Animation dùng `var(--ease)`/`var(--spring)`; chuyển màn qua `App.go/back`, không tự viết transition riêng.
- Số tiền định dạng `App.money()` (12.480.000 ₫). Dữ liệu mẫu lấy từ `DATA` (js/data.js); cần thêm thì khai báo trong file màn của mình.
- Mỗi màn/trạng thái đăng ký `App.state(...)` để hiện trong bảng QA bên trái.

## Lưu ý
- `.env`, `.env.local` không commit. `.env.example` chỉ chứa URL + publishable key (công khai được).
- `dist/`, `node_modules/` sinh ra, không sửa tay.
