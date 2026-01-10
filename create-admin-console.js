// Copy and paste this entire code into the browser console on the Admin Portal login page
// (Press F12, go to Console tab, paste this, and press Enter)

(async function() {
  try {
    // Import Firebase modules
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js');
    const { getAuth, createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js');
    const { getFirestore, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js');

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

    const adminId = 'admin';
    const password = 'admin123';
    const email = `${adminId}@municipality.gov`;

    console.log('⏳ Creating admin account...');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    await setDoc(doc(db, 'users', userId), {
      email: email,
      name: 'Admin User',
      role: 'admin',
      status: 'approved',
      points: 0,
      createdAt: new Date(),
      totalReports: 0,
      totalCleaned: 0
    });
    
    console.log('✅ Admin account created successfully!');
    console.log('📋 Login Credentials:');
    console.log(`   Admin ID: ${adminId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('🚀 You can now login!');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ Admin account already exists! You can login now.');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
})();

