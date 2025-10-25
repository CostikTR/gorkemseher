// Firestore'dan gelen bildirimleri dinle ve göster
import { db, collection, query, where, onSnapshot, doc, updateDoc } from './firebase-config.js';

class NotificationListener {
    constructor() {
        this.unsubscribe = null;
        this.init();
    }

    async init() {
        const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        if (!currentUser) {
            console.log('⚠️ Kullanıcı giriş yapmamış, bildirim dinleyici başlatılmadı');
            return;
        }

        console.log(`👂 ${currentUser} için bildirim dinleyici başlatılıyor...`);
        
        // Firestore'dan bu kullanıcıya gelen bildirimleri dinle
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('targetUser', '==', currentUser),
            where('read', '==', false)
        );

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.data();
                    console.log('📬 Yeni bildirim geldi:', data);
                    
                    // Bildirimi göster
                    this.showNotification(data, change.doc.id);
                }
            });
        });

        console.log('✅ Bildirim dinleyici aktif!');
    }

    async showNotification(data, docId) {
        try {
            const { title, body, icon, url } = data;
            
            // Service Worker varsa ona gönder (background notification için)
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    notification: {
                        title: title,
                        body: body,
                        icon: icon || '💕',
                        url: url || '/'
                    }
                });
            }
            
            // Browser notification göster (uygulama açıksa)
            if (Notification.permission === 'granted') {
                const notification = new Notification(title, {
                    body: body,
                    icon: '/icon-192.svg',
                    badge: '/badge-72.svg',
                    tag: 'notification-' + docId,
                    vibrate: [200, 100, 200],
                    data: { url: url }
                });

                notification.onclick = function() {
                    window.focus();
                    if (url) {
                        window.location.href = url;
                    }
                    notification.close();
                };

                console.log('✅ Bildirim gösterildi:', title);
            }

            // Bildirimi okundu olarak işaretle
            const notifRef = doc(db, 'notifications', docId);
            await updateDoc(notifRef, {
                read: true,
                readAt: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Bildirim gösterme hatası:', error);
        }
    }

    stop() {
        if (this.unsubscribe) {
            this.unsubscribe();
            console.log('🛑 Bildirim dinleyici durduruldu');
        }
    }
}

// Global instance
const notificationListener = new NotificationListener();
window.notificationListener = notificationListener;

export default notificationListener;
