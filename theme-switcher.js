// ==========================================
// THEME SWITCHER - TEMA DEĞİŞTİRİCİ
// ==========================================

// Theme management
const ThemeManager = {
    currentTheme: 'pink',
    currentMode: 'dark',
    
    init() {
        // Load saved preferences
        this.loadTheme();
        this.createThemeSwitcher();
        this.attachEventListeners();
    },
    
    loadTheme() {
        const savedTheme = localStorage.getItem('lovesite_theme') || 'pink';
        const savedMode = localStorage.getItem('lovesite_theme_mode') || 'dark';
        
        this.currentTheme = savedTheme;
        this.currentMode = savedMode;
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.setAttribute('data-theme-mode', savedMode);
    },
    
    saveTheme() {
        localStorage.setItem('lovesite_theme', this.currentTheme);
        localStorage.setItem('lovesite_theme_mode', this.currentMode);
    },
    
    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.saveTheme();
        this.updateActiveStates();
        this.showNotification(`🎨 ${this.getThemeName(theme)} teması aktif!`);
    },
    
    setMode(mode) {
        this.currentMode = mode;
        document.documentElement.setAttribute('data-theme-mode', mode);
        this.saveTheme();
        this.updateActiveStates();
        this.showNotification(`${mode === 'dark' ? '🌙' : '☀️'} ${mode === 'dark' ? 'Koyu' : 'Açık'} mod aktif!`);
    },
    
    getThemeName(theme) {
        const names = {
            pink: 'Romantik Pembe',
            red: 'Klasik Kırmızı',
            purple: 'Modern Mor',
            blue: 'Okyanus Mavisi',
            orange: 'Gün Batımı'
        };
        return names[theme] || theme;
    },
    
    createThemeSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher';
        switcher.innerHTML = `
            <button class="theme-toggle-btn" id="themeToggleBtn">
                🎨
            </button>
            <div class="theme-menu" id="themeMenu">
                <div class="theme-menu-title">Renk Teması</div>
                <div class="theme-option" data-theme="pink">
                    <div class="theme-color-dot pink"></div>
                    <span>Romantik Pembe</span>
                </div>
                <div class="theme-option" data-theme="red">
                    <div class="theme-color-dot red"></div>
                    <span>Klasik Kırmızı</span>
                </div>
                <div class="theme-option" data-theme="purple">
                    <div class="theme-color-dot purple"></div>
                    <span>Modern Mor</span>
                </div>
                <div class="theme-option" data-theme="blue">
                    <div class="theme-color-dot blue"></div>
                    <span>Okyanus Mavisi</span>
                </div>
                <div class="theme-option" data-theme="orange">
                    <div class="theme-color-dot orange"></div>
                    <span>Gün Batımı</span>
                </div>
                
                <div class="theme-divider"></div>
                
                <div class="theme-menu-title">Görünüm Modu</div>
                <div class="mode-switch">
                    <div class="mode-option" data-mode="light">☀️ Açık</div>
                    <div class="mode-option" data-mode="dark">🌙 Koyu</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(switcher);
        this.updateActiveStates();
    },
    
    attachEventListeners() {
        const toggleBtn = document.getElementById('themeToggleBtn');
        const themeMenu = document.getElementById('themeMenu');
        
        // Toggle menu
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themeMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!themeMenu.contains(e.target) && e.target !== toggleBtn) {
                themeMenu.classList.remove('active');
            }
        });
        
        // Theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.getAttribute('data-theme');
                this.setTheme(theme);
            });
        });
        
        // Mode selection
        document.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', () => {
                const mode = option.getAttribute('data-mode');
                this.setMode(mode);
            });
        });
    },
    
    updateActiveStates() {
        // Update theme options
        document.querySelectorAll('.theme-option').forEach(option => {
            const theme = option.getAttribute('data-theme');
            if (theme === this.currentTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        
        // Update mode options
        document.querySelectorAll('.mode-option').forEach(option => {
            const mode = option.getAttribute('data-mode');
            if (mode === this.currentMode) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    },
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 99999;
            animation: slideInDown 0.5s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutUp 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideOutUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);
