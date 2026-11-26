// Admin cấp tài khoản QL/NV: tạo auth.users (email, chưa mật khẩu) + dòng public.users 'invited'.
// { id, email }: gắn email cho tài khoản cũ có sẵn (không tạo dòng mới).
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

  const cols = 'id, name, email, phone, role, status';
  const toEmail = (v: unknown) => String(v ?? '').trim().toLowerCase();
  const badEmail = (e: string) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 254;
  const dupAuth = (m: string) => /already|exists|registered/i.test(m);

  // { action: 'edit', id, name?, email? }: sửa họ tên / email QL, NV. Email đổi ở cả auth.users (email đăng nhập) lẫn users.
  if (body.action === 'edit') {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return reply(400, { error: 'Dữ liệu không hợp lệ' });
    const { data: old } = await db.from('users').select(`${cols}, auth_id`).eq('id', id).maybeSingle();
    if (!old) return reply(404, { error: 'Không tìm thấy tài khoản' });
    if (old.role === 'admin') return reply(403, { error: 'Không sửa được tài khoản admin' });
    const patch: Record<string, string> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2 || name.length > 80) return reply(400, { error: 'Tên cần 2–80 ký tự' });
      if (name !== old.name) patch.name = name;
    }
    if (body.email !== undefined) {
      const email = toEmail(body.email);
      if (badEmail(email)) return reply(400, { error: 'Email không hợp lệ' });
      if (email !== old.email) {
        if (!old.auth_id) return reply(409, { error: 'Gắn email cho tài khoản này trước' });
        // GoTrue báo trùng email chỉ bằng lỗi 500 chung chung → tự kiểm trước
        const { data: taken } = await db.from('users').select('id').eq('email', email).neq('id', id).limit(1);
        if (taken?.length) return reply(409, { error: 'Email này đã có tài khoản' });
        const { error: ea } = await db.auth.admin.updateUserById(old.auth_id, { email, email_confirm: true });
        if (ea) return reply(dupAuth(ea.message) ? 409 : 500, { error: dupAuth(ea.message) ? 'Email này đã có tài khoản' : 'Không đổi được email' });
        patch.email = email;
      }
    }
    const { auth_id, ...current } = old;
    if (!Object.keys(patch).length) return reply(200, { user: current });
    const { data: row, error: eu } = await db.from('users').update(patch).eq('id', id).select(cols).maybeSingle();
    if (eu || !row) {
      if (patch.email) { // trả email đăng nhập về như cũ, không để auth.users lệch users
        const { error: er } = await db.auth.admin.updateUserById(auth_id, { email: old.email, email_confirm: true });
        if (er) console.error('admin-create-user: không trả lại được email auth', id, er.message);
      }
      const dup = eu?.code === '23505';
      return reply(dup ? 409 : 500, { error: dup ? 'Email này đã được dùng' : 'Không lưu được thay đổi' });
    }
    return reply(200, { user: row });
  }

  const email = toEmail(body.email);
  if (badEmail(email)) return reply(400, { error: 'Email không hợp lệ' });

  // Gắn email cho tài khoản cũ (dòng PIN trước khi có đăng nhập email): giữ id → hoá đơn cũ vẫn gắn đúng người
  if (body.id !== undefined) {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return reply(400, { error: 'Dữ liệu không hợp lệ' });
    const { data: old } = await db.from('users').select('role, auth_id').eq('id', id).maybeSingle();
    if (!old) return reply(404, { error: 'Không tìm thấy tài khoản' });
    if (old.auth_id || old.role === 'admin') return reply(409, { error: 'Tài khoản này đã có email đăng nhập' });
    const { data: au, error: ea } = await db.auth.admin.createUser({ email, email_confirm: true });
    if (ea) {
      const dup = /already|exists|registered/i.test(ea.message);
      return reply(dup ? 409 : 500, { error: dup ? 'Email này đã có tài khoản' : 'Không tạo được tài khoản' });
    }
    const { data: row, error: eu } = await db.from('users').update({ email, auth_id: au.user.id })
      .eq('id', id).is('auth_id', null).select('id, name, email, phone, role, status').maybeSingle();
    if (eu || !row) {
      await db.auth.admin.deleteUser(au.user.id); // không để auth.users mồ côi
      const dup = eu?.code === '23505';
      return reply(dup ? 409 : 500, { error: dup ? 'Email này đã được dùng' : 'Không lưu được email' });
    }
    return reply(200, { user: row });
  }

  const name = String(body.name ?? '').trim();
  const role = String(body.role ?? '');
  const phoneRaw = String(body.phone ?? '').replace(/\D/g, '');
  const phone = phoneRaw ? phoneRaw.replace(/^0/, '84') : null; // 0903… → 84903…

  if (name.length < 2 || name.length > 80) return reply(400, { error: 'Tên cần 2–80 ký tự' });
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
