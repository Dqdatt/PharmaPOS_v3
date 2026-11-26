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

## Việc tiếp theo (người dùng đổi thứ tự 26/11: hoãn C tồn kho, làm MVP lên DB thật trước)
Theo mục "MVP lên DB thật" trong `docs/TASKS.md` (M1→M10). Đã xong M1, M2, M8 (chưa commit); giao 030 = M3, giao 031 = M4 POS nút Đăng xuất màn chốt tồn QL. Tiếp: duyệt 030, 031 → M5 → M6 → M7 → M9 → M10.
- M4 app: quên mật khẩu (mã email → đặt mật khẩu mới) + đổi mật khẩu đã có sẵn. Đã thêm ở cuối `api.js`: SIGNED_OUT khi đang đăng nhập → về Đăng nhập + toast; mở lại app (visibilitychange) → `API.profile()` (bị khoá → đăng xuất). Đã chạy thật trên bản sao (khoá ĐQĐ → về Đăng nhập; đăng nhập lại báo bị khoá; đăng xuất thường không toast).
- M5 cần: khoá tài khoản phải xoá phiên (auth.sessions) + push_subscriptions + passkeys của người đó; kiểm `passkey` login từ chối tài khoản locked.
- DB thật (đọc 26/11): CHƯA có bảng supabase_migrations → `db push` sẽ chạy cả 11 file; diễn tập trên bản sao chạy sạch. users: #1 Quốc Đạt, #2 Đoàn Quốc Đường (cả 2 role admin cũ, có PIN); 1673 hoá đơn đều của #2. Chưa có auth.users.
- Vai trò CHỐT 26/11: #1 Quốc Đạt → admin (chỉ app), #2 Đoàn Quốc Đường → manager (bán POS, giữ 1673 hoá đơn). Người dùng tự điền email khi chạy `scripts/link-account.mjs` ở M9.
- POS thật = Netlify (pharmapos-v3.netlify.app, tự deploy từ `main`) → KHÔNG gộp main trước M9.
- `.env` thật dùng key mới `sb_publishable_…` (không phải JWT): function verify_jwt mặc định sẽ từ chối khi chưa đăng nhập (web-login tạo QR, passkey login) → M9 đặt `verify_jwt=false` cho các function đó (chúng tự kiểm Authorization) hoặc dùng anon JWT cũ.
- DB LOCAL đang chứa BẢN SAO DỮ LIỆU THẬT (+2 tài khoản test @example.com) → `npm run db:reset` để về dữ liệu seed trước khi chạy test:rls/web-login/passkey. File dump ở scratchpad phiên (không nằm trong repo).
- `api.js`: host `dqdatt.github.io` = live DB thật → KHÔNG deploy gh-pages trước M9.

## File cần đọc đầu tiên
`docs/AUTH_PLAN.md` · `AGENTS.md` · `supabase/functions/_shared/push.ts` · `supabase/functions/push/index.ts` · `prototype/js/api.js`
