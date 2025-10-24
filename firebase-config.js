// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAsQsyb6VebOmcI9TFsc-IIqXVYFiCwVIo",
    authDomain: "bebegim-5e848.firebaseapp.com",
    projectId: "bebegim-5e848",
    storageBucket: "bebegim-5e848.firebasestorage.app",
    messagingSenderId: "1073954837331",
    appId: "1:1073954837331:web:8fe594a86542966f2147a6",
    measurementId: "G-BL1STVK8QG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Export Firebase instances
export { db, storage, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, ref, uploadString, getDownloadURL, deleteObject };
