// Bucket List Management System
import firebaseSync from './firebase-sync.js';

let bucketItems = [];
let currentCompletingItem = null;
let completionPhotoData = null;

// Helper: Compress image to reduce size for localStorage
function compressImage(base64Data, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Scale down if needed
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG with quality compression
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
        };
        img.src = base64Data;
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadBucketItems();
    setupPhotoHandler();
    updateStats();
});

// Load bucket items from Firebase (önce) ve localStorage (fallback)
async function loadBucketItems() {
    try {
        // Önce Firebase'den yükle
        const bucketData = await firebaseSync.getData('bucketlist', 'items');
        
        if (bucketData && bucketData.data) {
            bucketItems = bucketData.data;
        } else {
            // Firebase'de yoksa localStorage'dan al
            const saved = localStorage.getItem('lovesite_bucketlist');
            bucketItems = saved ? JSON.parse(saved) : getDefaultItems();
            
            // If no items exist, save default items
            if (!saved) {
                await saveBucketItems();
            }
        }
        
        displayItems();
        updateStats();
    } catch (error) {
        console.error('❌ Bucket list yükleme hatası:', error);
        // Hata durumunda localStorage'dan yükle
        const saved = localStorage.getItem('lovesite_bucketlist');
        bucketItems = saved ? JSON.parse(saved) : getDefaultItems();
        displayItems();
        updateStats();
    }
}

// Get default bucket items
function getDefaultItems() {
    return [
        { id: Date.now() + 1, emoji: '🌅', text: 'Birlikte gün doğumu izlemek', completed: false, completedAt: null, photo: null },
        { id: Date.now() + 2, emoji: '✈️', text: 'Hayallerimizin tatilini yapmak', completed: false, completedAt: null, photo: null },
        { id: Date.now() + 3, emoji: '🎬', text: 'Maratona film izlemek', completed: false, completedAt: null, photo: null },
        { id: Date.now() + 4, emoji: '🍳', text: 'Birlikte yemek pişirmek', completed: false, completedAt: null, photo: null },
        { id: Date.now() + 5, emoji: '🎨', text: 'Çiftler için etkinliğe gitmek', completed: false, completedAt: null, photo: null },
        { id: Date.now() + 6, emoji: '🌟', text: 'Yıldızları seyretmek', completed: false, completedAt: null, photo: null }
    ];
}

// Save bucket items to localStorage
async function saveBucketItems() {
    localStorage.setItem('lovesite_bucketlist', JSON.stringify(bucketItems));
    
    // Firebase'e kaydet
    try {
        await firebaseSync.saveData('bucketlist', 'items', { data: bucketItems });
        console.log('✅ Bucket list Firebase\'e kaydedildi');
    } catch (error) {
        console.error('❌ Firebase kayıt hatası:', error);
    }
    
    // Trigger custom event for other pages to update
    window.dispatchEvent(new Event('bucketListUpdated'));
    
    // Try to notify parent window if in iframe
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'bucketListUpdated' }, '*');
    }
}

