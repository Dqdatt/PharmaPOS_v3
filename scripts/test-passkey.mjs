// Test Face ID = passkey (Edge Function passkey + duyệt POS). Authenticator giả: khoá ES256 trong Node, attestation 'none'.
// Chạy sau npm run db:reset: npm run test:passkey
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(execSync('supabase status -o env', { encoding: 'utf8' })
  .split('\n').map(l => l.match(/^(\w+)="?(.*?)"?$/)).filter(Boolean).map(m => [m[1], m[2]]));
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(env.API_URL || '')) throw new Error('Chỉ chạy với Supabase local');
const ORIGIN = 'http://localhost:4176', RP = 'localhost';
const mk = () => createClient(env.API_URL, env.ANON_KEY, { auth: { persistSession: false } });
const svc = createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const pk = async (c, body, origin = ORIGIN) => {
  const r = await c.functions.invoke('passkey', { body, headers: { Origin: origin } });
  return r.error ? { err: r.error.context.status, ...(await r.error.context.json()) } : r.data;
};
const login = async (email, password) => { const c = mk(); const { error } = await c.auth.signInWithPassword({ email, password }); if (error) throw error; return c; };
const activate = async (id, password) => {
  const { data } = await svc.from('users').select('auth_id').eq('id', id).single();
  await svc.auth.admin.updateUserById(data.auth_id, { password }); // trigger invited → active
};

// ---------- Authenticator giả ----------
const b64u = (b) => Buffer.from(b).toString('base64url');
const sha = (b) => createHash('sha256').update(b).digest();
const head = (mt, n) => Buffer.from(n < 24 ? [mt << 5 | n] : n < 256 ? [mt << 5 | 24, n] : [mt << 5 | 25, n >> 8, n & 255]);
const cbor = (v) => typeof v === 'number' ? (v >= 0 ? head(0, v) : head(1, -1 - v))
  : typeof v === 'string' ? Buffer.concat([head(3, Buffer.byteLength(v)), Buffer.from(v)])
  : Buffer.isBuffer(v) ? Buffer.concat([head(2, v.length), v])
  : Buffer.concat([head(5, v.size), ...[...v].flatMap(([k, x]) => [cbor(k), cbor(x)])]);

function device() {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  const credId = randomBytes(16);
  let count = 0;
  const cose = cbor(new Map([[1, 2], [3, -7], [-1, 1], [-2, Buffer.from(jwk.x, 'base64url')], [-3, Buffer.from(jwk.y, 'base64url')]]));
  const client = (type, challenge, origin) => Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin: false }));
  const flags = 0x05; // UP + UV (Face ID)
  return {
    id: b64u(credId),
    create(o, origin = ORIGIN) {
      const authData = Buffer.concat([sha(o.rp.id), Buffer.from([flags | 0x40]), Buffer.alloc(4), Buffer.alloc(16),
        Buffer.from([0, credId.length]), credId, cose]);
      const att = cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]]));
      return { id: b64u(credId), rawId: b64u(credId), type: 'public-key', clientExtensionResults: {},
        response: { clientDataJSON: b64u(client('webauthn.create', o.challenge, origin)), attestationObject: b64u(att), transports: ['internal'] } };
    },
    get(o, { key = privateKey, origin = ORIGIN } = {}) {
      const c = Buffer.alloc(4); c.writeUInt32BE(++count);
      const authData = Buffer.concat([sha(o.rpId), Buffer.from([flags]), c]);
      const cd = client('webauthn.get', o.challenge, origin);
      return { id: b64u(credId), rawId: b64u(credId), type: 'public-key', clientExtensionResults: {},
        response: { clientDataJSON: b64u(cd), authenticatorData: b64u(authData),
          signature: b64u(sign('sha256', Buffer.concat([authData, sha(cd)]), key)), userHandle: b64u(Buffer.from('medipos-3')) } };
    },
  };
}

await activate(3, 'Test-passkey-1');
await activate(2, 'Test-passkey-2');
const nv = await login('nv.tu@medipos.test', 'Test-passkey-1');
const lan = await login('nv.lan@medipos.test', 'Test-passkey-2');
const admin = await login('admin@medipos.test', 'MediPOS-dev-2026');
const phone = device(), lanPhone = device();

