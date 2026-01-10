# Fix Firebase Configuration

## The Problem
You're using environment variables (`import.meta.env.VITE_...`) but they're not set, so Firebase isn't initializing.

## Solution: Use Direct Values (Easiest)

### Step 1: Get Your Firebase Credentials
1. Go to https://console.firebase.google.com
2. Select your project: **hackhive-autonomous**
3. Click ⚙️ → **Project settings**
4. Scroll to **"Your apps"** → Click your web app (or create one)
5. Copy the `firebaseConfig` values

### Step 2: Update `src/firebase.js`

Replace lines 7-13 in `src/firebase.js` with your actual values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",  // ← Paste here
  authDomain: "hackhive-autonomous.firebaseapp.com",  // ← Usually: projectId + ".firebaseapp.com"
  projectId: "hackhive-autonomous",  // ← Your project ID
  storageBucket: "hackhive-autonomous.appspot.com",  // ← Usually: projectId + ".appspot.com"
  messagingSenderId: "123456789012",  // ← Paste here
  appId: "1:123456789012:web:abcdef123456"  // ← Paste here
};
```

### Step 3: Save and Restart
1. **Save** the file (`Ctrl+S`)
2. **Restart** the dev server:
   - Press `Ctrl+C` in terminal
   - Run `npm run dev`
3. **Refresh** your browser (`F5`)

## Alternative: Use Environment Variables

If you prefer using `.env` file:

1. Create a file named `.env` in the root directory
2. Add your values:
```
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=hackhive-autonomous.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hackhive-autonomous
VITE_FIREBASE_STORAGE_BUCKET=hackhive-autonomous.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
3. Restart the dev server (Vite needs restart to pick up .env changes)

## Verify It's Working

After updating:
1. Open browser console (F12)
2. You should NOT see the warning: "⚠️ Firebase config not set"
3. Try logging in - the alert should be gone

## Still Not Working?

Check browser console (F12) for errors:
- **"Invalid API key"**: Double-check your apiKey
- **"Permission denied"**: Enable Firebase services (Auth, Firestore, Storage)
- **Still showing alert**: Make sure you saved the file and restarted the server
