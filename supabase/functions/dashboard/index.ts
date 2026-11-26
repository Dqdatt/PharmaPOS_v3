// App điện thoại: số liệu Trang chủ / Doanh thu / Tiện ích (docs/TASKS.md M6). POST {} → cùng khuôn DATA của prototype.
// Gọi bằng JWT người dùng → RLS lọc (NV chỉ thấy hoá đơn + ca của mình). Doanh thu = net bán lẻ, cùng logic
// ô "Doanh thu ngày (bán lẻ)" trên POS (reportRevenue.ts). Công nợ NCC chỉ QL + admin.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getRetailCalendarRevenue, getValidRetailInvoices, parseReportDateToISO } from '../_shared/reportRevenue.ts';
import { all, TZ, vnDate } from '../_shared/db.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const PAY: Record<string, string> = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', card: 'Thẻ' };
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WD_FULL = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
// shortcut: ngưỡng "sắp hết" chung cho mọi thuốc khi chưa có products.min_stock, thay bằng min_stock ở bước C
const LOW_STOCK = 5;

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const hm = (time: string) => { const m = /(\d{1,2}):(\d{2})/.exec(time || ''); return m ? `${m[1].padStart(2, '0')}:${m[2]}` : ''; };
// Lọc thô theo tháng trong chuỗi "HH:MM:SS D/M/YYYY" (có/không số 0) hoặc ISO; lọc đúng bằng parseReportDateToISO
const monthPats = (y: string, m: string) =>
  [...new Set([`*/${+m}/${y}*`, `*/${m}/${y}*`, `${y}-${m}-*`])].map((p) => `time.like."${p}"`);
