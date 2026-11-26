# HANDOFF — MediPOS (PharmaPOS_V3), 27/11/2026 — ĐÃ LÊN THẬT. origin/main = 225e98d; local prototype-mobile đi trước (chưa push)

## Mục tiêu phiên vừa rồi
Làm tiếp M10: admin sửa tên/email NV, Face ID theo tài khoản, thông báo giữ luôn, icon Safari, dọn tài liệu sau M9.

## Đã xong (local, CHƯA deploy)
- Giao 034 (tài liệu Netlify) gộp; AGENTS.md: M9 xong, "push main = deploy thật, hỏi trước".
- Admin sửa họ tên + email NV: `admin-create-user` thêm `{ action: 'edit', id, name?, email? }` (chỉ admin, không sửa admin, email trùng → 409 tiếng Việt; tự kiểm trùng trước vì GoTrue chỉ báo 500; lỗi lưu `users` → trả email auth về cũ). `API.admin.update`. UI giao 035 (`screens/admin.js` nút "Sửa thông tin"). Test `npm run test:admin-edit` ĐẠT; bấm thử trên PWA local đạt.
- Face ID theo tài khoản: `api.js` PK_KEY = `medipos.passkeys` `{ [users.id]: credential }`, tự chuyển từ khoá cũ `medipos.passkey`; đăng xuất KHÔNG xoá passkey nữa (chỉ xoá applock); `need_bio`/`unknown` từ server → xoá mục cục bộ. Thử local: đăng xuất → đăng nhập tài khoản khác không có Face ID → quay lại có ngay.
- Thông báo: `API.push.keep()` gọi sau đăng nhập + mở app: máy đã cho phép và không tự tắt (`medipos.pushOff`) → tự đăng ký lại. Đăng xuất tắt push nhưng không đặt cờ tắt.
- "Nhà thuốc Tâm An" → "MediPOS"; `pwa/build.mjs` chép `apple-touch-icon(.png|-precomposed.png)` ra gốc.

## Đang dở
- Deploy (hỏi người dùng trước): 1) `supabase functions deploy admin-create-user` lên project thật; 2) push `prototype-mobile` → `main` (Netlify deploy POS + app, kèm d9294f3 camera).
- Chưa thử iPhone: Face ID theo tài khoản, push keep (iOS có thể đòi bấm mới subscribe → khi đó vẫn phải bấm Bật), icon Safari, camera Safari.
- Trình duyệt nhúng không đăng ký được service worker (cả bản cũ) → push chỉ thử được trên iPhone.

## Quyết định đã chốt
- Mọi push lên `main` = deploy thật cả POS lẫn app → hỏi trước. Mọi thao tác DB thật hỏi trước.
- Đăng xuất giữ Face ID của tài khoản trên máy (đăng nhập lại vẫn cần mật khẩu/mã).
- Nút "In lại"/"Gửi Zalo" hoãn. Địa chỉ nhà thuốc thật chưa có (đang để mẫu).

## Nợ Ponytail
- `dashboard/index.ts`: "sắp hết" = tồn ≤ 5 chung; `expiring` rỗng → bước C.
- Passkey cũ không xoá ở server khi đăng ký lại trên cùng máy (iOS ghi đè theo userID cố định) → hàng `passkeys` mồ côi, vô hại.

## Việc tiếp theo
1. Hỏi rồi deploy function + push main; người dùng thử trên iPhone (thông báo, Face ID đổi tài khoản, icon Safari) — [opus xhigh]
2. Bàn phím đè nội dung (sửa prototype rồi build PWA) — [sonnet] giao

## File cần đọc đầu tiên
`docs/TASKS.md` · `AGENTS.md` · `prototype/js/api.js` · `supabase/functions/admin-create-user/index.ts`
