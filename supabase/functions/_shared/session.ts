// Cấp phiên Supabase cho 1 email đã xác minh ở server: magic link (không gửi mail) → đổi token_hash lấy phiên.
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

export async function issueSession(db: SupabaseClient, email: string) {
  const { data: link, error: e1 } = await db.auth.admin.generateLink({ type: 'magiclink', email });
  if (e1 || !link?.properties?.hashed_token) return null;
  const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
  const { data: s, error: e2 } = await anon.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' });
  if (e2 || !s.session) return null;
  return { access_token: s.session.access_token, refresh_token: s.session.refresh_token };
}
