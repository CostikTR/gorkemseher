// Modern Gallery System
import { FirebaseSync } from './firebase-sync.js';
import { storage, ref, uploadString, getDownloadURL, deleteObject } from './firebase-config.js';
import dbStorage from './indexeddb-storage.js';

// Firebase sync instance
const firebaseSync = new FirebaseSync();
window.firebaseSync = firebaseSync;

let allPhotos = [];
let currentFilter = 'all';
let currentDateFilter = 'all';
let currentLightboxIndex = 0;
let pendingPhotoFile = null;
let pendingPhotoData = null;

// Initialize gallery on page load
document.addEventListener('DOMContentLoaded', async function() {
    // IndexedDB'yi başlat
    await dbStorage.init();
    
    // localStorage'dan IndexedDB'ye migrate et (ilk kez)
    const migrated = await dbStorage.getSetting('migrated_from_localstorage');
    if (!migrated) {
        await dbStorage.migrateFromLocalStorage();
    }
    
    await loadPhotos();
    setupFilterButtons();
    setupDateFilterButtons();
    setupUploadHandlers();
    setupLightboxHandlers();
});

// Load photos from Firebase Storage (cloud) and cache to IndexedDB
async function loadPhotos() {
    try {
        console.log('🔄 Fotoğraflar yükleniyor...');
        
        // 1. Firebase Firestore'dan fotoğrafları yükle
        try {
            console.log('☁️ Firebase\'den yükleniyor...');
            const firestorePhotos = await firebaseSync.loadData('photos');
            
            if (firestorePhotos && Object.keys(firestorePhotos).length > 0) {
                // Firestore'dan gelen fotoğrafları array'e çevir
                const rawPhotos = Object.entries(firestorePhotos)
                    .filter(([key, value]) => key !== 'metadata' && value && typeof value === 'object')
                    .map(([_, photo]) => photo);
                
                console.log('📦 Firebase\'den gelen ham fotoğraflar:', rawPhotos);
                
                // Sadece src'si olan fotoğrafları al
                allPhotos = rawPhotos
                    .filter(photo => {
                        if (!photo.src) {
                            console.warn('⚠️ src olmayan fotoğraf bulundu:', photo);
                            return false;
                        }
                        return true;
                    })
                    .sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
                
                console.log(`☁️ ${allPhotos.length} fotoğraf Firebase\'den yüklendi`);
                
                // Firebase'den yüklenen fotoğrafları IndexedDB'ye cache'le
                try {
                    for (const photo of allPhotos) {
                        // Fotoğrafın geçerli olduğundan emin ol
                        if (!photo.id || !photo.src) {
                            console.warn('⚠️ Photo ID veya src yok, cache atlanıyor:', photo);
                            continue;
                        }
                        
                        // Eğer cache'de yoksa veya URL farklıysa güncelle
                        const cached = await dbStorage.getAllPhotos();
                        const cachedPhoto = cached.find(p => p.id === photo.id);
                        
                        if (!cachedPhoto || cachedPhoto.src !== photo.src) {
                            // URL'den Base64'e çevir ve cache'le
                            try {
                                const response = await fetch(photo.src);
                                const blob = await response.blob();
                                const reader = new FileReader();
                                
                                await new Promise((resolve) => {
                                    reader.onloadend = async () => {
                                        const base64 = reader.result;
                                        const photoToCache = {
                                            ...photo,
                                            src: base64,
                                            id: photo.id
                                        };
                                        await dbStorage.savePhoto(photoToCache);
                                        resolve();
                                    };
                                    reader.readAsDataURL(blob);
                                });
                            } catch (cacheError) {
                                console.warn('⚠️ Cache hatası:', photo.id, cacheError);
                            }
                        }
                    }
                    console.log('💾 Firebase fotoğrafları cache\'lendi');
                } catch (cacheError) {
                    console.warn('⚠️ Cache işlemi hatası:', cacheError);
                }
            } else {
                console.log('ℹ️ Firebase\'de fotoğraf bulunamadı, cache kontrol ediliyor...');
                
                // Firebase'de yoksa IndexedDB'den yükle
                const cachedPhotos = await dbStorage.getAllPhotos();
                if (cachedPhotos && cachedPhotos.length > 0) {
                    allPhotos = cachedPhotos.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
                    console.log(`💾 ${allPhotos.length} fotoğraf cache\'den yüklendi`);
                }
            }
        } catch (firebaseError) {
            console.log('⚠️ Firebase yükleme hatası, cache\'den yükleniyor:', firebaseError.message);
            
            // Firebase hatası olursa IndexedDB'den yükle
            const cachedPhotos = await dbStorage.getAllPhotos();
            if (cachedPhotos && cachedPhotos.length > 0) {
                allPhotos = cachedPhotos.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
                console.log(`💾 ${allPhotos.length} fotoğraf cache\'den yüklendi`);
            }
        }
    } catch (error) {
        console.error('❌ Fotoğraf yükleme hatası:', error);
        allPhotos = [];
    }
    
    displayPhotos(allPhotos);
    updateStats();
}

