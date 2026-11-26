// Test thông báo đẩy: RPC đăng ký / cài đặt / đã đọc, cron doanh thu + công nợ (đúng số tiền, đúng người),
// chống gửi trùng, mã cron dùng 1 lần, endpoint hết hạn bị xoá, pg_cron → pg_net → function.
// Chạy sau npm run db:reset (cần npm run push:keys + supabase stop && supabase start một lần): npm run test:push
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { getRetailRevenueForDate } from '../src/utils/reportRevenue.ts';
import { fakePushService } from './lib/fake-push.mjs';

const env = Object.fromEntries(execSync('supabase status -o env', { encoding: 'utf8' })
  .split('\n').map(l => l.match(/^(\w+)="?(.*?)"?$/)).filter(Boolean).map(m => [m[1], m[2]]));
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(env.API_URL || '')) throw new Error('Chỉ chạy với Supabase local');
const VAPID_PUB = readFileSync(new URL('../supabase/functions/.env', import.meta.url), 'utf8').match(/^VAPID_PUBLIC_KEY=(.+)$/m)?.[1];
if (!VAPID_PUB) throw new Error('Chưa có khoá VAPID: npm run push:keys rồi supabase stop && supabase start');

const mk = () => createClient(env.API_URL, env.ANON_KEY, { auth: { persistSession: false } });
const svc = createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const login = async (email, password) => { const c = mk(); const { error } = await c.auth.signInWithPassword({ email, password }); if (error) throw error; return c; };
const activate = async (id, password) => {
  const { data } = await svc.from('users').select('auth_id').eq('id', id).single();
  await svc.auth.admin.updateUserById(data.auth_id, { password }); // trigger invited → active
};
const psql = (sql) => execSync('docker exec -i supabase_db_PharmaPOS_V3 psql -U postgres -Atq -v ON_ERROR_STOP=1', { input: sql, encoding: 'utf8' }).trim();
const fn = async (body) => {
  const r = await mk().functions.invoke('push', { body });
  return r.error ? { err: r.error.context.status, ...(await r.error.context.json()) } : r.data;
};
const cron = async (job) => fn({ action: 'cron', run: (await svc.from('push_jobs').insert({ job }).select('id').single()).data.id });
const money = (n) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n) + ' ₫';
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const [y, m, d] = today.split('-');

// Dọn dữ liệu của lượt test trước (nếu lỗi giữa chừng)
await svc.from('push_subscriptions').delete().like('endpoint', 'http://host.docker.internal:%');
await svc.from('notifications').delete().gte('id', 0);
await svc.from('invoices').delete().in('id', ['HDPUSH1', 'HDPUSH2']);
await svc.from('notif_prefs').delete().gte('user_id', 0);
await svc.from('push_subscriptions').delete().like('endpoint', 'https://fcm.googleapis.com/fcm/send/medipos-test-%');
// Máy thật đang test (iPhone) không được nhận thông báo của test: cất đi, trả lại khi xong hoặc khi lỗi
const { data: realSubs } = await svc.from('push_subscriptions').select('*');
if (realSubs.length) await svc.from('push_subscriptions').delete().in('endpoint', realSubs.map((r) => r.endpoint));
const restoreReal = async () => { if (realSubs.length) await svc.from('push_subscriptions').upsert(realSubs); };
process.on('uncaughtException', async (e) => { await restoreReal(); console.error(e); process.exit(1); });

await activate(1, 'Test-push-1');
await activate(3, 'Test-push-3');
const ql = await login('quanly@medipos.test', 'Test-push-1');
const nv = await login('nv.tu@medipos.test', 'Test-push-3');
const admin = await login('admin@medipos.test', 'MediPOS-dev-2026');

// ---------- Khoá + đăng ký máy ----------
assert.equal((await fn({ action: 'key' })).key, VAPID_PUB);
assert.equal((await fn({ action: 'nope' })).err, 400);
const fcm = (s, keys = { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) }) => ({ endpoint: `https://fcm.googleapis.com/fcm/send/medipos-test-${s}`, keys });
const sub = (c, s) => c.rpc('push_subscribe', { sub: s, ua: 'test' });
const owner = async (s) => (await svc.from('push_subscriptions').select('user_id').eq('endpoint', s.endpoint).maybeSingle()).data?.user_id;

