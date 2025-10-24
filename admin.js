// Firebase Import
import firebaseSync from './firebase-sync.js';

// Sayfa yüklendiğinde giriş kontrolü yap
if (!checkAuth()) {
    window.location.href = 'login.html';
}

// LocalStorage anahtarları (backward compatibility)
const STORAGE_KEYS = {
    DATES: 'lovesite_dates',
    MESSAGES: 'lovesite_messages',
    PHOTOS: 'lovesite_photos',
    BUCKET: 'lovesite_bucket'
};

// Sayfa yüklendiğinde verileri yükle
document.addEventListener('DOMContentLoaded', async function() {
    await loadDates();
    await loadMessages();
    await loadPhotos();
    await loadBucketList();
});

// Tarihleri yükle (Firebase'den)
async function loadDates() {
    try {
        // Önce Firebase'den dene
        const datesData = await firebaseSync.getData('dates', 'main');
        let dates = null;
        
        if (datesData && datesData.data) {
            dates = datesData.data;
        } else {
            // Firebase'de yoksa localStorage'dan al
            const savedDates = localStorage.getItem(STORAGE_KEYS.DATES);
            dates = savedDates ? JSON.parse(savedDates) : {};
        }
        
        if (dates.firstMeet) {
            document.getElementById('firstMeet').value = dates.firstMeet.date || '';
            document.getElementById('firstMeetDesc').value = dates.firstMeet.desc || '';
        }
        if (dates.relationship) {
            document.getElementById('relationship').value = dates.relationship.date || '';
            document.getElementById('relationshipDesc').value = dates.relationship.desc || '';
        }
        if (dates.firstKiss) {
            document.getElementById('firstKiss').value = dates.firstKiss.date || '';
            document.getElementById('firstKissDesc').value = dates.firstKiss.desc || '';
        }
        if (dates.specialDay) {
            document.getElementById('specialDay').value = dates.specialDay.date || '';
            document.getElementById('specialDayDesc').value = dates.specialDay.desc || '';
        }
    } catch (error) {
        console.error('Tarih yükleme hatası:', error);
        // Hata durumunda localStorage'dan yükle
        const savedDates = localStorage.getItem(STORAGE_KEYS.DATES);
        const dates = savedDates ? JSON.parse(savedDates) : {};
        
        if (dates.firstMeet) {
            document.getElementById('firstMeet').value = dates.firstMeet.date || '';
            document.getElementById('firstMeetDesc').value = dates.firstMeet.desc || '';
        }
        if (dates.relationship) {
            document.getElementById('relationship').value = dates.relationship.date || '';
            document.getElementById('relationshipDesc').value = dates.relationship.desc || '';
        }
        if (dates.firstKiss) {
            document.getElementById('firstKiss').value = dates.firstKiss.date || '';
            document.getElementById('firstKissDesc').value = dates.firstKiss.desc || '';
        }
        if (dates.specialDay) {
            document.getElementById('specialDay').value = dates.specialDay.date || '';
            document.getElementById('specialDayDesc').value = dates.specialDay.desc || '';
        }
    }
}

// Tarih güncelle
async function updateDate(dateType) {
    const dateInput = document.getElementById(dateType).value;
    const descInput = document.getElementById(dateType + 'Desc').value;
    
    if (!dateInput) {
        alert('Lütfen bir tarih seçin!');
        return;
    }
    
    const savedDates = localStorage.getItem(STORAGE_KEYS.DATES);
    const dates = savedDates ? JSON.parse(savedDates) : {};
    
    dates[dateType] = {
        date: dateInput,
        desc: descInput
    };
    
    // localStorage'a kaydet
    localStorage.setItem(STORAGE_KEYS.DATES, JSON.stringify(dates));
    
    // Firebase'e kaydet
    if (window.firebaseSync) {
        await window.firebaseSync.saveData('dates', 'main', { data: dates });
        console.log('Tarih Firebase kayded');
    }
    
    showSuccess('dateSuccess');
}

// Mesajları yükle
function loadMessages() {
    const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const messages = savedMessages ? JSON.parse(savedMessages) : getDefaultMessages();
    
    const messageList = document.getElementById('messageList');
    messageList.innerHTML = '';
    
    messages.forEach((message, index) => {
        const item = document.createElement('div');
        item.className = 'message-item';
        item.innerHTML = `
            <span>${message}</span>
            <button class="btn btn-secondary" onclick="deleteMessage(${index})">🗑️</button>
        `;
        messageList.appendChild(item);
    });
}

// Varsayılan mesajlar
function getDefaultMessages() {
    return [
        "Seninle geçirdiğim her an, hayatımın en değerli anıları 💕",
        "Sen benim için sadece bir sevgili değil, en yakın arkadaşım ve sırdaşımsın ❤️",
        "Gözlerinin içine baktığımda, geleceğimi görüyorum 🌟",
        "Seninle olmak, evde olmak gibi... Huzurlu ve güvenli 🏡",
        "Her gün sana olan aşkım biraz daha artıyor 💝"
    ];
}

