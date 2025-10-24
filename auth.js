// ============================================
// BURADAN ŞİFRELERİ DEĞİŞTİRİN
// ============================================

// Kullanıcı bilgileri - Bunları değiştirin!
const users = {
    'gorkem': 'bindirmail1',      // İlk kullanıcı (örn: 'ahmet': 'ahmet123')
    'seher': 'seher'   // İkinci kullanıcı (örn: 'ayse': 'ayse123')
};

// Admin şifresi - Ayarları değiştirmek için
const adminPassword = 'admin123'; // Bunu mutlaka değiştirin!

// ============================================
// BURADAN SONRAKİ KODLARI DEĞİŞTİRMEYİN
// ============================================

// Giriş kontrolü
function login(username, password, rememberMe = false) {
    if (users[username] && users[username] === password) {
        // Giriş başarılı
        const storage = rememberMe ? localStorage : sessionStorage;
        
        storage.setItem('loggedIn', 'true');
        storage.setItem('currentUser', username);
        storage.setItem('loginTime', new Date().getTime());
        
        // Beni hatırla seçiliyse şifreyi de sakla (güvenli hash ile)
        if (rememberMe) {
            localStorage.setItem('rememberedUser', username);
            localStorage.setItem('autoLogin', 'true');
        }
        
        return true;
    }
    return false;
}

// Admin kontrolü
function isAdmin(password) {
    return password === adminPassword;
}

// Çıkış yap
function logout() {
    // Her iki storage'dan da temizle
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('loginTime');
    
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('rememberedUser');
    localStorage.removeItem('autoLogin');
    
    window.location.href = 'login.html';
}

// Giriş kontrolü (her sayfada çağrılacak)
function checkAuth() {
    // Önce localStorage'a bak (beni hatırla)
    let loggedIn = localStorage.getItem('loggedIn');
    let loginTime = localStorage.getItem('loginTime');
    let storage = localStorage;
    
    // localStorage'da yoksa sessionStorage'a bak
    if (!loggedIn) {
        loggedIn = sessionStorage.getItem('loggedIn');
        loginTime = sessionStorage.getItem('loginTime');
        storage = sessionStorage;
    }
    
    const currentTime = new Date().getTime();
    
    // 30 gün sonra otomatik çıkış (localStorage için)
    // 24 saat sonra otomatik çıkış (sessionStorage için)
    const expiryTime = storage === localStorage ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    if (loginTime && (currentTime - loginTime) > expiryTime) {
        logout();
        return false;
    }
    
    if (!loggedIn || loggedIn !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Mevcut kullanıcıyı al
function getCurrentUser() {
    return localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
}

// Oturum süresini uzat
function extendSession() {
    // Her iki storage'ı da kontrol et ve güncelle
    if (localStorage.getItem('loggedIn') === 'true') {
        localStorage.setItem('loginTime', new Date().getTime());
    }
    if (sessionStorage.getItem('loggedIn') === 'true') {
        sessionStorage.setItem('loginTime', new Date().getTime());
    }
}

// Her 5 dakikada bir oturum süresini uzat (sayfada aktif olduğu sürece)
setInterval(() => {
    if (localStorage.getItem('loggedIn') === 'true' || sessionStorage.getItem('loggedIn') === 'true') {
        extendSession();
    }
}, 5 * 60 * 1000);