// Setup filter button handlers
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('#categoryFilters .filter-chip');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all category buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Apply filter
            const filter = this.getAttribute('data-filter');
            currentFilter = filter;
            applyFilters();
        });
    });
}

// Setup date filter button handlers
function setupDateFilterButtons() {
    const dateButtons = document.querySelectorAll('#dateFilters .filter-chip');
    dateButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all date buttons
            dateButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Apply filter
            const dateFilter = this.getAttribute('data-date');
            currentDateFilter = dateFilter;
            applyFilters();
        });
    });
}

// Apply both filters (category and date)
function applyFilters() {
    let filtered = [...allPhotos];
    
    // Apply category filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(photo => 
            (photo.category || 'diğer') === currentFilter
        );
    }
    
    // Apply date filter
    if (currentDateFilter !== 'all') {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        filtered = filtered.filter(photo => {
            if (!photo.uploadedAt) return false;
            const photoDate = new Date(photo.uploadedAt);
            const photoMonth = photoDate.getMonth();
            const photoYear = photoDate.getFullYear();
            
            switch(currentDateFilter) {
                case 'this-month':
                    return photoMonth === currentMonth && photoYear === currentYear;
                case 'last-month':
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    return photoMonth === lastMonth && photoYear === lastMonthYear;
                case 'this-year':
                    return photoYear === currentYear;
                case 'older':
                    return photoYear < currentYear;
                default:
                    return true;
            }
        });
    }
    
    displayPhotos(filtered);
}

