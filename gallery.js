// Modern Gallery System
import { FirebaseSync } from './firebase-sync.js';
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
    
    // Mevcut verileri Firebase'e aktar (metadata)
    await migrateLocalStorageToFirebase();
    
    await loadPhotos();
    setupFilterButtons();
    setupDateFilterButtons();
    setupUploadHandlers();
});

// localStorage'dan Firebase'e veri taşıma (sadece metadata)
async function migrateLocalStorageToFirebase() {
    try {
        const migrated = await dbStorage.getSetting('metadata_migrated_to_firebase');
        if (migrated) {
            console.log('📋 Metadata zaten Firebase\'e taşınmış');
            return;
        }
        
        // IndexedDB'deki fotoğrafları kontrol et
        const photos = await dbStorage.getAllPhotos();
        if (photos && photos.length > 0) {
            console.log(`🔄 ${photos.length} fotoğraf metadata'sı Firebase'e aktarılıyor...`);
            
            // Sadece metadata'yı kaydet (Base64 olmadan)
            const photoMetadata = photos.map(p => ({
                id: p.id,
                caption: p.caption,
                category: p.category,
                uploadedAt: p.uploadedAt,
                uploadedBy: p.uploadedBy,
            }));
            
            await firebaseSync.saveData('photos', 'metadata', { 
                data: photoMetadata,
                count: photos.length,
                lastUpdate: Date.now()
            });
            await dbStorage.saveSetting('metadata_migrated_to_firebase', true);
            console.log('✅ Fotoğraf metadata\'sı Firebase\'e aktarıldı!');
        }
    } catch (error) {
        console.error('⚠️ Migration hatası:', error);
    }
}

// Load photos from IndexedDB (ana kaynak) ve Firebase metadata (sync kontrolü)
async function loadPhotos() {
    try {
        // IndexedDB'den yükle (Base64 fotoğraflar burada)
        allPhotos = await dbStorage.getAllPhotos();
        
        console.log(`📦 ${allPhotos.length} fotoğraf IndexedDB'den yüklendi`);
        
        // Firebase'den metadata'yı kontrol et (sadece bilgi amaçlı)
        try {
            const firebaseData = await firebaseSync.getData('photos', 'metadata');
            if (firebaseData && firebaseData.count !== undefined) {
                console.log(`🔍 Firebase metadata: ${firebaseData.count} fotoğraf`);
                if (firebaseData.count !== allPhotos.length) {
                    console.warn('⚠️ IndexedDB ve Firebase sayıları uyuşmuyor');
                }
            }
        } catch (error) {
            console.log('ℹ️ Firebase metadata yüklenemedi (normal):', error.message);
        }
    } catch (error) {
        console.error('Fotoğraf yükleme hatası:', error);
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
             onerror="this.src='https://via.placeholder.com/400x600/667eea/ffffff?text=📸+Yüklenemedi'">
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

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            navigateLightbox(-1);
        } else if (e.key === 'ArrowRight') {
            navigateLightbox(1);
        }
    }
});

// Close lightbox on overlay click
document.getElementById('lightbox').addEventListener('click', function(e) {
    if (e.target === this) {
        closeLightbox();
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
            
            document.getElementById('previewImage').src = pendingPhotoData;
            
            // EXIF bilgilerini oku
            readExifData(file);
            
            // Modalı aç
            const modal = document.getElementById('uploadModal');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
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
        
        // Fotoğrafı kaydet
        const photo = {
            src: pendingPhotoData,
            caption: caption || 'İsimsiz Anı',
            category: category,
            uploadedAt: uploadedAt,
            uploadedBy: currentUser,
            id: uniqueId
        };
        
        // Çift yüklemeyi önle - aynı src varsa ekleme
        const existingPhoto = allPhotos.find(p => p.src === pendingPhotoData);
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
        
        // IndexedDB'ye kaydet
        try {
            await dbStorage.savePhoto(photo);
            console.log('💾 IndexedDB\'ye kaydedildi');
        } catch (dbError) {
            console.error('❌ IndexedDB kayıt hatası:', dbError);
            throw new Error('Fotoğraf kaydedilemedi. Tarayıcı depolama alanı dolu olabilir.');
        }
        
        // Firebase'e kaydet - SADECE METADATA (Base64 olmadan)
        try {
            console.log('🔄 Firebase\'e metadata kaydediliyor...');
            
            // Metadata oluştur (Base64 olmadan, sadece bilgiler)
            const photoMetadata = allPhotos.map(p => ({
                id: p.id,
                caption: p.caption,
                category: p.category,
                uploadedAt: p.uploadedAt,
                uploadedBy: p.uploadedBy,
                // src yok, çünkü çok büyük
            }));
            
            await firebaseSync.saveData('photos', 'metadata', { 
                data: photoMetadata,
                count: allPhotos.length,
                lastUpdate: Date.now()
            });
            console.log('✅ Metadata Firebase\'e kaydedildi');
            console.log('📊 Toplam fotoğraf sayısı:', allPhotos.length);
            
            // Bildirim gönder (diğer kullanıcıya)
            if (window.notificationSystem) {
                window.notificationSystem.notifyNewPhoto(currentUser);
            }
            
            showNotification(`✅ "${fileName}" başarıyla eklendi!`, 'success');
        } catch (firebaseError) {
            console.error('❌ Firebase kayıt hatası:', firebaseError);
            showNotification(`⚠️ "${fileName}" sadece bu cihaza kaydedildi. İnternet bağlantınızı kontrol edin.`, 'warning');
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
    
    const photoToDelete = allPhotos[index];
    allPhotos.splice(index, 1);
    
    // IndexedDB'den sil
    try {
        await dbStorage.deletePhoto(photoToDelete.id);
        console.log('💾 IndexedDB\'den silindi');
    } catch (error) {
        console.error('❌ IndexedDB silme hatası:', error);
    }
    
    // Firebase metadata'yı güncelle
    try {
        const photoMetadata = allPhotos.map(p => ({
            id: p.id,
            caption: p.caption,
            category: p.category,
            uploadedAt: p.uploadedAt,
            uploadedBy: p.uploadedBy,
        }));
        
        await firebaseSync.saveData('photos', 'metadata', { 
            data: photoMetadata,
            count: allPhotos.length,
            lastUpdate: Date.now()
        });
        console.log('✅ Firebase metadata güncellendi');
    } catch (error) {
        console.error('❌ Firebase silme hatası:', error);
    }
    
    await loadPhotos();
    showNotification('🗑️ Fotoğraf silindi');
}

// Global fonksiyonları window'a ekle
window.confirmUpload = confirmUpload;
window.closeUploadModal = closeUploadModal;
window.switchFilter = switchFilter;
window.deletePhoto = deletePhoto;
