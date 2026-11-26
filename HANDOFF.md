# HANDOFF — MediPOS (repo PharmaPOS_V3), 26/11/2026 — nhánh `prototype-mobile` (chưa push, chưa gộp main)

## Mục tiêu phiên này
Bước B: thông báo đẩy Web Push (VAPID). Phần server + `api.js` xong, test tự động đạt. Còn UI (giao) + test iPhone.

## Đã xong
- Trước đó: Supabase local, 3 vai trò + RLS, OTP email + mật khẩu, POS đăng nhập QR, bước A passkey (7d45767). Kế hoạch A–F ở `docs/AUTH_PLAN.md`.
- B server (CHƯA COMMIT lúc viết):
  - Migration `20261126130000_push.sql`: `push_subscriptions` (endpoint chỉ nhận FCM/Apple/Mozilla/WNS — chặn SSRF, tối đa 10 máy/người), `notif_prefs`, `notifications` (màn Thông báo + chống gửi trùng theo user+kind+ref), `push_jobs` (mã cron dùng 1 lần), RPC `push_subscribe/push_unsubscribe/my_notif_prefs/notifications_read`, `push_cron(job)` + 2 job `pg_cron` (14:00 UTC = 21:00 VN doanh thu; 01:00 UTC thứ Hai = 8:00 công nợ). URL function lấy ở Vault `functions_url` (seed local = `http://kong:8000/functions/v1`).
  - `_shared/push.ts` (`notify()`: lưu + đẩy, web-push chỉ mã hoá/ký, gửi bằng fetch, 404/410 xoá máy), function `push` (`key`, `cron`; `verify_jwt = false` trong config.toml), `web-login` poll → báo "Đăng nhập POS mới" cho chính tài khoản (waitUntil).
  - `reportRevenue.ts` chuyển sang `supabase/functions/_shared/`, `src/utils/reportRevenue.ts` chỉ re-export (POS + function dùng chung 1 nguồn). Doanh thu push = `getRetailRevenueForDate().netRevenue` = ô "Doanh thu ngày (bán lẻ)".
  - `pwa/src/sw.js`: `push` + `notificationclick` (app mở → postMessage, chưa mở → `./?notif=<kind>`).
  - `prototype/js/api.js`: `API.me()`, `API.push.{status,enable,disable,prefs,takeOpened,onOpen}`, `API.notifications.{list,read}`; đăng xuất gọi `API.push.disable()`. `data.js`: thông báo mẫu mới.
  - Test: `npm run test:push` (dịch vụ push giả `scripts/lib/fake-push.mjs` kiểm VAPID + giải mã RFC 8291), `test:passkey` thêm kiểm push đăng nhập POS. Đạt: rls, web-login, passkey, push, npm test, lint, build, check.mjs, check:pwa, verify:pwa.

## Đang dở
- Commit phần server (chờ người dùng đồng ý) → rồi `giao them` việc UI (đặc tả: màn Cài đặt thông báo có khối "Thông báo trên máy này" theo `API.push.status()`, công tắc đọc/lưu `API.push.prefs`, thêm "Công nợ nhà cung cấp", bỏ "Giờ yên lặng", NV ẩn doanh thu/công nợ; màn Thông báo đọc `API.notifications`; `App.openNotif(kind)`: revenue→tab revenue, stock→lowStock, expiry→expiring, debt→payables; home gọi `API.push.takeOpened()`). Chỉ sửa `screens/account.js`, `screens/home.js`.
- Sau UI: Claude chạy PWA thật duyệt, rồi test iPhone qua tunnel (phải Thêm vào MH chính).

## Quyết định đã chốt
- Mọi việc qua `giao`; auth/quyền/RLS/migration/tiền → Claude tự làm. 3 vai trò cố định, 1 cơ sở. Admin chỉ dùng app.
- Push: đăng nhập POS luôn báo (cho chính tài khoản). Doanh thu 21:00 + công nợ NCC 8:00 thứ Hai chỉ QL + admin (bật/tắt được). NV chỉ nhận đăng nhập POS. Bỏ giờ yên lặng. Kho/hạn dùng gửi ở bước C. Đăng xuất = xoá đăng ký push máy đó.
- Duyệt đăng nhập POS bắt buộc Face ID. Test trên PWA qua tunnel. Sửa ở `prototype/`, build lại `pwa/`.

## Nợ Ponytail / lưu ý
- `supabase start` TREO vì `security find-generic-password -s "Supabase CLI"` (keychain) khi project đang link. Cách chạy: tạm cất `supabase/.temp/project-ref` → `supabase start` → trả lại file. `db reset` / `status` không bị.
- Khoá VAPID local ở `supabase/functions/.env` (gitignore, `npm run push:keys`, xong phải `supabase stop && supabase start`). Bước F: khoá MỚI làm secret, Vault `functions_url` = URL project, deploy `push` (config đã `verify_jwt = false`).
- Đổi khoá VAPID thì máy cũ nhận 403 (không phải 410) → dòng đăng ký còn, bật lại thông báo trên máy là xong.
- `api.js:11` URL + anon key local viết cứng (bước F). `verify:pwa` chập chờn ~1/5. `test:rls` chạy ngay sau `db:reset`; `test:passkey` chỉ chạy được 1 lần sau reset. Bảng mới phải tự GRANT.
- Bước F: OTP email lạ trả 422; `passkey login-options` chưa giới hạn theo IP. Trình duyệt trong app Claude không chạy WebAuthn.

## Việc tiếp theo
1. Commit B server → giao UI → duyệt (chạy PWA) → test iPhone — [opus xhigh]
2. C — `products.min_stock` + `purchase_items.expiry_date` + ô nhập POS + push kho/hạn dùng — [opus xhigh]
3. D → E → F theo `docs/AUTH_PLAN.md` (F: hỏi trước mỗi thao tác trên DB thật) — [opus xhigh]

## File cần đọc đầu tiên
`docs/AUTH_PLAN.md` · `AGENTS.md` · `prototype/js/api.js` · `supabase/functions/push/index.ts` · `supabase/functions/_shared/push.ts` · `supabase/migrations/20261126130000_push.sql`
