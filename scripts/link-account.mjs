// Nối 1 tài khoản cũ (dòng public.users có sẵn, giữ nguyên id → hoá đơn/doanh số cũ vẫn gắn đúng người)
// với tài khoản đăng nhập mới bằng email. Sau đó người đó mở app → nhập email → mã 6 số → tạo mật khẩu.
//   Local:   node scripts/link-account.mjs <id> <email> <admin|manager|staff>
//   DB thật: SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/link-account.mjs ...
//            (người dùng tự dán khoá service role trong Terminal của mình; script hỏi xác nhận trước khi ghi)
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { createClient } from '@supabase/supabase-js';

const [idArg, emailArg, role] = process.argv.slice(2);
const id = Number(idArg);
const email = String(emailArg ?? '').trim().toLowerCase();
if (!Number.isInteger(id) || id <= 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['admin', 'manager', 'staff'].includes(role)) {
  console.error('Cách dùng: node scripts/link-account.mjs <id> <email> <admin|manager|staff>');
  process.exit(1);
}

let url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url) {
  const env = Object.fromEntries(execSync('supabase status -o env', { encoding: 'utf8' })
    .split('\n').map(l => l.match(/^(\w+)="?(.*?)"?$/)).filter(Boolean).map(m => [m[1], m[2]]));
  url = env.API_URL; key = env.SERVICE_ROLE_KEY;
}
if (!url || !key) throw new Error('Thiếu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: u, error } = await db.from('users').select('id, name, role, status, email, auth_id').eq('id', id).maybeSingle();
if (error) throw error;
if (!u) throw new Error(`Không có tài khoản id ${id}`);
if (u.auth_id) throw new Error(`${u.name} đã được nối email ${u.email} rồi`);

const local = /^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url);
console.log(`${local ? 'LOCAL' : 'DB THẬT'} ${url}\n  #${u.id} ${u.name}: ${u.role} → ${role}, email → ${email}`);
if (!local) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ok = (await rl.question('Gõ "dong y" để ghi: ')).trim() === 'dong y';
  rl.close();
  if (!ok) { console.log('Huỷ, chưa ghi gì.'); process.exit(0); }
}

const { data: created, error: e1 } = await db.auth.admin.createUser({ email, email_confirm: true });
if (e1) throw new Error(`Tạo đăng nhập lỗi: ${e1.message}`);
const { data: saved, error: e2 } = await db.from('users')
  .update({ email, role, auth_id: created.user.id }).eq('id', id).is('auth_id', null).select('id');
if (e2 || !saved?.length) {
  await db.auth.admin.deleteUser(created.user.id); // không để auth.users mồ côi
  throw new Error(`Lưu lỗi (đã huỷ đăng nhập vừa tạo): ${e2?.message ?? 'tài khoản vừa bị nối ở nơi khác'}`);
}
console.log(`✓ ${u.name}: ${role}, ${email}, trạng thái ${u.status} → mở app, nhập email để nhận mã và tạo mật khẩu`);
