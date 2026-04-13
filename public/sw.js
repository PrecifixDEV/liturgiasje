// Basic Service Worker for PWA
const CACHE_NAME = 'liturgia-sje-v3';
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
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return fetchResponse;
      });
    }).catch(() => {})
  );
});

// --- Início da lógica de Notificações Push ---

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nova atualização no Liturgia SJE',
      icon: '/Logo-Liturgia-SJE.png', 
      badge: '/Logo-Liturgia-SJE.png',
      data: {
        url: data.url || '/'
      },
      vibrate: [100, 50, 100]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Liturgia SJE', options)
    );
  } catch (error) {
    console.error('Erro ao processar notificação push:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Converter URL relativa para absoluta para comparação correta
  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // Compara URLs absolutas
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