// Yeni mesaj ekle
async function addMessage() {
    const newMessage = document.getElementById('newMessage').value.trim();
    
    if (!newMessage) {
        alert('Lütfen bir mesaj yazın!');
        return;
    }
    
    const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const messages = savedMessages ? JSON.parse(savedMessages) : getDefaultMessages();
    
    messages.push(newMessage);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    
    // Firebase'e kaydet
    if (window.firebaseSync) {
        await window.firebaseSync.saveData('messages', 'list', { data: messages });
    }
    
    document.getElementById('newMessage').value = '';
    loadMessages();
    showSuccess('messageSuccess');
}

// Mesaj sil
async function deleteMessage(index) {
    if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const messages = savedMessages ? JSON.parse(savedMessages) : [];
    
    messages.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    
    // Firebase'e kaydet
    if (window.firebaseSync) {
        await window.firebaseSync.saveData('messages', 'list', { data: messages });
    }
    
    loadMessages();
}

// Fotoğrafları yükle
function loadPhotos() {
    const savedPhotos = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    const photos = savedPhotos ? JSON.parse(savedPhotos) : [];
    
    const photoPreview = document.getElementById('photoPreview');
    photoPreview.innerHTML = '';
    
    if (photos.length === 0) {
        photoPreview.innerHTML = '<p style="text-align: center; opacity: 0.7;">Henüz fotoğraf eklenmemiş. Yukarıdan fotoğraf ekleyin! 📸</p>';
        return;
    }
    
    photos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'photo-preview-item';
        
        // Küçük bilgi etiketi
        const infoLabel = photo.uploadedBy ? 
            `<div style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.7); color: white; padding: 3px 8px; border-radius: 5px; font-size: 0.8em;">
                ${photo.uploadedBy}
            </div>` : '';
        
        item.innerHTML = `
            ${infoLabel}
            <img src="${photo.src}" alt="${photo.caption}" loading="lazy">
            <button class="delete-btn" onclick="deletePhoto(${index})" title="Sil">×</button>
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 8px; font-size: 0.85em; text-align: center;">
                ${photo.caption}
            </div>
        `;
        photoPreview.appendChild(item);
    });
}

// Fotoğraf yükleme (Dosyadan)
function handlePhotoUpload(event) {
    const files = event.target.files;
    const caption = document.getElementById('photoCaption1').value.trim() || 'Anımız 💕';
    const category = document.getElementById('photoCategory1').value;
    
    if (files.length === 0) return;
    
    const savedPhotos = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    const photos = savedPhotos ? JSON.parse(savedPhotos) : [];
    
    let uploadCount = 0;
    const totalFiles = files.length;
    
    Array.from(files).forEach(file => {
        // Dosya boyutu kontrolü (5MB max önerilir)
        if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} çok büyük! Lütfen 5MB'dan küçük fotoğraf seçin.`);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            photos.push({
                src: e.target.result,
                caption: caption,
                category: category,
                uploadedBy: getCurrentUser(),
                uploadedAt: new Date().toISOString()
            });
            
            uploadCount++;
            
            // Tüm dosyalar yüklendiğinde
            if (uploadCount === totalFiles) {
                localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
                
                // Firebase'e kaydet
                if (window.firebaseSync) {
                    window.firebaseSync.saveData('photos', 'gallery', { data: photos });
                }
                
                loadPhotos();
                showSuccess('photoSuccess');
                document.getElementById('photoCaption1').value = '';
                document.getElementById('photoCategory1').value = 'diğer';
            }
        };
        reader.readAsDataURL(file);
    });
    
    event.target.value = '';
}

// Fotoğraf URL ile ekleme
function addPhotoUrl() {
    const url = document.getElementById('photoUrl').value.trim();
    const caption = document.getElementById('photoCaption2').value.trim() || 'Anımız 💕';
    const category = document.getElementById('photoCategory2').value;
    
    if (!url) {
        alert('Lütfen bir fotoğraf URL\'si girin!');
        return;
    }
    
    // URL geçerliliği kontrolü
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('Lütfen geçerli bir URL girin (http:// veya https:// ile başlamalı)');
        return;
    }
    
    const savedPhotos = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    const photos = savedPhotos ? JSON.parse(savedPhotos) : [];
    
    photos.push({
        src: url,
        caption: caption,
        category: category,
        uploadedBy: getCurrentUser(),
        uploadedAt: new Date().toISOString()
    });
    
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    
    // Firebase'e kaydet
    if (window.firebaseSync) {
        window.firebaseSync.saveData('photos', 'gallery', { data: photos });
    }
    
    document.getElementById('photoUrl').value = '';
    document.getElementById('photoCaption2').value = '';
    document.getElementById('photoCategory2').value = 'diğer';
    
    loadPhotos();
    showSuccess('photoSuccess');
}

