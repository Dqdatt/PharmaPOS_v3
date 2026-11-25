import http from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));
const protoDir = join(rootDir, 'prototype');
const distDir = join(rootDir, 'pwa', 'dist');
const outDir = join(rootDir, 'pwa', 'tools', 'out');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

function startStaticServer(dir) {
  const baseDir = resolve(dir);
  const server = http.createServer((req, res) => {
    try {
      const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const rel = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
      const filePath = resolve(baseDir, rel);
      if (filePath !== baseDir && !filePath.startsWith(baseDir + '/')) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        res.writeHead(404).end('Not Found');
        return;
      }
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(readFileSync(filePath));
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  });
  return new Promise((resolvePromise, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolvePromise({ server, url: `http://127.0.0.1:${addr.port}/` });
    });
  });
}

function isGoogleFontNetworkError(text, locUrl = '') {
  const hasGoogleFontUrl = /https?:\/\/fonts\.(googleapis|gstatic)\.com/i.test(locUrl) || /https?:\/\/fonts\.(googleapis|gstatic)\.com/i.test(text);
  const isNetworkErr = /Failed to load resource|net::ERR_|Failed to fetch|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION_FAILED/i.test(text);
  return hasGoogleFontUrl && isNetworkErr;
}

function normalizeErrorKey(kind, text, locUrl = '') {
  const normText = String(text).replace(/http:\/\/127\.0\.0\.1:\d+\//g, '<origin>/');
  const normLoc = String(locUrl).replace(/http:\/\/127\.0\.0\.1:\d+\//g, '<origin>/');
  return `${kind}|${normText}|${normLoc}`;
}

function attachErrorCollector(page, side, scope, target, isEnabled = () => true) {
  page.on('pageerror', (err) => {
    if (!isEnabled()) return;
    const msg = err.message || String(err);
    target.errors.push({
      scope,
      key: normalizeErrorKey('pageerror', msg),
      raw: `[${side} ${scope}] pageerror: ${msg}`,
    });
  });
  page.on('console', (msg) => {
    if (!isEnabled() || msg.type() !== 'error') return;
    const text = msg.text();
    const locUrl = msg.location()?.url || '';
    if (isGoogleFontNetworkError(text, locUrl)) {
      target.fontNotes.push(`[${side} ${scope}] font network: ${text}${locUrl ? ` (${locUrl})` : ''}`);
      return;
    }
    target.errors.push({
      scope,
      key: normalizeErrorKey('console.error', text, locUrl),
      raw: `[${side} ${scope}] console.error: ${text}${locUrl ? ` (${locUrl})` : ''}`,
    });
  });
}

function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

function buildSizeMismatchDiff(pngA, pngB) {
  const width = Math.max(pngA.width, pngB.width);
  const height = Math.max(pngA.height, pngB.height);
  const diff = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const inA = x < pngA.width && y < pngA.height;
      const inB = x < pngB.width && y < pngB.height;
      let same = false;
      if (inA && inB) {
        const iA = (y * pngA.width + x) * 4;
        const iB = (y * pngB.width + x) * 4;
        same =
          pngA.data[iA] === pngB.data[iB] &&
          pngA.data[iA + 1] === pngB.data[iB + 1] &&
          pngA.data[iA + 2] === pngB.data[iB + 2] &&
          pngA.data[iA + 3] === pngB.data[iB + 3];
      }
      if (same) {
        const iA = (y * pngA.width + x) * 4;
        diff.data[idx] = pngA.data[iA];
        diff.data[idx + 1] = pngA.data[iA + 1];
        diff.data[idx + 2] = pngA.data[iA + 2];
        diff.data[idx + 3] = Math.round(pngA.data[iA + 3] * 0.25);
      } else {
        diff.data[idx] = 255;
        diff.data[idx + 1] = 0;
        diff.data[idx + 2] = 0;
        diff.data[idx + 3] = 255;
      }
    }
  }
  return diff;
}

