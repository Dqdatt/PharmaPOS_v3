# PharmaPOS V3 — quy tắc dự án (Claude, Codex, Antigravity cùng đọc)

Phần mềm bán hàng + quản lý nhà thuốc trên web (bán lẻ, kho, nhập/xuất, báo cáo, nhân viên, in tem/hóa đơn), tên hiển thị **MediPOS**, logo icon notes-medical (`public/favicon.svg`). Kèm **app điện thoại cho chủ nhà thuốc** (đăng nhập POS bằng quét QR, doanh thu, hoá đơn, nhân viên, quản lý tài khoản): prototype HTML `prototype/` chạy dữ liệu thật, đóng gói PWA ở `pwa/`.
Tiến độ: M1–M9 xong (đã lên DB thật 26/11/2026, `docs/GO_LIVE.md`), đang M10 góp ý trên iPhone. Việc mở: `docs/TASKS.md` · bàn giao phiên: `HANDOFF.md`.

## Stack
- Web: React 19 + Vite 6 + TypeScript 5.8, Tailwind 4 (`@tailwindcss/vite`), `motion`, `lucide-react`, `recharts`, `react-router-dom` 7.
- Dữ liệu: Supabase (`src/lib/supabase.ts`, gọi `supabase.from('<bảng>')` thẳng trong context/view). Bảng chính: products, invoices, purchases, purchase_items, export_orders, suppliers, users, staff_logs, payment_orders, inventory_history.
- Schema: `supabase/schema.sql` + `supabase/migrations/`. Edge Functions (Deno) `supabase/functions/`: admin-create-user, dashboard, passkey, push, web-login (+ `_shared/`).

## Lệnh
- `npm run dev` → http://localhost:3000 (preview `dev`). `.env.local`: `VITE_SUPABASE_URL=http://127.0.0.1:54321` + `VITE_SUPABASE_ANON_KEY` lấy từ `supabase status`.
- Supabase local: `supabase start` → `npm run db:reset` (schema + seed + tài khoản test, mật khẩu trong `scripts/seed-auth.mjs`) → `npm run test:rls` (ngay sau reset) → `test:web-login` · `test:passkey` · `test:push`. Mã OTP đọc ở Mailpit http://localhost:54324. Thêm function mới → `supabase stop && supabase start` mới được phục vụ.
- `npm run build` · `npm run lint` (= `tsc --noEmit`) · `npm test` (node:test, `src/__tests__/*.test.ts`)
- Prototype: `python3 -m http.server 4173 -d prototype` → http://localhost:4173 (preview `prototype`); kiểm tự động `node prototype/tools/check.mjs`
- PWA: `npm run build:pwa` → `pwa/dist/`; `npm run check:pwa`; `npm run verify:pwa` (so ảnh 0 pixel với prototype).
- Test iPhone (camera/Face ID cần HTTPS): preview `pwa-tunnel` (`npm run serve:pwa`, cổng 4176, chuyển tiếp Supabase cùng origin) + `cloudflared tunnel --url http://localhost:4176` → link `https://*.trycloudflare.com` (đổi mỗi lần chạy).

## Cấu trúc
- `src/views/` — mỗi màn web một file (POS, Inventory, Imports, Exports, Reports, Employees, LabelMaker, Login, MainApp, CustomerView)
- `src/contexts/PosContext.tsx` — state chung + gọi Supabase · `src/lib/` (supabase, webLogin)
- `src/components/` (autocomplete, liều dùng) · `src/components/modals/` · `src/utils/` (hàm thuần, có test)
- `prototype/` — app điện thoại (HTML/CSS/JS thuần, không build); `js/api.js` là lớp duy nhất gọi Supabase (local/tunnel/thật theo host, chỗ khác là mock, OTP 123456)
- `pwa/` vỏ PWA build từ prototype · `scripts/` seed, `link-account.mjs` (nối tài khoản cũ), test-* · `docs/` AUTH_PLAN, GO_LIVE, TASKS, `prototype-specs/` (đặc tả từng màn)

## Quy ước
- Giao diện tiếng Việt; màu thương hiệu teal (`teal-600/700` trên web). Thông báo qua `showNotification` (`src/utils/toast.ts`).
- Lỗi DB đọc qua `getDbErrorMessage`; cột mới có fallback payload cũ (`src/utils/dbFallback.ts`).
- Commit dạng `v3.x.y - mô tả ngắn không dấu`.

