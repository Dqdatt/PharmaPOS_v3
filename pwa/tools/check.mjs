import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));
const protoDir = join(rootDir, 'prototype');
const distDir = join(rootDir, 'pwa', 'dist');

const errs = [];
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else if (entry.isFile()) out.push(relative(base, full).split('\\').join('/'));
  }
  return out.sort();
}

function readPngSize(filePath) {
  const buf = readFileSync(filePath);
  const sig = '89504e470d0a1a0a';
  if (buf.length < 33 || buf.subarray(0, 8).toString('hex') !== sig) {
    throw new Error('không phải file PNG hợp lệ');
  }
  const chunkLen = buf.readUInt32BE(8);
  const chunkType = buf.subarray(12, 16).toString('ascii');
  if (chunkType !== 'IHDR' || chunkLen !== 13) {
    throw new Error(`chunk đầu PNG không hợp lệ (${chunkType}, length=${chunkLen})`);
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

if (!existsSync(distDir)) {
  console.error('KHÔNG ĐẠT:\n- Thiếu thư mục pwa/dist');
  process.exit(1);
}

// 1. Kiểm tra byte-for-byte 4 thư mục từ prototype (cả hai chiều)
for (const sub of ['css', 'js', 'screens', 'assets']) {
  const protoFiles = listFiles(join(protoDir, sub));
  const distFiles = listFiles(join(distDir, sub));
  const protoSet = new Set(protoFiles);
  const distSet = new Set(distFiles);

  for (const rel of protoFiles) {
    if (!distSet.has(rel)) {
      errs.push(`thiếu file ${sub}/${rel} trong pwa/dist`);
      continue;
    }
    const h1 = sha256(readFileSync(join(protoDir, sub, rel)));
    const h2 = sha256(readFileSync(join(distDir, sub, rel)));
    if (h1 !== h2) errs.push(`file ${sub}/${rel} khác sha256 so với prototype`);
  }
  for (const rel of distFiles) {
    if (!protoSet.has(rel)) {
      errs.push(`thừa file ${sub}/${rel} trong pwa/dist`);
    }
  }
}

// 2. Kiểm tra pwa/dist/index.html
const protoHtml = readFileSync(join(protoDir, 'index.html'), 'utf8');
const distHtml = readFileSync(join(distDir, 'index.html'), 'utf8');

const getScripts = (html) => [...html.matchAll(/<script\s+[^>]*src="([^"]+)"/g)].map((m) => m[1]);
const protoScripts = getScripts(protoHtml);
const distScripts = getScripts(distHtml);
if (JSON.stringify(protoScripts) !== JSON.stringify(distScripts)) {
  errs.push(`danh sách <script src> trong index.html không khớp prototype (${distScripts.join(', ')})`);
}
if (/class="qa"/.test(distHtml)) errs.push('index.html vẫn còn class="qa"');
if (!/class="rotate-lock"/.test(distHtml)) errs.push('index.html thiếu .rotate-lock');

const getImportantLinks = (html) =>
  [...html.matchAll(/<link\s+[^>]*>/g)]
    .map((m) => m[0].replace(/\s+/g, ' ').trim())
    .filter((tag) => /rel="icon"|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(tag));
const protoLinks = getImportantLinks(protoHtml);
const distLinks = getImportantLinks(distHtml);
if (JSON.stringify(protoLinks) !== JSON.stringify(distLinks)) {
  errs.push('favicon hoặc các link Google Fonts trong index.html không khớp prototype');
}

const requiredTags = [
  /<meta\s+name="viewport"\s+content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">/,
  /<meta\s+name="apple-mobile-web-app-capable"\s+content="yes">/,
  /<meta\s+name="mobile-web-app-capable"\s+content="yes">/,
  /<meta\s+name="apple-mobile-web-app-status-bar-style"\s+content="black-translucent">/,
  /<meta\s+name="apple-mobile-web-app-title"\s+content="MediPOS">/,
  /<meta\s+name="format-detection"\s+content="telephone=no">/,
  /<meta\s+name="theme-color"\s+content="#0F6F67">/,
  /<link\s+rel="manifest"\s+href="manifest\.webmanifest">/,
  /<link\s+rel="apple-touch-icon"\s+href="assets\/app-icon-180\.png">/,
  /serviceWorker\.register\('sw\.js'\)/
];
for (const re of requiredTags) {
  if (!re.test(distHtml)) errs.push(`index.html thiếu thẻ/đoạn khớp ${re}`);
}
const appCssIdx = distHtml.indexOf('href="css/app.css"');
const pwaCssIdx = distHtml.indexOf('href="pwa.css"');
if (appCssIdx === -1 || pwaCssIdx === -1 || pwaCssIdx < appCssIdx) {
  errs.push('pwa.css phải đặt sau css/app.css trong index.html');
}

// 3. Kiểm tra manifest.webmanifest
try {
  const manifest = JSON.parse(readFileSync(join(distDir, 'manifest.webmanifest'), 'utf8'));
  if (manifest.display !== 'standalone') errs.push(`manifest display=${manifest.display}, cần standalone`);
  if (manifest.orientation !== 'portrait') errs.push(`manifest orientation=${manifest.orientation}, cần portrait`);
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  let has192 = false;
  let has512 = false;
  let hasMaskable = false;
  for (const icon of icons) {
    const iconPath = join(distDir, icon.src || '');
    if (!existsSync(iconPath)) {
      errs.push(`manifest icon không tồn tại: ${icon.src}`);
      continue;
    }
    const { width, height } = readPngSize(iconPath);
    if (icon.sizes === '192x192') {
      if (width !== 192 || height !== 192) errs.push(`icon ${icon.src} kích thước thật ${width}x${height}, cần 192x192`);
      else has192 = true;
    }
    if (icon.sizes === '512x512') {
      if (width !== 512 || height !== 512) errs.push(`icon ${icon.src} kích thước thật ${width}x${height}, cần 512x512`);
      else has512 = true;
    }
    if (String(icon.purpose || '').split(/\s+/).includes('maskable')) hasMaskable = true;
  }
  if (!has192) errs.push('manifest thiếu icon 192x192');
  if (!has512) errs.push('manifest thiếu icon 512x512');
  if (!hasMaskable) errs.push('manifest thiếu icon có purpose maskable');
} catch (e) {
  errs.push(`manifest.webmanifest lỗi: ${e.message}`);
}

// 4. Kiểm tra sw.js
const swSrc = readFileSync(join(distDir, 'sw.js'), 'utf8');
if (swSrc.includes('__VERSION__') || swSrc.includes('__FILES__')) {
  errs.push('sw.js vẫn còn placeholder __VERSION__ hoặc __FILES__');
}
const filesMatch = swSrc.match(/const FILES\s*=\s*(\[[\s\S]*?\]);/);
if (!filesMatch) {
  errs.push('sw.js không tìm thấy mảng FILES');
} else {
  try {
    const swFiles = JSON.parse(filesMatch[1]);
    const expectedFiles = ['./', ...listFiles(distDir).filter((f) => f !== 'sw.js' && f !== '.nojekyll')];
    for (const req of ['./', 'index.html', 'manifest.webmanifest', 'js/core.js']) {
      if (!swFiles.includes(req)) errs.push(`FILES trong sw.js thiếu mục bắt buộc: ${req}`);
    }
    if (JSON.stringify([...swFiles].sort()) !== JSON.stringify([...expectedFiles].sort())) {
      errs.push('FILES trong sw.js không khớp danh sách file trong dist');
    }
  } catch (e) {
    errs.push(`FILES trong sw.js không parse được JSON: ${e.message}`);
  }
}

// 5. Kiểm tra không có mã màu hex trong pwa.css và index.html (trừ theme-color meta)
const pwaCss = readFileSync(join(distDir, 'pwa.css'), 'utf8');
if (/#[0-9a-fA-F]{3,8}\b/.test(pwaCss)) {
  errs.push('pwa.css có mã màu hex cứng, chỉ được dùng var(--...)');
}
const htmlNoThemeColor = distHtml.replace(/<meta\s+name="theme-color"\s+content="#[0-9a-fA-F]{3,8}">/g, '');
if (/#[0-9a-fA-F]{3,8}\b/.test(htmlNoThemeColor.replace(/&#\d+;/g, ''))) {
  errs.push('index.html có mã màu hex ngoài meta theme-color');
}

if (errs.length) {
  console.error('KHÔNG ĐẠT:\n- ' + errs.join('\n- '));
  process.exit(1);
}
console.log('ĐẠT');
