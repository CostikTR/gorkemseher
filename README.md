# 💕 Aşk Sayacı & Anı Panosu

Sevgiliniz için özel olarak hazırlanmış, interaktif bir aşk web sitesi!

## ✨ Özellikler

- ⏰ **Canlı Zaman Sayacı**: Birlikte geçirdiğiniz zamanı gün/saat/dakika/saniye olarak gösterir
- 📅 **Özel Günler**: İlk tanışma, ilk öpücük gibi özel anlarınızı takip eder
- 📸 **Fotoğraf Galerisi**: Fotoğraflarınızı güzel bir şekilde sergiler
- 💌 **Aşk Mesajları**: Rastgele romantik mesajlar gösterir
- 🌈 **Bucket List**: Birlikte yapmak istedikleriniz
- ❤️ **Kalp Animasyonları**: Romantik kalp animasyonları
- 🎵 **Müzik Desteği**: Arka plan müziği (isteğe bağlı)
- 📱 **Responsive**: Telefon, tablet ve bilgisayarda çalışır

## 🚀 Kurulum & Kullanım

### 1. Tarihleri Özelleştirin

`script.js` dosyasını açın ve en üstteki tarihleri kendinize göre değiştirin:

```javascript
// İlişkinizin başlangıç tarihi
const relationshipStartDate = new Date('2024-01-01T00:00:00');

// Özel günleriniz
const specialDates = {
    firstMeet: new Date('2023-12-15'),
    relationship: new Date('2024-01-01'),
    firstKiss: new Date('2024-01-14'),
    specialDay: new Date('2024-06-15')
};
```

### 2. Fotoğrafları Ekleyin

1. `photos` klasörü oluşturun (projenin ana dizininde)
2. Fotoğraflarınızı bu klasöre ekleyin (photo1.jpg, photo2.jpg, vb.)
3. `script.js` dosyasında fotoğraf yollarını ve açıklamalarını güncelleyin:

```javascript
const photos = [
    {
        src: 'photos/photo1.jpg',
        caption: 'İlk fotoğrafımız 💕'
    },
    // Daha fazla ekleyin...
];
```

### 3. Mesajları Özelleştirin

`script.js` dosyasında `loveMessages` dizisindeki mesajları kendinize göre değiştirin:

```javascript
const loveMessages = [
    "Seninle geçirdiğim her an özel 💕",
    "Seni çok seviyorum ❤️",
    // Kendi mesajlarınızı ekleyin...
];
```

### 4. Müzik Ekleyin (İsteğe Bağlı)

1. `music` klasörü oluşturun
2. Sevdiğiniz şarkıyı `song.mp3` olarak bu klasöre ekleyin
3. Sağ alt köşedeki 🎵 butonuna tıklayarak müziği açıp kapatabilirsiniz

### 5. Açın ve Keyfini Çıkarın!

`index.html` dosyasını çift tıklayarak tarayıcıda açın!

## 🎨 Özelleştirme İpuçları

### Renkleri Değiştirmek
`style.css` dosyasında gradient renklerini değiştirebilirsiniz:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### "Birlikte Yapacaklarımız" Listesini Değiştirmek
`index.html` dosyasındaki `.bucket-list` bölümünü düzenleyin.

### Daha Fazla Özel Gün Eklemek
`index.html` içinde `.dates-grid` bölümüne yeni kartlar ekleyebilirsiniz.

## 📱 Canlı Demo

Dosyayı açtıktan sonra:
- Zaman sayacının geriye doğru çalıştığını göreceksiniz
- Fotoğraflar arasında ok tuşlarıyla geçiş yapabilirsiniz
- "Yeni Mesaj" butonuyla farklı mesajlar görebilirsiniz
- Müzik butonuyla arka plan müziğini açıp kapatabilirsiniz

## 💝 İpuçları

1. **Fotoğraflar için**: En az 5 fotoğraf ekleyin, en iyi anlarınızı seçin
2. **Mesajlar için**: Kendi kelimelerinizle, kalpten yazın
3. **Tarihler için**: Doğru tarihleri kullanın, daha anlamlı olacaktır
4. **Paylaşım için**: Projeyi bir web hostingine yükleyerek link olarak paylaşabilirsiniz

## 🌟 Bonus Özellikler

- Her 10 saniyede bir yeni kalp animasyonu
- Hover efektleri
- Smooth geçişler ve animasyonlar
- Otomatik tarih/saat güncelleme

## 🎁 Hediye Etmek İçin

1. Tüm dosyaları bir USB'ye kopyalayın
2. Veya GitHub'a yükleyip link gönderin
3. Veya ücretsiz hosting (Netlify, Vercel) kullanarak online yapın

---

**Sevgilinizi mutlu edin! ❤️**
