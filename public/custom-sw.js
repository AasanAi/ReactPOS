// Offline fallback basic example

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('aasan-pos-cache').then(function (cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/favicon.ico',
        '/manifest.json',
        // Add other important files here if needed
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    clients.claim()
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request);
    })
  );
});
