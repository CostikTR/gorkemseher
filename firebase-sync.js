// Firebase Sync Manager - localStorage yerine Firebase Firestore kullanır
import { db, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, orderBy } from './firebase-config.js';

class FirebaseSync {
    constructor() {
        this.listeners = {};
        this.currentUser = sessionStorage.getItem('currentUser') || 'shared';
    }

    // Koleksiyon yolu oluştur (paylaşılan veri için 'shared' kullanıcısı)
    getCollectionPath(collectionName) {
        return `users/shared/${collectionName}`;
    }

    // Veri kaydet
    async saveData(collectionName, documentId, data) {
        try {
            const docRef = doc(db, this.getCollectionPath(collectionName), documentId);
            await setDoc(docRef, {
                ...data,
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentUser
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Firebase save error:', error);
            return false;
        }
    }

    // Veri getir
    async getData(collectionName, documentId) {
        try {
            const docRef = doc(db, this.getCollectionPath(collectionName), documentId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error('Firebase get error:', error);
            return null;
        }
    }

    // Tüm koleksiyon verilerini getir
    async getAllData(collectionName) {
        try {
            const collectionRef = collection(db, this.getCollectionPath(collectionName));
            const querySnapshot = await getDocs(collectionRef);
            
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return data;
        } catch (error) {
            console.error('Firebase getAll error:', error);
            return [];
        }
    }

    // Veri güncelle
    async updateData(collectionName, documentId, updates) {
        try {
            const docRef = doc(db, this.getCollectionPath(collectionName), documentId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentUser
            });
            return true;
        } catch (error) {
            console.error('Firebase update error:', error);
            return false;
        }
    }

    // Veri sil
    async deleteData(collectionName, documentId) {
        try {
            const docRef = doc(db, this.getCollectionPath(collectionName), documentId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error('Firebase delete error:', error);
            return false;
        }
    }

    // Real-time listener ekle
    addRealtimeListener(collectionName, callback) {
        try {
            const collectionRef = collection(db, this.getCollectionPath(collectionName));
            const q = query(collectionRef, orderBy('updatedAt', 'desc'));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = [];
                snapshot.forEach((doc) => {
                    data.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(data);
            });

            this.listeners[collectionName] = unsubscribe;
            return unsubscribe;
        } catch (error) {
            console.error('Firebase listener error:', error);
            return null;
        }
    }

    // Listener'ı kaldır
    removeListener(collectionName) {
        if (this.listeners[collectionName]) {
            this.listeners[collectionName]();
            delete this.listeners[collectionName];
        }
    }

    // localStorage'dan Firebase'e migrate et
    async migrateFromLocalStorage() {
        console.log('🔄 localStorage -> Firebase migration başlatılıyor...');
        
        const migrations = [
            { key: 'lovesite_dates', collection: 'dates', docId: 'main' },
            { key: 'lovesite_messages', collection: 'messages', docId: 'list' },
            { key: 'lovesite_photos', collection: 'photos', docId: 'gallery' },
            { key: 'lovesite_bucketlist', collection: 'bucketlist', docId: 'items' },
            { key: 'lovesite_profile1', collection: 'profiles', docId: 'profile1' },
            { key: 'lovesite_profile2', collection: 'profiles', docId: 'profile2' },
            { key: 'quizQuestions', collection: 'quiz', docId: 'questions' },
            { key: 'quizStats', collection: 'quiz', docId: 'stats' },
            { key: 'chatMessages', collection: 'chat', docId: 'messages' },
            { key: 'playlist', collection: 'playlist', docId: 'songs' },
            { key: 'gifts', collection: 'gifts', docId: 'list' },
            { key: 'reminders', collection: 'reminders', docId: 'list' },
            { key: 'lovesite_theme', collection: 'settings', docId: 'theme' },
            { key: 'lovesite_theme_mode', collection: 'settings', docId: 'themeMode' }
        ];

        let migrated = 0;
        for (const migration of migrations) {
            const localData = localStorage.getItem(migration.key);
            if (localData) {
                try {
                    let data;
                    try {
                        data = JSON.parse(localData);
                    } catch {
                        data = localData; // String değerler için
                    }
                    
                    await this.saveData(migration.collection, migration.docId, { data });
                    migrated++;
                    console.log(`✅ ${migration.key} migrated`);
                } catch (error) {
                    console.error(`❌ ${migration.key} migration failed:`, error);
                }
            }
        }

        console.log(`🎉 Migration tamamlandı! ${migrated} öğe taşındı.`);
        return migrated;
    }
}

// Global instance oluştur
const firebaseSync = new FirebaseSync();

// Export both class and instance
export { FirebaseSync };
export default firebaseSync;