// Đăng ký
assert.equal((await pk(mk(), { action: 'register-options' })).err, 401, 'chưa đăng nhập không đăng ký được');
assert.equal((await pk(nv, { action: 'register-options' }, 'https://evil.example')).err, 403, 'origin lạ bị chặn');
let o = await pk(nv, { action: 'register-options' });
assert.equal(o.rp.id, RP); assert.equal(o.authenticatorSelection.userVerification, 'required');
const reg = phone.create(o);
assert.equal((await pk(lan, { action: 'register', response: reg })).err, 400, 'không đăng ký bằng challenge của người khác');
o = await pk(nv, { action: 'register-options' });
const reg2 = phone.create(o);
const r = await pk(nv, { action: 'register', response: reg2 });
assert.equal(r.credential, phone.id); assert.equal(r.user_id, 3);
assert.equal((await pk(nv, { action: 'register', response: reg2 })).err, 400, 'challenge chỉ dùng 1 lần');
o = await pk(lan, { action: 'register-options' });
assert.equal((await pk(lan, { action: 'register', response: lanPhone.create(o, 'http://localhost:9999') })).err, 400, 'origin trong clientData phải khớp');
o = await pk(lan, { action: 'register-options' });
assert.ok((await pk(lan, { action: 'register', response: lanPhone.create(o) })).credential);

// Mở khoá app (cấp phiên)
o = await pk(mk(), { action: 'login-options', credential: phone.id });
assert.deepEqual(o.allowCredentials.map(c => c.id), [phone.id]);
const as = phone.get(o);
const s = await pk(mk(), { action: 'login', response: as });
assert.ok(s.session?.access_token, 'passkey đúng → có phiên');
const app = mk(); await app.auth.setSession(s.session);
assert.equal((await app.rpc('my_profile')).data[0].email, 'nv.tu@medipos.test');
assert.equal((await pk(mk(), { action: 'login', response: as })).err, 400, 'không phát lại được');
o = await pk(mk(), { action: 'login-options' });
const other = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey;
assert.equal((await pk(mk(), { action: 'login', response: phone.get(o, { key: other }) })).code, 'bio_failed', 'sai chữ ký');

// Duyệt đăng nhập POS
const web = async () => (await mk().functions.invoke('web-login', { body: { action: 'create' } })).data;
let w = await web();
assert.equal((await nv.rpc('web_login_decide', { req_id: w.id, approve: true })).data, 'need_passkey', 'RPC không duyệt được nữa');
assert.equal((await pk(admin, { action: 'approve-options', id: w.id })).err, 403, 'admin không vào POS');
const w2 = await web();
o = await pk(nv, { action: 'approve-options', id: w2.id });
assert.equal((await pk(nv, { action: 'approve', id: w.id, response: phone.get(o) })).err, 400, 'challenge gắn đúng mã QR');
o = await pk(nv, { action: 'approve-options', id: w.id });
assert.deepEqual(o.allowCredentials.map(c => c.id), [phone.id], 'chỉ passkey của chính mình');
assert.equal((await pk(nv, { action: 'approve', id: w.id, response: lanPhone.get(o) })).code, 'bio_failed', 'passkey người khác');
o = await pk(nv, { action: 'approve-options', id: w.id });
assert.equal((await pk(nv, { action: 'approve', id: w.id, response: phone.get(o) })).status, 'approved');
const poll = (await mk().functions.invoke('web-login', { body: { action: 'poll', id: w.id, secret: w.secret } })).data;
assert.equal(poll.status, 'approved'); assert.ok(poll.session?.access_token);
assert.equal((await pk(nv, { action: 'approve-options', id: w.id })).code, 'expired', 'mã đã dùng');

// Tắt Face ID → passkey hết hiệu lực
assert.ok((await pk(lan, { action: 'delete', credential: phone.id })).ok);
o = await pk(mk(), { action: 'login-options' });
assert.ok((await pk(mk(), { action: 'login', response: phone.get(o) })).session, 'người khác không xoá được passkey của mình');
assert.ok((await pk(nv, { action: 'delete', credential: phone.id })).ok);
o = await pk(mk(), { action: 'login-options' });
assert.equal((await pk(mk(), { action: 'login', response: phone.get(o) })).code, 'unknown');
const w3 = await web();
assert.equal((await pk(nv, { action: 'approve-options', id: w3.id })).code, 'need_bio', 'chưa bật Face ID thì không duyệt POS');

// Tài khoản bị khoá → passkey không cấp phiên
o = await pk(mk(), { action: 'login-options' });
const lanAs = lanPhone.get(o);
await svc.from('users').update({ status: 'locked' }).eq('id', 2);
assert.equal((await pk(mk(), { action: 'login', response: lanAs })).err, 403, 'tài khoản khoá');
await svc.from('users').update({ status: 'active' }).eq('id', 2);

console.log('PASSKEY OK');
