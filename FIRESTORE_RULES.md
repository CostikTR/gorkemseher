# 🔥 Firestore Security Rules Hatası Çözümü

## ❌ Hata:
```
Missing or insufficient permissions
```

## ✅ Çözüm:

### 1️⃣ Firebase Console'a Git:
https://console.firebase.google.com/

### 2️⃣ Projenizi Seçin:
"bebegim-5e848"

### 3️⃣ Firestore Database → Rules

### 4️⃣ Aşağıdaki kuralları ekleyin:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Kullanıcılar koleksiyonu - herkes okuyabilir/yazabilir (shared users için)
    match /users/{userId}/{document=**} {
      allow read, write: if true;
    }
    
    // FCM Tokens - herkes kendi token'ını yazabilir, herkes okuyabilir
    match /fcm_tokens/{userId} {
      allow read: if true;
      allow write: if true;
    }
    
    // ✨ YENİ: Notifications koleksiyonu - herkes okuyabilir/yazabilir
    match /notifications/{notificationId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Pending notifications (Cloud Functions için)
    match /pending_notifications/{notificationId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Diğer tüm koleksiyonlar
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 5️⃣ "Publish" (Yayınla) butonuna tıklayın

### 6️⃣ Sayfayı yenileyin ve tekrar test edin!

---

## 🎯 Alternatif: Geliştirme İçin Basit Rules

Eğer test aşamasındaysanız, HERKESİN HER ŞEYE ERİŞEBİLDİĞİ basit bir rule kullanabilirsiniz:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **UYARI:** Bu rule üretim için güvenli DEĞİLDİR! Sadece test için kullanın.

---

## 📝 Not:

Rules değişikliği **hemen aktif olur**, deployment beklemenize gerek yok!
