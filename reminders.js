// Reminders System
class RemindersSystem {
    constructor() {
        this.reminders = [];
        this.currentFilter = 'all';
        this.loadReminders();
        this.startCountdown();
    }

    loadReminders() {
        const saved = localStorage.getItem('reminders');
        if (saved) {
            this.reminders = JSON.parse(saved);
        }
        this.displayUpcoming();
        this.displayReminders();
    }

    saveReminders() {
        localStorage.setItem('reminders', JSON.stringify(this.reminders));
    }

    addReminder(data) {
        const reminder = {
            id: Date.now(),
            title: data.title.trim(),
            date: data.date,
            type: data.type,
            note: data.note.trim(),
            recurring: data.recurring,
            createdDate: new Date().toISOString()
        };
        
        this.reminders.push(reminder);
        this.saveReminders();
        this.displayUpcoming();
        this.displayReminders();
    }

    deleteReminder(id) {
        if (confirm('Bu hatırlatmayı silmek istediğinize emin misiniz?')) {
            this.reminders = this.reminders.filter(r => r.id !== id);
            this.saveReminders();
            this.displayUpcoming();
            this.displayReminders();
        }
    }

    getDaysUntil(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        
        // If recurring and date has passed, calculate next occurrence
        const reminder = this.reminders.find(r => r.date === dateString);
        if (reminder && reminder.recurring && targetDate < today) {
            const currentYear = today.getFullYear();
            targetDate.setFullYear(currentYear);
            
            // If still in the past, use next year
            if (targetDate < today) {
                targetDate.setFullYear(currentYear + 1);
            }
        }
        
        const diff = targetDate - today;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        return days;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    getTypeIcon(type) {
        const icons = {
            anniversary: '💕',
            birthday: '🎂',
            special: '⭐',
            vacation: '✈️',
            other: '📌'
        };
        return icons[type] || '📅';
    }

    getTypeLabel(type) {
        const labels = {
            anniversary: 'Yıldönümü',
            birthday: 'Doğum Günü',
            special: 'Özel Gün',
            vacation: 'Tatil/Gezi',
            other: 'Diğer'
        };
        return labels[type] || 'Hatırlatma';
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        this.displayReminders();
    }

    getFilteredReminders() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.reminders.filter(r => {
            const days = this.getDaysUntil(r.date);
            
            switch (this.currentFilter) {
                case 'upcoming':
                    return days >= 0 && days <= 90;
                case 'past':
                    return days < 0 && !r.recurring;
                default:
                    return true;
            }
        }).sort((a, b) => this.getDaysUntil(a.date) - this.getDaysUntil(b.date));
    }

    displayUpcoming() {
        const grid = document.getElementById('upcoming-grid');
        if (!grid) return;

        const upcoming = this.reminders
            .filter(r => {
                const days = this.getDaysUntil(r.date);
                return days >= 0 && days <= 30;
            })
            .sort((a, b) => this.getDaysUntil(a.date) - this.getDaysUntil(b.date))
            .slice(0, 4);

        if (upcoming.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-icon">📅</div>
                    <div class="empty-text">Önümüzdeki 30 günde özel gün yok</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        upcoming.forEach(reminder => {
            const days = this.getDaysUntil(reminder.date);
            const isUrgent = days <= 7;
            
            const card = document.createElement('div');
            card.className = `upcoming-card ${isUrgent ? 'urgent' : ''}`;
            
            let countdownText = '';
            if (days === 0) {
                countdownText = 'BUGÜN!';
            } else if (days === 1) {
                countdownText = '1 Gün';
            } else {
                countdownText = `${days} Gün`;
            }
            
            card.innerHTML = `
                <div style="font-size: 3em; margin-bottom: 10px;">${this.getTypeIcon(reminder.type)}</div>
                <div class="countdown">${countdownText}</div>
                <div class="countdown-label">kaldı</div>
                <div class="upcoming-title">${this.escapeHtml(reminder.title)}</div>
                <div class="upcoming-date">📅 ${this.formatDate(reminder.date)}</div>
                ${reminder.recurring ? '<div style="margin-top: 10px; opacity: 0.7; font-size: 0.9em;">🔄 Yıllık</div>' : ''}
            `;
            
            grid.appendChild(card);
        });
    }

    displayReminders() {
        const list = document.getElementById('reminders-list');
        if (!list) return;

        const filtered = this.getFilteredReminders();

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <div class="empty-text">
                        ${this.currentFilter === 'all' 
                            ? 'Henüz hatırlatma eklenmemiş!' 
                            : 'Bu filtrele eşleşen hatırlatma bulunamadı.'}
                    </div>
                </div>
            `;
            return;
        }

        list.innerHTML = '';
        filtered.forEach(reminder => {
            const card = this.createReminderCard(reminder);
            list.appendChild(card);
        });
    }

    createReminderCard(reminder) {
        const card = document.createElement('div');
        const days = this.getDaysUntil(reminder.date);
        const isPast = days < 0 && !reminder.recurring;
        
        card.className = `reminder-card ${isPast ? 'past' : ''}`;
        
        let daysText = '';
        if (days === 0) {
            daysText = '🔔 BUGÜN!';
        } else if (days > 0) {
            daysText = `⏰ ${days} gün sonra`;
        } else {
            daysText = `📚 ${Math.abs(days)} gün önce`;
        }
        
        card.innerHTML = `
            <div class="reminder-type-icon">${this.getTypeIcon(reminder.type)}</div>
            
            <div class="reminder-content">
                <div class="reminder-title">${this.escapeHtml(reminder.title)}</div>
                <div class="reminder-date">
                    📅 ${this.formatDate(reminder.date)} • ${daysText}
                </div>
                ${reminder.note ? `<div class="reminder-note">📝 ${this.escapeHtml(reminder.note)}</div>` : ''}
                <div class="reminder-meta">
                    <span>🏷️ ${this.getTypeLabel(reminder.type)}</span>
                    ${reminder.recurring ? '<span>🔄 Yıllık</span>' : ''}
                </div>
            </div>
            
            <div class="reminder-actions">
                <button class="reminder-btn delete-reminder-btn" onclick="remindersSystem.deleteReminder(${reminder.id})">
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

    startCountdown() {
        // Update countdowns every hour
        setInterval(() => {
            this.displayUpcoming();
            this.displayReminders();
        }, 3600000);
    }
}

let remindersSystem;

document.addEventListener('DOMContentLoaded', () => {
    remindersSystem = new RemindersSystem();

    const form = document.getElementById('add-reminder-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const data = {
                title: document.getElementById('reminder-title').value,
                date: document.getElementById('reminder-date').value,
                type: document.getElementById('reminder-type').value,
                note: document.getElementById('reminder-note').value,
                recurring: document.getElementById('reminder-recurring').checked
            };

            remindersSystem.addReminder(data);
            form.reset();
            
            const btn = form.querySelector('.add-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓ Eklendi!';
            btn.style.background = 'rgba(74, 222, 128, 0.5)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
            
            // Scroll to upcoming
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => remindersSystem.setFilter(btn.dataset.filter);
    });
});
