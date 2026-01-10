import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration from environment variables
// Create a .env file in the root directory with your Firebase credentials
// See .env.example for the format

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if config is valid
let app;
let auth;
let db;
let storage;

// Check if Firebase config is set (environment variables)
const isFirebaseConfigured = firebaseConfig.apiKey && 
                              firebaseConfig.apiKey !== undefined &&
                              firebaseConfig.apiKey !== "" &&
                              firebaseConfig.projectId && 
                              firebaseConfig.projectId !== undefined &&
                              firebaseConfig.projectId !== "";

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
} else {
  console.warn("⚠️ Firebase config not set. Please update src/firebase.js with your Firebase credentials.");
  console.warn("The UI will load but authentication and data features will not work.");
  // Set to null to prevent crashes
  app = null;
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };
