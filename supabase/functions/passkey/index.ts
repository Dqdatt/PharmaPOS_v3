// Face ID thật = passkey WebAuthn (docs/AUTH_PLAN.md bước A). App gọi qua supabase.functions.invoke('passkey').
//  register-options → register  { response }        (cần phiên)  đăng ký passkey máy này → { credential, user_id }
//  login-options { credential? } → login { response } (không cần) mở khoá app → { session }
//  approve-options { id } → approve { id, response }  (cần phiên)  duyệt đăng nhập POS web (web_login_requests.id)
//  delete { credential }                              (cần phiên)  xoá passkey của chính mình
// Lỗi: { error: 'câu tiếng Việt', code? } với code 'unknown' (passkey không còn) | 'need_bio' | 'bio_failed' | 'expired'.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse,
} from 'npm:@simplewebauthn/server@13';
import { isoBase64URL } from 'npm:@simplewebauthn/server@13/helpers';
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
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Origin được dùng passkey (RP ID = host của origin). Thật: secret PASSKEY_ORIGINS="https://medipos-app.netlify.app".
// Chưa đặt secret thì chỉ Supabase local mới nhận localhost + tunnel test.
const ORIGINS = (Deno.env.get('PASSKEY_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const LOCAL = /^http:\/\/(kong|127\.0\.0\.1|localhost)[:/]/.test(URL_);
const allowed = (o: string) => ORIGINS.length ? ORIGINS.includes(o)
  : LOCAL && (/^http:\/\/localhost:\d+$/.test(o) || /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(o));

type Row = Record<string, any>;

async function caller(req: Request): Promise<Row | null> {
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data } = await db.auth.getUser(jwt);
  if (!data?.user) return null;
  const { data: u } = await db.from('users').select('id, name, email, role, status').eq('auth_id', data.user.id).maybeSingle();
  return u?.status === 'active' ? u : null;
}

async function saveChallenge(challenge: string, kind: string, origin: string, extra: Row = {}) {
  await db.from('passkey_challenges').delete().lt('expires_at', new Date().toISOString());
  const { error } = await db.from('passkey_challenges')
    .insert({ challenge, kind, origin, rp_id: new URL(origin).hostname, ...extra });
  return !error;
}

// Đọc challenge trong clientDataJSON rồi xoá luôn: mỗi challenge chỉ dùng 1 lần.
async function claim(response: Row, kind: string): Promise<Row | null> {
  let ch: unknown;
  try { ch = JSON.parse(new TextDecoder().decode(isoBase64URL.toBuffer(response.response.clientDataJSON))).challenge; } catch { return null; }
  if (typeof ch !== 'string') return null;
  const { data } = await db.from('passkey_challenges').delete()
    .eq('challenge', ch).eq('kind', kind).gt('expires_at', new Date().toISOString()).select().maybeSingle();
  return data;
}

async function verifyAssertion(pk: Row, ch: Row, response: Row) {
  try {
    const v = await verifyAuthenticationResponse({
      response: response as any, expectedChallenge: ch.challenge, expectedOrigin: ch.origin, expectedRPID: ch.rp_id,
      requireUserVerification: true,
      credential: { id: pk.id, publicKey: isoBase64URL.toBuffer(pk.public_key), counter: Number(pk.counter), transports: pk.transports ?? undefined },
    });
    if (!v.verified) return false;
    await db.from('passkeys').update({ counter: v.authenticationInfo.newCounter, last_used_at: new Date().toISOString() }).eq('id', pk.id);
    return true;
  } catch { return false; }
}

const NO_SESSION = { error: 'Phiên đăng nhập đã hết, vui lòng đăng nhập lại' };
const EXPIRED = { error: 'Yêu cầu đã hết hạn, vui lòng thử lại' };
const BIO_FAILED = { error: 'Face ID không khớp', code: 'bio_failed' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'Phương thức không hỗ trợ' });
  let body: Row;
  try { body = await req.json(); } catch { return reply(400, { error: 'Dữ liệu không hợp lệ' }); }
  if (!body || typeof body !== 'object') return reply(400, { error: 'Dữ liệu không hợp lệ' });
  const action = String(body.action ?? '');
  const origin = req.headers.get('origin') ?? '';
  const response = body.response && typeof body.response === 'object' ? body.response : null;

  if (action.endsWith('-options') && !allowed(origin)) return reply(403, { error: 'Địa chỉ này không dùng được Face ID' });

  if (action === 'register-options') {
    const u = await caller(req); if (!u) return reply(401, NO_SESSION);
    const opts = await generateRegistrationOptions({
      rpName: 'MediPOS', rpID: new URL(origin).hostname, userName: u.email, userDisplayName: u.name,
      userID: new TextEncoder().encode(`medipos-${u.id}`), // cố định theo tài khoản: đăng ký lại trên cùng máy thì iOS ghi đè passkey cũ
      attestationType: 'none',
      authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'required', userVerification: 'required' },
    });
    if (!await saveChallenge(opts.challenge, 'register', origin, { user_id: u.id })) return reply(500, { error: 'Có lỗi xảy ra, vui lòng thử lại' });
    return reply(200, opts);
  }

  if (action === 'register') {
    const u = await caller(req); if (!u) return reply(401, NO_SESSION);
    if (!response) return reply(400, { error: 'Dữ liệu không hợp lệ' });
    const ch = await claim(response, 'register');
    if (!ch || ch.user_id !== u.id) return reply(400, EXPIRED);
    let v;
    try {
      v = await verifyRegistrationResponse({ response: response as any, expectedChallenge: ch.challenge, expectedOrigin: ch.origin,
        expectedRPID: ch.rp_id, requireUserVerification: true });
    } catch { v = null; }
    if (!v?.verified || !v.registrationInfo) return reply(400, { error: 'Không xác minh được Face ID' });
    const c = v.registrationInfo.credential;
    const { error } = await db.from('passkeys').insert({
      id: c.id, user_id: u.id, public_key: isoBase64URL.fromBuffer(c.publicKey), counter: c.counter, rp_id: ch.rp_id,
      transports: c.transports ?? null, device: (req.headers.get('user-agent') ?? '').slice(0, 300) || null,
    });
    if (error) return reply(500, { error: 'Không lưu được Face ID' });
    return reply(200, { credential: c.id, user_id: u.id });
  }

  if (action === 'login-options') {
    const hint = typeof body.credential === 'string' && body.credential.length < 1024 ? body.credential : null;
    const opts = await generateAuthenticationOptions({ rpID: new URL(origin).hostname, userVerification: 'required',
      allowCredentials: hint ? [{ id: hint }] : [] });
    if (!await saveChallenge(opts.challenge, 'login', origin)) return reply(500, { error: 'Có lỗi xảy ra, vui lòng thử lại' });
    return reply(200, opts);
  }

  if (action === 'login') {
    if (!response) return reply(400, { error: 'Dữ liệu không hợp lệ' });
    const ch = await claim(response, 'login'); if (!ch) return reply(400, EXPIRED);
    const { data: pk } = await db.from('passkeys').select('*').eq('id', String(response.id ?? '')).maybeSingle();
    if (!pk || pk.rp_id !== ch.rp_id) {
      return reply(404, { error: 'Face ID trên máy này không còn hiệu lực, vui lòng đăng nhập bằng mật khẩu', code: 'unknown' });
    }
    if (!await verifyAssertion(pk, ch, response)) return reply(401, BIO_FAILED);
    const { data: u } = await db.from('users').select('email, status').eq('id', pk.user_id).maybeSingle();
    if (!u?.email || u.status !== 'active') return reply(403, { error: 'Tài khoản đã bị khoá, vui lòng liên hệ admin' });
    const session = await issueSession(db, u.email);
    if (!session) return reply(500, { error: 'Không cấp được phiên đăng nhập' });
    return reply(200, { session });
  }

  if (action === 'approve-options' || action === 'approve') {
    const u = await caller(req); if (!u) return reply(401, NO_SESSION);
    const id = String(body.id ?? '').toLowerCase();
    if (!UUID.test(id)) return reply(400, { error: 'Dữ liệu không hợp lệ' });
    if (u.role === 'admin') return reply(403, { error: 'Tài khoản quản trị chỉ dùng app, không đăng nhập POS' });
    const expired = { error: 'Mã đã hết hạn, hãy tải lại mã trên máy tính', code: 'expired' };

    if (action === 'approve-options') {
      const { data: r } = await db.from('web_login_requests').select('status, expires_at').eq('id', id).maybeSingle();
      if (!r || r.status !== 'pending' || new Date(r.expires_at) <= new Date()) return reply(410, expired);
      const rpID = new URL(origin).hostname;
      const { data: pks } = await db.from('passkeys').select('id, transports').eq('user_id', u.id).eq('rp_id', rpID);
      if (!pks?.length) return reply(409, { error: 'Bật Face ID trong Tài khoản để duyệt đăng nhập POS', code: 'need_bio' });
      const opts = await generateAuthenticationOptions({ rpID, userVerification: 'required',
        allowCredentials: pks.map((p) => ({ id: p.id, transports: p.transports ?? undefined })) });
      if (!await saveChallenge(opts.challenge, 'approve', origin, { user_id: u.id, req_id: id })) return reply(500, { error: 'Có lỗi xảy ra, vui lòng thử lại' });
      return reply(200, opts);
    }

    if (!response) return reply(400, { error: 'Dữ liệu không hợp lệ' });
    const ch = await claim(response, 'approve');
    if (!ch || ch.user_id !== u.id || ch.req_id !== id) return reply(400, EXPIRED);
    const { data: pk } = await db.from('passkeys').select('*').eq('id', String(response.id ?? '')).eq('user_id', u.id).maybeSingle();
    if (!pk || pk.rp_id !== ch.rp_id || !await verifyAssertion(pk, ch, response)) return reply(401, BIO_FAILED);
    const { data: st, error } = await db.rpc('web_login_approve', { req_id: id, uid: u.id });
    if (error) return reply(500, { error: 'Có lỗi xảy ra, vui lòng thử lại' });
    if (st === 'approved') return reply(200, { status: 'approved' });
    if (st === 'expired') return reply(410, expired);
    if (st === 'admin_blocked') return reply(403, { error: 'Tài khoản quản trị chỉ dùng app, không đăng nhập POS' });
    return reply(403, { error: 'Tài khoản chưa có quyền đăng nhập POS' });
  }

  if (action === 'delete') {
    const u = await caller(req); if (!u) return reply(401, NO_SESSION);
    const { error } = await db.from('passkeys').delete().eq('id', String(body.credential ?? '')).eq('user_id', u.id);
    return error ? reply(500, { error: 'Có lỗi xảy ra, vui lòng thử lại' }) : reply(200, { ok: true });
  }

  return reply(400, { error: 'Hành động không hỗ trợ' });
});
