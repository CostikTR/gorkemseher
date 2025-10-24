# 🔐 Kullanım Kılavuzu - Aşk Sayacı & Anı Panosu

## 📋 İlk Kurulum Adımları

### 1️⃣ Şifreleri Ayarlayın

`auth.js` dosyasını açın ve şifreleri değiştirin:

```javascript
const users = {
    'ahmet': 'ahmet123',      // İlk kullanıcı
    'ayse': 'ayse123'         // İkinci kullanıcı
};

const adminPassword = 'admin123'; // Admin şifresi
```

**ÖNEMLİ:** Mutlaka kendi kullanıcı adı ve şifrelerinizi belirleyin!

### 2️⃣ Siteyi Açın

`login.html` dosyasını tarayıcıda açın. Artık giriş yapmanız gerekecek!

### 3️⃣ İlk Giriş

Varsayılan kullanıcı adı ve şifrelerle giriş yapın (değiştirdiklerinizle).

## 🎯 Özellikler

### 🔒 Güvenlik
- ✅ Şifreli giriş sistemi
- ✅ Sadece siz ikiniz erişebilir
- ✅ 24 saat otomatik oturum süresi
- ✅ Güvenli çıkış

### ⚙️ Admin Paneli
**Ayarlar** butonuna tıklayarak:

#### 📅 Özel Günler
- İlk tanışma tarihinizi ekleyin
- İlişki başlangıcınızı kaydedin
- İlk öpücük tarihini belirleyin
- Diğer özel günleri ekleyin

#### 💌 Aşk Mesajları
- Kendi romantik mesajlarınızı ekleyin
- Mevcut mesajları düzenleyin veya silin
- "Yeni Mesaj" butonu rastgele mesaj gösterir

#### 📸 Fotoğraflar
- Ortak fotoğraflarınızı yükleyin
- Her fotoğrafa açıklama ekleyin
- Galeri otomatiğe güncellenir
- Fotoğraflar tarayıcıda güvenle saklanır

#### 🌈 Birlikte Yapacaklarımız
- Bucket list oluşturun
- Emoji ve açıklama ekleyin
- İstediğiniz kadar etkinlik

#### 💾 Yedekleme
- Tüm verilerinizi bilgisayarınıza indirin
- Gerektiğinde geri yükleyin
- Veri kaybı endişesi yok!

## 🚀 Nasıl Kullanılır?

### Günlük Kullanım
1. `login.html` açın
2. Giriş yapın
3. Ana sayfada anılarınızı görün
4. "Yeni Mesaj" ile rastgele mesajlar okuyun
5. Fotoğraflar arasında gezinin

### İçerik Ekleme
1. "⚙️ Ayarlar" butonuna tıklayın
2. Eklemek istediğiniz bölümü bulun
3. Bilgileri girin ve "Kaydet" veya "Ekle"
4. Ana sayfaya dönün ve değişiklikleri görün

### Güvenlik İpuçları
- Şifreleri karmaşık tutun
- Başkalarıyla paylaşmayın
- Her kullanımdan sonra çıkış yapın
- Düzenli yedek alın

## 📱 Mobil Kullanım

Site telefon ve tablette de mükemmel çalışır:
- Responsive tasarım
- Touch-friendly butonlar
- Mobil uyumlu galeri

## 🎁 Ekstra İpuçları

### Romantik Fikirler
- Her gün yeni bir mesaj ekleyin
- Özel günleri geri sayım için kullanın
- Anlamlı fotoğraflar seçin
- Bucket list'e renkli hayaller ekleyin

### Sürpriz Yapın
- Sevgilinizin görmeden mesaj ekleyin
- Birlikte çektiğiniz fotoğrafları yükleyin
- Özel günleri hatırlatan notlar yazın

## 🔧 Teknik Bilgiler

### Veri Depolama
- Tüm veriler tarayıcıda (localStorage) saklanır
- Sunucu gerektirmez
- Tamamen offline çalışır
- Gizliliğiniz garantili

### Tarayıcı Desteği
- ✅ Chrome
- ✅ Firefox
- ✅ Edge
- ✅ Safari
- ✅ Mobil tarayıcılar

## 🆘 Sorun Giderme

**Giriş yapamıyorum:**
- `auth.js` dosyasındaki kullanıcı bilgilerini kontrol edin
- Doğru şifreyi girdiğinizden emin olun

**Fotoğraflar görünmüyor:**
- Admin panelden fotoğraf yükleyin
- Tarayıcı cache'ini temizleyin

**Veriler kayboldu:**
- Yedek dosyanızı geri yükleyin
- Tarayıcı verilerini silmediyseniz, localStorage'da hala vardır

## 💝 Son Notlar

Bu proje tamamen sizin için hazırlandı. İstediğiniz gibi özelleştirin, değiştirin ve sevgilinizi mutlu edin!

**Önemli:** Düzenli olarak yedek alın! 💾

---

**Mutlu günler dilerim! ❤️**
