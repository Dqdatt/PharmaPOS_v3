const VERSION = '__VERSION__';
const FILES = __FILES__;
const CACHE_NAME = 'medipos-' + VERSION;
const FONT_CACHE = 'medipos-fonts';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES))
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
        caches.match('./').then((res) => res || caches.match('index.html'))
      )
    );
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    const updatePromise = caches.open(FONT_CACHE).then((cache) =>
      fetch(request).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          return cache.put(request, res.clone()).then(() => res);
        }
        return res;
      })
    );
    event.waitUntil(updatePromise.catch(() => undefined));
    event.respondWith(
      caches.open(FONT_CACHE)
        .then((cache) => cache.match(request))
        .then((cached) => cached || updatePromise)
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
