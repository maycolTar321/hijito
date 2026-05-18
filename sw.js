const CACHE_NAME = 'super-aziel-v3';
const urlsToCache = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Solo aplicar network-first a peticiones locales/propias del PWA
  if (event.request.mode === 'navigate' || event.request.url.includes(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseCopy = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseCopy);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Para otras peticiones (como la API de Google Apps Script), responder normal
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});
