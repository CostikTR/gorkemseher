// ============================================
// AŞK SİTESİ - ANA SCRIPT
// ============================================

import firebaseSync from './firebase-sync.js';

// Firebase'i global olarak kullanılabilir yap
window.firebaseSync = firebaseSync;

window.nextImage = function() { console.log('next'); };
window.previousImage = function() { console.log('prev'); };
window.showRandomMessage = function() { console.log('msg'); };

let relationshipStartDate = new Date('2024-01-01T00:00:00');

let specialDates = {
    firstMeet: new Date('2023-12-15'),
    relationship: new Date('2024-01-01'),
    firstKiss: new Date('2024-01-14'),
    specialDay: new Date('2024-06-15')
};

// Fotoğraflar Firebase'den yüklenecek
let photos = [];

const loveMessages = [
    "Seninle geçirdiğim her an, hayatımın en değerli anıları 💕",
    "Sen benim için sadece bir sevgili değil, en yakın arkadaşım ve sırdaşımsın ❤️",
    "Gözlerinin içine baktığımda, geleceğimi görüyorum 🌟",
    "Seninle olmak, evde olmak gibi... Huzurlu ve güvenli 🏡",
    "Her gün sana olan aşkım biraz daha artıyor 💝"
];

let currentPhotoIndex = 0;

document.addEventListener('DOMContentLoaded', async function() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const welcomeEl = document.getElementById('welcomeUser');
        if (welcomeEl) welcomeEl.textContent = `Hoş geldin, ${currentUser} 💕`;
    }
    
    await loadSavedData();
    await loadPhotosFromFirebase(); // Firebase'den fotoğrafları yükle
    initializeCounters();
    updateTimeCounter();
    setInterval(updateTimeCounter, 1000);
    
    updateSpecialDates();
    initializeGallery();
    showRandomMessage();
    createFloatingHearts();
    updateCurrentDate();
    
    if (document.querySelector('.hearts-container')) {
        setInterval(createFloatingHearts, 10000);
    }
    
    initializeProfilePhotos();
    initializeTypewriter();
    
    if (document.getElementById('bucketListPreview')) {
        loadBucketListPreview();
    }
});

async function loadPhotosFromFirebase() {
    try {
        console.log('📸 Ana sayfa fotoğrafları yükleniyor...');
        console.log('🔍 firebaseSync instance:', window.firebaseSync);
        
        // Window.firebaseSync kullan (index.html'den set ediliyor)
        if (!window.firebaseSync || typeof window.firebaseSync.loadData !== 'function') {
            console.warn('⚠️ firebaseSync.loadData bulunamadı, placeholder gösteriliyor');
            photos = [{
                src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='white'%3EGaleri\'den Fotoğraf Ekleyin 📸%3C/text%3E%3C/svg%3E",
                caption: 'Galeri sayfasından fotoğraf ekleyin'
            }];
            return;
        }
        
        // Firebase'den fotoğrafları yükle
        const firestorePhotos = await window.firebaseSync.loadData('photos');
        
        if (firestorePhotos && Object.keys(firestorePhotos).length > 0) {
            // Firestore'dan gelen fotoğrafları array'e çevir
            photos = Object.entries(firestorePhotos)
                .filter(([key, value]) => key !== 'metadata' && value && typeof value === 'object' && value.src)
                .map(([_, photo]) => photo)
                .sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
            
            console.log(`☁️ ${photos.length} fotoğraf Firebase\'den yüklendi`);
            console.log('📷 İlk fotoğrafın src\'si:', photos[0]?.src?.substring(0, 100) + '...');
            console.log('📷 Fotoğraflar:', photos);
        } else {
            console.log('ℹ️ Firebase\'de fotoğraf bulunamadı');
            // Placeholder fotoğraf
            photos = [{
                src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='white'%3EGaleri\'den Fotoğraf Ekleyin 📸%3C/text%3E%3C/svg%3E",
                caption: 'Galeri sayfasından fotoğraf ekleyin'
            }];
        }
    } catch (error) {
        console.error('❌ Fotoğraf yükleme hatası:', error);
        photos = [{
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='white'%3EGaleri\'den Fotoğraf Ekleyin 📸%3C/text%3E%3C/svg%3E",
            caption: 'Galeri sayfasından fotoğraf ekleyin'
        }];
    }
}

