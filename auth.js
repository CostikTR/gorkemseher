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
function login(username, password) {
    if (users[username] && users[username] === password) {
        // Giriş başarılı
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('currentUser', username);
        sessionStorage.setItem('loginTime', new Date().getTime());
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
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('loginTime');
    window.location.href = 'login.html';
}

// Giriş kontrolü (her sayfada çağrılacak)
function checkAuth() {
    const loggedIn = sessionStorage.getItem('loggedIn');
    const loginTime = sessionStorage.getItem('loginTime');
    const currentTime = new Date().getTime();
    
    // 24 saat sonra otomatik çıkış
    if (loginTime && (currentTime - loginTime) > 24 * 60 * 60 * 1000) {
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
    return sessionStorage.getItem('currentUser');
}

// Oturum süresini uzat
function extendSession() {
    sessionStorage.setItem('loginTime', new Date().getTime());
}

// Her 5 dakikada bir oturum süresini uzat (sayfada aktif olduğu sürece)
setInterval(() => {
    if (sessionStorage.getItem('loggedIn') === 'true') {
        extendSession();
    }
}, 5 * 60 * 1000);
