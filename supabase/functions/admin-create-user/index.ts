// Admin cấp tài khoản QL/NV: tạo auth.users (email, chưa mật khẩu) + dòng public.users 'invited'.
// Người được cấp tự đăng nhập lần đầu bằng mã OTP qua email rồi đặt mật khẩu (docs/AUTH_PLAN.md).
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'Phương thức không hỗ trợ' });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  // Người gọi phải là admin đang active
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: caller } = await db.auth.getUser(jwt);
  if (!caller?.user) return reply(401, { error: 'Chưa đăng nhập' });
  const { data: me } = await db.from('users').select('role, status').eq('auth_id', caller.user.id).maybeSingle();
  if (me?.role !== 'admin' || me.status !== 'active') return reply(403, { error: 'Chỉ admin được cấp tài khoản' });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { error: 'Dữ liệu không hợp lệ' }); }

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const role = String(body.role ?? '');
  const phoneRaw = String(body.phone ?? '').replace(/\D/g, '');
  const phone = phoneRaw ? phoneRaw.replace(/^0/, '84') : null; // 0903… → 84903…

  if (name.length < 2 || name.length > 80) return reply(400, { error: 'Tên cần 2–80 ký tự' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return reply(400, { error: 'Email không hợp lệ' });
  if (role !== 'manager' && role !== 'staff') return reply(400, { error: 'Vai trò chỉ được là Quản lý hoặc Nhân viên' });
  if (phone && !/^84\d{9}$/.test(phone)) return reply(400, { error: 'Số điện thoại cần đủ 10 số' });

  const { data: created, error: e1 } = await db.auth.admin.createUser({ email, email_confirm: true });
  if (e1) {
    const dup = /already|exists|registered/i.test(e1.message);
    return reply(dup ? 409 : 500, { error: dup ? 'Email này đã có tài khoản' : 'Không tạo được tài khoản' });
  }

  const { data: row, error: e2 } = await db.from('users')
    .insert({ name, email, phone, role, status: 'invited', auth_id: created.user.id })
    .select('id, name, email, phone, role, status').single();
  if (e2) {
    await db.auth.admin.deleteUser(created.user.id); // không để auth.users mồ côi
    const dup = e2.code === '23505';
    return reply(dup ? 409 : 500, { error: dup ? 'Email hoặc số điện thoại đã được dùng' : 'Không lưu được tài khoản' });
  }
  return reply(200, { user: row });
});
