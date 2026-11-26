// Đăng nhập POS web bằng app (docs/AUTH_PLAN.md bước 4). Gọi bằng anon key từ POS web.
//  { action: 'create' }               → { id, secret, expires_at }   (QR chỉ chứa id; secret web giữ)
//  { action: 'poll', id, secret }     → { status: 'pending'|'rejected'|'expired' } | { status: 'approved', session }
// Phiên chỉ cấp 1 lần (approved → used), chỉ cho QL/NV đang active; admin không vào POS.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { issueSession } from '../_shared/session.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const URL_ = Deno.env.get('SUPABASE_URL')!;
const db = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

const sha256 = async (s: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PER_IP = 30; // yêu cầu / 10 phút / IP

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'Phương thức không hỗ trợ' });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { error: 'Dữ liệu không hợp lệ' }); }

  if (body.action === 'create') {
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim().slice(0, 64) || null;
    const ua = (req.headers.get('user-agent') ?? '').slice(0, 300) || null;
    await db.from('web_login_requests').delete().lt('created_at', new Date(Date.now() - 864e5).toISOString());
    if (ip) {
      const { count } = await db.from('web_login_requests').select('id', { count: 'exact', head: true })
        .eq('ip', ip).gt('created_at', new Date(Date.now() - 6e5).toISOString());
      if ((count ?? 0) >= MAX_PER_IP) return reply(429, { error: 'Tạo mã quá nhiều lần, vui lòng đợi vài phút' });
    }
    const secret = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const { data, error } = await db.from('web_login_requests')
      .insert({ secret_hash: await sha256(secret), user_agent: ua, ip }).select('id, expires_at').single();
    if (error) return reply(500, { error: 'Không tạo được mã đăng nhập' });
    return reply(200, { id: data.id, secret, expires_at: data.expires_at });
  }

  if (body.action === 'poll') {
    const id = String(body.id ?? ''), secret = String(body.secret ?? '');
    if (!UUID.test(id) || secret.length < 32) return reply(400, { error: 'Dữ liệu không hợp lệ' });
    const { data: r } = await db.from('web_login_requests')
      .select('status, secret_hash, expires_at, decided_at').eq('id', id).maybeSingle();
    if (!r || r.secret_hash !== await sha256(secret)) return reply(404, { error: 'Không tìm thấy yêu cầu' });

    if (r.status === 'rejected') return reply(200, { status: 'rejected' });
    if (r.status === 'pending') return reply(200, { status: new Date(r.expires_at) > new Date() ? 'pending' : 'expired' });
    if (r.status !== 'approved' || Date.now() - new Date(r.decided_at).getTime() > 2 * 60e3) return reply(200, { status: 'expired' });

    // Chiếm quyền dùng 1 lần (2 lần poll song song chỉ 1 lần thắng)
    const { data: claimed } = await db.from('web_login_requests')
      .update({ status: 'used' }).eq('id', id).eq('status', 'approved').select('user_id').maybeSingle();
    if (!claimed) return reply(200, { status: 'expired' });

    const { data: u } = await db.from('users').select('email, role, status').eq('id', claimed.user_id).maybeSingle();
    if (!u?.email || u.status !== 'active' || (u.role !== 'manager' && u.role !== 'staff')) {
      return reply(200, { status: 'rejected' });
    }
    const session = await issueSession(db, u.email);
    if (!session) return reply(500, { error: 'Không cấp được phiên đăng nhập' });
    return reply(200, { status: 'approved', session });
  }

  return reply(400, { error: 'Hành động không hỗ trợ' });
});
