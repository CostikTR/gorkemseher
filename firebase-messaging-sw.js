// Firebase Messaging Service Worker
// Bu dosya public root'da olmalı ve firebase-messaging-sw.js adında olmalı

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAsQsyb6VebOmcI9TFsc-IIqXVYFiCwVIo",
    authDomain: "bebegim-5e848.firebaseapp.com",
    projectId: "bebegim-5e848",
    storageBucket: "bebegim-5e848.firebasestorage.app",
    messagingSenderId: "1073954837331",
    appId: "1:1073954837331:web:8fe594a86542966f2147a6"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('📬 Arka plan mesajı alındı:', payload);
    
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Yeni Bildirim 💕';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'Yeni bir güncelleme var!',
        icon: payload.notification?.icon || '/icon-192.png',
        badge: '/badge-72.png',
        tag: payload.data?.tag || 'notification',
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: {
            url: payload.data?.url || '/',
            ...payload.data
        },
        actions: [
            {
                action: 'open',
                title: 'Aç',
                icon: '/icon-192.png'
            },
            {
                action: 'close',
                title: 'Kapat'
            }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('🖱️ Bildirime tıklandı:', event.action);
    
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        const urlToOpen = event.notification.data?.url || '/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Zaten açık pencere varsa onu kullan
                    for (let client of clientList) {
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            return client.focus().then(() => {
                                if (urlToOpen !== '/') {
                                    return client.navigate(urlToOpen);
                                }
                            });
                        }
                    }
                    // Yoksa yeni pencere aç
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

console.log('✅ Firebase Messaging Service Worker yüklendi');
