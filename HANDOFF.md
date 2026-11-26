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
Theo "MVP lên DB thật" trong `docs/TASKS.md`. Xong: M1, M2, M3 (030), M4 (031 + api.js), M7 local, M8; server M5 (v3.7.0), M6 (v3.7.1). 032 + 033 đã duyệt, chạy thật live (admin: khoá/mở/cấp; số liệu thật), đã gộp. Tiếp: M9 theo `docs/GO_LIVE.md` (hỏi người dùng trước từng thao tác DB thật).
- Vai trò CHỐT: #1 Quốc Đạt → admin (chỉ app), #2 Đoàn Quốc Đường → manager (POS, 1673 hoá đơn). Người dùng tự điền email khi chạy `scripts/link-account.mjs`.
- DB thật chưa có supabase_migrations → `db push` chạy cả 12 file; diễn tập sạch (scratchpad `load_prod.sh` nạp bản sao vào local).
- POS thật = Netlify tự deploy từ `main` → KHÔNG gộp main trước M9. `api.js`: host `dqdatt.github.io` = DB thật → KHÔNG deploy gh-pages trước M9.
- Bảo mật mới (v3.7.0): `my_role()/my_user_id()` đòi phiên còn sống trong auth.sessions (thu hồi/khoá có hiệu lực ngay); signOut mọi nơi `scope: 'local'` (trước đây đăng xuất POS đá cả app); POS tự kiểm phiên 30s/khi focus (`dropRevokedSession`).
- `dashboard` function: doanh thu net bán lẻ = reportRevenue, đã khớp SQL độc lập trên dữ liệu thật. shortcut: sắp hết = tồn ≤ 5 (chờ min_stock bước C); expiring rỗng (bước C).
- Tài khoản cũ không email: CHECK `users_contact_check` (NOT VALID) chặn UPDATE dòng đó → `admin_set_user` trả 'no_email', admin phải gắn email trước.
- Còn hỏi người dùng: tên + địa chỉ nhà thuốc thật cho app (`DATA.store` đang là mẫu "Nhà thuốc Tâm An").

## File cần đọc đầu tiên
`docs/AUTH_PLAN.md` · `AGENTS.md` · `supabase/functions/_shared/push.ts` · `supabase/functions/push/index.ts` · `prototype/js/api.js`
