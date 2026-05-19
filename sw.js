const CACHE_NAME = 'hijito-baby-tracker-v1';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './logo.png'
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
  // Never cache external API/data requests
  if (event.request.url.includes('script.google.com') || event.request.url.includes('exec') || event.request.url.includes('tile.openstreetmap.org')) {
    return event.respondWith(fetch(event.request));
  }

  // Network-first for navigate requests, fallback to cache
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
    // For other assets, try cache first, fallback to network
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});
