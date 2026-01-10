const fs = require('fs');
const path = require('path');

const firebaseConfig = {
  apiKey: "AIzaSyB2FwKH4GkJhoztuOlWFRuapG9TvrJaN_I",
  authDomain: "hackhive-autonomous.firebaseapp.com",
  projectId: "hackhive-autonomous",
  storageBucket: "hackhive-autonomous.firebasestorage.app",
  messagingSenderId: "853119952270",
  appId: "1:853119952270:web:7b4a0105d57cce7b08b0df",
  measurementId: "G-GZECFQCR3Q"
};

const envContent = `VITE_FIREBASE_API_KEY=${firebaseConfig.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}
VITE_FIREBASE_PROJECT_ID=${firebaseConfig.projectId}
VITE_FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.messagingSenderId}
VITE_FIREBASE_APP_ID=${firebaseConfig.appId}
VITE_FIREBASE_MEASUREMENT_ID=${firebaseConfig.measurementId}
`;

const portals = ['citizen-portal', 'sweeper-portal', 'admin-portal'];

portals.forEach(portal => {
  const envPath = path.join(portal, '.env');
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated .env file for ${portal}`);
});

console.log('\n🎉 All .env files updated with your Firebase configuration!');

