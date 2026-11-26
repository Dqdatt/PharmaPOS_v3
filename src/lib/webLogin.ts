// Đăng nhập POS web bằng app MediPOS (quét QR + Face ID). Claude giữ — UI chỉ gọi 2 hàm dưới.
// Luồng: createWebLogin() → hiện QR từ `qrText` → pollWebLogin() mỗi ~2s tới khi khác 'pending'.
// 'approved' → phiên Supabase đã được đặt (supabase.auth), POS đọc hồ sơ bằng getMyProfile().
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface WebLoginRequest { id: string; secret: string; expiresAt: number; qrText: string }
export type WebLoginStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export interface MyProfile { id: number; name: string; role: 'admin' | 'manager' | 'staff'; status: string; email: string | null; phone: string | null }

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('web-login', { body });
  if (error) {
    const msg = await (error as { context?: Response }).context?.json?.().then((j: { error?: string }) => j.error).catch(() => null);
    throw new Error(msg || 'Không kết nối được máy chủ');
  }
  return data as T;
}

export async function createWebLogin(): Promise<WebLoginRequest> {
  const r = await call<{ id: string; secret: string; expires_at: string }>({ action: 'create' });
  return { id: r.id, secret: r.secret, expiresAt: new Date(r.expires_at).getTime(), qrText: `medipos-login:${r.id}` };
}

export async function pollWebLogin(req: WebLoginRequest): Promise<WebLoginStatus> {
  const r = await call<{ status: WebLoginStatus; session?: { access_token: string; refresh_token: string } }>(
    { action: 'poll', id: req.id, secret: req.secret });
  if (r.status === 'approved' && r.session) {
    const { error } = await supabase.auth.setSession(r.session);
    if (error) throw new Error('Không lưu được phiên đăng nhập');
  }
  return r.status;
}

/** Hồ sơ tài khoản đang đăng nhập; null nếu chưa đăng nhập, bị khoá, hoặc là admin (admin không vào POS). */
export async function getMyProfile(): Promise<MyProfile | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data, error } = await supabase.rpc('my_profile');
  const p = !error && data?.[0] as MyProfile | undefined;
  if (!p || p.status !== 'active' || p.role === 'admin') { await supabase.auth.signOut({ scope: 'local' }); return null; }
  return p;
}

/** Server đã xoá phiên (thu hồi từ app / khoá tài khoản) → đăng xuất máy này (SIGNED_OUT → màn đăng nhập). Mất mạng thì giữ. */
export async function dropRevokedSession() {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return;
  const { error } = await supabase.auth.getUser();
  if (error && !isAuthRetryableFetchError(error)) await supabase.auth.signOut({ scope: 'local' });
}

// local: chỉ đăng xuất phiên POS này, không đá app điện thoại của cùng tài khoản (mặc định 'global')
export const signOutPos = () => supabase.auth.signOut({ scope: 'local' });
