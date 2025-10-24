// PWA Installer
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }
    
    init() {
        // Service Worker'ı kaydet
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('✅ Service Worker kayıtlı:', registration.scope);
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
    
    showInstallButton() {
        // Install butonu göster
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.innerHTML = '📱 Uygulamayı Yükle';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 50px;
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            z-index: 9999;
            animation: pulse 2s infinite;
        `;
        
        installBtn.onclick = () => this.promptInstall();
        
        // Sadece login olmamışsa göster
        const isLoggedIn = localStorage.getItem('loggedIn') || sessionStorage.getItem('loggedIn');
        if (isLoggedIn === 'true') {
            document.body.appendChild(installBtn);
        }
    }
    
    hideInstallButton() {
        const btn = document.getElementById('pwa-install-btn');
        if (btn) btn.remove();
    }
    
    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('Install prompt mevcut değil');
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
`;
document.head.appendChild(pwaStyles);
