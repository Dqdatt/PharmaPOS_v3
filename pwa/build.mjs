import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const protoDir = join(rootDir, 'prototype');
const srcDir = join(rootDir, 'pwa', 'src');
const distDir = join(rootDir, 'pwa', 'dist');

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFileSync(srcPath, destPath);
    }
  }
}

function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full, base));
    } else if (entry.isFile()) {
      out.push(relative(base, full).split('\\').join('/'));
    }
  }
  return out;
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

for (const sub of ['css', 'js', 'screens', 'assets']) {
  copyDir(join(protoDir, sub), join(distDir, sub));
}

for (const file of ['index.html', 'pwa.css', 'manifest.webmanifest']) {
  copyFileSync(join(srcDir, file), join(distDir, file));
}
copyDir(join(srcDir, 'icons'), join(distDir, 'icons'));

const distFiles = listFiles(distDir).sort();
const hash = createHash('sha256');
for (const rel of distFiles) {
  hash.update(rel);
  hash.update(readFileSync(join(distDir, rel)));
}
const version = hash.digest('hex').slice(0, 10);
const cacheFiles = ['./', ...distFiles.filter((f) => f !== 'sw.js')];

const swTemplate = readFileSync(join(srcDir, 'sw.js'), 'utf8');
const swOut = swTemplate
  .replace('__VERSION__', version)
  .replace('__FILES__', JSON.stringify(cacheFiles, null, 2));

writeFileSync(join(distDir, 'sw.js'), swOut, 'utf8');
writeFileSync(join(distDir, '.nojekyll'), '', 'utf8');

const totalFiles = distFiles.length + 2;
if (!statSync(join(distDir, 'sw.js')).isFile()) {
  throw new Error('Không tạo được sw.js');
}
console.log(`Built pwa/dist: ${totalFiles} files, VERSION=${version}`);
