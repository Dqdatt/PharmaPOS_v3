// Dịch vụ push giả cho test: nhận POST từ Edge Function, kiểm VAPID, giải mã payload aes128gcm (RFC 8291).
import { createECDH, createDecipheriv, createPublicKey, hkdfSync, randomBytes, verify } from 'node:crypto';
import { createServer } from 'node:http';

const enc = (s) => Buffer.from(s);

// Một "trình duyệt": khoá ECDH + auth secret như PushSubscription thật
export function browser(base, name) {
  const ecdh = createECDH('prime256v1'); ecdh.generateKeys();
  const auth = randomBytes(16);
  return {
    name, ecdh, auth,
    sub: { endpoint: `${base}/ep/${name}`, keys: { p256dh: ecdh.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } },
  };
}

function decrypt(b, body) {
  const salt = body.subarray(0, 16), idlen = body[20], asPub = body.subarray(21, 21 + idlen), ct = body.subarray(21 + idlen);
  const uaPub = b.ecdh.getPublicKey();
  const ikm = Buffer.from(hkdfSync('sha256', b.ecdh.computeSecret(asPub), b.auth, Buffer.concat([enc('WebPush: info\0'), uaPub, asPub]), 32));
  const cek = Buffer.from(hkdfSync('sha256', ikm, salt, enc('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, enc('Content-Encoding: nonce\0'), 12));
  const d = createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(ct.subarray(ct.length - 16));
  const pt = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  let end = pt.length - 1;
  while (pt[end] === 0) end--;
  if (pt[end] !== 2) throw new Error('padding sai');
  return JSON.parse(pt.subarray(0, end).toString('utf8'));
}

// VAPID: Authorization "vapid t=<JWT ES256>, k=<public key>", aud = origin của endpoint
function checkVapid(header, vapidPub, origin) {
  const m = /^vapid t=([^,]+),\s*k=(.+)$/.exec(header || '');
  if (!m) throw new Error('thiếu VAPID');
  if (m[2] !== vapidPub) throw new Error('VAPID key khác');
  const [h, p, s] = m[1].split('.');
  const raw = Buffer.from(vapidPub, 'base64url');
  const key = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: raw.subarray(1, 33).toString('base64url'), y: raw.subarray(33).toString('base64url') }, format: 'jwk' });
  if (!verify('sha256', enc(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'))) throw new Error('chữ ký VAPID sai');
  const claims = JSON.parse(Buffer.from(p, 'base64url'));
  if (claims.aud !== origin || claims.exp * 1000 < Date.now()) throw new Error('VAPID aud/exp sai');
}

// add(name) tạo máy nhận; gone: tên endpoint trả 410. inbox: [{ name, msg }], errors: lỗi kiểm VAPID/giải mã
export async function fakePushService(vapidPub) {
  const inbox = [], errors = [], browsers = new Map(), gone = new Set();
  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const name = decodeURIComponent(req.url.replace(/^\/ep\//, ''));
      try {
        if (gone.has(name)) { res.writeHead(410).end(); return; }
        const b = browsers.get(name);
        if (!b) throw new Error(`endpoint lạ ${name}`);
        if (req.headers['content-encoding'] !== 'aes128gcm' || !req.headers.ttl) throw new Error('header push sai');
        checkVapid(req.headers.authorization, vapidPub, base);
        inbox.push({ name, msg: decrypt(b, Buffer.concat(chunks)) });
        res.writeHead(201).end();
      } catch (e) { errors.push(`${name}: ${e.message}`); res.writeHead(400).end(); }
    });
  });
  await new Promise((r) => server.listen(0, '0.0.0.0', r));
  // Edge Function chạy trong Docker → gọi về máy host
  const base = `http://host.docker.internal:${server.address().port}`;
  return {
    base, inbox, errors, gone,
    add(name) { const b = browser(base, name); browsers.set(name, b); return b; },
    async waitFor(n, ms = 8000) {
      for (const t = Date.now(); inbox.length < n && Date.now() - t < ms;) await new Promise((r) => setTimeout(r, 100));
      return inbox;
    },
    close: () => server.close(),
  };
}
