# Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install for all portals
cd citizen-portal && npm install && cd ..
cd sweeper-portal && npm install && cd ..
cd admin-portal && npm install && cd ..
cd functions && npm install && cd ..
```

### 2. Configure Environment Variables

For each portal (citizen-portal, sweeper-portal, admin-portal):

1. Copy `.env.example` to `.env`
2. Add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Configure Firebase Functions

```bash
cd functions
firebase functions:config:set gemini.key="your_gemini_api_key"
cd ..
```

### 4. Run Development Servers

Open 3 terminal windows:

**Terminal 1 - Citizen Portal (Port 3000)**
```bash
cd citizen-portal
npm run dev
```

**Terminal 2 - Sweeper Portal (Port 3001)**
```bash
cd sweeper-portal
npm run dev
```

**Terminal 3 - Admin Portal (Port 3002)**
```bash
cd admin-portal
npm run dev
```

### 5. Access the Applications

- Citizen Portal: http://localhost:3000
- Sweeper Portal: http://localhost:3001
- Admin Portal: http://localhost:3002

## Firebase Setup Requirements

### Enable Services

1. **Authentication**
   - Enable Email/Password authentication
   - Enable Phone authentication (optional)

2. **Firestore Database**
   - Create database in production mode
   - Set up security rules (see below)

3. **Storage**
   - Create storage bucket
   - Set up security rules (see below)

4. **Cloud Functions**
   - Deploy functions: `cd functions && npm run deploy`

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing the Application

### Create Test Users

1. **Citizen User**
   - Sign up through Citizen Portal
   - Email: citizen@test.com
   - Password: test123

2. **Sweeper User**
   - Create in Firebase Console or through Admin Portal
   - Employee ID: sweeper1
   - Email: sweeper1@municipality.gov
   - Role: sweeper

3. **Admin User**
   - Create in Firebase Console
   - Admin ID: admin1
   - Email: admin1@municipality.gov
   - Role: admin

## Troubleshooting

### Camera Not Working
- Ensure HTTPS or localhost (required for camera API)
- Check browser permissions for camera access

### Geolocation Not Working
- Check browser permissions for location access
- Ensure HTTPS or localhost

### Import Errors
- Verify all dependencies are installed
- Check that shared folder is accessible from each portal

### Firebase Connection Issues
- Verify environment variables are set correctly
- Check Firebase project configuration
- Ensure Firebase services are enabled

## Production Build

```bash
# Build all portals
cd citizen-portal && npm run build && cd ..
cd sweeper-portal && npm run build && cd ..
cd admin-portal && npm run build && cd ..
```

Build outputs will be in `dist/` folders of each portal.

