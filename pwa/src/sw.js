const VERSION = '__VERSION__';
const FILES = __FILES__;
const CACHE_NAME = 'medipos-' + VERSION;
const FONT_CACHE = 'medipos-fonts';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('medipos-') && k !== CACHE_NAME && k !== FONT_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('./', { cacheName: CACHE_NAME }).then((res) => res || caches.match('index.html', { cacheName: CACHE_NAME }))
      )
    );
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    let putPromise;
    const network = fetch(request).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        putPromise = caches.open(FONT_CACHE).then((c) => c.put(request, copy)).catch(() => {});
      }
      return res;
    });
    event.respondWith(caches.match(request, { cacheName: FONT_CACHE }).then((cached) => cached || network));
    event.waitUntil(network.then(() => putPromise, () => {}));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request, { cacheName: CACHE_NAME }).then((cached) => cached || fetch(request))
    );
  }
});
