// Basic Service Worker for PWA
const CACHE_NAME = 'liturgia-sje-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
  '/Logo-Liturgia-SJE.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Apenas cachear requisições GET e de mesma origem
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Não cachear chamadas da API do Supabase ou dados dinâmicos aqui para evitar inconsistências
        return fetchResponse;
      });
    }).catch(() => {
      // Offline fallback can be implemented here
    })
  );
});
