# CleanCity - Municipal Garbage Management System

A comprehensive web application for managing municipal garbage reporting, cleaning, and administration. Built with React, Firebase, and Google Gemini AI for intelligent waste detection and verification.

## 🎯 Project Overview

CleanCity is a three-role municipal waste management platform that connects citizens, sweepers, and administrators in a unified ecosystem for reporting, cleaning, and managing garbage issues in cities.

### User Roles

1. **Citizen** - Report garbage issues in their area
2. **Sweeper** - View assigned tasks and capture after-cleaning photos
3. **Admin** - Manage users, approve accounts, view reports on map, and monitor system

---

## ✨ Features

### 👤 Citizen Features
- 🔐 **Authentication** - Email/Password registration and login
- 📸 **Camera-based Reporting** - Live camera capture (no gallery uploads) for garbage reporting
- 📍 **GPS Location Tracking** - Automatic location capture at upload time
- 📊 **Personal Dashboard** - View statistics, recent reports, and activity
- 📋 **Reports Management** - Track all submitted reports with status updates
- 🏆 **Leaderboard** - See top contributors and your ranking
- ✅ **Real-time Status Updates** - Track report status (pending → assigned/fake → verified)
- 💰 **Points System** - Earn points for valid reports and verified cleanups

### 🧹 Sweeper Features
- 📋 **My Tasks** - View all assigned garbage cleaning tasks
- 📷 **Capture Clean** - Live camera and location tracking for after-cleaning verification
- 🖼️ **Cleanups Gallery** - View all completed cleaning tasks with photos
- 🏆 **Sweeper Leaderboard** - Compete with other sweepers based on cleaning contributions
- 📊 **Statistics** - Track total cleanings, points earned, and performance
- ✅ **Task Management** - View task details, location, and status

### 👨‍💼 Admin Features
- 📊 **Dashboard** - System overview with statistics and analytics
- 👥 **User Approval** - Approve or reject citizen and sweeper registrations
- 🗺️ **Reports Map** - Visualize all garbage reports on an interactive map
- 🏆 **Leaderboard Management** - View and manage leaderboards for citizens and sweepers
- 📈 **Analytics** - Monitor system performance, reports, and user activity
- 🔍 **Report Verification** - Review and manage garbage reports

---

## 🏗️ Project Structure

```
AutonomousHacks_HackHive26-backend-firebase/
├── functions/                    # Firebase Cloud Functions (Backend)
│   ├── index.js                 # AI-powered report processing with Gemini
│   ├── package.json          # Backend dependencies
│   └── package-lock.json
├── src/
│   ├── pages/                   # React page components
│   │   ├── Login.jsx            # Login page with role selection
│   │   ├── Register.jsx         # Registration with citizen/sweeper role
│   │   ├── Dashboard.jsx        # Citizen dashboard
│   │   ├── Reports.jsx          # Citizen reports list
│   │   ├── Leaderboard.jsx      # Citizen leaderboard
│   │   ├── Report.jsx           # Camera-based garbage reporting
│   │   ├── AdminDashboard.jsx   # Admin dashboard
│   │   ├── AdminUserApproval.jsx # User approval interface
│   │   ├── AdminReportsMap.jsx  # Reports visualization map
│   │   ├── AdminLeaderboard.jsx # Admin leaderboard view
│   │   ├── SweeperDashboard.jsx # Sweeper dashboard
│   │   ├── SweeperTaskDetail.jsx # Task details view
│   │   ├── SweeperCamera.jsx    # Camera component (legacy)
│   │   └── SweeperCaptureClean.jsx # Live camera and location capture
│   ├── firebase.js              # Firebase configuration
│   ├── App.jsx                  # Main app with routing and role-based access
│   ├── App.css                  # Global styles with blue/sky blue theme
│   ├── ErrorBoundary.jsx        # Error handling component
│   └── index.jsx                # App entry point
├── public/
│   └── index.html               # HTML template
├── firebase.json                 # Firebase configuration
├── vite.config.js               # Vite build configuration
├── package.json                 # Frontend dependencies
└── README.md                    # This file
```

---

## 🔥 Firebase Collections

