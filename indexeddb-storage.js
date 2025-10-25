// IndexedDB Storage Manager - localStorage yerine kullanılır
class IndexedDBStorage {
    constructor() {
        this.dbName = 'LoveSiteDB';
        this.version = 1;
        this.db = null;
    }

    // Database'i başlat
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB başlatıldı');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Photos store
                if (!db.objectStoreNames.contains('photos')) {
                    const photosStore = db.createObjectStore('photos', { keyPath: 'id' });
                    photosStore.createIndex('category', 'category', { unique: false });
                    photosStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                console.log('🔧 IndexedDB object stores oluşturuldu');
            };
        });
    }

    // Fotoğraf kaydet
    async savePhoto(photo) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            const request = store.put(photo);

            request.onsuccess = () => resolve(photo.id);
            request.onerror = () => reject(request.error);
        });
    }

    // Tüm fotoğrafları getir
    async getAllPhotos() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    // Fotoğraf sil
    async deletePhoto(photoId) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            const request = store.delete(photoId);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Ayar kaydet
    async saveSetting(key, value) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            const request = store.put({ key, value });

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Ayar getir
    async getSetting(key) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = () => reject(request.error);
        });
    }

    // localStorage'dan IndexedDB'ye migrate et
    async migrateFromLocalStorage() {
        console.log('🔄 localStorage → IndexedDB migration başlatılıyor...');

        try {
            const localPhotos = localStorage.getItem('lovesite_photos');
            if (localPhotos) {
                const photos = JSON.parse(localPhotos);
                console.log(`📦 ${photos.length} fotoğraf bulundu`);

                for (const photo of photos) {
                    await this.savePhoto(photo);
                }

                console.log(`✅ ${photos.length} fotoğraf IndexedDB'ye aktarıldı`);
                
                // Migration tamamlandı işareti
                await this.saveSetting('migrated_from_localstorage', true);
                
                // Eski localStorage'ı temizle
                localStorage.removeItem('lovesite_photos');
                console.log('🗑️ localStorage temizlendi');
                
                return photos.length;
            }
        } catch (error) {
            console.error('❌ Migration hatası:', error);
            return 0;
        }
    }

    // Database'i temizle (dikkatli kullan!)
    async clearAll() {
        if (!this.db) await this.init();

        const stores = ['photos', 'settings'];
        for (const storeName of stores) {
            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
        console.log('🗑️ IndexedDB temizlendi');
    }
}

// Global instance
const dbStorage = new IndexedDBStorage();

export default dbStorage;
