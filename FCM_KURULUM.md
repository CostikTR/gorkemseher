# 📱 Firebase Cloud Messaging (FCM) Kurulum Rehberi

## 🎯 Ne Yapacağız?
Telefonunuza **WhatsApp, Instagram gibi direkt push notification** göndereceğiz!
- ✅ Uygulama kapalıyken bile bildirim gelecek
- ✅ Telefon ekranında bildirim görünecek
- ✅ Titreşim olacak
- ✅ Ses çalacak (telefon ayarlarına göre)

---

## 📋 Kurulum Adımları

### Adım 1: Firebase Console VAPID Key Alma

1. **Firebase Console'a git**: https://console.firebase.google.com
2. Projenizi seçin: **bebegim-5e848**
3. **⚙️ Project Settings** (sol alttaki dişli ikonu)
4. **Cloud Messaging** sekmesine tıklayın
5. **Web Push certificates** bölümüne inin
6. **Generate key pair** butonuna tıklayın (veya zaten varsa kopyalayın)
7. Çıkan **Key pair** değerini kopyalayın (örnek: `BNxK7OqHJ9YVL8UqQJ0hF5vGqP2XK...`)

### Adım 2: VAPID Key'i Koda Ekleyin

**Dosya:** `fcm-manager.js`  
**Satır:** 33

```javascript
// Bu satırı bulun:
const vapidKey = 'BNxK7OqHJ9YVL8UqQJ0hF5vGqP2XK3jN4mR6sT8uV9wX0yZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ4'; // PLACEHOLDER

// Firebase Console'dan aldığınız gerçek key ile değiştirin:
const vapidKey = 'BURAYA_FIREBASE_CONSOLE_DAN_ALDIGINIZ_KEY';
```

### Adım 3: HTTPS Aktif Edin

FCM sadece HTTPS üzerinde çalışır. İki seçenek:

#### Seçenek A: GitHub Pages (Ücretsiz HTTPS)
1. GitHub repo'nuzu açın
2. **Settings** → **Pages**
3. **Source**: main branch seçin
4. **Save**
5. 1-2 dakika bekleyin
6. Siteniz `https://yourname.github.io/repo-name` adresinde yayında!

#### Seçenek B: Netlify/Vercel (Daha Hızlı)
1. https://netlify.com veya https://vercel.com
2. GitHub repo'nuzu bağlayın
3. Otomatik deploy olacak
4. Ücretsiz HTTPS domain alacaksınız

### Adım 4: PWA Olarak Yükleyin

**Android:**
1. Chrome'da siteyi açın
2. Menü (⋮) → **Install app** veya **Add to Home screen**
3. **Install**

**iPhone:**
1. Safari'de siteyi açın
2. Paylaş (⬆️) → **Add to Home Screen**
3. **Add**

### Adım 5: İzin Verin

1. Uygulamayı açın (ana ekrandaki simgeden)
2. Bildirim izni popup'ı çıkacak
3. **İzin Ver** / **Allow**
4. Test için `test-notifications.html` sayfasını açın

---

## 🧪 Test Edin

### Test 1: FCM Token Kontrolü

Browser Console'u açın (F12) ve şunu yazın:

```javascript
fcmManager.currentToken
```

Çıktı: Uzun bir token string görmelisiniz. Yoksa VAPID key yanlış olabilir.

### Test 2: Manuel Bildirim Gönder

Console'da:

```javascript
fcmManager.sendNotificationToUser('Görkem', 'Test Bildirimi', 'Bu çalışıyor mu? 🎉', {})
```

### Test 3: Canlı Test

1. **İki cihazdan giriş yapın** (telefon + bilgisayar)
2. **Birinden fotoğraf ekleyin**
3. **Diğer cihazda bildirim gelmeli!** (uygulama kapalı olsa bile)

---

## 🔧 Cloud Function (Opsiyonel - İleri Seviye)

Bildirimlerin otomatik gönderilmesi için Firebase Cloud Functions kurmalısınız:

### functions/index.js

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Yeni fotoğraf eklendiğinde
exports.onPhotoAdded = functions.firestore
    .document('users/shared/photos/{photoId}')
    .onCreate(async (snapshot, context) => {
        const photo = snapshot.data();
        const uploadedBy = photo.uploadedBy;
        
        // Diğer kullanıcılara bildirim gönder
        const tokensSnapshot = await admin.firestore()
            .collection('fcm_tokens')
            .get();
        
        const tokens = [];
        tokensSnapshot.forEach(doc => {
            if (doc.id !== uploadedBy) { // Kendine gönderme
                tokens.push(doc.data().token);
            }
        });
        
        if (tokens.length > 0) {
            await admin.messaging().sendMulticast({
                tokens: tokens,
                notification: {
                    title: '📸 Yeni Fotoğraf!',
                    body: `${uploadedBy} yeni bir anı ekledi!`
                },
                data: {
                    url: '/gallery.html',
                    type: 'photo'
                }
            });
        }
    });

// Pending notifications'ı gönder
exports.sendPendingNotifications = functions.firestore
    .document('pending_notifications/{notificationId}')
    .onCreate(async (snapshot, context) => {
        const notification = snapshot.data();
        
        try {
            await admin.messaging().send({
                token: notification.to,
                notification: notification.notification,
                data: notification.data
            });
            
            // Başarılı, sil
            await snapshot.ref.delete();
        } catch (error) {
            console.error('Bildirim gönderme hatası:', error);
            // Hata, status güncelle
            await snapshot.ref.update({ status: 'failed', error: error.message });
        }
    });
```

### Kurulum:

```bash
cd functions
npm install firebase-functions firebase-admin
firebase deploy --only functions
```

---

## 📊 Kontrol Paneli

Firebase Console → **Cloud Messaging** → **Campaigns**

Buradan manuel bildirim gönderebilir, istatistikleri görebilirsiniz.

---

## ⚠️ Sorun Giderme

### "VAPID key is required"
- Firebase Console'dan key aldınız mı?
- `fcm-manager.js` dosyasına eklediniz mi?

### "Messaging is not supported"
- HTTPS kullanıyor musunuz? (http:// değil https://)
- Service Worker kayıtlı mı? Console'da kontrol edin

### "Permission denied"
- Telefon ayarlarında tarayıcı bildirimleri açık mı?
- PWA olarak yüklediniz mi?

### Token alınamıyor
- Browser Console'da hata var mı?
- `firebase-messaging-sw.js` dosyası root'ta mı?

### Bildirim gelmiyor
- FCM token Firebase'e kaydedildi mi? (Firestore → fcm_tokens koleksiyonu)
- Cloud Function deploy edildi mi?
- İnternet bağlantınız var mı?

---

## 🎉 Başarı!

Artık WhatsApp gibi gerçek zamanlı push notificationlarınız var! 🚀

**Özellikler:**
- ✅ Uygulama kapalıyken bile bildirim
- ✅ Kilitte bile görünür
- ✅ Titreşim + Ses
- ✅ Tıklanınca ilgili sayfaya yönlendirir
- ✅ Çoklu cihaz desteği

**Test:** Telefonunuzu kilitleyin, sevgiliniz fotoğraf eklesin, telefonunuz titreyecek! 💕
