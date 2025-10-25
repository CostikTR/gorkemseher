// Timeline - Relationship Story
import { FirebaseSync } from './firebase-sync.js';

const firebaseSync = new FirebaseSync();
let memories = [];

// Default memories
const defaultMemories = [
    {
        id: Date.now() + 1,
        date: '2023-12-15',
        title: 'İlk Tanışma',
        description: 'Hayatımın en güzel gününde tanıştık. Gözlerine baktığım an herşeyin değişeceğini biliyordum.',
        icon: '💕'
    },
    {
        id: Date.now() + 2,
        date: '2024-01-01',
        title: 'İlk Yeni Yıl',
        description: 'Birlikte kutladığımız ilk yeni yıl. Senle her anın özel olduğunu anladım.',
        icon: '🎆'
    },
    {
        id: Date.now() + 3,
        date: '2024-01-14',
        title: 'İlk Öpücük',
        description: 'Zamanın durduğu o muhteşem an... Kalplerimiz bir oldu.',
        icon: '💋'
    },
    {
        id: Date.now() + 4,
        date: '2024-02-14',
        title: 'Sevgililer Günü',
        description: 'İlk sevgililer günümüz. Her gün senle sevgililer günü gibi!',
        icon: '💝'
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await loadMemories();
    renderTimeline();
});

// Load memories from Firebase
async function loadMemories() {
    try {
        const data = await firebaseSync.getData('timeline', 'memories');
        if (data && data.list && data.list.length > 0) {
            memories = data.list;
        } else {
            // Use default memories
            memories = defaultMemories;
            await saveMemories();
        }
    } catch (error) {
        console.error('❌ Timeline yükleme hatası:', error);
        memories = defaultMemories;
    }
}

// Save memories to Firebase
async function saveMemories() {
    try {
        await firebaseSync.saveData('timeline', 'memories', {
            list: memories,
            updatedAt: Date.now()
        });
    } catch (error) {
        console.error('❌ Timeline kaydetme hatası:', error);
    }
}

// Render timeline
function renderTimeline() {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    // Sort by date (oldest first)
    const sorted = [...memories].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );

    sorted.forEach((memory, index) => {
        const item = createTimelineItem(memory, index);
        timeline.appendChild(item);
    });
}

// Create timeline item
function createTimelineItem(memory, index) {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.style.animationDelay = `${index * 0.1}s`;

    const formattedDate = formatDate(memory.date);

    item.innerHTML = `
        <div class="timeline-icon">${memory.icon || '💕'}</div>
        <div class="timeline-content">
            <span class="timeline-date">${formattedDate}</span>
            <h3 class="timeline-title">${memory.title}</h3>
            <p class="timeline-description">${memory.description}</p>
            ${memory.image ? `<img src="${memory.image}" class="timeline-image" alt="${memory.title}">` : ''}
        </div>
    `;

    return item;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('tr-TR', options);
}

// Open add modal
window.openAddModal = function() {
    const modal = document.getElementById('addModal');
    modal.classList.add('active');
    
    // Set today as default date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('memoryDate').value = today;
}

// Close add modal
window.closeAddModal = function() {
    const modal = document.getElementById('addModal');
    modal.classList.remove('active');
    
    // Clear form
    document.getElementById('memoryDate').value = '';
    document.getElementById('memoryTitle').value = '';
    document.getElementById('memoryDescription').value = '';
    document.getElementById('memoryIcon').value = '';
}

// Add new memory
window.addMemory = async function() {
    const date = document.getElementById('memoryDate').value;
    const title = document.getElementById('memoryTitle').value.trim();
    const description = document.getElementById('memoryDescription').value.trim();
    const icon = document.getElementById('memoryIcon').value.trim() || '💕';

    if (!date || !title) {
        alert('Lütfen tarih ve başlık alanlarını doldurun!');
        return;
    }

    const newMemory = {
        id: Date.now(),
        date: date,
        title: title,
        description: description,
        icon: icon
    };

    memories.push(newMemory);
    await saveMemories();
    renderTimeline();
    closeAddModal();

    showNotification('✅ Yeni anı eklendi!');
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

// Logout function
window.logout = function() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}