assert.ok((await sub(mk(), fcm('x'))).error, 'chưa đăng nhập không đăng ký được');
assert.equal((await sub(nv, { ...fcm('x'), endpoint: 'http://kong:8000/functions/v1/push' })).data, false, 'chặn endpoint nội bộ (SSRF)');
assert.equal((await sub(nv, { ...fcm('x'), endpoint: 'https://fcm.googleapis.com.evil.example/x' })).data, false, 'chặn host giả');
assert.equal((await sub(nv, fcm('x', { p256dh: 'x', auth: 'y' }))).data, false, 'khoá sai định dạng');
assert.equal((await sub(nv, fcm('nv1'))).data, true);
assert.equal(await owner(fcm('nv1')), 3);
assert.ok((await nv.from('push_subscriptions').select()).error, 'không đọc thẳng bảng đăng ký');
assert.equal((await sub(ql, fcm('nv1'))).data, true, 'máy đổi tài khoản');
assert.equal(await owner(fcm('nv1')), 1, 'endpoint về người đăng nhập sau');
await nv.rpc('push_unsubscribe', { endpoint: fcm('nv1').endpoint });
assert.equal(await owner(fcm('nv1')), 1, 'không xoá được máy của người khác');
await ql.rpc('push_unsubscribe', { endpoint: fcm('nv1').endpoint });
assert.equal(await owner(fcm('nv1')), undefined);
for (let i = 0; i < 12; i++) assert.equal((await sub(nv, fcm(`m${i}`))).data, true);
const nvSubs = (await svc.from('push_subscriptions').select('endpoint').eq('user_id', 3)).data.map((r) => r.endpoint);
assert.equal(nvSubs.length, 10, 'tối đa 10 máy');
assert.ok(!nvSubs.includes(fcm('m0').endpoint) && nvSubs.includes(fcm('m11').endpoint), 'bỏ máy cũ nhất');
await svc.from('push_subscriptions').delete().like('endpoint', 'https://fcm.googleapis.com/fcm/send/medipos-test-%');

// ---------- Cài đặt ----------
let p = (await nv.rpc('my_notif_prefs', { changes: {} })).data;
assert.deepEqual([p.revenue, p.debt, p.low_stock, p.expiring, p.expiry_days], [true, true, true, true, 30], 'mặc định');
p = (await admin.rpc('my_notif_prefs', { changes: { revenue: false, expiry_days: 60 } })).data;
assert.deepEqual([p.user_id, p.revenue, p.debt, p.expiry_days], [4, false, true, 60]);
assert.ok((await nv.rpc('my_notif_prefs', { changes: { expiry_days: 45 } })).error, 'ngưỡng chỉ 15/30/60/90');
assert.ok((await mk().rpc('my_notif_prefs', { changes: {} })).error, 'chưa đăng nhập');
assert.equal((await nv.rpc('my_notif_prefs', { changes: {} })).data.expiry_days, 30, 'mỗi người một cài đặt');

// ---------- Cron doanh thu 21:00 ----------
const push = await fakePushService(VAPID_PUB);
const phones = { ql: push.add('ql'), nv: push.add('nv'), admin: push.add('admin'), old: push.add('old') };
push.gone.add('old'); // máy đã gỡ app: dịch vụ push trả 410
const row = (b, user_id) => ({ endpoint: b.sub.endpoint, user_id, p256dh: b.sub.keys.p256dh, auth: b.sub.keys.auth });
assert.ok(!(await svc.from('push_subscriptions').insert([row(phones.ql, 1), row(phones.nv, 3), row(phones.admin, 4), row(phones.old, 1)])).error);

const base = { employee_name: 'Lê Minh Tú', employee_id: 3, method: 'cash' };
assert.ok(!(await svc.from('invoices').insert([
  { ...base, id: 'HDPUSH1', time: `20:15:00 ${d}/${m}/${y}`, other_costs: 15000, total: 250000, status: 'completed' },
  { ...base, id: 'HDPUSH2', time: `20:30:00 ${d}/${m}/${y}`, other_costs: 0, total: 999000, status: 'deleted' },
])).error);
const inv = (await svc.from('invoices').select('time, total, other_costs, status')).data;
const exp = getRetailRevenueForDate(inv.map((i) => ({ time: i.time, total: Number(i.total), otherCosts: Number(i.other_costs), status: i.status })), today);
assert.ok(exp.otherCosts >= 15000 && exp.invoices.some((i) => i.total === 250000) && !exp.invoices.some((i) => i.total === 999000));

