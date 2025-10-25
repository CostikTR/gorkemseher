// PWA Installer
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }
    
    init() {
        // Service Worker'ı kaydet
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('✅ Service Worker kayıtlı:', registration.scope);
                    
                    // Güncelleme kontrolü
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification(registration);
                            }
                        });
                    });
                    
                    // Periyodik güncelleme kontrolü (her 1 saatte bir)
                    setInterval(() => {
                        registration.update();
                    }, 60 * 60 * 1000);
                })
                .catch(error => {
                    console.error('❌ Service Worker kaydı başarısız:', error);
                });
        }
        
        // Install prompt'u dinle
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        // App yüklendikten sonra
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA başarıyla yüklendi!');
            this.hideInstallButton();
            this.showSuccessMessage();
        });
    }
    
    showUpdateNotification(registration) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 25px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 99999;
            max-width: 350px;
            animation: slideInRight 0.5s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 2em;">🎉</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Yeni Güncelleme!</div>
                    <div style="font-size: 0.9em; opacity: 0.9;">Yeni özellikler mevcut</div>
                </div>
            </div>
            <button onclick="location.reload()" 
                style="margin-top: 15px; width: 100%; padding: 10px; background: white; 
                color: #667eea; border: none; border-radius: 10px; font-weight: bold; 
                cursor: pointer; transition: all 0.3s;">
                Şimdi Güncelle
            </button>
            <button onclick="this.parentElement.remove()" 
                style="margin-top: 8px; width: 100%; padding: 8px; background: rgba(255,255,255,0.2); 
                color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 0.9em;">
                Sonra
            </button>
        `;
        
        document.body.appendChild(notification);
    }
    
    showInstallButton() {
        // Eğer kullanıcı daha önce kapattıysa gösterme
        if (localStorage.getItem('pwa-install-dismissed') === 'true') {
            return;
        }

        // Install butonu göster
        const installContainer = document.createElement('div');
        installContainer.id = 'pwa-install-container';
        installContainer.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            display: flex;
            gap: 10px;
            align-items: center;
            z-index: 9999;
        `;

        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.innerHTML = '📱 Uygulamayı Yükle';
        installBtn.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 50px;
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            animation: pulse 2s infinite;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 50%;
            font-size: 1.2em;
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        installBtn.onclick = () => this.promptInstall();
        closeBtn.onclick = () => {
            localStorage.setItem('pwa-install-dismissed', 'true');
            installContainer.remove();
        };

        installContainer.appendChild(installBtn);
        installContainer.appendChild(closeBtn);
        
        // Container'ı ekle (eğer zaten yoksa)
        if (!document.getElementById('pwa-install-container')) {
            document.body.appendChild(installContainer);
        }
        
        console.log('✅ PWA Install butonu eklendi');
    }
    
    hideInstallButton() {
        const container = document.getElementById('pwa-install-container');
        if (container) container.remove();
        const btn = document.getElementById('pwa-install-btn');
        if (btn) btn.remove();
    }
    
    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('⚠️ Install prompt mevcut değil - tarayıcı desteklemiyor veya zaten yüklü');
            
            // Alternatif mesaj göster
            const message = document.createElement('div');
            message.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                z-index: 99999;
                text-align: center;
                max-width: 400px;
            `;
            
            message.innerHTML = `
                <div style="font-size: 3em; margin-bottom: 15px;">📱</div>
                <div style="font-size: 1.3em; font-weight: bold; margin-bottom: 10px;">
                    Manuel Kurulum
                </div>
                <div style="font-size: 0.95em; line-height: 1.5;">
                    <strong>Chrome/Edge:</strong> Adres çubuğundaki ⋮ → "Yükle"<br>
                    <strong>Safari:</strong> Paylaş → "Ana Ekrana Ekle"<br>
                    <strong>Firefox:</strong> ⋮ → "Ana Ekrana Ekle"
                </div>
                <button onclick="this.parentElement.remove()" 
                    style="margin-top: 20px; padding: 10px 30px; background: white; 
                    color: #667eea; border: none; border-radius: 20px; 
                    font-weight: bold; cursor: pointer;">
                    Anladım
                </button>
            `;
            
            document.body.appendChild(message);
            return;
        }
        
        this.deferredPrompt.prompt();
        
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`Kullanıcı seçimi: ${outcome}`);
        
        this.deferredPrompt = null;
        this.hideInstallButton();
        
        if (outcome === 'accepted') {
            this.showSuccessMessage();
        }
    }
    
    showSuccessMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            z-index: 99999;
            text-align: center;
            animation: fadeIn 0.5s ease-out;
        `;
        
        message.innerHTML = `
            <div style="font-size: 4em; margin-bottom: 15px;">🎉</div>
            <div style="font-size: 1.5em; font-weight: bold; margin-bottom: 10px;">Harika!</div>
            <div style="font-size: 1.1em;">Artık ana ekranınızdan<br>kolayca erişebilirsiniz! 💕</div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => message.remove(), 500);
        }, 3000);
    }
    
    // Online/Offline durumunu göster
    handleConnectionChange() {
        window.addEventListener('online', () => {
            this.showConnectionStatus('🟢 Çevrimiçi', '#4CAF50');
        });
        
        window.addEventListener('offline', () => {
            this.showConnectionStatus('🔴 Çevrimdışı', '#f44336');
        });
    }
    
    showConnectionStatus(message, color) {
        const status = document.createElement('div');
        status.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${color};
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            z-index: 99999;
            animation: slideDown 0.3s ease-out;
        `;
        status.textContent = message;
        
        document.body.appendChild(status);
        
        setTimeout(() => {
            status.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => status.remove(), 300);
        }, 2000);
    }
}

// PWA Installer'ı başlat
const pwaInstaller = new PWAInstaller();
pwaInstaller.handleConnectionChange();

// Manuel install butonu ekle (her zaman görünsün)
setTimeout(() => {
    if (!document.getElementById('pwa-install-container') && 
        !window.matchMedia('(display-mode: standalone)').matches &&
        localStorage.getItem('pwa-install-dismissed') !== 'true') {
        pwaInstaller.showInstallButton();
    }
}, 2000);

// Animasyonlar
const pwaStyles = document.createElement('style');
pwaStyles.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
    
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100px); opacity: 0; }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(pwaStyles);

// PWA durumunu göster
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('✅ PWA modunda çalışıyor');
    
    // Hoşgeldin mesajı (sadece ilk açılışta)
    if (!sessionStorage.getItem('pwa-welcome-shown')) {
        setTimeout(() => {
            const welcome = document.createElement('div');
            welcome.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                border-radius: 50px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                z-index: 99999;
                font-weight: bold;
                animation: slideDown 0.5s ease-out;
            `;
            welcome.textContent = '💕 Hoşgeldin! Uygulama hazır';
            document.body.appendChild(welcome);
            
            setTimeout(() => {
                welcome.style.animation = 'slideUp 0.5s ease-out';
                setTimeout(() => welcome.remove(), 500);
            }, 2500);
            
            sessionStorage.setItem('pwa-welcome-shown', 'true');
        }, 1000);
    }
}
