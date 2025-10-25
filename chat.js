// Chat System
import firebaseSync from './firebase-sync.js';

class ChatSystem {
    constructor() {
        this.messages = [];
        this.currentFilter = 'all';
        this.currentEditId = null;
        this.loadMessages();
    }

    async loadMessages() {
        try {
            // Önce Firebase'den yükle
            const chatData = await firebaseSync.getData('chat', 'messages');
            
            if (chatData && chatData.data) {
                this.messages = chatData.data;
            } else {
                // Firebase'de yoksa localStorage'dan al
                const saved = localStorage.getItem('chatMessages');
                if (saved) {
                    this.messages = JSON.parse(saved);
                }
            }
        } catch (error) {
            console.error('❌ Chat yükleme hatası:', error);
            // Hata durumunda localStorage'dan yükle
            const saved = localStorage.getItem('chatMessages');
            if (saved) {
                this.messages = JSON.parse(saved);
            }
        }
        
        this.displayMessages();
        this.updateStats();
    }

    async saveMessages() {
        localStorage.setItem('chatMessages', JSON.stringify(this.messages));
        
        // Firebase'e kaydet
        try {
            await firebaseSync.saveData('chat', 'messages', { data: this.messages });
            console.log('✅ Chat Firebase\'e kaydedildi');
        } catch (error) {
            console.error('❌ Firebase kayıt hatası:', error);
        }
    }

    addMessage(text, sender = null) {
        // Eğer sender belirtilmemişse, mevcut kullanıcıyı kullan
        if (!sender) {
            sender = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || 'me';
        }
        
        const message = {
            id: Date.now(),
            text: text.trim(),
            sender: sender,
            timestamp: new Date().toISOString(),
            loved: false
        };
        
        this.messages.push(message);
        this.saveMessages();
        this.displayMessages();
        this.updateStats();
        
        // Scroll to bottom
        const container = document.getElementById('messages-container');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }

    deleteMessage(id) {
        if (confirm('Bu mesajı silmek istediğinize emin misiniz?')) {
            this.messages = this.messages.filter(m => m.id !== id);
            this.saveMessages();
            this.displayMessages();
            this.updateStats();
        }
    }

    editMessage(id) {
        const message = this.messages.find(m => m.id === id);
        if (!message) return;

        this.currentEditId = id;
        const editInput = document.getElementById('edit-message-input');
        const editModal = document.getElementById('edit-modal');
        
        if (editInput) editInput.value = message.text;
        if (editModal) editModal.classList.add('active');
    }

    saveEdit() {
        const editInput = document.getElementById('edit-message-input');
        if (!editInput || !this.currentEditId) return;

        const newText = editInput.value.trim();
        if (!newText) {
            alert('Mesaj boş olamaz!');
            return;
        }

        const message = this.messages.find(m => m.id === this.currentEditId);
        if (message) {
            message.text = newText;
            message.edited = true;
            this.saveMessages();
            this.displayMessages();
        }

        this.closeEditModal();
    }

    closeEditModal() {
        const editModal = document.getElementById('edit-modal');
        if (editModal) editModal.classList.remove('active');
        this.currentEditId = null;
    }

    toggleLove(id) {
        const message = this.messages.find(m => m.id === id);
        if (message) {
            message.loved = !message.loved;
            this.saveMessages();
            this.displayMessages();
            this.updateStats();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.displayMessages();
    }

    getFilteredMessages() {
        switch (this.currentFilter) {
            case 'loved':
                return this.messages.filter(m => m.loved);
            case 'from-me':
                return this.messages.filter(m => m.sender === 'me');
            case 'to-me':
                return this.messages.filter(m => m.sender === 'you');
            default:
                return this.messages;
        }
    }

    displayMessages() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        const filtered = this.getFilteredMessages();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💌</div>
                    <div class="empty-state-text">
                        ${this.currentFilter === 'all' 
                            ? 'Henüz mesaj yok. İlk mesajı gönder!' 
                            : 'Bu filtrele eşleşen mesaj bulunamadı.'}
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        filtered.forEach(message => {
            const bubble = this.createMessageBubble(message);
            container.appendChild(bubble);
        });
    }

