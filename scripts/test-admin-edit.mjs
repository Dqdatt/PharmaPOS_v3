// Test admin sửa họ tên + email NV (Edge Function admin-create-user, action 'edit'). Chạy sau npm run db:reset: npm run test:admin-edit
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(execSync('supabase status -o env', { encoding: 'utf8' })
  .split('\n').map(l => l.match(/^(\w+)="?(.*?)"?$/)).filter(Boolean).map(m => [m[1], m[2]]));
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(env.API_URL || '')) throw new Error('Chỉ chạy với Supabase local');
const PASS = 'Test-admin-edit-1';
const mk = () => createClient(env.API_URL, env.ANON_KEY, { auth: { persistSession: false } });
const svc = createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const login = async (email, password = PASS) => { const c = mk(); const { error } = await c.auth.signInWithPassword({ email, password }); if (error) throw error; return c; };
const edit = async (c, body) => {
  const r = await c.functions.invoke('admin-create-user', { body: { action: 'edit', ...body } });
  return r.error ? { status: r.error.context.status, error: (await r.error.context.json()).error } : { status: 200, ...r.data };
};
const row = async (id) => (await svc.from('users').select('name, email, auth_id').eq('id', id).single()).data;

const orig = await row(2);
for (const id of [1, 2, 4]) await svc.auth.admin.updateUserById((await row(id)).auth_id, { password: PASS });
const admin = await login('admin@medipos.test');
try {
  assert.equal((await edit(await login('quanly@medipos.test'), { id: 2, name: 'QL sửa' })).status, 403, 'QL không sửa được');
  assert.equal((await edit(admin, { id: 4, name: 'Admin mới' })).status, 403, 'không sửa tài khoản admin');
  assert.equal((await edit(admin, { id: 999, name: 'Không có' })).status, 404);
  assert.equal((await edit(admin, { id: 2, name: 'a' })).status, 400, 'tên quá ngắn');
  assert.equal((await edit(admin, { id: 2, email: 'sai-email' })).status, 400, 'email sai dạng');

  let r = await edit(admin, { id: 2, name: '  Trần Thị Lan Mới ' });
  assert.equal(r.user.name, 'Trần Thị Lan Mới'); assert.equal(r.user.email, orig.email, 'chỉ đổi tên');

  r = await edit(admin, { id: 2, email: 'NV.Lan2@medipos.test ' });
  assert.equal(r.user.email, 'nv.lan2@medipos.test');
  assert.equal((await svc.auth.admin.getUserById(orig.auth_id)).data.user.email, 'nv.lan2@medipos.test', 'email đăng nhập đổi theo');
  await assert.rejects(login(orig.email), 'email cũ hết đăng nhập được');
  const nv = await login('nv.lan2@medipos.test');
  assert.equal((await nv.rpc('my_profile')).data[0].id, 2, 'email mới vào đúng tài khoản cũ');
  assert.equal((await mk().auth.signInWithOtp({ email: 'nv.lan2@medipos.test', options: { shouldCreateUser: false } })).error, null, 'gửi mã tới email mới');

  r = await edit(admin, { id: 2, email: 'nv.tu@medipos.test' });
  assert.equal(r.status, 409); assert.equal(r.error, 'Email này đã có tài khoản');
  assert.equal((await row(2)).email, 'nv.lan2@medipos.test', 'email trùng → không đổi gì');
  assert.equal((await svc.auth.admin.getUserById(orig.auth_id)).data.user.email, 'nv.lan2@medipos.test');

  r = await edit(admin, { id: 2, email: 'nv.lan2@medipos.test' });
  assert.equal(r.status, 200, 'không đổi gì vẫn OK');
} finally {
  await edit(admin, { id: 2, name: orig.name, email: orig.email });
}
assert.deepEqual(await row(2), orig, 'trả lại như cũ');
console.log('ADMIN EDIT OK');