// Display photos in grid
function displayPhotos(photos) {
    console.log('🖼️ displayPhotos çağrıldı, fotoğraf sayısı:', photos.length);
    const grid = document.getElementById('photoGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!grid) {
        console.error('❌ photoGrid elementi bulunamadı!');
        return;
    }
    
    if (!photos || photos.length === 0) {
        console.log('⚠️ Gösterilecek fotoğraf yok');
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    grid.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    grid.innerHTML = '';
    console.log('✅ Grid temizlendi, fotoğraflar ekleniyor...');
    
    // Sort by date (newest first)
    const sortedPhotos = [...photos].sort((a, b) => {
        const dateA = new Date(a.uploadedAt || 0);
        const dateB = new Date(b.uploadedAt || 0);
        return dateB - dateA;
    });
    
    sortedPhotos.forEach((photo, index) => {
        const item = createPhotoItem(photo, index);
        grid.appendChild(item);
        
        // Stagger animation
        setTimeout(() => {
            item.style.animationDelay = `${index * 0.1}s`;
        }, 10);
    });
}

// Create photo item element
function createPhotoItem(photo, index) {
    const item = document.createElement('div');
    item.className = 'photo-item';
    
    const uploadDate = photo.uploadedAt ? 
        new Date(photo.uploadedAt).toLocaleDateString('tr-TR', { 
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
        }) : '';
    
    const categoryEmoji = getCategoryEmoji(photo.category || 'diğer');
    const category = photo.category ? photo.category.charAt(0).toUpperCase() + photo.category.slice(1) : '';
    
    const infoParts = [
        categoryEmoji + (category ? ' ' + category : ''),
        uploadDate
    ].filter(Boolean).join(' • ');
    
    item.innerHTML = `
        <img src="${photo.src}" 
             alt="${photo.caption || 'Fotoğraf'}" 
             loading="lazy"
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27600%27%3E%3Crect width=%27400%27 height=%27600%27 fill=%27%23667eea%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27Arial%27 font-size=%2748%27 fill=%27white%27%3E📸%3C/text%3E%3Ctext x=%2750%25%27 y=%2760%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27Arial%27 font-size=%2716%27 fill=%27white%27%3EYüklenemedi%3C/text%3E%3C/svg%3E'">
        <button class="photo-delete-btn" onclick="event.stopPropagation(); deletePhoto(${index})" title="Sil">
            🗑️
        </button>
        <div class="photo-overlay">
            <div class="photo-title">${photo.caption || 'İsimsiz Anı'}</div>
            ${infoParts ? `<div class="photo-info">${infoParts}</div>` : ''}
        </div>
    `;
    
    item.addEventListener('click', () => openLightbox(allPhotos.indexOf(photo)));
    
    return item;
}

// Get category emoji
function getCategoryEmoji(category) {
    const emojis = {
        'tatil': '🏖️',
        'selfie': '🤳',
        'özel': '🎉',
        'doğa': '🌲',
        'diğer': '📷'
    };
    return emojis[category] || '📷';
}

// Update statistics
function updateStats() {
    const totalPhotos = allPhotos.length;
    document.getElementById('totalPhotos').textContent = totalPhotos;
    document.getElementById('totalMemories').textContent = totalPhotos;
}

// Open lightbox
function openLightbox(index) {
    if (index < 0 || index >= allPhotos.length) return;
    
    currentLightboxIndex = index;
    const photo = allPhotos[index];
    const lightbox = document.getElementById('lightbox');
    
    document.getElementById('lightboxImage').src = photo.src;
    document.getElementById('lightboxCaption').textContent = photo.caption || 'İsimsiz Anı';
    
    const uploadDate = photo.uploadedAt ? 
        new Date(photo.uploadedAt).toLocaleDateString('tr-TR', { 
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
        }) : '';
    
    const categoryEmoji = getCategoryEmoji(photo.category || 'diğer');
    const category = photo.category ? photo.category.charAt(0).toUpperCase() + photo.category.slice(1) : '';
    
    const metaParts = [
        categoryEmoji + (category ? ' ' + category : ''),
        photo.uploadedBy || '',
        uploadDate
    ].filter(Boolean).join(' • ');
    
    document.getElementById('lightboxMeta').textContent = metaParts || 'Detay yok';
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close lightbox
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Navigate in lightbox
function navigateLightbox(direction) {
    currentLightboxIndex += direction;
    
    if (currentLightboxIndex < 0) {
        currentLightboxIndex = allPhotos.length - 1;
    } else if (currentLightboxIndex >= allPhotos.length) {
        currentLightboxIndex = 0;
    }
    
    openLightbox(currentLightboxIndex);
}

// Setup lightbox button handlers
function setupLightboxHandlers() {
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightbox = document.getElementById('lightbox');
    
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    }
    
    if (lightboxNext) {
        lightboxNext.addEventListener('click', () => navigateLightbox(1));
    }
    
    // Close on overlay click
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === this) {
                closeLightbox();
            }
        });
    }
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && lightbox.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            navigateLightbox(-1);
        } else if (e.key === 'ArrowRight') {
            navigateLightbox(1);
        }
    }
});

// Refresh on window focus
window.addEventListener('focus', function() {
    loadPhotos();
});

