# 🚀 Next Steps - Testing Your Application

## Step 1: Start Development Servers

Open 3 terminal windows and run:

**Terminal 1 - Citizen Portal:**
```bash
cd citizen-portal
npm run dev
```

**Terminal 2 - Sweeper Portal:**
```bash
cd sweeper-portal
npm run dev
```

**Terminal 3 - Admin Portal:**
```bash
cd admin-portal
npm run dev
```

Or use the script:
```powershell
.\start-dev.ps1
```

## Step 2: Set Up Firestore Security Rules

Go to Firebase Console → Firestore Database → Rules tab and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Reports collection
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.citizenId == request.auth.uid ||
        resource.data.assignedSweeper == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.toUser == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.toUser == request.auth.uid;
    }
  }
}
```

Click **Publish** to save.

## Step 3: Set Up Storage Security Rules

Go to Firebase Console → Storage → Rules tab and add:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'sweeper']
      );
    }
  }
}
```

Click **Publish** to save.

## Step 4: Create Test Users

### Option A: Through Firebase Console

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Create these users:

**Citizen User:**
- Email: `citizen@test.com`
- Password: `test123456`
- After creation, go to Firestore and create document:
  - Collection: `users`
  - Document ID: (the user's UID from Authentication)
  - Fields:
    ```json
    {
      "email": "citizen@test.com",
      "role": "citizen",
      "points": 0,
      "status": "approved",
      "createdAt": [timestamp]
    }
    ```

**Sweeper User:**
- Email: `sweeper1@municipality.gov`
- Password: `test123456`
- Firestore document:
  ```json
  {
    "email": "sweeper1@municipality.gov",
    "role": "sweeper",
    "points": 0,
    "status": "approved",
    "createdAt": [timestamp]
  }
  ```

**Admin User:**
- Email: `admin1@municipality.gov`
- Password: `test123456`
- Firestore document:
  ```json
  {
    "email": "admin1@municipality.gov",
    "role": "admin",
    "status": "approved",
    "createdAt": [timestamp]
  }
  ```

### Option B: Through Application UI

1. **Citizen**: Sign up through Citizen Portal (http://localhost:3000)
2. **Sweeper/Admin**: Create through Admin Portal after logging in as admin

## Step 5: Configure Cloud Functions

```bash
cd functions

# Set Gemini API key
firebase functions:config:set gemini.key="your_gemini_api_key_here"

# Deploy functions
npm run deploy
```

## Step 6: Test the Application Flow

### Test Citizen Portal (http://localhost:3000)

1. **Login** as citizen
2. **Report Garbage**:
   - Click "Report Garbage" button
   - Allow camera permission
   - Take a photo of garbage
   - Location will be captured automatically
   - Upload the report
3. **View Reports**: Check "My Reports" page
4. **Check Points**: View points on dashboard
5. **Leaderboard**: Check ranking

### Test Sweeper Portal (http://localhost:3001)

1. **Login** as sweeper
2. **View Tasks**: See assigned tasks on dashboard
3. **Filter Tasks**: Use High/Medium/Low filters
4. **View Task Details**: Click on a task
5. **Navigate**: Click "Navigate" to open Google Maps
6. **Clean Task**:
   - Click "Clean Now"
   - Take after-cleaning photo
   - Upload to complete task

### Test Admin Portal (http://localhost:3002)

1. **Login** as admin
2. **Dashboard**: View statistics and KPIs
3. **User Approval**:
   - Go to "User Approval"
   - Filter by All/Citizens/Sweepers
   - Approve or reject pending users
4. **Reports Map**: View all reports on map
5. **Leaderboard**: View top performers

## Step 7: Verify AI Integration

1. **Report from Citizen Portal**:
   - Upload a garbage photo
   - Check Firestore `reports` collection
   - Wait for Cloud Function to process
   - Verify fields: `wasteDetected`, `wasteType`, `level`, `priority`

2. **Check Function Logs**:
   ```bash
   firebase functions:log
   ```

3. **After Cleaning**:
   - Sweeper uploads after-cleaning photo
   - Check if status changes to "verified"
   - Verify points are awarded

## Step 8: Test PWA Features

1. **Install as App**:
   - Open in Chrome/Edge
   - Click install prompt
   - Test offline functionality

2. **Camera Access**:
   - Test on mobile device
   - Verify camera works
   - Test geolocation

## Common Issues & Solutions

### Issue: "Permission denied" in Firestore
- **Solution**: Check security rules are published
- Verify user has correct role in Firestore

### Issue: Camera not working
- **Solution**: Must use HTTPS or localhost
- Check browser permissions

### Issue: Functions not triggering
- **Solution**: Verify functions are deployed
- Check GEMINI_KEY is set
- Check function logs: `firebase functions:log`

### Issue: Images not uploading
- **Solution**: Check Storage rules
- Verify Storage bucket is created
- Check browser console for errors

## 🎯 Testing Checklist

- [ ] All 3 portals start without errors
- [ ] Can create citizen account
- [ ] Can login to all portals
- [ ] Can report garbage with photo
- [ ] Location is captured
- [ ] Report appears in Firestore
- [ ] AI processes the image (check logs)
- [ ] Sweeper can see assigned tasks
- [ ] Sweeper can upload after-cleaning photo
- [ ] Admin can approve users
- [ ] Admin can view reports map
- [ ] Points are awarded correctly
- [ ] Leaderboard displays correctly

## 🚀 Production Deployment

When ready for production:

1. **Build all portals**:
   ```bash
   cd citizen-portal && npm run build
   cd ../sweeper-portal && npm run build
   cd ../admin-portal && npm run build
   ```

2. **Deploy to Firebase Hosting**:
   - Configure `firebase.json` for hosting
   - Deploy: `firebase deploy --only hosting`

3. **Set Production Environment Variables**

4. **Enable App Check** (recommended)

---

**You're all set! Start testing your application! 🎉**

