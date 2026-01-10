/**
 * Script to create an admin account in Firebase
 * Uses Firebase Admin SDK from functions folder
 * 
 * Usage: node create-admin.js
 */

const path = require('path');
const admin = require(path.join(__dirname, 'functions/node_modules/firebase-admin'));

// Initialize Firebase Admin
// Note: This requires Firebase service account key or emulator
// For production, set GOOGLE_APPLICATION_CREDENTIALS environment variable
// For development, we'll use applicationDefault() which works with Firebase emulator
// or you can manually create the admin in Firebase Console

try {
  // Try to initialize with default credentials
  if (!admin.apps.length) {
    admin.initializeApp();
  }
} catch (e) {
  console.error('❌ Firebase Admin SDK initialization failed.');
  console.error('💡 Options to create admin account:');
  console.error('   1. Use Firebase Console (Recommended):');
  console.error('      - Go to https://console.firebase.google.com/');
  console.error('      - Select project: hackhive-autonomous');
  console.error('      - Go to Authentication > Users > Add User');
  console.error('      - Email: admin@municipality.gov');
  console.error('      - Password: (your choice)');
  console.error('      - Then create Firestore document manually\n');
  console.error('   2. Use browser console method (see create-admin-web.html)\n');
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n🔐 Creating Admin Account\n');
    
    const adminId = await question('Enter Admin ID (e.g., "admin"): ');
    const password = await question('Enter Password (min 6 characters): ');
    
    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      rl.close();
      process.exit(1);
    }
    
    const email = `${adminId}@municipality.gov`;
    const name = await question('Enter Admin Name (optional, press Enter for default): ') || 'Admin User';
    
    console.log('\n⏳ Creating admin account...\n');
    
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: true
    });
    
    const userId = userRecord.uid;
    
    // Create Firestore user document
    await db.collection('users').doc(userId).set({
      email: email,
      name: name,
      role: 'admin',
      status: 'approved',
      points: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      totalReports: 0,
      totalCleaned: 0
    });
    
    console.log('✅ Admin account created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log(`   Admin ID: ${adminId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${'*'.repeat(password.length)}\n`);
    console.log('🚀 You can now login to the Admin Portal at: http://localhost:3002\n');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.error('❌ Error: This admin account already exists!');
      console.log('💡 If you forgot the password, reset it in Firebase Console.\n');
    } else {
      console.error('❌ Error creating admin account:', error.message);
      console.error('\n💡 EASIER METHOD: Create admin account via browser console\n');
      console.error('   1. Open Admin Portal: http://localhost:3002/login');
      console.error('   2. Open browser console (F12)');
      console.error('   3. Copy and paste this code:\n');
      console.error(`      const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js');`);
      console.error(`      const { getFirestore, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js');`);
      console.error(`      const auth = getAuth();`);
      console.error(`      const db = getFirestore();`);
      console.error(`      const email = 'admin@municipality.gov';`);
      console.error(`      const password = 'admin123';`);
      console.error(`      const userCred = await createUserWithEmailAndPassword(auth, email, password);`);
      console.error(`      await setDoc(doc(db, 'users', userCred.user.uid), { email, name: 'Admin User', role: 'admin', status: 'approved', points: 0, createdAt: new Date() });`);
      console.error(`      console.log('Admin created!');\n`);
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

createAdmin();