### `users` Collection
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: "citizen" | "sweeper" | "admin",
  points: number,
  totalReports: number,
  totalCleaned: number,
  approved: boolean,        // For admin approval
  createdAt: timestamp
}
```

### `reports` Collection
```javascript
{
  id: string,
  citizenId: string,
  imageBefore: string,      // Storage URL
  imageAfter: string,        // Storage URL (after cleaning)
  status: "pending" | "assigned" | "fake" | "verified",
  location: {
    lat: number,
    lng: number
  },
  locationName: string,      // Human-readable location
  assignedTo: string,        // Sweeper UID
  wasteType: "dry" | "wet",
  priority: "red" | "yellow" | "green",
  createdAt: timestamp,
  cleanedAt: timestamp,
  cleanedLocation: {
    lat: number,
    lng: number
  }
}
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Firebase account
- Google Gemini API key (for AI-powered waste detection)
- Git (optional)

### Step 1: Clone and Install

```bash
# Navigate to project directory
cd AutonomousHacks_HackHive26-backend-firebase

# Install frontend dependencies
npm install

# Install backend dependencies
cd functions
npm install
cd ..
```

### Step 2: Configure Firebase

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or use existing one

2. **Enable Firebase Services**
   - **Authentication**: Enable Email/Password provider
   - **Firestore**: Create database in production mode
   - **Storage**: Create storage bucket with default rules

3. **Get Firebase Credentials**
   - Go to Project Settings → General → Your apps
   - Copy the Firebase configuration object

4. **Update Firebase Config**
   - Open `src/firebase.js`
   - Replace placeholder config with your credentials:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### Step 3: Configure Firebase Storage Rules

In Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 4: Configure Firestore Rules

In Firebase Console → Firestore → Rules:

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

### Step 5: Set Up Backend Functions

1. **Install Firebase CLI** (if not installed):
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**:
```bash
firebase login
```

3. **Initialize Firebase** (if not already):
```bash
firebase init
```

4. **Set Gemini API Key**:
```bash
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"
```

   Or use environment variables (recommended):
   - Go to Firebase Console → Functions → Configuration
   - Add `GEMINI_KEY` as a string parameter

5. **Deploy Functions**:
```bash
firebase deploy --only functions
```

### Step 6: Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173` (Vite default port)

---

## 🔄 Application Workflow

### Citizen Report Flow

1. **Registration/Login**
   - Citizen registers with email/password
   - Selects "Citizen" role
   - Admin approves account (if approval required)

2. **Report Garbage**
   - Navigate to "Report" page
   - Camera automatically starts
   - Location is captured
   - Take photo of garbage
   - Upload report

3. **Backend Processing**
   - Image uploaded to `reports/before/{reportId}.jpg`
   - Report saved to Firestore with `status: "pending"`
   - Cloud Function triggers (`onReportUpload`)
   - Gemini AI analyzes image:
     - Detects if waste is present
     - Classifies as dry/wet
     - Assigns priority (red/yellow/green)
   - Status updated to `"assigned"` or `"fake"`

4. **Points Award**
   - If valid report: Citizen gets +50 points
   - If fake: No points awarded

### Sweeper Cleanup Flow

1. **Registration/Login**
   - Sweeper registers with email/password
   - Selects "Sweeper" role
   - Admin approves account

2. **View Assigned Tasks**
   - Sweeper dashboard shows all assigned reports
   - Tasks filtered by `assignedTo: sweeperId`

3. **Capture Clean**
   - Click "Capture Clean" in sidebar
   - Navigate to camera page with task details
   - Live camera and location tracking start
   - Take photo after cleaning
   - Upload with live location

4. **Verification**
   - Image uploaded to `reports/after/{reportId}.jpg`
   - Cloud Function triggers (`onAfterCleanUpload`)
   - Gemini AI verifies if area is clean
   - Report status updated to `"verified"`
   - Points awarded:
     - Sweeper: +50 points
     - Citizen: +50 points

### Admin Management Flow

1. **User Approval**
   - View pending user registrations
   - Approve or reject accounts
   - Users can only access system after approval

2. **Reports Monitoring**
   - View all reports on interactive map
   - Filter by status, priority, or date
   - Assign reports to sweepers manually (if needed)

3. **Analytics**
   - View system statistics
   - Monitor user activity
   - Track report completion rates

---

## 💰 Points System

