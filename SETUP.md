# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- Firebase project created
- Google Gemini API key (for backend functions)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Firebase

1. Open `src/firebase.js`
2. Replace the placeholder config with your Firebase project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

You can find these in Firebase Console → Project Settings → General → Your apps

## Step 3: Enable Firebase Services

In Firebase Console:

1. **Authentication**: Enable Email/Password provider
2. **Firestore**: Create database in production mode
3. **Storage**: Create storage bucket with default rules

## Step 4: Set Up Backend Functions

```bash
cd functions
npm install
```

Set Gemini API key:
```bash
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"
```

Deploy functions:
```bash
firebase deploy --only functions
```

## Step 5: Run the App

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Testing

1. Create a test user account via the Login page
2. Navigate to Dashboard
3. Click "Report Garbage" to test camera functionality
4. Check Firestore console to see reports being created

## Important Notes

- **Camera Access**: The app requires camera permissions (HTTPS or localhost)
- **Location Access**: GPS location is required for reports
- **Storage Rules**: Ensure Firebase Storage allows authenticated uploads to `reports/before/` path
- **Firestore Rules**: Ensure authenticated users can read/write to `reports` and `users` collections

## Troubleshooting

- **Camera not working**: Ensure you're on HTTPS or localhost
- **Location error**: Check browser permissions for location access
- **Upload fails**: Verify Firebase Storage rules allow authenticated uploads
- **Functions not triggering**: Check Firebase Functions logs in console
