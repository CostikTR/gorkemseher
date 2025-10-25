// Firebase Cloud Messaging Manager
import { messaging, getToken, onMessage } from './firebase-config.js';
import { db, doc, setDoc, getDoc } from './firebase-config.js';

class FCMManager {
    constructor() {
        this.currentToken = null;
        this.init();
    }

    async init() {
        if (!messaging) {
            console.warn('⚠️ Firebase Messaging kullanılamıyor (HTTPS gerekli)');
            return;
        }

        // Foreground mesajları dinle
        this.listenForMessages();
        
        // Token al ve kaydet
        await this.requestPermissionAndGetToken();
    }

    async requestPermissionAndGetToken() {
        try {
            // Bildirim izni al
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                console.log('⚠️ Bildirim izni verilmedi');
                return null;
            }

            console.log('✅ Bildirim izni alındı, FCM token isteniyor...');

            // VAPID key - Firebase Console'dan alındı
            const vapidKey = 'BF8KbpaZqsQl_1gz04TQ3n8Wnim1PLeMgVoQVc5g2WcpEOSZU_ZTpo28JSVqwiqjV7W1JCWY5KGGxB56JEht2Qc';
            
            try {
                const currentToken = await getToken(messaging, { 
                    vapidKey: vapidKey,
                    serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js')
                });

                if (currentToken) {
                    console.log('✅ FCM Token alındı:', currentToken.substring(0, 20) + '...');
                    this.currentToken = currentToken;
                    
                    // Token'ı Firebase'e kaydet
                    await this.saveTokenToFirebase(currentToken);
                    
                    return currentToken;
                } else {
                    console.log('⚠️ FCM token alınamadı');
                    return null;
                }
            } catch (error) {
                console.warn('⚠️ FCM token hatası (VAPID key gerekli):', error.message);
                return null;
            }

        } catch (error) {
            console.error('❌ FCM izin hatası:', error);
            return null;
        }
    }

    async saveTokenToFirebase(token) {
        try {
            const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
            if (!currentUser) return;

            const userTokenRef = doc(db, 'fcm_tokens', currentUser);
            
            await setDoc(userTokenRef, {
                token: token,
                user: currentUser,
                updatedAt: new Date().toISOString(),
                device: this.getDeviceInfo()
            }, { merge: true });

            console.log('✅ FCM token Firebase\'e kaydedildi');
        } catch (error) {
            console.error('❌ Token kayıt hatası:', error);
        }
    }

    getDeviceInfo() {
        const ua = navigator.userAgent;
        let device = 'Unknown';
        
        if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) {
            if (/iPhone|iPad|iPod/.test(ua)) {
                device = 'iOS';
            } else if (/Android/.test(ua)) {
                device = 'Android';
            } else {
                device = 'Mobile';
            }
        } else {
            device = 'Desktop';
        }
        
        return {
            type: device,
            userAgent: ua,
            platform: navigator.platform,
            language: navigator.language
        };
    }

    listenForMessages() {
        if (!messaging) return;

        onMessage(messaging, (payload) => {
            console.log('📬 Foreground mesaj alındı:', payload);
            
            const title = payload.notification?.title || payload.data?.title || 'Yeni Bildirim 💕';
            const body = payload.notification?.body || payload.data?.body || 'Yeni bir güncelleme!';
            const icon = payload.data?.icon || '💕';
            
            // Sayfa içi bildirim göster
            this.showInPageNotification(title, body, icon);
            
            // Tarayıcı bildirimi de göster
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body: body,
                    icon: '/icon-192.svg',
                    badge: '/badge-72.svg',
                    tag: payload.data?.tag || 'fcm-notification',
                    vibrate: [200, 100, 200],
                    data: payload.data
                });
            }
        });
    }

    showInPageNotification(title, body, icon) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 25px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 999999;
            max-width: 350px;
            animation: slideInRight 0.5s ease-out;
            cursor: pointer;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 5px;">${icon}</div>
            <div style="font-weight: bold; font-size: 1.2em; margin-bottom: 5px;">${title}</div>
            <div style="opacity: 0.95; font-size: 0.95em;">${body}</div>
        `;
        
        notification.onclick = () => notification.remove();
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    // Diğer kullanıcıya bildirim gönder
    async sendNotificationToUser(targetUser, title, body, data = {}) {
        try {
            console.log(`📤 ${targetUser} için bildirim hazırlanıyor...`);
            
            // Hedef kullanıcının FCM token'ını al
            const userTokenRef = doc(db, 'fcm_tokens', targetUser);
            const tokenDoc = await getDoc(userTokenRef);
            
            if (!tokenDoc.exists()) {
                console.warn(`⚠️ ${targetUser} için FCM token bulunamadı. PWA yüklemediyse bildirim gitmez.`);
                return false;
            }

            const targetToken = tokenDoc.data().token;
            console.log(`✅ ${targetUser} token bulundu: ${targetToken.substring(0, 20)}...`);
            
            // ÇÖZÜM 1: Firestore'a bildirim ekle
            // Diğer cihaz bunu dinleyip kendi Service Worker'ından gösterecek
            const notificationRef = doc(db, 'notifications', Date.now().toString());
            
            await setDoc(notificationRef, {
                targetUser: targetUser,
                targetToken: targetToken,
                title: title,
                body: body,
                icon: data.icon || '💕',
                url: data.url || '/',
                type: data.type || 'general',
                timestamp: new Date().toISOString(),
                read: false
            });

            console.log(`✅ ${targetUser} için bildirim Firestore'a kaydedildi`);
            
            // ÇÖZÜM 2: Cloud Function varsa (opsiyonel)
            // pending_notifications koleksiyonuna da ekle
            const pendingRef = doc(db, 'pending_notifications', Date.now().toString());
            await setDoc(pendingRef, {
                to: targetToken,
                notification: { title, body },
                data: { ...data, timestamp: new Date().toISOString() },
                createdAt: new Date().toISOString(),
                status: 'pending'
            });

            return true;

        } catch (error) {
            console.error('❌ Bildirim gönderme hatası:', error);
            return false;
        }
    }
}

// Global instance
const fcmManager = new FCMManager();
window.fcmManager = fcmManager;

export default fcmManager;