// Fotoğraf sil
async function deletePhoto(index) {
    if (!confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    const savedPhotos = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    const photos = savedPhotos ? JSON.parse(savedPhotos) : [];
    
    photos.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    
    // Firebase'e kaydet
    if (window.firebaseSync) {
        await window.firebaseSync.saveData('photos', 'gallery', { data: photos });
    }
    
    loadPhotos();
}

// Bucket list yükle
function loadBucketList() {
    const savedBucket = localStorage.getItem(STORAGE_KEYS.BUCKET);
    const bucketItems = savedBucket ? JSON.parse(savedBucket) : getDefaultBucket();
    
    const bucketList = document.getElementById('bucketList');
    bucketList.innerHTML = '';
    
    bucketItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'bucket-item-edit';
        div.innerHTML = `
            <input type="text" value="${item.emoji}" readonly style="width: 60px;">
            <input type="text" value="${item.text}" readonly style="flex: 1;">
            <button class="btn btn-secondary" onclick="deleteBucketItem(${index})">🗑️</button>
        `;
        bucketList.appendChild(div);
    });
}

// Varsayılan bucket list
function getDefaultBucket() {
    return [
        { emoji: '🌅', text: 'Birlikte gün doğumu izlemek' },
        { emoji: '✈️', text: 'Hayallerimizin tatilini yapmak' },
        { emoji: '🎬', text: 'Maratona film izlemek' },
        { emoji: '🍳', text: 'Birlikte yemek pişirmek' },
        { emoji: '🎨', text: 'Çiftler için etkinliğe gitmek' },
        { emoji: '🌟', text: 'Yıldızları seyretmek' }
    ];
}

// Bucket item ekle
async function addBucketItem() {
    const emoji = document.getElementById('newBucketEmoji').value.trim();
    const text = document.getElementById('newBucketText').value.trim();
    
    if (!emoji || !text) {
        alert('Lütfen hem emoji hem de açıklama girin!');
        return;
    }
    
    const savedBucket = localStorage.getItem(STORAGE_KEYS.BUCKET);
    const bucketItems = savedBucket ? JSON.parse(savedBucket) : getDefaultBucket();
    
    bucketItems.push({ emoji, text });
    localStorage.setItem(STORAGE_KEYS.BUCKET, JSON.stringify(bucketItems));
    
    // Firebase'e kaydet
    if (window.firebaseSync) {
        await window.firebaseSync.saveData('bucketlist', 'items', { data: bucketItems });
    }
    
    document.getElementById('newBucketEmoji').value = '';
    document.getElementById('newBucketText').value = '';
    
    loadBucketList();
    showSuccess('bucketSuccess');
}

// Bucket item sil
async function deleteBucketItem(index) {
    if (!confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    const savedBucket = localStorage.getItem(STORAGE_KEYS.BUCKET);
    const bucketItems = savedBucket ? JSON.parse(savedBucket) : [];
    
    bucketItems.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.BUCKET, JSON.stringify(bucketItems));
    
    // Firebase'e kaydet
    if (window.firebaseSync) {
        await window.firebaseSync.saveData('bucketlist', 'items', { data: bucketItems });
    }
    
    loadBucketList();
}

// Başarı mesajı göster
function showSuccess(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

// Yedekleme
function backupData() {
    const data = {
        dates: localStorage.getItem(STORAGE_KEYS.DATES),
        messages: localStorage.getItem(STORAGE_KEYS.MESSAGES),
        photos: localStorage.getItem(STORAGE_KEYS.PHOTOS),
        bucket: localStorage.getItem(STORAGE_KEYS.BUCKET),
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `love-site-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    alert('Verileriniz başarıyla indirildi! 💾');
}

// Geri yükleme
function restoreData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('Tüm mevcut veriler silinecek ve yedekten geri yüklenecek. Emin misiniz?')) {
                if (data.dates) localStorage.setItem(STORAGE_KEYS.DATES, data.dates);
                if (data.messages) localStorage.setItem(STORAGE_KEYS.MESSAGES, data.messages);
                if (data.photos) localStorage.setItem(STORAGE_KEYS.PHOTOS, data.photos);
                if (data.bucket) localStorage.setItem(STORAGE_KEYS.BUCKET, data.bucket);
                
                alert('Veriler başarıyla geri yüklendi! Sayfa yeniden yüklenecek.');
                location.reload();
            }
        } catch (error) {
            alert('Hatalı yedek dosyası! Lütfen geçerli bir yedek dosyası seçin.');
        }
    };
    reader.readAsText(file);
    
    event.target.value = '';
}

// Global fonksiyonları export et
window.updateDate = updateDate;
window.addMessage = addMessage;
window.deleteMessage = deleteMessage;
window.addPhoto = addPhoto;
window.deletePhoto = deletePhoto;
window.movePhotoUp = movePhotoUp;
window.movePhotoDown = movePhotoDown;
window.addBucketItem = addBucketItem;
window.deleteBucketItem = deleteBucketItem;
window.toggleBucketItem = toggleBucketItem;
window.backupData = backupData;
window.restoreData = restoreData;
