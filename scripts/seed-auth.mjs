// Tạo tài khoản auth.users cho các dòng public.users đã seed, rồi gắn auth_id.
// Chỉ chạy với Supabase LOCAL: npm run db:reset (= supabase db reset && node scripts/seed-auth.mjs)
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

// Mật khẩu test cho tài khoản đã 'active' (chỉ dùng local). Tài khoản 'invited' không có mật khẩu: test luồng OTP lần đầu.
const DEV_PASSWORD = 'MediPOS-dev-2026';

const env = Object.fromEntries(
  execSync('supabase status -o env', { encoding: 'utf8' })
    .split('\n').map(l => l.match(/^(\w+)="?(.*?)"?$/)).filter(Boolean).map(m => [m[1], m[2]])
);
const url = env.API_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url || '')) throw new Error(`Chỉ seed Supabase local, API_URL = ${url}`);
const admin = createClient(url, env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: rows, error } = await admin.from('users').select('id, name, email, phone, status').is('auth_id', null);
if (error) throw error;

for (const u of rows) {
  if (!u.email) continue; // đăng nhập chỉ bằng email; SĐT để ở public.users cho liên hệ
  const { data, error: e } = await admin.auth.admin.createUser({
    email: u.email,
    email_confirm: true,
    password: u.status === 'active' ? DEV_PASSWORD : undefined,
    app_metadata: { user_id: u.id },
  });
  if (e) throw new Error(`${u.name}: ${e.message}`);
  const { error: e2 } = await admin.from('users').update({ auth_id: data.user.id }).eq('id', u.id);
  if (e2) throw e2;
  console.log(`✓ ${u.name} (${u.email}) ${u.status}`);
}