    createMessageBubble(message) {
        const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || 'me';
        const isMyMessage = message.sender === currentUser;
        
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${isMyMessage ? 'from-me' : ''}`;
        
        const date = new Date(message.timestamp);
        const timeString = date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const senderEmoji = isMyMessage ? '👤' : '💕';
        const senderName = message.sender;

        bubble.innerHTML = `
            <div class="message-avatar">${senderEmoji}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${senderName}</span>
                    <span class="message-time">${timeString}</span>
                    ${message.edited ? '<span style="opacity:0.6;font-size:0.85em;">• düzenlendi</span>' : ''}
                </div>
                <div class="message-body">
                    <div class="message-text">${this.escapeHtml(message.text)}</div>
                    ${isMyMessage ? `
                        <div class="message-actions">
                            <button class="message-action-btn ${message.loved ? 'loved' : ''}" onclick="chat.toggleLove(${message.id})">
                                ${message.loved ? '❤️' : '🤍'} ${message.loved ? 'Favorilerde' : 'Favorilere Ekle'}
                            </button>
                            <button class="message-action-btn" onclick="chat.editMessage(${message.id})">
                                ✏️ Düzenle
                            </button>
                            <button class="message-action-btn" onclick="chat.deleteMessage(${message.id})">
                                🗑️ Sil
                            </button>
                        </div>
                    ` : `
                        <div class="message-actions">
                            <button class="message-action-btn ${message.loved ? 'loved' : ''}" onclick="chat.toggleLove(${message.id})">
                                ${message.loved ? '❤️' : '🤍'} ${message.loved ? 'Favorilerde' : 'Favorilere Ekle'}
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;

        return bubble;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        const totalMessages = document.getElementById('total-messages');
        const lovedMessages = document.getElementById('loved-messages');

        if (totalMessages) totalMessages.textContent = this.messages.length;
        if (lovedMessages) lovedMessages.textContent = this.messages.filter(m => m.loved).length;
    }
}

// Initialize chat
let chat;

document.addEventListener('DOMContentLoaded', () => {
    chat = new ChatSystem();

    // Message input
    const messageInput = document.getElementById('message-input');
    const charCount = document.getElementById('char-count');
    const sendBtn = document.getElementById('send-btn');

    if (messageInput) {
        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = messageInput.scrollHeight + 'px';
            
            // Update char counter
            if (charCount) {
                charCount.textContent = messageInput.value.length;
            }
            
            // Enable/disable send button
            if (sendBtn) {
                sendBtn.disabled = messageInput.value.trim().length === 0;
            }
        });

        // Send on Enter (Shift+Enter for new line)
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Send button
    if (sendBtn) {
        sendBtn.onclick = sendMessage;
        sendBtn.disabled = true;
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        chat.addMessage(text, 'me');
        messageInput.value = '';
        messageInput.style.height = 'auto';
        if (charCount) charCount.textContent = '0';
        if (sendBtn) sendBtn.disabled = true;
    }

    // Emoji picker
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');

    if (emojiBtn && emojiPicker) {
        emojiBtn.onclick = (e) => {
            e.stopPropagation();
            emojiPicker.classList.toggle('active');
        };

        // Close picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
                emojiPicker.classList.remove('active');
            }
        });

        // Emoji selection
        emojiPicker.querySelectorAll('.emoji').forEach(emoji => {
            emoji.onclick = () => {
                if (messageInput) {
                    const cursorPos = messageInput.selectionStart;
                    const textBefore = messageInput.value.substring(0, cursorPos);
                    const textAfter = messageInput.value.substring(cursorPos);
                    messageInput.value = textBefore + emoji.textContent + textAfter;
                    messageInput.focus();
                    messageInput.selectionStart = messageInput.selectionEnd = cursorPos + emoji.textContent.length;
                    
                    // Trigger input event to update char counter
                    messageInput.dispatchEvent(new Event('input'));
                }
                emojiPicker.classList.remove('active');
            };
        });
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            chat.setFilter(btn.dataset.filter);
        };
    });

    // Edit modal
    const closeEditBtn = document.getElementById('close-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const editModal = document.getElementById('edit-modal');

    if (closeEditBtn) closeEditBtn.onclick = () => chat.closeEditModal();
    if (cancelEditBtn) cancelEditBtn.onclick = () => chat.closeEditModal();
    if (saveEditBtn) saveEditBtn.onclick = () => chat.saveEdit();

    // Close modal on outside click
    if (editModal) {
        editModal.onclick = (e) => {
            if (e.target === editModal) {
                chat.closeEditModal();
            }
        };
    }
});
