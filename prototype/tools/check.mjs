// Kiểm prototype không cần trình duyệt: nạp core + data + mọi màn trong vm, gọi render của từng màn,
// và soi luật UI (chữ ≥ 12px, không mã màu cứng trong màn, không dấu "·" "•" " | " trong chữ hiển thị).
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
const dir = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(dir + p, 'utf8');
const ctx = { console, Intl, performance, setTimeout, clearTimeout, requestAnimationFrame: () => 0 };
ctx.window = ctx; vm.createContext(ctx);
const errs = [];
const load = (p) => { try { vm.runInContext(read(p), ctx, { filename: p }); } catch (e) { errs.push(`${p}: lỗi khi nạp: ${e.message}`); } };
load('js/core.js'); load('js/data.js');
const files = readdirSync(dir + 'screens').filter((f) => f.endsWith('.js'));
const owner = {};
for (const f of files) {
  const before = new Set(Object.keys(ctx.App.screens));
  load('screens/' + f);
  for (const k of Object.keys(ctx.App.screens)) if (!before.has(k)) owner[k] = f;
  const src = read('screens/' + f);
  for (const m of src.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) if (+m[1] < 12) errs.push(`${f}: font-size ${m[1]}px < 12px`);
  if (/#[0-9a-fA-F]{3,8}\b/.test(src.replace(/&#\d+;/g, ''))) errs.push(`${f}: có mã màu cứng, dùng var(--...)`);
}
for (const m of read('css/app.css').matchAll(/font-size:\s*(\d+)px/g)) if (+m[1] < 12) errs.push(`app.css: font-size ${m[1]}px < 12px`);
const visible = (html) => html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
for (const [name, def] of Object.entries(ctx.App.screens)) {
  let html;
  try { html = def.render({}); } catch (e) { errs.push(`${owner[name]} màn "${name}": render lỗi: ${e.message}`); continue; }
  if (typeof html !== 'string' || !html.trim()) { errs.push(`màn "${name}": render không trả HTML`); continue; }
  const text = visible(html);
  if (/\bundefined\b|\bNaN\b|\[object Object\]/.test(text)) errs.push(`màn "${name}": chữ hiển thị có undefined/NaN/[object Object]`);
  if (/ · | • | \| /.test(text)) errs.push(`màn "${name}": dùng dấu "·" "•" "|" để nối chữ, viết thành câu hoặc tách dòng`);
}
const need = (process.argv[2] || '').split(',').filter(Boolean);
for (const n of need) if (!ctx.App.screens[n]) errs.push(`thiếu màn "${n}"`);
console.log(`Màn đã đăng ký (${Object.keys(ctx.App.screens).length}): ${Object.keys(ctx.App.screens).join(', ')}`);
console.log(`Trạng thái QA: ${ctx.App.states.length}`);
if (errs.length) { console.error('KHÔNG ĐẠT:\n- ' + errs.join('\n- ')); process.exit(1); }
console.log('ĐẠT');
