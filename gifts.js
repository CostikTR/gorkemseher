// Gifts System
import firebaseSync from './firebase-sync.js';

class GiftsSystem {
    constructor() {
        this.gifts = [];
        this.currentFilter = 'all';
        this.loadGifts();
    }

    async loadGifts() {
        // Firebase'den yükle
        try {
            const firebaseData = await firebaseSync.getData('gifts', 'list');
            if (firebaseData && firebaseData.items) {
                this.gifts = firebaseData.items;
                localStorage.setItem('gifts', JSON.stringify(this.gifts));
                this.displayGifts();
                this.updateStats();
                return;
            }
        } catch (err) {
            console.log('Firebase gifts yükleme hatası:', err);
        }

        // Fallback: localStorage
        const saved = localStorage.getItem('gifts');
        if (saved) {
            this.gifts = JSON.parse(saved);
        }
        this.displayGifts();
        this.updateStats();
    }

    async saveGifts() {
        localStorage.setItem('gifts', JSON.stringify(this.gifts));
        
        // Firebase'e kaydet
        try {
            await firebaseSync.saveData('gifts', 'list', { items: this.gifts });
        } catch (err) {
            console.error('Gifts Firebase kayıt hatası:', err);
        }
    }

    addGift(giftData) {
        const gift = {
            id: Date.now(),
            name: giftData.name.trim(),
            for: giftData.for.trim(),
            price: parseFloat(giftData.price) || 0,
            priority: giftData.priority,
            note: giftData.note.trim(),
            bought: false,
            addedDate: new Date().toISOString()
        };
        
        this.gifts.unshift(gift);
        this.saveGifts();
        this.displayGifts();
        this.updateStats();
    }

    deleteGift(id) {
        if (confirm('Bu hediyeyi silmek istediğinize emin misiniz?')) {
            this.gifts = this.gifts.filter(g => g.id !== id);
            this.saveGifts();
            this.displayGifts();
            this.updateStats();
        }
    }

    toggleBought(id) {
        const gift = this.gifts.find(g => g.id === id);
        if (gift) {
            gift.bought = !gift.bought;
            if (gift.bought) {
                gift.boughtDate = new Date().toISOString();
            } else {
                delete gift.boughtDate;
            }
            this.saveGifts();
            this.displayGifts();
            this.updateStats();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        this.displayGifts();
    }

    getFilteredGifts() {
        switch (this.currentFilter) {
            case 'pending':
                return this.gifts.filter(g => !g.bought);
            case 'bought':
                return this.gifts.filter(g => g.bought);
            default:
                return this.gifts;
        }
    }

    displayGifts() {
        const grid = document.getElementById('gifts-grid');
        if (!grid) return;

        const filtered = this.getFilteredGifts();

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; opacity: 0.7;">
                    <div style="font-size: 4em; margin-bottom: 20px;">🎁</div>
                    <div style="font-size: 1.2em;">
                        ${this.currentFilter === 'all' 
                            ? 'Henüz hediye eklenmemiş!' 
                            : 'Bu filtrele eşleşen hediye bulunamadı.'}
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        filtered.forEach(gift => {
            const card = this.createGiftCard(gift);
            grid.appendChild(card);
        });
    }

    createGiftCard(gift) {
        const card = document.createElement('div');
        card.className = `gift-card ${gift.bought ? 'bought' : ''}`;
        
        const priorityLabels = {
            high: '⭐⭐⭐ Yüksek',
            medium: '⭐⭐ Orta',
            low: '⭐ Düşük'
        };

        const date = new Date(gift.addedDate).toLocaleDateString('tr-TR');
        const boughtDate = gift.boughtDate ? new Date(gift.boughtDate).toLocaleDateString('tr-TR') : '';
        
        card.innerHTML = `
            <div class="priority-badge priority-${gift.priority}">
                ${priorityLabels[gift.priority]}
            </div>
            
            <div class="gift-header">
                <div class="gift-icon">🎁</div>
                <div class="gift-info">
                    <div class="gift-name">${this.escapeHtml(gift.name)}</div>
                    <div class="gift-for">👤 ${this.escapeHtml(gift.for)}</div>
                </div>
            </div>
            
            <div class="gift-details">
                ${gift.price > 0 ? `<div class="gift-price">💰 ${gift.price.toFixed(2)}₺</div>` : ''}
                ${gift.note ? `<div class="gift-note">📝 ${this.escapeHtml(gift.note)}</div>` : ''}
                <div class="gift-date">
                    📅 Eklendi: ${date}
                    ${gift.bought ? `<br>✓ Alındı: ${boughtDate}` : ''}
                </div>
            </div>
            
            <div class="gift-actions">
                ${gift.bought ? `
                    <button class="gift-btn mark-pending-btn" onclick="giftsSystem.toggleBought(${gift.id})">
                        ⏳ Bekliyor İşaretle
                    </button>
                ` : `
                    <button class="gift-btn mark-bought-btn" onclick="giftsSystem.toggleBought(${gift.id})">
                        ✓ Alındı İşaretle
                    </button>
                `}
                <button class="gift-btn delete-gift-btn" onclick="giftsSystem.deleteGift(${gift.id})">
                    🗑️ Sil
                </button>
            </div>
        `;

        return card;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        const totalGifts = document.getElementById('total-gifts');
        const boughtGifts = document.getElementById('bought-gifts');
        const totalPrice = document.getElementById('total-price');

        const bought = this.gifts.filter(g => g.bought).length;
        const price = this.gifts.reduce((sum, g) => sum + g.price, 0);

        if (totalGifts) totalGifts.textContent = this.gifts.length;
        if (boughtGifts) boughtGifts.textContent = bought;
        if (totalPrice) totalPrice.textContent = price.toFixed(2) + '₺';
    }
}

let giftsSystem;

document.addEventListener('DOMContentLoaded', () => {
    giftsSystem = new GiftsSystem();

    const form = document.getElementById('add-gift-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const giftData = {
                name: document.getElementById('gift-name').value,
                for: document.getElementById('gift-for').value,
                price: document.getElementById('gift-price').value,
                priority: document.getElementById('gift-priority').value,
                note: document.getElementById('gift-note').value
            };

            giftsSystem.addGift(giftData);
            form.reset();
            
            const btn = form.querySelector('.add-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓ Eklendi!';
            btn.style.background = 'rgba(74, 222, 128, 0.5)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        };
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => giftsSystem.setFilter(btn.dataset.filter);
    });
});
