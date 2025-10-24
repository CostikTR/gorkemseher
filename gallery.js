// Modern Gallery System
let allPhotos = [];
let currentFilter = 'all';
let currentDateFilter = 'all';
let currentLightboxIndex = 0;
let pendingPhotoFile = null;
let pendingPhotoData = null;

// Initialize gallery on page load
document.addEventListener('DOMContentLoaded', function() {
    loadPhotos();
    setupFilterButtons();
    setupDateFilterButtons();
    setupUploadHandlers();
});

// Load photos from localStorage
function loadPhotos() {
    const savedPhotos = localStorage.getItem('lovesite_photos');
    allPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];
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

// Display photos in masonry grid
function displayPhotos(photos) {
    const grid = document.getElementById('photoGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (photos.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'block';
    emptyState.style.display = 'none';
    grid.innerHTML = '';
    
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
    const uploadEmojiBtn = document.getElementById('uploadEmojiBtn');
    
    // File input change
    uploadInput.addEventListener('change', handleFileSelect);
    
    // Emoji button click - EN ÖNCELİKLİ
    if (uploadEmojiBtn) {
        uploadEmojiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Emoji button clicked!');
            uploadInput.click();
        });
        
        uploadEmojiBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Emoji button touched!');
            uploadInput.click();
        }, { passive: false });
    }
    
    // Upload area click/touch - mobil uyumlu
    uploadArea.addEventListener('click', (e) => {
        if (e.target === uploadEmojiBtn) return;
        e.preventDefault();
        console.log('Upload area clicked!');
        uploadInput.click();
    });
    
    // Touch event support for mobile
    uploadArea.addEventListener('touchend', (e) => {
        if (e.target === uploadEmojiBtn) return;
        e.preventDefault();
        console.log('Upload area touched!');
        uploadInput.click();
    }, { passive: false });
    
    // Drag and drop
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

// Handle file selection
function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        handleFiles(files);
    }
}

// Handle files
function handleFiles(files) {
    const file = files[0]; // İlk dosyayı al
    
    if (!file.type.startsWith('image/')) {
        alert('Lütfen sadece resim dosyası seçin!');
        return;
    }
    
    pendingPhotoFile = file;
    
    // Dosyayı oku ve önizleme göster
    const reader = new FileReader();
    reader.onload = function(e) {
        pendingPhotoData = e.target.result;
        document.getElementById('previewImage').src = pendingPhotoData;
        
        // EXIF bilgilerini oku
        readExifData(file);
        
        // Modalı aç
        document.getElementById('uploadModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Bugünün tarihini default olarak ayarla
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('uploadDate').value = today;
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
    
    // Reset form
    document.getElementById('uploadCaption').value = '';
    document.getElementById('uploadCategory').value = 'diğer';
    document.getElementById('uploadDate').value = '';
    document.getElementById('uploadInput').value = '';
    pendingPhotoFile = null;
    pendingPhotoData = null;
}

// Confirm upload
async function confirmUpload() {
    if (!pendingPhotoData) {
        alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        return;
    }
    
    const caption = document.getElementById('uploadCaption').value.trim();
    const category = document.getElementById('uploadCategory').value;
    let uploadDate = document.getElementById('uploadDate').value;
    
    // Tarih girilmemişse bugünün tarihi
    if (!uploadDate) {
        uploadDate = new Date().toISOString().split('T')[0];
    }
    
    // Tarihi timestamp'e çevir
    const dateObj = new Date(uploadDate);
    const uploadedAt = dateObj.getTime();
    
    // Kullanıcı bilgisi
    const currentUser = localStorage.getItem('lovesite_currentUser') || 'Anonim';
    
    // Fotoğrafı kaydet
    const photo = {
        src: pendingPhotoData,
        caption: caption || 'İsimsiz Anı',
        category: category,
        uploadedAt: uploadedAt,
        uploadedBy: currentUser,
        id: Date.now()
    };
    
    allPhotos.push(photo);
    localStorage.setItem('lovesite_photos', JSON.stringify(allPhotos));
    
    // Firebase'e kaydet
    if (window.firebaseSync) {
        try {
            await window.firebaseSync.saveData('photos', 'list', allPhotos);
        } catch (error) {
            console.error('Firebase kayıt hatası:', error);
        }
    }
    
    // Modalı kapat
    closeUploadModal();
    
    // Galeriyi yenile
    loadPhotos();
    
    // Başarı mesajı
    showNotification('✨ Anı başarıyla eklendi!');
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);
        z-index: 99999;
        animation: slideInRight 0.5s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}
