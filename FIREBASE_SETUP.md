# Firebase Setup Guide

## Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Click the ⚙️ gear icon → **Project settings**
4. Scroll down to **"Your apps"** section
5. If you don't have a web app:
   - Click **"Add app"** → Select **Web** (</> icon)
   - Register your app with a nickname (e.g., "CleanCity Web")
6. Copy the `firebaseConfig` object that looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## Step 2: Update src/firebase.js

Replace the placeholder values in `src/firebase.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

## Step 3: Enable Firebase Services

In Firebase Console, enable these services:

### Authentication
1. Go to **Authentication** → **Get started**
2. Enable **Email/Password** provider
3. Click **Save**

### Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Start in **production mode** (you can change rules later)
3. Choose a location (e.g., `asia-south1` to match your functions)
4. Click **Enable**

### Storage
1. Go to **Storage** → **Get started**
2. Start in **production mode**
3. Use the same location as Firestore
4. Click **Done**

## Step 4: Set Firestore Rules (for development)

Go to **Firestore Database** → **Rules** and temporarily use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ Warning**: These rules allow any authenticated user to read/write. Update them for production!

## Step 5: Set Storage Rules (for development)

Go to **Storage** → **Rules** and temporarily use:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ Warning**: Update these rules for production!

## Step 6: Restart Dev Server

After updating `src/firebase.js`:

1. Stop the server (`Ctrl+C`)
2. Restart: `npm run dev`
3. Refresh your browser

The warning message should disappear and authentication will work!

## Testing

1. Try creating an account via the login page
2. Check Firebase Console → Authentication to see the new user
3. Check Firestore → `users` collection to see user data

## Troubleshooting

- **"Firebase: Error (auth/invalid-api-key)"**: Double-check your API key
- **"Permission denied"**: Check Firestore/Storage rules
- **"Network error"**: Check if Firebase services are enabled