async function loadSavedData() {
    try {
        // window.firebaseSync kullan
        if (!window.firebaseSync) {
            console.warn('⚠️ firebaseSync henüz yüklenmedi');
            return;
        }
        
        // Tarihleri Firebase'den yükle
        const datesData = await window.firebaseSync.getData('dates', 'main');
        let dates = null;
        
        if (datesData && datesData.data) {
            dates = datesData.data;
        } else {
            // Firebase'de yoksa localStorage'dan al
            const savedDates = localStorage.getItem('lovesite_dates');
            dates = savedDates ? JSON.parse(savedDates) : null;
        }
        
        if (dates) {
            // Admin panelden gelen format: dates.firstMeet.date
            if (dates.firstMeet && dates.firstMeet.date) {
                specialDates.firstMeet = new Date(dates.firstMeet.date);
            } else if (dates.firstMeet) {
                specialDates.firstMeet = new Date(dates.firstMeet);
            }
            
            if (dates.relationship && dates.relationship.date) {
                specialDates.relationship = new Date(dates.relationship.date);
                // İlişki başlangıç tarihi güncelle (sayaç için)
                relationshipStartDate = new Date(dates.relationship.date);
            } else if (dates.relationship) {
                specialDates.relationship = new Date(dates.relationship);
                relationshipStartDate = new Date(dates.relationship);
            }
            
            if (dates.firstKiss && dates.firstKiss.date) {
                specialDates.firstKiss = new Date(dates.firstKiss.date);
            } else if (dates.firstKiss) {
                specialDates.firstKiss = new Date(dates.firstKiss);
            }
            
            if (dates.specialDay && dates.specialDay.date) {
                specialDates.specialDay = new Date(dates.specialDay.date);
            } else if (dates.specialDay) {
                specialDates.specialDay = new Date(dates.specialDay);
            }
            
            console.log('✅ Tarihler Firebase\'den yüklendi:', {
                relationship: relationshipStartDate,
                specialDates: specialDates
            });
        }
    } catch (error) {
        console.error('❌ Tarih yükleme hatası:', error);
        // Hata durumunda localStorage'dan yükle
        const savedDates = localStorage.getItem('lovesite_dates');
        if (savedDates) {
            const dates = JSON.parse(savedDates);
            // Yukarıdaki ile aynı işlem
            if (dates.relationship && dates.relationship.date) {
                relationshipStartDate = new Date(dates.relationship.date);
            }
        }
    }
    
    // Fotoğrafları Firebase'den yükle
    try {
        const photosData = await firebaseSync.getData('photos', 'list');
        if (photosData && photosData.data && Array.isArray(photosData.data)) {
            photos = photosData.data;
            console.log(`✅ ${photos.length} fotoğraf Firebase'den yüklendi`);
        } else {
            const savedPhotos = localStorage.getItem('lovesite_photos');
            if (savedPhotos) {
                photos = JSON.parse(savedPhotos);
            }
        }
    } catch (error) {
        console.error('❌ Fotoğraf yükleme hatası:', error);
        const savedPhotos = localStorage.getItem('lovesite_photos');
        if (savedPhotos) {
            photos = JSON.parse(savedPhotos);
        }
    }
}

async function initializeProfilePhotos() {
    // Firebase'den profil fotoğraflarını yükle
    try {
        const profile1Data = await firebaseSync.getData('profiles', 'profile1');
        const profile2Data = await firebaseSync.getData('profiles', 'profile2');
        
        if (profile1Data && profile1Data.image) {
            localStorage.setItem('lovesite_profile1', profile1Data.image);
        }
        if (profile2Data && profile2Data.image) {
            localStorage.setItem('lovesite_profile2', profile2Data.image);
        }
    } catch (error) {
        console.warn('⚠️ Profil fotoğrafları Firebase\'den yüklenemedi:', error);
    }
    
    // localStorage'dan göster
    const profile1 = localStorage.getItem('lovesite_profile1');
    const profile2 = localStorage.getItem('lovesite_profile2');
    
    if (profile1) {
        const img1 = document.getElementById('profileImg1');
        const placeholder1 = document.getElementById('placeholder1');
        if (img1 && placeholder1) {
            img1.src = profile1;
            img1.style.display = 'block';
            placeholder1.style.display = 'none';
        }
    }
    
    if (profile2) {
        const img2 = document.getElementById('profileImg2');
        const placeholder2 = document.getElementById('placeholder2');
        if (img2 && placeholder2) {
            img2.src = profile2;
            img2.style.display = 'block';
            placeholder2.style.display = 'none';
        }
    }
    
    const upload1 = document.getElementById('profileUpload1');
    const upload2 = document.getElementById('profileUpload2');
    
    if (upload1) upload1.addEventListener('change', (e) => handleProfileUpload(e, 1));
    if (upload2) upload2.addEventListener('change', (e) => handleProfileUpload(e, 2));
}

