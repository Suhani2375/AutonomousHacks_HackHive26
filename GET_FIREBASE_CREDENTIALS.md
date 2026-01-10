# How to Get Your Firebase Credentials

## Quick Steps:

### 1. Go to Firebase Console
👉 https://console.firebase.google.com

### 2. Select Your Project
- Click on **"hackhive-autonomous"** (or your project name)

### 3. Get Web App Config
1. Click the **⚙️ gear icon** (top left) → **Project settings**
2. Scroll down to **"Your apps"** section
3. If you see a web app (</> icon), click on it
4. If you DON'T see a web app:
   - Click **"Add app"** button
   - Select **Web** (</> icon)
   - Register with nickname: **"CleanCity Web"**
   - Click **Register app**

### 4. Copy the Config
You'll see a code block that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "hackhive-autonomous.firebaseapp.com",
  projectId: "hackhive-autonomous",
  storageBucket: "hackhive-autonomous.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 5. Copy Each Value
Copy these 6 values:
- ✅ `apiKey`
- ✅ `authDomain`
- ✅ `projectId`
- ✅ `storageBucket`
- ✅ `messagingSenderId`
- ✅ `appId`

### 6. Update src/firebase.js
Open `src/firebase.js` and replace the placeholder values with your actual values.

## Example:

**Before:**
```javascript
apiKey: "YOUR_API_KEY",
```

**After:**
```javascript
apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
```

Do this for all 6 values!

## After Updating:

1. **Save the file** (`Ctrl+S`)
2. **Restart the dev server**:
   - Stop: `Ctrl+C`
   - Start: `npm run dev`
3. **Refresh your browser** (`F5`)

The warning message should disappear! 🎉