async function captureState(context, baseUrl, stateIndex, side, logBucket) {
  const page = await context.newPage();
  attachErrorCollector(page, side, `state:${stateIndex}`, logBucket);
  try {
    await page.clock.install({ time: new Date('2026-11-25T14:36:00+07:00') });
    await page.goto(baseUrl, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.clock.runFor(2500);
    await page.evaluate((i) => App.states[i].run(), stateIndex);
    for (let k = 0; k < 8; k++) {
      await page.waitForTimeout(150);
      await page.evaluate(() => document.getAnimations().forEach((a) => {
        try { a.finish(); } catch { a.pause(); a.currentTime = 0; }
      }));
      await page.clock.runFor(1000);
    }
    await page.evaluate(() => document.getAnimations().forEach((a) => {
      try { a.finish(); } catch { a.pause(); a.currentTime = 0; }
    }));
    await page.addStyleTag({ content: '*,*::before,*::after{caret-color:transparent!important}' });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    return await page.screenshot();
  } finally {
    await page.close();
  }
}

async function main() {
  if (!existsSync(distDir)) {
    console.error('Thiếu thư mục pwa/dist. Hãy chạy node pwa/build.mjs trước.');
    process.exit(1);
  }

  rmSync(outDir, { recursive: true, force: true });

  const srvA = await startStaticServer(protoDir);
  const srvB = await startStaticServer(distDir);
  const browser = await chromium.launch({ headless: true });

  const contextOpts = {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block',
    reducedMotion: 'no-preference',
  };

  try {
    const ctx = await browser.newContext(contextOpts);
    const probePage = await ctx.newPage();
    await probePage.goto(srvA.url, { waitUntil: 'load' });
    const states = await probePage.evaluate(() => App.states.map((s) => `${s.group} / ${s.label}`));
    await probePage.close();

    const stateResults = [];
    const logsA = { errors: [], fontNotes: [] };
    const logsB = { errors: [], fontNotes: [] };

    for (let i = 0; i < states.length; i++) {
      const bufA = await captureState(ctx, srvA.url, i, 'A', logsA);
      const bufB = await captureState(ctx, srvB.url, i, 'B', logsB);

      const pngA = PNG.sync.read(bufA);
      const pngB = PNG.sync.read(bufB);

      let diffPixels = 0;
      if (pngA.width !== pngB.width || pngA.height !== pngB.height) {
        const diffPng = buildSizeMismatchDiff(pngA, pngB);
        diffPixels = Math.max(pngA.width * pngA.height, pngB.width * pngB.height);
        mkdirSync(outDir, { recursive: true });
        writeFileSync(join(outDir, `${i}-A.png`), bufA);
        writeFileSync(join(outDir, `${i}-B.png`), bufB);
        writeFileSync(join(outDir, `${i}-diff.png`), PNG.sync.write(diffPng));
      } else {
        const diffPng = new PNG({ width: pngA.width, height: pngA.height });
        diffPixels = pixelmatch(pngA.data, pngB.data, diffPng.data, pngA.width, pngA.height, {
          threshold: 0,
          includeAA: true,
        });
        if (diffPixels > 0) {
          mkdirSync(outDir, { recursive: true });
          writeFileSync(join(outDir, `${i}-A.png`), bufA);
          writeFileSync(join(outDir, `${i}-B.png`), bufB);
          writeFileSync(join(outDir, `${i}-diff.png`), PNG.sync.write(diffPng));
        }
      }
      stateResults.push({ index: i, name: states[i], diffPixels });
    }

    // Ca 1: Ngang / Dọc trên B
    let rotateOk = false;
    let rotateNote = '';
    {
      const p = await ctx.newPage();
      attachErrorCollector(p, 'B', 'rotate', logsB);
      try {
        await p.goto(srvB.url, { waitUntil: 'load' });
        await p.setViewportSize({ width: 844, height: 390 });
        const land = await p.evaluate(() => {
          const rl = document.querySelector('.rotate-lock');
          const st = document.querySelector('.stage');
          return {
            rlDisplay: rl ? getComputedStyle(rl).display : null,
            stVisibility: st ? getComputedStyle(st).visibility : null,
          };
        });
        await p.setViewportSize({ width: 390, height: 844 });
        const port = await p.evaluate(() => {
          const rl = document.querySelector('.rotate-lock');
          return { rlDisplay: rl ? getComputedStyle(rl).display : null };
        });
        rotateOk = land.rlDisplay === 'flex' && land.stVisibility === 'hidden' && port.rlDisplay === 'none';
        if (!rotateOk) {
          rotateNote = `landscape=${JSON.stringify(land)}, portrait=${JSON.stringify(port)}`;
        }
      } finally {
        await p.close();
      }
    }
    await ctx.close();

    // Ca 2: Offline (cho phép service worker)
    let offlineOk = false;
    let offlineNote = '';
    const offlineLogs = { errors: [], fontNotes: [] };
    {
      const swCtx = await browser.newContext({ ...contextOpts, serviceWorkers: 'allow' });
      const p = await swCtx.newPage();
      let collectOfflineErrors = false;
      attachErrorCollector(p, 'B', 'offline', offlineLogs, () => collectOfflineErrors);
      try {
        await p.goto(srvB.url, { waitUntil: 'load' });
        await withTimeout(
          p.evaluate(() => navigator.serviceWorker.ready),
          8000,
          'Hết thời gian chờ navigator.serviceWorker.ready'
        );
        const hasCtrl = await p.evaluate(() => Boolean(navigator.serviceWorker.controller));
        if (!hasCtrl) {
          await p.reload({ waitUntil: 'load' });
          await withTimeout(
            p.evaluate(() => navigator.serviceWorker.ready),
            8000,
            'Hết thời gian chờ navigator.serviceWorker.ready sau reload'
          );
        }
        const ctrlAfter = await p.evaluate(() => Boolean(navigator.serviceWorker.controller));
        if (!ctrlAfter) {
          throw new Error('Không có navigator.serviceWorker.controller');
        }
        await swCtx.setOffline(true);
        collectOfflineErrors = true;
        await p.reload({ waitUntil: 'load' });
        const viewCount = await p.locator('.phone .view').count();
        offlineOk = viewCount > 0 && offlineLogs.errors.length === 0;
        if (!offlineOk) {
          offlineNote = `.phone .view=${viewCount}, errors=${offlineLogs.errors.length}`;
        }
      } catch (e) {
        offlineNote = e.message;
      } finally {
        await p.close();
        await swCtx.close();
      }
    }

    // Ca 3: Manifest
    let manifestOk = false;
    let manifestNote = '';
    try {
      const res = await fetch(`${srvB.url}manifest.webmanifest`);
      const json = await res.json();
      manifestOk = res.status === 200 && json.orientation === 'portrait';
      if (!manifestOk) manifestNote = `status=${res.status}, orientation=${json.orientation}`;
    } catch (e) {
      manifestNote = e.message;
    }

    // Đối chiếu lỗi console theo nội dung và state tương ứng
    const errorsAByScope = new Map();
    for (const err of logsA.errors) {
      if (!errorsAByScope.has(err.scope)) errorsAByScope.set(err.scope, new Map());
      const m = errorsAByScope.get(err.scope);
      m.set(err.key, (m.get(err.key) || 0) + 1);
    }

    const bOnlyErrors = [];
    const remainingA = new Map();
    for (const [scope, map] of errorsAByScope) {
      remainingA.set(scope, new Map(map));
    }
    for (const err of logsB.errors) {
      const scopeMap = remainingA.get(err.scope);
      const count = scopeMap?.get(err.key) || 0;
      if (count > 0) {
        scopeMap.set(err.key, count - 1);
      } else {
        bOnlyErrors.push(err);
      }
    }
    const allBOnlyErrors = [...bOnlyErrors, ...offlineLogs.errors];

    // In bảng kết quả
    const nameWidth = Math.max(30, ...stateResults.map((r) => r.name.length));
    console.log(`\n${'state'.padEnd(nameWidth)} | pixel lệch`);
    console.log(`${'-'.repeat(nameWidth)}-+-${'-'.repeat(12)}`);
    for (const r of stateResults) {
      console.log(`${`${r.index}: ${r.name}`.padEnd(nameWidth)} | ${r.diffPixels}`);
    }

    console.log('\nCa riêng trên B:');
    console.log(`- Ngang/Dọc (.rotate-lock) | ${rotateOk ? 'ĐẠT' : `KHÔNG ĐẠT (${rotateNote})`}`);
    console.log(`- Offline (Service Worker) | ${offlineOk ? 'ĐẠT' : `KHÔNG ĐẠT (${offlineNote})`}`);
    console.log(`- Manifest (portrait)      | ${manifestOk ? 'ĐẠT' : `KHÔNG ĐẠT (${manifestNote})`}`);

    const allFontNotes = [...logsA.fontNotes, ...logsB.fontNotes, ...offlineLogs.fontNotes];
    if (allFontNotes.length > 0) {
      console.log(`\nGhi chú font Google (không tính lỗi): ${allFontNotes.length} thông báo`);
    }

    if (logsA.errors.length > 0) {
      console.log('\nLỗi console ở A:');
      for (const e of logsA.errors) console.log(`  ${e.raw}`);
    }
    const allBErrors = [...logsB.errors, ...offlineLogs.errors];
    if (allBErrors.length > 0) {
      console.log('\nLỗi console ở B:');
      for (const e of allBErrors) console.log(`  ${e.raw}`);
    }
    if (allBOnlyErrors.length > 0) {
      console.log('\nLỗi console chỉ có ở B (tính KHÔNG ĐẠT):');
      for (const e of allBOnlyErrors) console.log(`  ${e.raw}`);
    }

    const allStatesZero = stateResults.every((r) => r.diffPixels === 0);
    const passed = allStatesZero && rotateOk && offlineOk && manifestOk && allBOnlyErrors.length === 0;
    console.log(`\nTổng kết: ${passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`);
    if (!passed) process.exitCode = 1;
  } finally {
    await browser.close();
    srvA.server.close();
    srvB.server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