function handleProfileUpload(event, profileNum) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let width = img.width;
            let height = img.height;
            const maxSize = 800;
            
            if (width > height && width > maxSize) {
                height = (height / width) * maxSize;
                width = maxSize;
            } else if (height > maxSize) {
                width = (width / height) * maxSize;
                height = maxSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
            
            // localStorage'a kaydet (backup)
            localStorage.setItem(`lovesite_profile${profileNum}`, compressed);
            
            // Firebase'e kaydet
            firebaseSync.saveData('profiles', `profile${profileNum}`, {
                image: compressed,
                updatedAt: Date.now()
            }).then(() => {
                console.log(`✅ Profil ${profileNum} Firebase'e kaydedildi`);
            }).catch(error => {
                console.error(`❌ Profil ${profileNum} Firebase kayıt hatası:`, error);
            });
            
            const imgElement = document.getElementById(`profileImg${profileNum}`);
            const placeholder = document.getElementById(`placeholder${profileNum}`);
            
            if (imgElement && placeholder) {
                imgElement.src = compressed;
                imgElement.style.display = 'block';
                placeholder.style.display = 'none';
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function initializeTypewriter() {
    const texts = [
        "Seninle her anım özel 💕",
        "Birlikte geçirdiğimiz günler çok değerli ❤️",
        "Sen benim en güzel sürprizimsin 🎁",
        "Seninle gülmek en güzel terapi 😊",
        "Hayatımın aşkı sensin 💝"
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typewriterElement = document.getElementById('typewriterText');
    
    if (!typewriterElement) return;
    
    function type() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            typewriterElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typewriterElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typeSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typeSpeed = 500;
        }
        
        setTimeout(type, typeSpeed);
    }
    
    type();
}

function initializeCounters() {}

function updateTimeCounter() {
    const now = new Date();
    const diff = now - relationshipStartDate;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (daysEl) daysEl.textContent = days;
    if (hoursEl) hoursEl.textContent = hours;
    if (minutesEl) minutesEl.textContent = minutes;
    if (secondsEl) secondsEl.textContent = seconds;
}

function updateSpecialDates() {
    const dateElements = {
        'firstMeet': specialDates.firstMeet,
        'relationship': specialDates.relationship,
        'firstKiss': specialDates.firstKiss,
        'specialDay': specialDates.specialDay
    };
    
    for (const [key, date] of Object.entries(dateElements)) {
        const dateEl = document.getElementById(key);
        const daysEl = document.getElementById(`${key}Days`);
        
        if (dateEl && date) {
            dateEl.textContent = date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        if (daysEl && date) {
            const daysPassed = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
            daysEl.textContent = `${daysPassed} gün önce`;
        }
    }
}

function initializeGallery() {
    if (photos.length === 0) return;
    showPhoto(currentPhotoIndex);
    updateDots();
}

function showPhoto(index) {
    const imgEl = document.getElementById('galleryImage');
    const captionEl = document.getElementById('photoCaption');
    
    if (imgEl && photos[index]) imgEl.src = photos[index].src;
    if (captionEl && photos[index]) captionEl.textContent = photos[index].caption || '';
}

function nextImage() {
    currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
    showPhoto(currentPhotoIndex);
    updateDots();
}

function previousImage() {
    currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
    showPhoto(currentPhotoIndex);
    updateDots();
}

function updateDots() {
    const dotsContainer = document.getElementById('galleryDots');
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    
    photos.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = 'dot' + (index === currentPhotoIndex ? ' active' : '');
        dot.onclick = () => {
            currentPhotoIndex = index;
            showPhoto(currentPhotoIndex);
            updateDots();
        };
        dotsContainer.appendChild(dot);
    });
}

function showRandomMessage() {
    const messageEl = document.getElementById('loveMessage');
    if (!messageEl) return;
    
    const randomIndex = Math.floor(Math.random() * loveMessages.length);
    messageEl.textContent = loveMessages[randomIndex];
    messageEl.style.opacity = '0';
    
    setTimeout(() => { messageEl.style.opacity = '1'; }, 100);
}

function createFloatingHearts() {
    const container = document.querySelector('.hearts-container');
    if (!container) return;
    
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = '❤️';
    heart.style.left = Math.random() * 100 + '%';
    heart.style.animationDuration = (Math.random() * 3 + 4) + 's';
    heart.style.fontSize = (Math.random() * 20 + 20) + 'px';
    
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 7000);
}

function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (!dateEl) return;
    
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function loadBucketListPreview() {
    const saved = localStorage.getItem('lovesite_bucketlist');
    const items = saved ? JSON.parse(saved) : [];
    
    const container = document.getElementById('bucketListPreview');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Sadece tamamlanmamış hedefleri göster
    // Destek: farklı veri modelleri (completed, done, status) olabileceği için hepsini kontrol et
    const activeItems = items.filter(item => {
        const isCompleted = Boolean(item.completed) || Boolean(item.done) || (item.status && item.status.toString().toLowerCase() === 'completed');
        return !isCompleted;
    });
    const previewItems = activeItems.slice(0, 6);
    
    if (previewItems.length === 0) {
        container.innerHTML = '<p style="text-align: center; opacity: 0.7;">Henüz aktif hedef yok 🎯</p>';
        return;
    }
    
    previewItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bucket-item';
        card.innerHTML = `
            <span class="bucket-emoji">${item.emoji}</span>
            <span class="bucket-text">${item.text}</span>
        `;
        container.appendChild(card);
    });
}

window.nextImage = nextImage;
window.previousImage = previousImage;
window.showRandomMessage = showRandomMessage;
