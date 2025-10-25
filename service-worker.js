// Service Worker - PWA Offline Desteği
const CACHE_NAME = 'love-site-v1';
const urlsToCache = [
  './',
  './index.html',
  './gallery.html',
  './bucket-list.html',
  './chat.html',
  './admin.html',
  './login.html',
  './style.css',
  './gallery.css',
  './navigation.css',
  './script.js',
  './gallery.js',
  './auth.js',
  './firebase-config.js',
  './firebase-sync.js',
  './notification-system.js',
  './pwa-installer.js',
  './video-manager.js'
];

// Install event - cache dosyaları
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache açıldı');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - eski cache'leri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski cache siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network First, fallback to Cache
self.addEventListener('fetch', event => {
  // POST isteklerini cache'leme (Firebase istekleri için)
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Firebase isteklerini cache'leme
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Başarılı response'u cache'e kaydet (sadece GET istekleri için)
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache).catch(err => {
                console.log('Cache put error:', err);
              });
            });
        }
        return response;
      })
      .catch(() => {
        // Network başarısız, cache'den dön
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Offline sayfası göster
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Push notification event
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Bizim Hikayemiz 💕';
  const options = {
    body: data.body || 'Yeni bir güncelleme var!',
    icon: data.icon || '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Aç'
      },
      {
        action: 'close',
        title: 'Kapat'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || './')
    );
  }
});

// Background sync event
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Firebase sync işlemi
  console.log('Background sync çalışıyor...');
  // TODO: Firebase ile senkronizasyon
}
