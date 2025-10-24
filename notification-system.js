// ============================================
// BİLDİRİM SİSTEMİ
// ============================================

class NotificationSystem {
    constructor() {
        this.checkPermission();
        this.checkSpecialDates();
        
        // Her gün bir kere kontrol et
        setInterval(() => this.checkSpecialDates(), 24 * 60 * 60 * 1000);
        
        // Her saat başı kontrol et
        setInterval(() => this.checkHourlyReminders(), 60 * 60 * 1000);
    }
    
    // Bildirim izni kontrol et
    async checkPermission() {
        if (!('Notification' in window)) {
            console.log('Bu tarayıcı bildirimleri desteklemiyor');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return false;
    }
    
    // Tarayıcı bildirimi gönder
    async sendNotification(title, body, icon = '💕') {
        const hasPermission = await this.checkPermission();
        
        if (!hasPermission) {
            // Fallback: Sayfa içi bildirim
            this.showInPageNotification(title, body, icon);
            return;
        }
        
        try {
            const notification = new Notification(title, {
                body: body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">' + icon + '</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">💕</text></svg>',
                tag: 'love-notification',
                requireInteraction: false,
                vibrate: [200, 100, 200]
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // 10 saniye sonra otomatik kapat
            setTimeout(() => notification.close(), 10000);
            
        } catch (error) {
            console.error('Bildirim hatası:', error);
            this.showInPageNotification(title, body, icon);
        }
    }
    
    // Sayfa içi bildirim (fallback)
    showInPageNotification(title, body, icon = '💕') {
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
        
        // 8 saniye sonra otomatik kapat
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 8000);
    }
    
    // Özel günleri kontrol et
    checkSpecialDates() {
        const today = new Date();
        const savedDates = localStorage.getItem('lovesite_dates');
        
        if (!savedDates) return;
        
        const dates = JSON.parse(savedDates);
        const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        
        // Her bir özel tarihi kontrol et
        for (const [key, value] of Object.entries(dates)) {
            if (!value || !value.date) continue;
            
            const specialDate = new Date(value.date);
            const daysPassed = Math.floor((today - specialDate) / (1000 * 60 * 60 * 24));
            
            // Yıldönümü kontrolü (tam yıl)
            if (daysPassed > 0 && daysPassed % 365 === 0) {
                const years = daysPassed / 365;
                const title = this.getDateTitle(key);
                this.sendNotification(
                    `🎉 ${years}. Yıl Dönümünüz! 🎉`,
                    `${title} tarihinin ${years}. yılı! Mutlu yıldönümü ${currentUser}! 💕`,
                    '🎊'
                );
            }
            
            // Ayın aynı günü (aylık yıldönümü)
            if (today.getDate() === specialDate.getDate() && daysPassed > 30 && daysPassed % 30 === 0) {
                const months = Math.floor(daysPassed / 30);
                const title = this.getDateTitle(key);
                this.sendNotification(
                    `💝 ${months} Aylık Özel Gün`,
                    `${title} tarihinin ${months}. ayı! 🌟`,
                    '📅'
                );
            }
            
            // 100, 200, 300... gün
            if (daysPassed > 0 && daysPassed % 100 === 0) {
                const title = this.getDateTitle(key);
                this.sendNotification(
                    `🌈 ${daysPassed}. Gün!`,
                    `${title} tarihinden bu yana ${daysPassed} gün geçti! ✨`,
                    '🎯'
                );
            }
        }
        
        // Bugün kontrol edildi olarak işaretle
        const lastCheck = localStorage.getItem('lastNotificationCheck');
        const todayStr = today.toDateString();
        
        if (lastCheck !== todayStr) {
            localStorage.setItem('lastNotificationCheck', todayStr);
        }
    }
    
    // Tarih başlığını al
    getDateTitle(key) {
        const titles = {
            firstMeet: 'İlk Tanışma',
            relationship: 'İlişki Başlangıcı',
            firstKiss: 'İlk Öpücük',
            specialDay: 'Özel Gün'
        };
        return titles[key] || 'Özel Gün';
    }
    
    // Saatlik hatırlatıcılar
    checkHourlyReminders() {
        const now = new Date();
        const hour = now.getHours();
        const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        
        // Sabah mesajı (09:00)
        if (hour === 9) {
            this.sendNotification(
                '☀️ Günaydın!',
                `Güzel bir gün olsun ${currentUser}! 💕`,
                '🌅'
            );
        }
        
        // Akşam mesajı (21:00)
        if (hour === 21) {
            this.sendNotification(
                '🌙 İyi Geceler!',
                `Tatlı rüyalar ${currentUser}! 😴💕`,
                '✨'
            );
        }
    }
    
    // Yeni fotoğraf bildirim
    notifyNewPhoto(uploaderName) {
        const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        
        if (uploaderName !== currentUser) {
            this.sendNotification(
                '📸 Yeni Fotoğraf!',
                `${uploaderName} yeni bir anı ekledi. Görmeye gitmez misin? 💕`,
                '📷'
            );
        }
    }
    
    // Yeni mesaj bildirimi
    notifyNewMessage(senderName, messagePreview) {
        const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        
        if (senderName !== currentUser) {
            this.sendNotification(
                `💌 ${senderName}`,
                messagePreview.substring(0, 50) + '...',
                '💬'
            );
        }
    }
    
    // Bucket list tamamlama bildirimi
    notifyBucketComplete(itemName) {
        this.sendNotification(
            '🎊 Hedef Tamamlandı!',
            `"${itemName}" hedefinizi gerçekleştirdiniz! Tebrikler! 🌟`,
            '✅'
        );
    }
}

// Global instance oluştur
const notificationSystem = new NotificationSystem();
window.notificationSystem = notificationSystem;

// CSS animasyonları ekle
if (!document.getElementById('notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