## Chia việc
- Mọi yêu cầu sửa/dựng (kể cả góp ý qua lại trong phiên) → Claude viết đặc tả, chia qua `giao`; Claude chỉ tự làm vùng nhạy cảm và file khung.
- PWA không có giao diện riêng: sửa giao diện ở `prototype/`, rồi build lại `pwa/`.

## Vùng nhạy cảm (chỉ Claude phiên chính làm, effort xhigh)
- Tiền: doanh thu/báo cáo (`reportRevenue.ts`; function `dashboard` phải ra cùng số), thanh toán nhập hàng (`purchasePayment.ts`), VietQR/ngân hàng.
- Đăng nhập + phân quyền (`docs/AUTH_PLAN.md`): Supabase Auth (OTP email), 3 vai trò `admin|manager|staff`, RLS + phiên trong các migration `20261126*`, POS đăng nhập bằng QR (`Login.tsx`), passkey/Face ID, push, `prototype/js/api.js`, mọi Edge Function.
- Tồn kho/trigger DB, migration, `scripts/link-account.mjs`, mọi thao tác trên DB thật.

## Prototype app (`prototype/`) — quy tắc UI bắt buộc
Nguồn chuẩn để sau này port 1:1 sang app native. Khung `index.html`, `css/app.css`, `js/core.js`, `js/data.js`, `js/api.js` do Claude giữ — nhân viên KHÔNG sửa; mỗi nhóm màn là một file `screens/<nhóm>.js` (+ CSS riêng của màn viết trong chính file đó qua `App.css(...)`).
- Khung iPhone 390×844. Dùng token trong `css/app.css` (`var(--...)`), không viết mã màu cứng trong màn.
- Liquid glass CHỈ ở lớp nổi (tab bar, nút nổi, sheet, banner, chip trên ảnh): lớp `.glass`. Nội dung để đọc dùng `.card` nền đặc. Không lồng kính trong kính.
- Không nét "AI": không chip có chấm ở mọi mục, không ô icon nghiêng, không đốm blur nền, không chữ gradient, không lưới thẻ giống hệt nhau; mỗi khối một bố cục.
- Chữ ≥ 12px. Không rớt chữ: nhãn 1 dòng dùng `.ell`, câu dài xuống hàng tự nhiên. Ít chữ giải thích, bỏ subtext thừa.
- Không nhảy layout khi đổi tab/trạng thái (giữ chiều cao cố định). Tải dữ liệu → `App.skeleton()`, không để màn trống.
- Bấm là phản hồi ngay: nút chuyển trạng thái xử lý (xám + chữ trạng thái), không để bấm lại.
- Sinh trắc học: gọi `App.faceId()` (mô phỏng hộp thoại hệ thống iOS), không tự vẽ modal Face ID.
- Animation dùng `var(--ease)`/`var(--spring)`; chuyển màn qua `App.go/back`, không tự viết transition riêng.
- Số tiền định dạng `App.money()` (12.480.000 ₫). Dữ liệu thật lấy qua `API.*` (js/api.js); dữ liệu mẫu từ `DATA` (js/data.js), cần thêm thì khai báo trong file màn của mình.
- Mỗi màn/trạng thái đăng ký `App.state(...)` để hiện trong bảng QA bên trái.

## Lưu ý
- `.env`, `.env.local` không commit. `.env.example` chỉ chứa `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (publishable, công khai được).
- `dist/`, `pwa/dist/`, `node_modules/` sinh ra, không sửa tay.
- DB thật (project `fbppvryvfdeohocsgwtl`) có dữ liệu bán hàng thật; mọi thao tác trên nó hỏi người dùng trước. POS thật = Netlify `pharmapos-v3.netlify.app`, tự deploy từ `main`; app = site Netlify riêng `medipos-app.netlify.app` (build `npm run build:pwa`, publish `pwa/dist`, cấu hình trong giao diện Netlify — không thêm `netlify.toml` vì đè cấu hình site POS), cũng tự deploy từ `main` và tự trỏ DB thật → mọi push lên `main` = deploy thật cả POS lẫn app, hỏi người dùng trước. Không dùng GitHub Pages.
- iOS không nhớ quyền camera của PWA qua mỗi lần mở app (giới hạn WebKit) → quét QR xin quyền tối đa 1 lần/lần mở; không đổi `location.hash` khi chuyển màn (đổi hash làm iOS hỏi lại).
