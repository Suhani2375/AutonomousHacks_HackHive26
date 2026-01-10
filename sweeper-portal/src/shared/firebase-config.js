// Import Firebase modules in correct order
import { initializeApp } from 'firebase/app';
import 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB2FwKH4GkJhoztuOlWFRuapG9TvrJaN_I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hackhive-autonomous.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hackhive-autonomous",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hackhive-autonomous.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "853119952270",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:853119952270:web:7b4a0105d57cce7b08b0df",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GZECFQCR3Q"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
