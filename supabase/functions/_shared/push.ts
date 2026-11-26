// Thông báo đẩy Web Push (VAPID) + lưu vào public.notifications. Dùng chung cho `push` (cron) và `web-login`.
// Secret: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (base64url, `npm run push:keys` tạo cho local), VAPID_SUBJECT (mailto:).
import webpush from 'npm:web-push@3.6.7';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const VAPID = {
  subject: Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@medipos.vn',
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
};
export const vapidPublicKey = () => VAPID.publicKey || null;

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
export const money = (n: number) => nf.format(n) + ' ₫'; // giống App.money ở app

export const deviceName = (ua: string | null) => {
  ua = ua ?? '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Trình duyệt';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) && !/Mobile/.test(ua) ? 'macOS'
    : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'máy tính';
  return `${browser} trên ${os}`;
};

export type Note = { kind: 'web' | 'revenue' | 'debt' | 'stock' | 'expiry'; title: string; body?: string; ref?: string };

// Lưu cho từng người (bỏ qua người đã có cùng kind + ref: cron chạy lại không gửi trùng),
// rồi đẩy tới mọi máy của họ. Máy hết đăng ký (404/410) thì xoá. Trả số máy đã nhận.
export async function notify(db: SupabaseClient, userIds: number[], n: Note): Promise<number> {
  if (!userIds.length) return 0;
  const { data: fresh, error } = await db.from('notifications')
    .upsert(userIds.map((user_id) => ({ user_id, kind: n.kind, title: n.title, body: n.body ?? null, ref: n.ref ?? null })),
      { onConflict: 'user_id,kind,ref', ignoreDuplicates: true })
    .select('user_id');
  if (error) { console.error('notify', error.message); return 0; }
  if (!fresh?.length) return 0;
  if (!VAPID.privateKey) { console.error('push: chưa cấu hình VAPID'); return 0; }

  const { data: subs } = await db.from('push_subscriptions').select('endpoint, p256dh, auth')
    .in('user_id', fresh.map((r) => r.user_id));
  const payload = JSON.stringify({ title: n.title, body: n.body ?? '', kind: n.kind });
  const ok = await Promise.all((subs ?? []).map(async (s) => {
    try {
      // web-push chỉ mã hoá + ký VAPID; gửi bằng fetch của Deno
      const d = webpush.generateRequestDetails({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload,
        { vapidDetails: VAPID, TTL: n.kind === 'web' ? 600 : 43200, urgency: n.kind === 'web' ? 'high' : 'normal' });
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(d.headers)) if (k.toLowerCase() !== 'content-length') headers[k] = String(v);
      const res = await fetch(d.endpoint, { method: 'POST', headers, body: d.body, signal: AbortSignal.timeout(10_000) });
      const text = await res.text();
      if (res.status === 404 || res.status === 410) await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      else if (!res.ok) console.error('push', res.status, text.slice(0, 200));
      return res.ok;
    } catch (e) { console.error('push', String(e)); return false; }
  }));
  return ok.filter(Boolean).length;
}