const dayPats = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return [...new Set([`${+d}/${+m}/${y}`, `${d}/${m}/${y}`, `${+d}/${m}/${y}`, `${d}/${+m}/${y}`])];
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'Phương thức không hỗ trợ' });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: me } = await db.rpc('my_profile');
  const role = me?.[0]?.status === 'active' ? me[0].role : null;
  if (!role) return reply(401, { error: 'Phiên đăng nhập đã hết, vui lòng đăng nhập lại' });

  try {
    const now = new Date();
    const t = vnDate(now);
    const [y, m, d] = t.split('-');
    const prev = addDays(`${y}-${m}-01`, -1); // ngày cuối tháng trước
    const [py, pm] = prev.split('-');

    type Inv = { id: string; time: string; employee_name: string; method: string; total: number; other_costs: number; status: string };
    const raw = await all<Inv>(() => db.from('invoices')
      .select('id, time, employee_name, method, total, other_costs, status')
      .or([...monthPats(y, m), ...monthPats(py, pm)].join(',')).order('id'));
    const rows = raw.map((i) => ({ ...i, total: Number(i.total), otherCosts: Number(i.other_costs), date: parseReportDateToISO(i.time) }));
    const cal = getRetailCalendarRevenue(rows); // YYYY-MM-DD → doanh thu net bán lẻ
    const valid = getValidRetailInvoices(rows);
    const net = (i: { total: number; otherCosts: number }) => i.total - i.otherCosts;
    const sumDays = (from: string, to: string) => Object.entries(cal).reduce((s, [k, v]) => (k >= from && k <= to ? s + v : s), 0);

    // Hôm nay
    const todayInv = valid.filter((i) => i.date === t).sort((a, b) => hm(b.time).localeCompare(hm(a.time)) || b.id.localeCompare(a.id));
    const nowHour = +new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(now);
    const hourOf = (i: Inv) => +hm(i.time).slice(0, 2);
    const hourStart = Math.min(7, nowHour, ...todayInv.map(hourOf));
    const hourly = Array.from({ length: nowHour - hourStart + 1 }, () => 0);
    const group = (key: (i: typeof rows[number]) => string) => {
      const g = new Map<string, { value: number; invoices: number }>();
      for (const i of todayInv) { const k = key(i); const e = g.get(k) ?? { value: 0, invoices: 0 }; e.value += net(i); e.invoices++; g.set(k, e); }
      return [...g].sort((a, b) => b[1].value - a[1].value);
    };
    for (const i of todayInv) { const h = hourOf(i) - hourStart; if (h >= 0 && h < hourly.length) hourly[h] += net(i); }
    const dow = new Date(`${t}T00:00:00Z`).getUTCDay();

    const today = {
      dateLabel: `${WD_FULL[dow]}, ${+d} tháng ${+m}`, hourStart, nowHour, hourly,
      revenue: cal[t] ?? 0, yesterday: cal[addDays(t, -1)] ?? 0, invoices: todayInv.length,
      lastSale: todayInv[0] ? hm(todayInv[0].time) : '',
      payments: group((i) => PAY[i.method] ?? 'Khác').map(([key, v]) => ({ key, value: v.value })),
      byStaff: group((i) => i.employee_name || 'Không rõ').map(([name, v]) => ({ name, ...v })),
    };
    const week = Array.from({ length: 7 }, (_, k) => {
      const iso = addDays(t, k - 6);
      return { label: WD[new Date(`${iso}T00:00:00Z`).getUTCDay()], date: ddmm(iso), value: cal[iso] ?? 0 };
    });
    const month = {
      label: `Tháng ${+m}`,
      revenue: sumDays(`${y}-${m}-01`, t),
      lastMonthSameDay: sumDays(`${py}-${pm}-01`, `${py}-${pm}-${String(Math.min(+d, +prev.slice(8))).padStart(2, '0')}`),
      invoices: valid.filter((i) => i.date >= `${y}-${m}-01` && i.date <= t).length,
    };

    // Hoá đơn hôm nay (tên hàng), ca làm hôm nay, thuốc sắp hết, công nợ NCC
    const ids = todayInv.map((i) => i.id);
    const items = ids.length ? await all<{ invoice_id: string; name: string }>(() =>
      db.from('invoice_items').select('invoice_id, name').in('invoice_id', ids).order('id')) : [];
    const invoices = todayInv.map((i) => ({
      id: i.id, time: hm(i.time), items: items.filter((x) => x.invoice_id === i.id).map((x) => x.name),
      total: i.total, staff: i.employee_name, pay: PAY[i.method] ?? 'Khác',
    }));

    const logs = await all<{ name: string; login_time: string; logout_time: string | null }>(() => db.from('staff_logs')
      .select('name, login_time, logout_time').or(dayPats(t).map((s) => `login_time.like."* ${s}"`).join(',')).order('id'));
    const shifts = logs.filter((l) => parseReportDateToISO(l.login_time) === t).map((l) => ({
      name: l.name, shift: `Vào ca ${hm(l.login_time)}`, status: l.logout_time ? `Hết ca ${hm(l.logout_time)}` : 'Đang làm',
    }));

    const products = await all<{ name: string; unit: string; initial_stock: number; total_in: number; total_out: number }>(() =>
      db.from('products').select('name, unit, initial_stock, total_in, total_out').order('id'));
    const lowStock = products
      .map((p) => ({ name: p.name, unit: p.unit, left: Number(p.initial_stock) + Number(p.total_in) - Number(p.total_out), min: LOW_STOCK }))
      .filter((p) => p.left <= LOW_STOCK).sort((a, b) => a.left - b.left).slice(0, 30);

    let payables: { supplier: string; amount: number; count: number; since: string }[] = [];
    if (role !== 'staff') {
      const debts = await all<{ supplier: string; total: number; date: string }>(() =>
        db.from('purchases').select('supplier, total, date').eq('status', 'DEBT').order('id'));
      const g = new Map<string, { amount: number; count: number; since: string }>();
      for (const p of debts) {
        const iso = parseReportDateToISO(p.date);
        const e = g.get(p.supplier) ?? { amount: 0, count: 0, since: iso };
        e.amount += Number(p.total); e.count++; if (iso && (!e.since || iso < e.since)) e.since = iso;
        g.set(p.supplier, e);
      }
      payables = [...g].map(([supplier, v]) => ({ supplier, ...v, since: v.since ? ddmm(v.since) : '' }))
        .sort((a, b) => b.amount - a.amount);
    }

    // shortcut: chưa có hạn dùng theo lô (purchase_items.expiry_date, bước C) → expiring rỗng
    return reply(200, { role, today, week, month, invoices, shifts, lowStock, payables, expiring: [] });
  } catch (e) {
    console.error(e);
    return reply(500, { error: 'Không tải được số liệu' });
  }
});