// Setup upload handlers
function setupUploadHandlers() {
    const uploadInput = document.getElementById('uploadInput');
    const uploadArea = document.querySelector('.upload-area');
    
    // File input change - tek gereken bu
    uploadInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop için event'ler (desktop)
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            uploadArea.style.background = 'rgba(255, 255, 255, 0.15)';
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            uploadArea.style.background = 'rgba(255, 255, 255, 0.05)';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            uploadArea.style.background = 'rgba(255, 255, 255, 0.05)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFiles(files);
            }
        });
    }
}

// Handle file selection
function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        handleFiles(files);
    }
}

// Bekleyen dosyalar için kuyruk
let pendingFiles = [];
let currentFileIndex = 0;

// Fotoğrafı otomatik küçült (Firestore limiti için)
async function compressImageIfNeeded(base64Data, mimeType) {
    return new Promise((resolve, reject) => {
        // Video ise sıkıştırma
        if (mimeType.startsWith('video/')) {
            resolve(base64Data);
            return;
        }
        
        // Boyutu kontrol et
        const sizeKB = Math.round(base64Data.length / 1024);
        const MAX_SIZE_KB = 800; // Firestore limiti için güvenli boyut
        
        console.log(`📏 Orijinal boyut: ${sizeKB} KB`);
        
        if (sizeKB <= MAX_SIZE_KB) {
            console.log('✅ Boyut uygun, sıkıştırma gerekmiyor');
            resolve(base64Data);
            return;
        }
        
        console.log(`🔄 Fotoğraf sıkıştırılıyor (${sizeKB} KB → ${MAX_SIZE_KB} KB)...`);
        
        // Canvas ile yeniden boyutlandır
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Yeni boyutları hesapla (aspect ratio koru)
            let width = img.width;
            let height = img.height;
            const maxDimension = 1920; // Max genişlik/yükseklik
            
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = (height / width) * maxDimension;
                    width = maxDimension;
                } else {
                    width = (width / height) * maxDimension;
                    height = maxDimension;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Kaliteyi ayarla (0.1 - 1.0)
            let quality = 0.8;
            let compressedData = canvas.toDataURL(mimeType, quality);
            let compressedSizeKB = Math.round(compressedData.length / 1024);
            
            // Hala büyükse kaliteyi daha da düşür
            while (compressedSizeKB > MAX_SIZE_KB && quality > 0.3) {
                quality -= 0.1;
                compressedData = canvas.toDataURL(mimeType, quality);
                compressedSizeKB = Math.round(compressedData.length / 1024);
            }
            
            console.log(`✅ Sıkıştırma tamamlandı: ${compressedSizeKB} KB (kalite: ${Math.round(quality * 100)}%)`);
            resolve(compressedData);
        };
        
        img.onerror = () => {
            console.error('❌ Resim yüklenemedi, orijinal kullanılacak');
            resolve(base64Data);
        };
        
        img.src = base64Data;
    });
}

// Handle files
function handleFiles(files) {
    // Tüm dosyaları kuyruğa ekle
    const allFiles = Array.from(files);
    pendingFiles = allFiles.filter(file => {
        // Resim veya video kontrolü
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            // Boyut kontrolü (50MB)
            if (file.size > 50 * 1024 * 1024) {
                showNotification(`❌ ${file.name} çok büyük (Max 50MB)`, 'error');
                return false;
            }
            return true;
        }
        return false;
    });
    
    // Geçersiz dosyalar varsa bildir
    const invalidCount = allFiles.length - pendingFiles.length;
    if (invalidCount > 0) {
        showNotification(`⚠️ ${invalidCount} dosya geçersiz (sadece resim/video yüklenebilir)`, 'warning');
    }
    
    if (pendingFiles.length === 0) {
        alert('❌ Geçerli dosya bulunamadı!\n\nKabul edilen:\n• Resimler (JPG, PNG, GIF, WEBP)\n• Videolar (MP4, MOV, AVI)\n• Maksimum 50MB');
        return;
    }
    
    currentFileIndex = 0;
    console.log(`✅ ${pendingFiles.length} dosya yükleme kuyruğuna eklendi`);
    
    // İlk dosyayı işle
    processNextFile();
}

