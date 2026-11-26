// Tạo khoá VAPID cho thông báo đẩy LOCAL → supabase/functions/.env (không commit). Có rồi thì giữ nguyên.
// Sau khi tạo: supabase stop && supabase start để Edge Function đọc. DB thật: đặt secret ở bước F, KHÔNG dùng khoá này.
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../supabase/functions/.env', import.meta.url);
const cur = existsSync(file) ? readFileSync(file, 'utf8') : '';
if (/^VAPID_PRIVATE_KEY=/m.test(cur)) { console.log('Đã có khoá VAPID trong supabase/functions/.env'); process.exit(0); }

const jwk = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ format: 'jwk' });
const pub = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]).toString('base64url');
writeFileSync(file, `${cur}${cur && !cur.endsWith('\n') ? '\n' : ''}VAPID_SUBJECT=https://dqdatt.github.io/PharmaPOS_v3/\nVAPID_PUBLIC_KEY=${pub}\nVAPID_PRIVATE_KEY=${jwk.d}\n`);
console.log('Đã tạo khoá VAPID → supabase/functions/.env. Chạy: supabase stop && supabase start');
