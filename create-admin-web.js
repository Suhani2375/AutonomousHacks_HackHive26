/**
 * Web-based admin account creation
 * This creates an admin account using Firebase client SDK
 * Run this in Node.js with ES modules support or use in browser console
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB2FwKH4GkJhoztuOlWFRuapG9TvrJaN_I",
  authDomain: "hackhive-autonomous.firebaseapp.com",
  projectId: "hackhive-autonomous",
  storageBucket: "hackhive-autonomous.firebasestorage.app",
  messagingSenderId: "853119952270",
  appId: "1:853119952270:web:7b4a0105d57cce7b08b0df",
  measurementId: "G-GZECFQCR3Q"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// For browser console use
if (typeof window !== 'undefined') {
  window.createAdminAccount = async function(adminId, password, name = 'Admin User') {
    try {
      const email = `${adminId}@municipality.gov`;
      console.log('Creating admin account...');
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      await setDoc(doc(db, 'users', userId), {
        email: email,
        name: name,
        role: 'admin',
        status: 'approved',
        points: 0,
        createdAt: new Date(),
        totalReports: 0,
        totalCleaned: 0
      });
      
      console.log('✅ Admin account created!');
      console.log(`Admin ID: ${adminId}`);
      console.log(`Email: ${email}`);
      return { success: true, email, adminId };
    } catch (error) {
      console.error('❌ Error:', error.message);
      return { success: false, error: error.message };
    }
  };
  
  console.log('💡 To create admin account, run in console:');
  console.log('   createAdminAccount("admin", "admin123", "Admin User")');
}

module.exports = { createAdminAccount: window?.createAdminAccount };