// Display bucket items
function displayItems() {
    const pendingGrid = document.getElementById('pendingGrid');
    const completedGrid = document.getElementById('completedGrid');
    const emptyState = document.getElementById('emptyState');
    const emptyPending = document.getElementById('emptyPending');
    const emptyCompleted = document.getElementById('emptyCompleted');
    const pendingSection = document.querySelector('.pending-section');
    const completedSection = document.querySelector('.completed-section');
    
    // Safety checks
    if (!pendingGrid || !completedGrid) return;
    
    if (bucketItems.length === 0) {
        pendingGrid.style.display = 'none';
        completedGrid.style.display = 'none';
        if (pendingSection) pendingSection.style.display = 'none';
        if (completedSection) completedSection.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Separate items
    const pendingItems = bucketItems.filter(item => !item.completed);
    const completedItems = bucketItems.filter(item => item.completed);
    
    // Display pending items
    pendingGrid.innerHTML = '';
    if (pendingItems.length === 0) {
        pendingGrid.style.display = 'none';
        if (emptyPending) emptyPending.style.display = 'block';
    } else {
        pendingGrid.style.display = 'grid';
        if (emptyPending) emptyPending.style.display = 'none';
        pendingItems.forEach(item => {
            const card = createItemCard(item);
            pendingGrid.appendChild(card);
        });
    }
    if (pendingSection) pendingSection.style.display = 'block';
    
    // Display completed items
    completedGrid.innerHTML = '';
    if (completedItems.length === 0) {
        completedGrid.style.display = 'none';
        if (emptyCompleted) emptyCompleted.style.display = 'block';
    } else {
        completedGrid.style.display = 'grid';
        if (emptyCompleted) emptyCompleted.style.display = 'none';
        completedItems.forEach(item => {
            const card = createItemCard(item);
            completedGrid.appendChild(card);
        });
    }
    if (completedSection) completedSection.style.display = 'block';
    
    updateStats();
}

// Create item card
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = `bucket-card ${item.completed ? 'completed' : ''}`;
    
    const photoHTML = item.photo ? `
        <div class="completion-photo" onclick="viewPhoto('${item.photo.replace(/'/g, "\\'")}')">
            <img src="${item.photo}" alt="Tamamlandı">
            <div class="photo-overlay">
                <span class="photo-icon">🔍</span>
                <span class="photo-text">Fotoğrafı Büyüt</span>
            </div>
        </div>
    ` : '';
    
    const completionBadge = item.completed ? `
        <div class="completion-badge">✅ Tamamlandı</div>
    ` : '';
    
    const completionDate = item.completed && item.completedAt ? `
        <div class="completion-date">
            📅 ${new Date(item.completedAt).toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            })}
        </div>
    ` : '';
    
    const actionButton = item.completed ? `
        <button class="action-btn uncomplete-btn" onclick="uncompleteItem(${item.id})">
            <span>↩️</span> Geri Al
        </button>
    ` : `
        <button class="action-btn complete-btn" onclick="completeItem(${item.id})">
            <span>✅</span> Tamamlandı
        </button>
    `;
    
    card.innerHTML = `
        ${completionBadge}
        <div class="card-header">
            <div class="card-emoji">${item.emoji}</div>
            <div class="card-text">${item.text}</div>
        </div>
        ${completionDate}
        ${photoHTML}
        <div class="card-actions">
            ${actionButton}
            <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">
                <span>🗑️</span>
            </button>
        </div>
    `;
    
    return card;
}

// Add new item
async function addNewItem() {
    const emoji = document.getElementById('newItemEmoji').value.trim();
    const text = document.getElementById('newItemText').value.trim();
    
    if (!text) {
        alert('Lütfen bir açıklama girin!');
        return;
    }
    
    const newItem = {
        id: Date.now(),
        emoji: emoji || '🎯',
        text: text,
        completed: false,
        completedAt: null,
        photo: null
    };
    
    bucketItems.push(newItem);
    await saveBucketItems();
    displayItems();
    updateStats();
    
    // Clear inputs
    document.getElementById('newItemEmoji').value = '';
    document.getElementById('newItemText').value = '';
    
    showNotification('✨ Yeni hedef eklendi!');
}

// Complete item
function completeItem(id) {
    currentCompletingItem = bucketItems.find(item => item.id === id);
    if (!currentCompletingItem) return;
    
    // Show photo upload modal
    document.getElementById('photoModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Uncomplete item
async function uncompleteItem(id) {
    const item = bucketItems.find(item => item.id === id);
    if (!item) return;
    
    item.completed = false;
    item.completedAt = null;
    item.photo = null;
    
    await saveBucketItems();
    displayItems();
    updateStats();
    
    showNotification('↩️ Hedef geri alındı');
}

// Delete item
async function deleteItem(id) {
    if (!confirm('Bu hedefi silmek istediğinizden emin misiniz?')) return;
    
    bucketItems = bucketItems.filter(item => item.id !== id);
    await saveBucketItems();
    displayItems();
    updateStats();
    
    showNotification('🗑️ Hedef silindi');
}

// Setup photo handler
function setupPhotoHandler() {
    const photoInput = document.getElementById('completionPhoto');
    photoInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Lütfen sadece resim dosyası seçin!');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async function(event) {
            // Compress image before storing
            const rawData = event.target.result;
            completionPhotoData = await compressImage(rawData, 1200, 0.7);
            document.getElementById('photoPreview').src = completionPhotoData;
            document.getElementById('photoPreviewContainer').style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
}

// Skip photo upload
async function skipPhoto() {
    if (!currentCompletingItem) return;
    
    currentCompletingItem.completed = true;
    currentCompletingItem.completedAt = Date.now();
    currentCompletingItem.photo = null;
    
    await saveBucketItems();
    closePhotoModal();
    displayItems();
    updateStats();
    
    showNotification('✅ Hedef tamamlandı!');
}

// Confirm photo upload
async function confirmPhotoUpload() {
    if (!currentCompletingItem || !completionPhotoData) {
        alert('Lütfen bir fotoğraf seçin!');
        return;
    }
    
    // Find the actual item in the array and update it
    const itemIndex = bucketItems.findIndex(item => item.id === currentCompletingItem.id);
    if (itemIndex !== -1) {
        bucketItems[itemIndex].completed = true;
        bucketItems[itemIndex].completedAt = Date.now();
        bucketItems[itemIndex].photo = completionPhotoData;
    }
    
    await saveBucketItems();
    
    // Try to add to gallery with error handling
    const galleryAdded = await addToGallery(bucketItems[itemIndex]);
    
    closePhotoModal();
    displayItems();
    updateStats();
    
    if (galleryAdded) {
        showNotification('🎉 Tebrikler! Anı galerinize eklendi!');
    } else {
        showNotification('✅ Hedef tamamlandı! (Galeri kapasitesi dolu)');
    }
}

// Add completed item photo to gallery with quota handling
async function addToGallery(item) {
    try {
        const photos = JSON.parse(localStorage.getItem('lovesite_photos') || '[]');
        const currentUser = localStorage.getItem('lovesite_currentUser') || 'Anonim';
        
        // Compress image further if needed
        let compressedPhoto = item.photo;
        
        const photo = {
            src: compressedPhoto,
            caption: `${item.emoji} ${item.text}`,
            category: 'özel',
            uploadedAt: item.completedAt,
            uploadedBy: currentUser,
            id: Date.now(),
            bucketListItem: true
        };
        
        photos.push(photo);
        
        try {
            localStorage.setItem('lovesite_photos', JSON.stringify(photos));
            return true; // Success
        } catch (quotaError) {
            if (quotaError.name === 'QuotaExceededError') {
                // Try with more aggressive compression
                console.warn('Storage quota exceeded, trying higher compression...');
                compressedPhoto = await compressImage(item.photo, 800, 0.5);
                photo.src = compressedPhoto;
                
                try {
                    localStorage.setItem('lovesite_photos', JSON.stringify(photos));
                    return true; // Success with higher compression
                } catch (secondError) {
                    // Still failed - remove last photo and notify user
                    console.error('Failed to save photo even with compression:', secondError);
                    alert('⚠️ Galeri kapasitesi dolu! Lütfen eski fotoğraflardan bazılarını silin.\n\nHedef yine de tamamlandı olarak işaretlendi.');
                    return false; // Failed to add to gallery
                }
            }
            throw quotaError; // Re-throw if not quota error
        }
    } catch (error) {
        console.error('Error adding photo to gallery:', error);
        alert('Fotoğraf galeriye eklenirken bir hata oluştu. Hedef yine de tamamlandı.');
        return false;
    }
}

// Close photo modal
function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Reset
    document.getElementById('completionPhoto').value = '';
    document.getElementById('photoPreviewContainer').style.display = 'none';
    currentCompletingItem = null;
    completionPhotoData = null;
}

// View photo in lightbox
function viewPhoto(src) {
    const lightbox = document.createElement('div');
    lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(10px);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.3s ease-out;
    `;
    
    lightbox.innerHTML = `
        <div style="position: relative; max-width: 90%; max-height: 90%;">
            <img src="${src}" style="max-width: 100%; max-height: 85vh; border-radius: 15px; box-shadow: 0 20px 80px rgba(0,0,0,0.8);">
            <button style="
                position: absolute;
                top: -15px;
                right: -15px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                font-size: 1.5em;
                cursor: pointer;
                box-shadow: 0 5px 20px rgba(245, 87, 108, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s ease;
            " onmouseover="this.style.transform='scale(1.1) rotate(90deg)'" onmouseout="this.style.transform='scale(1)'">
                ✕
            </button>
        </div>
        <p style="color: white; margin-top: 20px; font-size: 0.9em; opacity: 0.7;">Kapatmak için herhangi bir yere tıklayın</p>
    `;
    
    lightbox.onclick = function(e) {
        if (e.target === lightbox || e.target.tagName === 'BUTTON' || e.target.tagName === 'P') {
            lightbox.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => lightbox.remove(), 300);
        }
    };
    
    document.body.appendChild(lightbox);
}

// Update statistics
function updateStats() {
    const total = bucketItems.length;
    const completed = bucketItems.filter(item => item.completed).length;
    const pending = total - completed;
    
    const totalEl = document.getElementById('totalItems');
    const completedEl = document.getElementById('completedItems');
    const pendingEl = document.getElementById('pendingItems');
    const pendingCountEl = document.getElementById('pendingCount');
    const completedCountEl = document.getElementById('completedCount');
    
    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (pendingEl) pendingEl.textContent = pending;
    if (pendingCountEl) pendingCountEl.textContent = pending;
    if (completedCountEl) completedCountEl.textContent = completed;
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

// Refresh on window focus
window.addEventListener('focus', function() {
    loadBucketItems();
});
