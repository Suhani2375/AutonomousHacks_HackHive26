const fs = require('fs');
const path = require('path');

const envTemplate = `VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
`;

const portals = ['citizen-portal', 'sweeper-portal', 'admin-portal'];

portals.forEach(portal => {
  const envPath = path.join(portal, '.env');
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envTemplate);
    console.log(`Created .env file for ${portal}`);
  } else {
    console.log(`.env file already exists for ${portal}`);
  }
});

console.log('\n✅ Environment files created!');
console.log('⚠️  Please update the .env files with your Firebase configuration.');

