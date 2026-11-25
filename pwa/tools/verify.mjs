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

function isGoogleFontError(text, locUrl = '') {
  const s = `${text} ${locUrl}`;
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(s)) return true;
  if (/Failed to load resource: net::ERR_/i.test(text) && !locUrl) return true;
  return false;
}

function attachErrorCollector(page, label, target) {
  const failedFontUrls = new Set();
  page.on('requestfailed', (req) => {
    const u = req.url();
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(u)) {
      failedFontUrls.add(u);
    }
  });
  page.on('pageerror', (err) => {
    target.errors.push(`[${label}] pageerror: ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    const locUrl = msg.location()?.url || '';
    if (isGoogleFontError(text, locUrl) || (failedFontUrls.size > 0 && /Failed to load resource/i.test(text) && (!locUrl || /fonts\.google|fonts\.gstatic/i.test(locUrl)))) {
      target.fontNotes.push(`[${label}] font network: ${text}${locUrl ? ` (${locUrl})` : ''}`);
      return;
    }
    target.errors.push(`[${label}] console.error: ${text}${locUrl ? ` (${locUrl})` : ''}`);
  });
}

async function captureState(context, baseUrl, stateIndex, label, logBucket) {
  const page = await context.newPage();
  attachErrorCollector(page, label, logBucket);
  try {
    await page.clock.install({ time: new Date('2026-11-25T14:36:00+07:00') });
    await page.goto(baseUrl, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.clock.runFor(2500);
    await page.evaluate((i) => App.states[i].run(), stateIndex);
    await page.clock.runFor(3000);
    await page.evaluate(() => document.getAnimations().forEach((a) => {
      try { a.finish(); } catch { a.pause(); }
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
      const bufA = await captureState(ctx, srvA.url, i, `A[${i}]`, logsA);
      const bufB = await captureState(ctx, srvB.url, i, `B[${i}]`, logsB);

      const pngA = PNG.sync.read(bufA);
      const pngB = PNG.sync.read(bufB);

      let diffPixels = 0;
      if (pngA.width !== pngB.width || pngA.height !== pngB.height) {
        diffPixels = Math.max(pngA.width * pngA.height, pngB.width * pngB.height);
      } else {
        const diffPng = new PNG({ width: pngA.width, height: pngA.height });
        diffPixels = pixelmatch(pngA.data, pngB.data, diffPng.data, pngA.width, pngA.height, { threshold: 0 });
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
      attachErrorCollector(p, 'B[rotate]', logsB);
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
      attachErrorCollector(p, 'B[offline]', offlineLogs);
      try {
        await p.goto(srvB.url, { waitUntil: 'load' });
        await p.evaluate(() => navigator.serviceWorker.ready);
        const hasCtrl = await p.evaluate(() => Boolean(navigator.serviceWorker.controller));
        if (!hasCtrl) {
          await p.reload({ waitUntil: 'load' });
          await p.evaluate(() => navigator.serviceWorker.ready);
        }
        const ctrlAfter = await p.evaluate(() => Boolean(navigator.serviceWorker.controller));
        await swCtx.setOffline(true);
        await p.reload({ waitUntil: 'load' });
        const viewCount = await p.locator('.phone .view').count();
        offlineOk = ctrlAfter && viewCount > 0 && offlineLogs.errors.length === 0;
        if (!offlineOk) {
          offlineNote = `controller=${ctrlAfter}, .phone .view=${viewCount}, errors=${offlineLogs.errors.length}`;
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
      for (const e of logsA.errors) console.log(`  ${e}`);
    }
    const allBErrors = [...logsB.errors, ...offlineLogs.errors];
    if (allBErrors.length > 0) {
      console.log('\nLỗi console ở B:');
      for (const e of allBErrors) console.log(`  ${e}`);
    }

    const allStatesZero = stateResults.every((r) => r.diffPixels === 0);
    const passed = allStatesZero && rotateOk && offlineOk && manifestOk && allBErrors.length === 0;
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
