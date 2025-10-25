# 💝 Görkem & Seher - Aşk Sitemiz# 💕 Aşk Sayacı & Anı Panosu



Romantik bir web sitesi projesi - Sevgilinizle olan özel anlarınızı kaydedin ve paylaşın!# 💝 Görkem & Seher - Aşk Sitemiz

## 🌟 v2.1 - Yeni Özellikler! 🎉

### Son Güncellemeler
- 📊 **Fotoğraf Sıralama** - 5 farklı sıralama seçeneği
- 📱 **PWA İyileştirmeleri** - Otomatik güncelleme, offline destek
- 📖 **Timeline** - Hikayemizi kronolojik görüntüle
- 🔍 **Galeri Arama** - Fotoğraflarda anında arama

Sevgiliniz için özel olarak hazırlanmış, interaktif bir aşk web sitesi!



## 🌟 Özellikler## ✨ Özellikler



### 💕 Temel Özellikler- ⏰ **Canlı Zaman Sayacı**: Birlikte geçirdiğiniz zamanı gün/saat/dakika/saniye olarak gösterir

- 📸 **Fotoğraf Galerisi** - Anılarınızı fotoğraflarla saklayın- 📅 **Özel Günler**: İlk tanışma, ilk öpücük gibi özel anlarınızı takip eder

- 💝 **Aşk Mesajları** - Birbirinize özel mesajlar- 📸 **Fotoğraf Galerisi**: Fotoğraflarınızı güzel bir şekilde sergiler

- ⏰ **İlişki Sayacı** - Birlikte geçirdiğiniz zamanı takip edin- 💌 **Aşk Mesajları**: Rastgele romantik mesajlar gösterir

- 📅 **Özel Günler** - Önemli tarihleri hatırlayın- 🌈 **Bucket List**: Birlikte yapmak istedikleriniz

- 👤 **Profil Fotoğrafları** - İkinizin de profil resmi- ❤️ **Kalp Animasyonları**: Romantik kalp animasyonları

- 🎵 **Müzik Desteği**: Arka plan müziği (isteğe bağlı)

### 🎮 İnteraktif Özellikler- 📱 **Responsive**: Telefon, tablet ve bilgisayarda çalışır

- 🎯 **Quiz Oyunu** - Birbirinizi ne kadar tanıyorsunuz?

- 💌 **Mesaj Kutusu** - Özel sohbet alanı## 🚀 Kurulum & Kullanım

- 🎵 **Müzik Playlist** - Özel şarkılarınız

- 🎁 **Hediye Listesi** - Almak istediğiniz hediyeler### 1. Tarihleri Özelleştirin

- 🌈 **Bucket List** - Birlikte yapacaklarınız listesi

- 📊 **İstatistikler** - Detaylı analiz ve grafikler`script.js` dosyasını açın ve en üstteki tarihleri kendinize göre değiştirin:



### 🎨 Görsel Özellikler```javascript

- 5 farklı tema rengi (Pembe, Mor, Mavi, Yeşil, Turuncu)// İlişkinizin başlangıç tarihi

- Light/Dark modeconst relationshipStartDate = new Date('2024-01-01T00:00:00');

- Responsive tasarım

- Animasyonlu kalpler// Özel günleriniz

- Typewriter efekticonst specialDates = {

    firstMeet: new Date('2023-12-15'),

## 🔥 Firebase Entegrasyonu    relationship: new Date('2024-01-01'),

    firstKiss: new Date('2024-01-14'),

Site Firebase Firestore kullanarak real-time senkronizasyon sağlar:    specialDay: new Date('2024-06-15')

- ✅ Farklı cihazlardan erişim};

- ✅ Gerçek zamanlı güncelleme```

- ✅ Güvenli veri saklama

- ✅ Otomatik yedekleme### 2. Fotoğrafları Ekleyin



## 🚀 Kurulum1. `photos` klasörü oluşturun (projenin ana dizininde)

2. Fotoğraflarınızı bu klasöre ekleyin (photo1.jpg, photo2.jpg, vb.)

### Firebase Ayarları3. `script.js` dosyasında fotoğraf yollarını ve açıklamalarını güncelleyin:



1. **Firebase Console'a git:** https://console.firebase.google.com```javascript

