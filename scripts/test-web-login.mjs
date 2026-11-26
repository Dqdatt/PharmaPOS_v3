// Test luồng đăng nhập POS web bằng app (Edge Function web-login + RPC). Chạy sau npm run db:reset: npm run test:web-login
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(execSync('supabase status -o env', { encoding: 'utf8' })
  .split('\n').map(l => l.match(/^(\w+)="?(.*?)"?$/)).filter(Boolean).map(m => [m[1], m[2]]));
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(env.API_URL || '')) throw new Error('Chỉ chạy với Supabase local');
const mk = () => createClient(env.API_URL, env.ANON_KEY, { auth: { persistSession: false } });
const svc = createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const fn = async (body) => { const r = await mk().functions.invoke('web-login', { body }); return r.error ? { err: r.error.context.status } : r.data; };
const login = async (email, password) => { const c = mk(); const { error } = await c.auth.signInWithPassword({ email, password }); if (error) throw error; return c; };
const decide = async (c, id, approve) => (await c.rpc('web_login_decide', { req_id: id, approve })).data;

// Kích hoạt NV 3 bằng cách đặt mật khẩu (trigger invited → active)
const { data: u3 } = await svc.from('users').select('auth_id').eq('id', 3).single();
await svc.auth.admin.updateUserById(u3.auth_id, { password: 'Test-web-login-1' });
const nv = await login('nv.tu@medipos.test', 'Test-web-login-1');
const admin = await login('admin@medipos.test', 'MediPOS-dev-2026');

let w = await fn({ action: 'create' });
assert.ok(w.id && w.secret.length >= 32, 'tạo yêu cầu');
assert.equal((await fn({ action: 'poll', id: w.id, secret: w.secret })).status, 'pending');
assert.equal((await fn({ action: 'poll', id: w.id, secret: 'x'.repeat(43) })).err, 404, 'secret sai');
assert.equal((await mk().rpc('web_login_info', { req_id: w.id })).error?.code, '42501', 'anon không xem được yêu cầu');
assert.equal((await nv.rpc('web_login_info', { req_id: w.id })).data.length, 1, 'app xem được yêu cầu');
assert.equal(await decide(nv, w.id, true), 'approved');
const ok = await fn({ action: 'poll', id: w.id, secret: w.secret });
assert.equal(ok.status, 'approved'); assert.ok(ok.session?.access_token);
assert.equal((await fn({ action: 'poll', id: w.id, secret: w.secret })).status, 'expired', 'phiên chỉ cấp 1 lần');
assert.equal(await decide(nv, w.id, true), 'expired', 'không duyệt lại được');
const web = mk(); await web.auth.setSession(ok.session);
const me = (await web.rpc('my_profile')).data[0];
assert.equal(me.email, 'nv.tu@medipos.test');
const inv = (await web.from('invoices').select('employee_id')).data;
assert.ok(inv.length > 0 && inv.every(i => i.employee_id === me.id), 'POS của NV chỉ thấy hoá đơn của mình');

w = await fn({ action: 'create' });
assert.equal(await decide(admin, w.id, true), 'admin_blocked', 'admin không vào POS');
assert.equal(await decide(nv, w.id, false), 'rejected');
assert.equal((await fn({ action: 'poll', id: w.id, secret: w.secret })).status, 'rejected');

w = await fn({ action: 'create' });
await svc.from('web_login_requests').update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('id', w.id);
assert.equal(await decide(nv, w.id, true), 'expired');
assert.equal((await fn({ action: 'poll', id: w.id, secret: w.secret })).status, 'expired');

console.log('WEB LOGIN OK');
