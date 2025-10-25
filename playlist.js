// Playlist System with YouTube Player
import firebaseSync from './firebase-sync.js';

class PlaylistSystem {
    constructor() {
        this.songs = [];
        this.currentFilter = 'all';
        this.player = null;
        this.currentSongId = null;
        this.loadSongs();
    }

    async loadSongs() {
        // Firebase'den yükle
        try {
            const firebaseData = await firebaseSync.getData('playlist', 'songs');
            if (firebaseData && firebaseData.list) {
                this.songs = firebaseData.list;
                localStorage.setItem('playlist', JSON.stringify(this.songs));
                this.displaySongs();
                this.updateStats();
                return;
            }
        } catch (err) {
            console.log('Firebase playlist yükleme hatası:', err);
        }

        // Fallback: localStorage
        const saved = localStorage.getItem('playlist');
        if (saved) {
            this.songs = JSON.parse(saved);
        }
        this.displaySongs();
        this.updateStats();
    }

    async saveSongs() {
        localStorage.setItem('playlist', JSON.stringify(this.songs));
        
        // Firebase'e kaydet
        try {
            await firebaseSync.saveData('playlist', 'songs', { list: this.songs });
        } catch (err) {
            console.error('Playlist Firebase kayıt hatası:', err);
        }
    }

    addSong(songData) {
        const song = {
            id: Date.now(),
            title: songData.title.trim(),
            artist: songData.artist.trim(),
            youtubeId: songData.youtubeId.trim(),
            note: songData.note.trim(),
            favorite: false,
            addedDate: new Date().toISOString()
        };
        
        this.songs.unshift(song);
        this.saveSongs();
        this.displaySongs();
        this.updateStats();
    }

    deleteSong(id) {
        if (confirm('Bu şarkıyı silmek istediğinize emin misiniz?')) {
            this.songs = this.songs.filter(s => s.id !== id);
            this.saveSongs();
            this.displaySongs();
            this.updateStats();
            
            // Close player if deleted song was playing
            if (this.currentSongId === id) {
                this.closePlayer();
            }
        }
    }

    toggleFavorite(id) {
        const song = this.songs.find(s => s.id === id);
        if (song) {
            song.favorite = !song.favorite;
            this.saveSongs();
            this.displaySongs();
            this.updateStats();
        }
    }

    playSong(id) {
        const song = this.songs.find(s => s.id === id);
        if (!song) return;

        this.currentSongId = id;
        
        // Show player container
        const nowPlaying = document.getElementById('now-playing');
        if (nowPlaying) {
            nowPlaying.style.display = 'block';
            nowPlaying.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Update playing info
        const playingTitle = document.getElementById('playing-title');
        const playingArtist = document.getElementById('playing-artist');
        if (playingTitle) playingTitle.textContent = song.title;
        if (playingArtist) playingArtist.textContent = song.artist;

        // Load video
        if (this.player) {
            this.player.loadVideoById(song.youtubeId);
        } else {
            this.initYouTubePlayer(song.youtubeId);
        }
    }

    initYouTubePlayer(videoId) {
        this.player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                controls: 1,
                modestbranding: 1,
                rel: 0
            }
        });
    }

    closePlayer() {
        const nowPlaying = document.getElementById('now-playing');
        if (nowPlaying) {
            nowPlaying.style.display = 'none';
        }
        
        if (this.player) {
            this.player.stopVideo();
        }
        
        this.currentSongId = null;
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
        
        this.displaySongs();
    }

    getFilteredSongs() {
        if (this.currentFilter === 'favorites') {
            return this.songs.filter(s => s.favorite);
        }
        return this.songs;
    }

    displaySongs() {
        const grid = document.getElementById('playlist-grid');
        if (!grid) return;

        const filtered = this.getFilteredSongs();

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-playlist" style="grid-column: 1/-1;">
                    <div class="empty-playlist-icon">🎵</div>
                    <div class="empty-playlist-text">
                        ${this.currentFilter === 'all' 
                            ? 'Henüz şarkı eklenmemiş. Yukarıdaki formu kullanarak özel şarkılarınızı ekleyin!' 
                            : 'Henüz favori şarkı eklenmemiş.'}
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        filtered.forEach(song => {
            const card = this.createSongCard(song);
            grid.appendChild(card);
        });
    }

    createSongCard(song) {
        const card = document.createElement('div');
        card.className = 'song-card';
        
        const thumbnailUrl = `https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`;
        
        card.innerHTML = `
            <div class="song-thumbnail" onclick="playlist.playSong(${song.id})">
                <img src="${thumbnailUrl}" alt="${song.title}">
                <div class="play-overlay">
                    <div class="play-icon">▶️</div>
                </div>
            </div>
            
            <div class="song-info">
                <div class="song-title">${this.escapeHtml(song.title)}</div>
                <div class="song-artist">👨‍🎤 ${this.escapeHtml(song.artist)}</div>
                ${song.note ? `<div class="song-note">💭 ${this.escapeHtml(song.note)}</div>` : ''}
            </div>
            
            <div class="song-actions">
                <button class="song-btn play-btn" onclick="playlist.playSong(${song.id})">
                    ▶️ Çal
                </button>
                <button class="song-btn favorite-btn ${song.favorite ? 'favorited' : ''}" 
                        onclick="playlist.toggleFavorite(${song.id})">
                    ${song.favorite ? '⭐ Favori' : '☆ Favoriye Ekle'}
                </button>
                <button class="song-btn delete-btn" onclick="playlist.deleteSong(${song.id})">
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
        const totalSongs = document.getElementById('total-songs');
        const favoriteSongs = document.getElementById('favorite-songs');

        if (totalSongs) totalSongs.textContent = this.songs.length;
        if (favoriteSongs) favoriteSongs.textContent = this.songs.filter(s => s.favorite).length;
    }
}

// Initialize playlist
let playlist;

// YouTube IFrame API ready callback
function onYouTubeIframeAPIReady() {
    // Player will be initialized when first song is played
}

document.addEventListener('DOMContentLoaded', () => {
    playlist = new PlaylistSystem();

    // Add song form
    const addSongForm = document.getElementById('add-song-form');
    if (addSongForm) {
        addSongForm.onsubmit = (e) => {
            e.preventDefault();
            
            const songData = {
                title: document.getElementById('song-title').value,
                artist: document.getElementById('song-artist').value,
                youtubeId: document.getElementById('song-youtube').value,
                note: document.getElementById('song-note').value
            };

            // Validate YouTube ID
            if (!/^[a-zA-Z0-9_-]{11}$/.test(songData.youtubeId)) {
                alert('Geçersiz YouTube video ID! ID 11 karakter olmalı (örn: dQw4w9WgXcQ)');
                return;
            }

            playlist.addSong(songData);
            addSongForm.reset();
            
            // Success feedback
            const submitBtn = addSongForm.querySelector('.add-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '✓ Şarkı Eklendi!';
            submitBtn.style.background = 'rgba(74, 222, 128, 0.5)';
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
            }, 2000);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            playlist.setFilter(btn.dataset.filter);
        };
    });

    // Close player button
    const closePlayerBtn = document.getElementById('close-player');
    if (closePlayerBtn) {
        closePlayerBtn.onclick = () => {
            playlist.closePlayer();
        };
    }
});
