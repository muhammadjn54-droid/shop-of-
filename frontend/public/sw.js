const CACHE_NAME = 'shop-crm-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Do not intercept API requests or cross-origin requests (e.g. backend port 4000)
  try {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/api') || url.origin !== self.location.origin) {
      return;
    }
  } catch {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});
