# HANDOFF — MediPOS (repo PharmaPOS_V3), 26/11/2026 — nhánh `prototype-mobile` (chưa push, chưa gộp main)

## Mục tiêu phiên vừa rồi
Bước B (`docs/AUTH_PLAN.md`): thông báo đẩy Web Push VAPID cho app — XONG, iPhone thật nhận doanh thu + công nợ.

## Đã xong
- 7fa98ca v3.6.0 server: migration `20261126130000_push.sql` (`push_subscriptions` chỉ nhận endpoint FCM/Apple/Mozilla/WNS, ≤10 máy/người; `notif_prefs`; `notifications` chống trùng user+kind+ref; `push_jobs` mã cron dùng 1 lần; RPC `push_subscribe/push_unsubscribe/my_notif_prefs/notifications_read`; `pg_cron` 14:00 UTC doanh thu, 01:00 UTC thứ Hai công nợ → `push_cron()` → `pg_net` → function, URL ở Vault `functions_url`). Function `push` (`key`, `cron`, `verify_jwt=false`), `_shared/push.ts` `notify()`, `web-login` báo "Đăng nhập POS mới". `reportRevenue.ts` dời sang `supabase/functions/_shared/` (src re-export). `sw.js` push + notificationclick. `api.js`: `API.me/push/notifications`, đăng xuất huỷ push.
- 45b276f giao 029 UI: Cài đặt thông báo (bật/tắt máy, công tắc thật, thêm công nợ, bỏ giờ yên lặng, NV ẩn doanh thu/công nợ), màn Thông báo đọc thật, `App.openNotif` (revenue/stock/expiry/debt→payables).
- 177cac3 v3.6.1: `VAPID_SUBJECT` = `https://dqdatt.github.io/PharmaPOS_v3/` (Apple 403 BadJwtToken với `.test`); `test:push` cất/trả máy thật.
- Đạt: test:rls, web-login, passkey, push, npm test, lint, build, check.mjs, check:pwa, verify:pwa; Claude chạy thật UI; iPhone qua tunnel nhận push.

## Đang dở
- Không có việc `giao` nào mở. Chưa thử push "Đăng nhập POS mới" trên iPhone: POS local kẹt màn chốt tồn bắt buộc của QL (DB reset → tháng 10 chưa chốt) → bấm "Chốt tồn & Mở khóa làm việc" rồi quét QR lại.

## Quyết định đã chốt
- Mọi việc qua `giao`; auth/quyền/RLS/migration/tiền/tồn kho → Claude tự làm. 3 vai trò cố định, 1 cơ sở, admin chỉ dùng app.
- Push: đăng nhập POS luôn báo (chính tài khoản đó); doanh thu 21:00 (= ô "Doanh thu ngày (bán lẻ)" POS) + công nợ NCC 8:00 thứ Hai chỉ QL+admin; NV chỉ nhận đăng nhập POS; bỏ giờ yên lặng; kho/hạn dùng gửi ở bước C; đăng xuất = huỷ push máy đó.
- Nút Đăng xuất cho màn chốt tồn QL: để sau. Đăng xuất máy tính từ điện thoại = bước E (màn "Phiên web đang mở" hiện là mẫu).

## Nợ Ponytail / lưu ý
- Không có `shortcut:` mới. Cũ: `api.js:11` URL + anon key local viết cứng (bước F).
- `supabase start` TREO vì keychain (`security find-generic-password`) khi project đang link: tạm cất `supabase/.temp/project-ref`, start, trả lại; hoặc chạy tay 1 lần và bấm "Luôn cho phép". Đổi `supabase/functions/.env` phải stop/start lại.
- `test:passkey` chỉ chạy 1 lần sau `db:reset`; `test:rls` chạy ngay sau reset; `test:push` xoá hết bảng notifications local. `verify:pwa` chập chờn ~1/5.
- Bước F: khoá VAPID MỚI làm secret, Vault `functions_url` URL project, deploy `push`; OTP email lạ trả 422; `passkey login-options` chưa giới hạn theo IP.

## Việc tiếp theo
1. C: `products.min_stock` + `purchase_items.expiry_date` + ô nhập POS Nhập hàng (UI giao) + push thuốc sắp hết / cận hạn qua `notify()` và `notif_prefs.low_stock/expiring/expiry_days` — [opus xhigh]
2. Việc vặt trong `docs/TASKS.md`: push đăng nhập POS trên iPhone, nút Đăng xuất màn chốt tồn QL, bỏ state QA push cũ ở `weblogin.js` — [sonnet] giao
3. D → E → F theo `docs/AUTH_PLAN.md` (F: hỏi trước mỗi thao tác DB thật) — [opus xhigh]

## File cần đọc đầu tiên
`docs/AUTH_PLAN.md` · `AGENTS.md` · `supabase/functions/_shared/push.ts` · `supabase/functions/push/index.ts` · `prototype/js/api.js`