2. **Projen:** `bebegim-5e848` seçconst photos = [

3. **Firestore Database** → **Create database**    {

4. **Location:** `europe-west` seç        src: 'photos/photo1.jpg',

5. **Start in test mode** → **Enable**        caption: 'İlk fotoğrafımız 💕'

6. **Rules** sekmesine git ve yapıştır:    },

    // Daha fazla ekleyin...

```javascript];

rules_version = '2';```

service cloud.firestore {

  match /databases/{database}/documents {### 3. Mesajları Özelleştirin

    match /users/shared/{document=**} {

      allow read, write: if true;`script.js` dosyasında `loveMessages` dizisindeki mesajları kendinize göre değiştirin:

    }

  }```javascript

}const loveMessages = [

```    "Seninle geçirdiğim her an özel 💕",

    "Seni çok seviyorum ❤️",

7. **Publish** tıkla    // Kendi mesajlarınızı ekleyin...

];

### Netlify Deploy```



1. **https://app.netlify.com** → Giriş yap### 4. Müzik Ekleyin (İsteğe Bağlı)

2. **Add new site** → **Import from GitHub**

3. **CostikTR/gorkemseher** seç1. `music` klasörü oluşturun

4. **Deploy site** tıkla2. Sevdiğiniz şarkıyı `song.mp3` olarak bu klasöre ekleyin

5. Site otomatik deploy edilecek!3. Sağ alt köşedeki 🎵 butonuna tıklayarak müziği açıp kapatabilirsiniz



## 🔐 Giriş Bilgileri### 5. Açın ve Keyfini Çıkarın!



- **Kullanıcı 1:** `gorkem` / `bindirmail1``index.html` dosyasını çift tıklayarak tarayıcıda açın!

- **Kullanıcı 2:** `seher` / `seher`

- **Admin:** Şifre ile admin.html'e erişim## 🎨 Özelleştirme İpuçları



## 🛠️ Teknolojiler### Renkleri Değiştirmek

`style.css` dosyasında gradient renklerini değiştirebilirsiniz:

- **Frontend:** HTML5, CSS3, JavaScript```css

- **Backend:** Firebase Firestorebackground: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

- **Charts:** Chart.js```

- **Hosting:** Netlify

- **Version Control:** Git & GitHub### "Birlikte Yapacaklarımız" Listesini Değiştirmek

`index.html` dosyasındaki `.bucket-list` bölümünü düzenleyin.

## 📱 Sayfalar

### Daha Fazla Özel Gün Eklemek

- 🏠 Ana Sayfa`index.html` içinde `.dates-grid` bölümüne yeni kartlar ekleyebilirsiniz.

- 📊 İstatistikler  

- 🎯 Quiz Oyunu## 📱 Canlı Demo

- 💌 Mesajlar

- 🎵 Müzik PlaylistDosyayı açtıktan sonra:

- 🎁 Hediyeler- Zaman sayacının geriye doğru çalıştığını göreceksiniz

- 📅 Özel Günler- Fotoğraflar arasında ok tuşlarıyla geçiş yapabilirsiniz

- 🌈 Bucket List- "Yeni Mesaj" butonuyla farklı mesajlar görebilirsiniz

- 📸 Galeri- Müzik butonuyla arka plan müziğini açıp kapatabilirsiniz

- ⚙️ Admin Panel

## 💝 İpuçları

## 📖 Dokümantasyon

1. **Fotoğraflar için**: En az 5 fotoğraf ekleyin, en iyi anlarınızı seçin

- [Kullanım Kılavuzu](KULLANIM_KILAVUZU.md)2. **Mesajlar için**: Kendi kelimelerinizle, kalpten yazın

- [Fotoğraf Rehberi](FOTOGRAF_REHBERI.md)3. **Tarihler için**: Doğru tarihleri kullanın, daha anlamlı olacaktır

- [Hızlı Başlangıç](HIZLI_BASLANGIÇ.md)4. **Paylaşım için**: Projeyi bir web hostingine yükleyerek link olarak paylaşabilirsiniz

- [Hosting Kılavuzu](HOSTING_KLAVUZU.md)

## 🌟 Bonus Özellikler

## 💝 Yapımcılar

- Her 10 saniyede bir yeni kalp animasyonu

**Görkem & Seher** ile sevgiyle yapıldı ❤️- Hover efektleri

- Smooth geçişler ve animasyonlar

---- Otomatik tarih/saat güncelleme



⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!## 🎁 Hediye Etmek İçin


1. Tüm dosyaları bir USB'ye kopyalayın
2. Veya GitHub'a yükleyip link gönderin
3. Veya ücretsiz hosting (Netlify, Vercel) kullanarak online yapın

---

**Sevgilinizi mutlu edin! ❤️**
