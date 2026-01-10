# CleanCity – Swachh Agent AI

Autonomous Municipal Garbage Intelligence Platform

CleanCity is an AI-powered, agent-driven waste management platform that enables verified citizens, verified municipal sweepers, and municipal authorities to report, prioritize, clean, and verify garbage using live camera capture, GPS validation, and Gemini AI-based visual intelligence.

Unlike traditional complaint apps, CleanCity operates as a self-governing AI system that verifies every report, assigns tasks autonomously, and confirms cleaning using before-and-after image analysis.

## Project Vision

Cities fail not because of lack of complaints, but because of fake reports, poor prioritization, and no verification of cleaning.

CleanCity solves this by creating a closed-loop AI agent that:

  1.Sees garbage from citizen photos

  2.Verifies authenticity & location

  3.Classifies urgency

  4.Assigns nearest sweeper

  5.Confirms cleaning

  6.Rewards honesty

  7.Penalizes fraud

## User Roles (Municipality Verified)

All users must be approved by municipality before using the system.

| Role        | Responsibility                        |
| ----------- | ------------------------------------- |
| **Citizen** | Reports garbage using live camera     |
| **Sweeper** | Cleans assigned locations             |
| **Admin**   | Approves users, monitors AI decisions |

---

## Features

###  Citizen Features
-  **Authentication** - Email/Password registration and login
-  **Camera-based Reporting** - Live camera capture (no gallery uploads) for garbage reporting
-  **GPS Location Tracking** - Automatic location capture at upload time
-  **Personal Dashboard** - View statistics, recent reports, and activity
-  **Reports Management** - Track all submitted reports with status updates
-  **Leaderboard** - See top contributors and your ranking
-  **Real-time Status Updates** - Track report status (pending → assigned/fake → verified)
-  **Points System** - Earn points for valid reports and verified cleanups

###  Sweeper Features
-  **My Tasks** - View all assigned garbage cleaning tasks
-  **Capture Clean** - Live camera and location tracking for after-cleaning verification
-  **Cleanups Gallery** - View all completed cleaning tasks with photos
-  **Sweeper Leaderboard** - Compete with other sweepers based on cleaning contributions
-  **Statistics** - Track total cleanings, points earned, and performance
-  **Task Management** - View task details, location, and status

###  Admin Features
-  **Dashboard** - System overview with statistics and analytics
-  **User Approval** - Approve or reject citizen and sweeper registrations
-  **Reports Map** - Visualize all garbage reports on an interactive map
-  **Leaderboard Management** - View and manage leaderboards for citizens and sweepers
-  **Analytics** - Monitor system performance, reports, and user activity
-  **Report Verification** - Review and manage garbage reports

---
---
## Camera & Location Integrity

CleanCity enforces real-world truth.

✔ Live camera only (no gallery uploads)
✔ GPS captured at upload time
✔ Timestamp bound to image
✔ AI checks fake or blank images
✔ Location mismatch detection

This prevents:
  1.Old photos
  2.Screenshots
  3.Fake complaints
  4.Spoofed locations

## Gemini AI Capabilities

Gemini is used for visual intelligence, not for location.

It performs:
  1.Garbage detection
  2.Dry vs wet waste classification
  3.Visual clutter estimation
  4.Priority scoring
  5.Before vs After comparison
  6.Fake / blank image detection

GPS is validated using metadata + system logic.

## AI Priority Engine
 Each report is classified automatically:
 | Level     | Meaning       | Action             |
| --------- | ------------- | ------------------ |
| 🔴 Red    | Heavy garbage | Immediate cleaning |
| 🟡 Yellow | Medium        | Urgent             |
| 🟢 Green  | Small         | Clean on route     |

---

##  Project Structure

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

## Trust-Based Reward System

Points are awarded only after AI verification.

| Action                 | Citizen | Sweeper |
| ---------------------- | ------- | ------- |
| Valid garbage detected | +2      | –       |
| Cleaning verified      | +2      | +4      |
| Fake upload            | 0       | Penalty |


**Leaderboard Rankings:**
- Citizens ranked by total points
- Sweepers ranked by total cleanings and points
- Leaderboards are based on verified impact, not uploads.

## Google Maps Usage
  Maps API is used to:
  Show garbage locations
  Display sweeper routes
  Find nearest available cleaner
  Group multiple reports from same area

---

## Tech Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Frontend      | React + PWA                                    |
| Backend       | Firebase (Auth, Firestore, Storage, Functions) |
| AI            | Google Gemini Vision                           |
| Maps          | Google Maps API                                |
| Notifications | Firebase Cloud Messaging                       |

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

## 🔒 Security Considerations

1. **Authentication Required** - All routes protected by Firebase Auth
2. **Role-based Access** - Users can only access routes for their role
3. **Storage Rules** - Only authenticated users can upload/read images
4. **Firestore Rules** - Users can only modify their own data
5. **API Keys** - Keep Firebase and Gemini keys secure (use environment variables)

---

## 📚 Additional Documentation

- `SETUP.md` - Detailed setup guide
- `QUICK_START.md` - Quick start instructions
- `FIREBASE_SETUP.md` - Firebase configuration details
- `ADMIN_SETUP.md` - Admin account setup
- `TROUBLESHOOTING.md` - Common issues and solutions
- `GET_FIREBASE_CREDENTIALS.md` - How to get Firebase credentials

---
## Why CleanCity is Agentic AI

CleanCity is not a form-based app.
It is a Swachh Agent that:
  - Observes the city
  - Understands waste
  - Makes decisions
  - Executes cleaning
  - Verifies results
  - Learns user trust

This is autonomous urban sanitation.


## Future Enhancements

  - Smart bins & IoT integration
  - Drone-based waste scanning
  - Predictive garbage hotspots
  - Government ERP integration
  - Citizen reward partnerships
---
---
## CleanCity = AI That Cleans Cities

A real-time, AI-verified, location-trusted waste intelligence platform for smart cities.

---