function processNextFile() {
    if (currentFileIndex >= pendingFiles.length) {
        // Tüm dosyalar işlendi
        const totalCount = currentFileIndex;
        pendingFiles = [];
        currentFileIndex = 0;
        if (totalCount > 0) {
            showNotification(`✨ ${totalCount} fotoğraf başarıyla eklendi!`);
        }
        return;
    }
    
    const file = pendingFiles[currentFileIndex];
    pendingPhotoFile = file;
    
    // Dosya okuma hatası kontrolü
    const reader = new FileReader();
    
    reader.onerror = function(error) {
        console.error('❌ Dosya okuma hatası:', error);
        showNotification(`❌ "${file.name}" okunamadı. Dosya bozuk olabilir.`, 'error');
        
        // Bir sonraki dosyaya geç
        currentFileIndex++;
        setTimeout(() => processNextFile(), 500);
    };
    
    reader.onload = function(e) {
        try {
            pendingPhotoData = e.target.result;
            
            // Data URL doğrulama
            if (!pendingPhotoData || !pendingPhotoData.startsWith('data:')) {
                throw new Error('Geçersiz dosya formatı');
            }
            
            // Fotoğraf boyutunu kontrol et ve gerekirse küçült
            compressImageIfNeeded(pendingPhotoData, file.type).then(compressedData => {
                pendingPhotoData = compressedData;
                
                // Önizleme göster
                document.getElementById('previewImage').src = pendingPhotoData;
                
                // EXIF bilgilerini oku
                readExifData(file);
                
                // Modalı aç
                const modal = document.getElementById('uploadModal');
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }).catch(error => {
                console.error('❌ Fotoğraf sıkıştırma hatası:', error);
                // Hata olursa orijinali kullan
                document.getElementById('previewImage').src = pendingPhotoData;
                readExifData(file);
                const modal = document.getElementById('uploadModal');
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
            
            // Modal başlığını güncelle
            const modalTitle = modal.querySelector('h3');
            if (modalTitle && pendingFiles.length > 1) {
                modalTitle.textContent = `Fotoğraf ${currentFileIndex + 1} / ${pendingFiles.length}`;
            }
            
            // Bugünün tarihini default olarak ayarla
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('uploadDate').value = today;
            
            // Önceki değerleri temizle
            document.getElementById('uploadCaption').value = '';
            document.getElementById('uploadCategory').value = 'diğer';
        } catch (error) {
            console.error('❌ Dosya işleme hatası:', error);
            showNotification(`❌ "${file.name}" işlenemedi: ${error.message}`, 'error');
            
            // Bir sonraki dosyaya geç
            currentFileIndex++;
            setTimeout(() => processNextFile(), 500);
        }
    };
    
    reader.readAsDataURL(file);
}

// Read EXIF data from photo
function readExifData(file) {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = function(e) {
        img.src = e.target.result;
        img.onload = function() {
            EXIF.getData(img, function() {
                const exifInfo = document.getElementById('exifInfo');
                const exifDetails = document.getElementById('exifDetails');
                
                // Çekim tarihi
                const dateTime = EXIF.getTag(this, 'DateTime') || EXIF.getTag(this, 'DateTimeOriginal');
                
                // GPS bilgileri
                const lat = EXIF.getTag(this, 'GPSLatitude');
                const lon = EXIF.getTag(this, 'GPSLongitude');
                const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
                const lonRef = EXIF.getTag(this, 'GPSLongitudeRef');
                
                // Kamera bilgileri
                const make = EXIF.getTag(this, 'Make');
                const model = EXIF.getTag(this, 'Model');
                
                let exifHTML = '';
                let hasExif = false;
                
                if (dateTime) {
                    hasExif = true;
                    exifHTML += `<p>📅 Çekim Tarihi: ${dateTime}</p>`;
                    
                    // Çekim tarihini input'a otomatik doldur
                    try {
                        const parts = dateTime.split(' ')[0].split(':');
                        if (parts.length === 3) {
                            const exifDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
                            document.getElementById('uploadDate').value = exifDate;
                        }
                    } catch (e) {
                        console.log('Tarih parse hatası:', e);
                    }
                }
                
                if (lat && lon) {
                    hasExif = true;
                    const latitude = convertDMSToDD(lat, latRef);
                    const longitude = convertDMSToDD(lon, lonRef);
                    exifHTML += `<p>📍 Konum: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>`;
                    exifHTML += `<p style="font-size: 0.85em; opacity: 0.7;">
                        <a href="https://www.google.com/maps?q=${latitude},${longitude}" target="_blank" style="color: #ffd700;">
                            Haritada Göster →
                        </a>
                    </p>`;
                }
                
                if (make || model) {
                    hasExif = true;
                    exifHTML += `<p>📷 Kamera: ${make || ''} ${model || ''}</p>`;
                }
                
                if (hasExif) {
                    exifDetails.innerHTML = exifHTML;
                    exifInfo.style.display = 'block';
                } else {
                    exifInfo.style.display = 'none';
                }
            });
        };
    };
    
    reader.readAsDataURL(file);
}

// Convert GPS coordinates from DMS to DD
function convertDMSToDD(dms, ref) {
    const degrees = dms[0];
    const minutes = dms[1];
    const seconds = dms[2];
    
    let dd = degrees + minutes / 60 + seconds / 3600;
    
    if (ref === 'S' || ref === 'W') {
        dd = dd * -1;
    }
    
    return dd;
}

// Close upload modal
function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Sadece tüm dosyalar işlendiğinde reset et
    if (currentFileIndex >= pendingFiles.length || pendingFiles.length === 0) {
        document.getElementById('uploadCaption').value = '';
        document.getElementById('uploadCategory').value = 'diğer';
        document.getElementById('uploadDate').value = '';
        document.getElementById('uploadInput').value = '';
        pendingPhotoFile = null;
        pendingPhotoData = null;
        pendingFiles = [];
        currentFileIndex = 0;
    }
}

// Confirm upload
async function confirmUpload() {
    if (!pendingPhotoData) {
        showNotification('❌ Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        return;
    }
    
    const fileName = pendingPhotoFile ? pendingPhotoFile.name : 'Dosya';
    
    try {
        const caption = document.getElementById('uploadCaption').value.trim();
        const category = document.getElementById('uploadCategory').value;
        let uploadDate = document.getElementById('uploadDate').value;
        
        // Tarih girilmemişse bugünün tarihi
        if (!uploadDate) {
            uploadDate = new Date().toISOString().split('T')[0];
        }
        
        // Tarihi timestamp'e çevir
        const dateObj = new Date(uploadDate);
        if (isNaN(dateObj.getTime())) {
            throw new Error('Geçersiz tarih formatı');
        }
        const uploadedAt = dateObj.getTime();
        
        // Kullanıcı bilgisi
        const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || 'Anonim';
        
        // Benzersiz ID oluştur (timestamp + random)
        const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
        
        // Firebase Storage'a yükle (isteğe bağlı, hata olursa IndexedDB kullan)
        let photoURL = pendingPhotoData; // Base64 kullan
        let useStorage = false; // Storage kullanma, Firestore kullan
        
        // Firebase Storage YERINE Firestore Database kullan
        const USE_FIREBASE_STORAGE = false; // Storage kapalı, Firestore'a Base64 kaydet
        
        if (USE_FIREBASE_STORAGE) {
            try {
                console.log('☁️ Fotoğraf Firebase Storage\'a yükleniyor...');
                
                // Storage referansı oluştur
                const storageRef = ref(storage, `photos/${currentUser}/${uniqueId}`);
                
                // Base64 string'i yükle (5 saniye timeout)
                const uploadPromise = uploadString(storageRef, pendingPhotoData, 'data_url');
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                );
                
                await Promise.race([uploadPromise, timeoutPromise]);
                
                // Download URL al
                photoURL = await getDownloadURL(storageRef);
                useStorage = true;
                console.log('✅ Fotoğraf Storage\'a yüklendi:', photoURL);
                
            } catch (storageError) {
                console.warn('⚠️ Storage yükleme hatası, IndexedDB kullanılacak:', storageError.message);
                photoURL = pendingPhotoData; // Base64'ü direkt kullan
                useStorage = false;
            }
        } else {
            console.log('📦 IndexedDB kullanılıyor (Firebase Storage devre dışı)');
        }
        
        // Fotoğraf objesini oluştur
        const photo = {
            src: photoURL, // Firebase Storage URL veya Base64
            caption: caption || 'İsimsiz Anı',
            category: category,
            uploadedAt: uploadedAt,
            uploadedBy: currentUser,
            id: uniqueId,
            storageRef: useStorage ? `photos/${currentUser}/${uniqueId}` : null // Silme için
        };
        
        // Çift yüklemeyi önle
        const existingPhoto = allPhotos.find(p => p.id === uniqueId);
        if (existingPhoto) {
            console.warn('⚠️ Bu fotoğraf zaten mevcut, tekrar eklenmedi');
            showNotification(`⚠️ "${fileName}" zaten galeriye eklenmiş`, 'warning');
            closeUploadModal();
            currentFileIndex++;
            if (currentFileIndex < pendingFiles.length) {
                setTimeout(() => processNextFile(), 500);
            } else {
                pendingFiles = [];
                currentFileIndex = 0;
            }
            return;
        }
        
        allPhotos.push(photo);
        console.log('📸 Fotoğraf array\'e eklendi. Toplam:', allPhotos.length);
        
        // IndexedDB'ye cache olarak kaydet
        try {
            const cachedPhoto = { ...photo, src: pendingPhotoData }; // Base64 ile cache
            await dbStorage.savePhoto(cachedPhoto);
            console.log('💾 IndexedDB cache\'e kaydedildi');
        } catch (dbError) {
            console.warn('⚠️ IndexedDB cache kayıt hatası:', dbError);
            // Cache hatası kritik değil, devam et
        }
        
        // Firebase Firestore'a Base64 ile kaydet
        try {
            console.log('🔄 Firestore\'a Base64 ile kayıt ediliyor...');
            
            // Base64 boyutunu kontrol et (Firestore limiti ~1MB)
            const photoSizeKB = Math.round(pendingPhotoData.length / 1024);
            console.log(`📏 Fotoğraf boyutu: ${photoSizeKB} KB`);
            
            if (photoSizeKB > 900) {
                console.warn('⚠️ Fotoğraf çok büyük (>900KB), Firestore limiti aşabilir');
                showNotification(`⚠️ Fotoğraf büyük (${photoSizeKB}KB). Sorun olursa daha küçük yükleyin.`, 'warning');
            }
            
            // Fotoğrafı Firestore collection'a ekle (Base64 dahil)
            await firebaseSync.saveData('photos', uniqueId, photo);
            
            console.log('✅ Firestore\'a kaydedildi (Base64 dahil)');
            
            // Bildirim gönder
            if (window.notificationSystem) {
                window.notificationSystem.notifyNewPhoto(currentUser);
            }
            
            showNotification(`✅ "${fileName}" başarıyla eklendi!`, 'success');
        } catch (firestoreError) {
            console.error('❌ Firestore kayıt hatası:', firestoreError);
            
            // Firestore limiti aşıldıysa özel mesaj
            if (firestoreError.message.includes('maximum size') || firestoreError.message.includes('too large')) {
                showNotification(`❌ Fotoğraf çok büyük! Daha küçük bir fotoğraf seçin (max 800KB)`, 'error');
            } else {
                showNotification(`⚠️ "${fileName}" yüklendi ama senkronize edilemedi.`, 'warning');
            }
        }
        
        // Galeriyi hemen güncelle
        displayPhotos(allPhotos);
        updateStats();
        
        // Modalı kapat
        closeUploadModal();
        
        // Bir sonraki dosyaya geç
        currentFileIndex++;
        
        if (currentFileIndex < pendingFiles.length) {
            // Bir sonraki dosyayı işle
            setTimeout(() => {
                processNextFile();
            }, 500);
        } else {
            // Tüm dosyalar işlendi
            const totalUploaded = pendingFiles.length;
            pendingFiles = [];
            currentFileIndex = 0;
            showNotification(`✨ ${totalUploaded} fotoğraf başarıyla eklendi!`);
        }
        
    } catch (error) {
        console.error('❌ Fotoğraf yükleme hatası:', error);
        showNotification(`❌ "${fileName}" yüklenemedi: ${error.message}`, 'error');
        
        // Bir sonraki dosyaya geç
        currentFileIndex++;
        if (currentFileIndex < pendingFiles.length) {
            setTimeout(() => processNextFile(), 500);
        } else {
            pendingFiles = [];
            currentFileIndex = 0;
        }
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    
    // Renk temasını belirle
    let backgroundColor;
    switch(type) {
        case 'error':
            backgroundColor = 'linear-gradient(135deg, #f5576c 0%, #e94057 100%)';
            break;
        case 'warning':
            backgroundColor = 'linear-gradient(135deg, #ffa751 0%, #ff9800 100%)';
            break;
        case 'success':
        default:
            backgroundColor = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: ${backgroundColor};
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);
        z-index: 99999;
        animation: slideInRight 0.5s ease-out;
        max-width: 400px;
        word-wrap: break-word;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 4000);
}

// Delete photo
async function deletePhoto(index) {
    if (!confirm('Bu anıyı silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    if (index < 0 || index >= allPhotos.length) {
        console.error('❌ Geçersiz fotoğraf index:', index);
        return;
    }
    
    const photoToDelete = allPhotos[index];
    
    if (!photoToDelete || !photoToDelete.id) {
        console.error('❌ Fotoğraf bulunamadı veya ID yok:', photoToDelete);
        return;
    }
    
    console.log('🗑️ Siliniyor:', photoToDelete.id);
    
    // Firebase Storage'dan sil
    if (photoToDelete.storageRef) {
        try {
            const storageRef = ref(storage, photoToDelete.storageRef);
            await deleteObject(storageRef);
            console.log('☁️ Firebase Storage\'dan silindi');
        } catch (error) {
            console.warn('⚠️ Storage silme hatası (devam ediliyor):', error);
        }
    }
    
    // Firestore'dan sil
    try {
        const deleted = await firebaseSync.deleteData('photos', photoToDelete.id);
        if (deleted) {
            console.log('✅ Firestore\'dan silindi');
        } else {
            console.warn('⚠️ Firestore silme işlemi başarısız');
        }
    } catch (error) {
        console.error('❌ Firestore silme hatası:', error);
    }
    
    // IndexedDB cache'den sil
    try {
        await dbStorage.deletePhoto(photoToDelete.id);
        console.log('💾 Cache\'den silindi');
    } catch (error) {
        console.warn('⚠️ Cache silme hatası (devam ediliyor):', error);
    }
    
    // Array'den sil
    allPhotos.splice(index, 1);
    
    // Galeriyi yeniden yükle
    await loadPhotos();
    showNotification('🗑️ Fotoğraf silindi');
}

// Global fonksiyonları window'a ekle
window.confirmUpload = confirmUpload;
window.closeUploadModal = closeUploadModal;
window.deletePhoto = deletePhoto;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.navigateLightbox = navigateLightbox;
