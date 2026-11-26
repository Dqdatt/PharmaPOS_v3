// Thông báo đẩy (docs/AUTH_PLAN.md bước B). verify_jwt = false (config.toml): mỗi action tự kiểm.
//  { action: 'key' }        → { key }          VAPID public key cho pushManager.subscribe (công khai)
//  { action: 'cron', run }  → { job, sent }    chỉ public.push_cron (pg_cron) gọi: run = mã dùng 1 lần trong push_jobs
// daily (21:00): doanh thu bán lẻ hôm nay = ô "Doanh thu ngày (bán lẻ)" trên POS → QL + admin.
// weekly (8:00 thứ Hai): công nợ NCC (phiếu nhập DEBT) → QL + admin. Kho / hạn dùng: bước C.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getRetailRevenueForDate } from '../_shared/reportRevenue.ts';
import { money, notify, vapidPublicKey } from '../_shared/push.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const vnToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()); // YYYY-MM-DD

// Đọc hết (PostgREST cắt ở max_rows: thiếu dòng = sai tiền)
async function all<T>(query: () => any): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query().range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

// QL + admin đang hoạt động, trừ người đã tắt loại này
async function managers(pref: 'revenue' | 'debt'): Promise<number[]> {
  const users = await all<{ id: number }>(() => db.from('users').select('id').in('role', ['manager', 'admin']).eq('status', 'active').order('id'));
  const ids = users.map((u) => u.id);
  if (!ids.length) return [];
  const { data: off, error } = await db.from('notif_prefs').select('user_id').in('user_id', ids).eq(pref, false);
  if (error) throw error;
  const skip = new Set((off ?? []).map((r) => r.user_id));
  return ids.filter((id) => !skip.has(id));
}

async function daily() {
  const day = vnToday();
  const [y, m, d] = day.split('-');
  // Lọc thô theo chuỗi ngày trong invoices.time (ISO hoặc "HH:MM:SS DD/MM/YYYY", có/không số 0), lọc đúng bằng reportRevenue
  const dates = new Set([`${d}/${m}/${y}`, `${+d}/${m}/${y}`, `${d}/${+m}/${y}`, `${+d}/${+m}/${y}`]);
  const pats = [`${day}*`, ...[...dates].flatMap((s) => [`${s}*`, `* ${s}*`, `*,${s}*`])];
  const inv = await all<{ time: string; total: number; other_costs: number; status: string }>(() =>
    db.from('invoices').select('id, time, total, other_costs, status').or(pats.map((p) => `time.like."${p}"`).join(',')).order('id'));
  const r = getRetailRevenueForDate(
    inv.map((i) => ({ time: i.time, total: Number(i.total), otherCosts: Number(i.other_costs), status: i.status })), day);
  await db.from('notifications').delete().lt('created_at', new Date(Date.now() - 90 * 864e5).toISOString());
  return notify(db, await managers('revenue'), {
    kind: 'revenue', title: `Doanh thu ${+d}/${+m}`, body: `${money(r.netRevenue)} từ ${r.invoices.length} đơn bán lẻ`, ref: day,
  });
}

async function weekly() {
  const debts = await all<{ supplier: string; supplier_id: number | null; total: number }>(() =>
    db.from('purchases').select('id, supplier, supplier_id, total').eq('status', 'DEBT').order('id'));
  if (!debts.length) return 0;
  const total = debts.reduce((s, p) => s + Number(p.total), 0);
  const n = new Set(debts.map((p) => p.supplier_id ?? p.supplier)).size;
  return notify(db, await managers('debt'), {
    kind: 'debt', title: 'Công nợ nhà cung cấp', body: `Còn nợ ${n} nhà cung cấp, tổng ${money(total)}`, ref: vnToday(),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'Phương thức không hỗ trợ' });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { error: 'Dữ liệu không hợp lệ' }); }
  if (!body || typeof body !== 'object') return reply(400, { error: 'Dữ liệu không hợp lệ' });

  if (body.action === 'key') {
    const key = vapidPublicKey();
    return key ? reply(200, { key }) : reply(503, { error: 'Máy chủ chưa bật thông báo' });
  }

  if (body.action === 'cron') {
    const run = String(body.run ?? '');
    if (!UUID.test(run)) return reply(400, { error: 'Dữ liệu không hợp lệ' });
    const { data: j } = await db.from('push_jobs').delete()
      .eq('id', run).gt('created_at', new Date(Date.now() - 5 * 60e3).toISOString()).select('job').maybeSingle();
    if (!j) return reply(404, { error: 'Không tìm thấy lượt chạy' });
    try {
      return reply(200, { job: j.job, sent: j.job === 'daily' ? await daily() : await weekly() });
    } catch (e) {
      console.error('push cron', j.job, e);
      return reply(500, { error: 'Có lỗi xảy ra' });
    }
  }

  return reply(400, { error: 'Hành động không hỗ trợ' });
});