| Action | Citizen Points | Sweeper Points |
|--------|----------------|----------------|
| Valid garbage report | +50 | - |
| Report verified as cleaned | +50 | +50 |
| Invalid/fake report | 0 | - |

**Leaderboard Rankings:**
- Citizens ranked by total points
- Sweepers ranked by total cleanings and points

---

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI library
- **React Router DOM 6** - Client-side routing
- **Vite** - Build tool and dev server
- **Firebase SDK 12** - Authentication, Firestore, Storage

### Backend
- **Firebase Cloud Functions** - Serverless backend
- **Google Gemini AI** - Image analysis and waste detection
- **Firebase Admin SDK** - Server-side Firebase operations

### Styling
- **CSS3** - Custom styling with CSS variables
- **Blue/Sky Blue Theme** - Consistent color scheme across all dashboards
- **Responsive Design** - Mobile and desktop support

---

## 📱 Key Features Details

### Camera Functionality
- **Live Camera Preview** - Real-time video stream
- **Camera Only** - No gallery uploads (backend requirement)
- **Location Tracking** - GPS coordinates captured at upload time
- **Live Location** - Continuous location updates for sweepers

### Navigation
- **Role-based Routing** - Automatic redirection based on user role
- **Left Sidebar Navigation** - Consistent across all dashboards
- **Active State Indicators** - Visual feedback for current page
- **Logout Functionality** - Available in all dashboards

### Real-time Updates
- **Firestore Listeners** - Real-time data synchronization
- **Status Updates** - Instant status changes reflected in UI
- **Leaderboard Updates** - Live ranking updates

---

## 🏗️ Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist/` directory, ready for deployment to:
- Firebase Hosting
- Netlify
- Vercel
- Any static hosting service

### Deploy to Firebase Hosting

```bash
# Initialize hosting (if not done)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

---

## 🔒 Security Considerations

1. **Authentication Required** - All routes protected by Firebase Auth
2. **Role-based Access** - Users can only access routes for their role
3. **Storage Rules** - Only authenticated users can upload/read images
4. **Firestore Rules** - Users can only modify their own data
5. **API Keys** - Keep Firebase and Gemini keys secure (use environment variables)

---

## 🐛 Troubleshooting

### Camera Not Working
- **Issue**: Camera doesn't start
- **Solution**: 
  - Ensure you're on HTTPS or localhost
  - Check browser permissions for camera access
  - Try a different browser

### Location Not Capturing
- **Issue**: GPS location not available
- **Solution**:
  - Enable location permissions in browser
  - Check device GPS settings
  - Try on a device with GPS (not desktop without location services)

### Firebase Connection Errors
- **Issue**: Cannot connect to Firebase
- **Solution**:
  - Verify Firebase config in `src/firebase.js`
  - Check internet connection
  - Verify Firebase project is active
  - Check Firebase console for service status

### Functions Not Triggering
- **Issue**: Cloud Functions not executing
- **Solution**:
  - Verify functions are deployed: `firebase functions:list`
  - Check Firebase Console → Functions for errors
  - Verify Gemini API key is set correctly
  - Check function logs in Firebase Console

### User Role Issues
- **Issue**: Wrong dashboard after login
- **Solution**:
  - Check user document in Firestore `users` collection
  - Verify `role` field is set correctly
  - Ensure user document exists after registration

---

## 📚 Additional Documentation

- `SETUP.md` - Detailed setup guide
- `QUICK_START.md` - Quick start instructions
- `FIREBASE_SETUP.md` - Firebase configuration details
- `ADMIN_SETUP.md` - Admin account setup
- `TROUBLESHOOTING.md` - Common issues and solutions
- `GET_FIREBASE_CREDENTIALS.md` - How to get Firebase credentials

---

## 🤝 Contributing

This is a municipal corporation initiative. For contributions:
1. Follow the existing code style
2. Test all features before submitting
3. Update documentation as needed

---

## 📄 License

A Municipal Corporation Initiative

---

## 👥 Support

For issues or questions:
- Check `TROUBLESHOOTING.md`
- Review Firebase Console logs
- Check browser console for errors

---

## 🎯 Future Enhancements

- Push notifications for task assignments
- In-app messaging between users
- Advanced analytics dashboard
- Mobile app versions (iOS/Android)
- Multi-language support
- Integration with municipal systems

---

**Built with ❤️ for Clean Cities**