let r = await cron('daily');
assert.deepEqual(r, { job: 'daily', sent: 1 }, 'chỉ QL: admin tắt doanh thu, NV không nhận, máy cũ 410');
await push.waitFor(1);
assert.deepEqual(push.errors, []);
assert.deepEqual(push.inbox, [{ name: 'ql', msg: { title: `Doanh thu ${+d}/${+m}`, body: `${money(exp.netRevenue)} từ ${exp.invoices.length} đơn bán lẻ`, kind: 'revenue' } }],
  'số tiền = ô "Doanh thu ngày (bán lẻ)" trên POS');
assert.equal(await owner(phones.old.sub), undefined, 'máy hết đăng ký bị xoá');

assert.deepEqual(await cron('daily'), { job: 'daily', sent: 0 }, 'chạy lại trong ngày không gửi trùng');
const { data: j } = await svc.from('push_jobs').insert({ job: 'daily' }).select('id').single();
assert.equal((await fn({ action: 'cron', run: j.id })).job, 'daily');
assert.equal((await fn({ action: 'cron', run: j.id })).err, 404, 'mã cron dùng 1 lần');
assert.equal((await fn({ action: 'cron', run: randomUUID() })).err, 404, 'mã đoán bừa');
const { data: oldJob } = await svc.from('push_jobs').insert({ job: 'daily', created_at: new Date(Date.now() - 10 * 60e3).toISOString() }).select('id').single();
assert.equal((await fn({ action: 'cron', run: oldJob.id })).err, 404, 'mã quá 5 phút');

// ---------- Màn Thông báo đọc theo người ----------
const feed = (await ql.from('notifications').select('id, kind, read_at')).data;
assert.deepEqual(feed.map((n) => [n.kind, n.read_at]), [['revenue', null]]);
assert.equal((await nv.from('notifications').select()).data.length, 0, 'NV không thấy thông báo của QL');
assert.ok((await ql.from('notifications').update({ title: 'x' }).eq('id', feed[0].id)).error, 'không sửa thẳng');
await nv.rpc('notifications_read', { ids: null });
assert.equal((await svc.from('notifications').select('read_at').eq('id', feed[0].id).single()).data.read_at, null, 'không đánh dấu hộ người khác');
await ql.rpc('notifications_read', { ids: [feed[0].id] });
assert.ok((await ql.from('notifications').select('read_at').eq('id', feed[0].id).single()).data.read_at);

// ---------- Cron công nợ NCC 8:00 thứ Hai ----------
const debts = (await svc.from('purchases').select('supplier, supplier_id, total').eq('status', 'DEBT')).data;
assert.ok(debts.length, 'seed có phiếu nợ');
const debtBody = `Còn nợ ${new Set(debts.map((x) => x.supplier_id ?? x.supplier)).size} nhà cung cấp, tổng ${money(debts.reduce((s, x) => s + Number(x.total), 0))}`;
push.inbox.length = 0;
assert.deepEqual(await cron('weekly'), { job: 'weekly', sent: 2 }, 'QL + admin');
await push.waitFor(2);
assert.deepEqual(push.inbox.map((x) => x.name).sort(), ['admin', 'ql']);
assert.ok(push.inbox.every((x) => x.msg.kind === 'debt' && x.msg.title === 'Công nợ nhà cung cấp' && x.msg.body === debtBody), debtBody);
await svc.from('notifications').delete().eq('kind', 'debt');
await svc.from('users').update({ status: 'locked' }).eq('id', 1);
assert.equal((await cron('weekly')).sent, 1, 'tài khoản khoá không nhận');
await svc.from('users').update({ status: 'active' }).eq('id', 1);

// ---------- pg_cron → pg_net → function ----------
assert.equal(psql("SELECT count(*) FROM cron.job WHERE jobname IN ('medipos-push-daily', 'medipos-push-weekly')"), '2');
const reqId = psql("SELECT public.push_cron('daily')");
let resp = '';
for (let t = Date.now(); !resp && Date.now() - t < 15000;) {
  await new Promise((res) => setTimeout(res, 300));
  resp = psql(`SELECT status_code || ' ' || content FROM net._http_response WHERE id = ${Number(reqId)}`);
}
assert.equal(resp, '200 {"job":"daily","sent":0}', 'DB gọi được function qua Vault functions_url');
assert.ok((await nv.rpc('push_cron', { job: 'daily' })).error, 'client không gọi được push_cron');

await svc.from('invoices').delete().in('id', ['HDPUSH1', 'HDPUSH2']);
await svc.from('push_subscriptions').delete().like('endpoint', `${push.base}/%`);
push.close();
await restoreReal();
console.log('PUSH OK');
