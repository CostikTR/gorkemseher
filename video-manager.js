// ============================================
// VİDEO YÖNETİM SİSTEMİ
// ============================================

class VideoManager {
    constructor() {
        this.videos = this.loadVideos();
        this.currentVideoIndex = 0;
    }
    
    loadVideos() {
        const saved = localStorage.getItem('lovesite_videos');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveVideos() {
        localStorage.setItem('lovesite_videos', JSON.stringify(this.videos));
        
        // Firebase'e de kaydet
        if (window.firebaseSync) {
            window.firebaseSync.saveData('videos', 'list', this.videos)
                .catch(err => console.error('Video Firebase kayıt hatası:', err));
        }
    }
    
    async addVideo(file, caption = '', category = 'diğer') {
        return new Promise((resolve, reject) => {
            // Video boyut kontrolü (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                reject('Video boyutu çok büyük! Maksimum 50MB olabilir.');
                return;
            }
            
            // Video süre kontrolü
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                
                // Max 5 dakika
                if (video.duration > 300) {
                    reject('Video süresi çok uzun! Maksimum 5 dakika olabilir.');
                    return;
                }
                
                // Video'yu oku
                const reader = new FileReader();
                reader.onload = (e) => {
                    const videoData = {
                        src: e.target.result,
                        caption: caption || 'İsimsiz Video',
                        category: category,
                        duration: Math.round(video.duration),
                        uploadedAt: Date.now(),
                        uploadedBy: localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'),
                        id: Date.now(),
                        type: 'video'
                    };
                    
                    this.videos.unshift(videoData);
                    this.saveVideos();
                    resolve(videoData);
                };
                
                reader.onerror = () => reject('Video okuma hatası!');
                reader.readAsDataURL(file);
            };
            
            video.onerror = () => reject('Video yükleme hatası!');
            video.src = URL.createObjectURL(file);
        });
    }
    
    deleteVideo(id) {
        this.videos = this.videos.filter(v => v.id !== id);
        this.saveVideos();
    }
    
    getVideosByCategory(category) {
        if (category === 'all') return this.videos;
        return this.videos.filter(v => v.category === category);
    }
    
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.id = video.id;
        
        card.innerHTML = `
            <div class="video-thumbnail" onclick="videoManager.playVideo(${video.id})">
                <video src="${video.src}" preload="metadata"></video>
                <div class="video-play-overlay">
                    <div class="play-button">▶️</div>
                </div>
                <div class="video-duration">${this.formatDuration(video.duration)}</div>
            </div>
            <div class="video-info">
                <h3 class="video-caption">${video.caption}</h3>
                <div class="video-meta">
                    <span class="video-date">${new Date(video.uploadedAt).toLocaleDateString('tr-TR')}</span>
                    <span class="video-uploader">👤 ${video.uploadedBy}</span>
                </div>
                <div class="video-actions">
                    <button onclick="videoManager.playVideo(${video.id})" class="btn-play">
                        ▶️ Oynat
                    </button>
                    <button onclick="videoManager.downloadVideo(${video.id})" class="btn-download">
                        ⬇️ İndir
                    </button>
                    <button onclick="videoManager.deleteVideo(${video.id})" class="btn-delete">
                        🗑️ Sil
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    playVideo(id) {
        const video = this.videos.find(v => v.id === id);
        if (!video) return;
        
        // Video player modal oluştur
        const modal = document.createElement('div');
        modal.className = 'video-player-modal';
        modal.innerHTML = `
            <div class="video-player-container">
                <button class="video-close" onclick="this.closest('.video-player-modal').remove()">✕</button>
                <video controls autoplay class="video-player">
                    <source src="${video.src}" type="video/mp4">
                    Tarayıcınız video oynatmayı desteklemiyor.
                </video>
                <div class="video-player-info">
                    <h3>${video.caption}</h3>
                    <p>📅 ${new Date(video.uploadedAt).toLocaleDateString('tr-TR')} • 👤 ${video.uploadedBy}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ESC tuşu ile kapatma
        const closeOnEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEsc);
            }
        };
        document.addEventListener('keydown', closeOnEsc);
        
        // Modal dışına tıklayınca kapat
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }
    
    downloadVideo(id) {
        const video = this.videos.find(v => v.id === id);
        if (!video) return;
        
        const a = document.createElement('a');
        a.href = video.src;
        a.download = `${video.caption}_${new Date(video.uploadedAt).toISOString().split('T')[0]}.mp4`;
        a.click();
    }
    
    renderVideos(containerId, category = 'all') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const videos = this.getVideosByCategory(category);
        
        if (videos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎬</div>
                    <p>Henüz video yüklenmemiş</p>
                    <p class="empty-hint">İlk videoyu sen yükle! 📹</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        videos.forEach(video => {
            container.appendChild(this.createVideoCard(video));
        });
    }
}

// Global instance
const videoManager = new VideoManager();
window.videoManager = videoManager;

// Video card stilleri
const videoStyles = document.createElement('style');
videoStyles.textContent = `
    .video-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 15px;
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .video-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
    }
    
    .video-thumbnail {
        position: relative;
        width: 100%;
        aspect-ratio: 16/9;
        overflow: hidden;
        cursor: pointer;
        background: #000;
    }
    
    .video-thumbnail video {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .video-play-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .video-thumbnail:hover .video-play-overlay {
        opacity: 1;
    }
    
    .play-button {
        font-size: 4em;
        filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.5));
        animation: pulse 2s infinite;
    }
    
    .video-duration {
        position: absolute;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 0.9em;
        font-weight: bold;
    }
    
    .video-info {
        padding: 15px;
    }
    
    .video-caption {
        font-size: 1.2em;
        margin-bottom: 10px;
        color: white;
    }
    
    .video-meta {
        display: flex;
        justify-content: space-between;
        opacity: 0.8;
        margin-bottom: 15px;
        font-size: 0.9em;
    }
    
    .video-actions {
        display: flex;
        gap: 10px;
    }
    
    .video-actions button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9em;
    }
    
    .video-actions button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
    }
    
    .btn-delete:hover {
        background: rgba(244, 67, 54, 0.8) !important;
    }
    
    /* Video Player Modal */
    .video-player-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        animation: fadeIn 0.3s ease-out;
    }
    
    .video-player-container {
        position: relative;
        max-width: 90%;
        max-height: 90%;
        width: 1200px;
    }
    
    .video-close {
        position: absolute;
        top: -50px;
        right: 0;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 2em;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .video-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
    }
    
    .video-player {
        width: 100%;
        max-height: 80vh;
        border-radius: 10px;
    }
    
    .video-player-info {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        padding: 20px;
        border-radius: 10px;
        margin-top: 15px;
        color: white;
    }
    
    .video-player-info h3 {
        margin-bottom: 10px;
        font-size: 1.5em;
    }
    
    .video-player-info p {
        opacity: 0.8;
    }
    
    .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: white;
    }
    
    .empty-icon {
        font-size: 5em;
        margin-bottom: 20px;
        opacity: 0.5;
    }
    
    .empty-hint {
        opacity: 0.7;
        margin-top: 10px;
    }
`;
document.head.appendChild(videoStyles);
