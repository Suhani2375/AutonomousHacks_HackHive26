# CleanCity – Swachh Agent AI  

**Autonomous Municipal Garbage Intelligence Platform**

CleanCity is an AI-powered, agent-driven waste management system that enables **verified citizens**, **municipal sweepers**, and **city authorities** to report, prioritize, clean, and verify garbage using **live camera capture**, **GPS validation**, and **Gemini-powered visual intelligence**.

Unlike traditional complaint apps, CleanCity works as a **closed-loop AI system** that verifies every report, assigns tasks automatically, and confirms cleaning using **before-and-after image analysis**.

---

## Project Vision

Cities do not fail because of a lack of complaints — they fail due to:

- Fake reports  
- Poor prioritization  
- No cleaning verification  

CleanCity fixes this using an **autonomous AI agent** that:

1. Detects garbage from citizen photos  
2. Verifies authenticity and location  
3. Classifies urgency  
4. Assigns the nearest sweeper  
5. Confirms cleaning  
6. Rewards honest users  
7. Penalizes abuse  

---

## User Roles (Municipality Verified)

All users must be approved by the municipality.

| Role | Responsibility |
|------|----------------|
| **Citizen** | Reports garbage using live camera |
| **Sweeper** | Cleans assigned locations |
| **Admin** | Approves users, monitors AI decisions |

---

## Features

### Citizen
- Live camera garbage reporting  
- GPS-based location capture  
- Report tracking (Pending → Assigned → Verified/Fake)  
- Leaderboard & points  
- Personal dashboard  

### Sweeper
- Assigned cleaning tasks  
- Live camera + GPS for after-clean verification  
- Performance statistics  
- Sweeper leaderboard  

### Admin
- User approval system  
- City-wide garbage map  
- AI verification control  
- Analytics & monitoring  
- Leaderboard management  

---

## Camera & Location Integrity

CleanCity enforces **real-world truth**.

✔ Live camera only (no gallery)  
✔ GPS captured at upload  
✔ Timestamp bound to image  
✔ AI fake & blank detection  
✔ Location mismatch detection  

Prevents:
- Old photos  
- Screenshots  
- Fake reports  
- GPS spoofing  

---

## Gemini AI Capabilities

Gemini is used for **visual intelligence**, not location.

It performs:
- Garbage detection  
- Dry vs wet classification  
- Clutter estimation  
- Priority scoring  
- Before vs after comparison  
- Fake image detection  

---

## AI Priority Engine

| Level | Meaning | Action |
|------|--------|--------|
| Red | Heavy garbage | Immediate |
| Yellow | Medium | Urgent |
| Green | Small | On-route |

---

##  Project Structure

```
AutonomousHacks_HackHive26-backend-firebase/
├── functions/ # Firebase Cloud Functions
│ └── index.js # Gemini-powered AI logic
├── src/
│ ├── pages/ # React Pages
│ ├── firebase.js # Firebase config
│ ├── App.jsx # Routing & role access
│ └── index.jsx # App entry
├── public/
├── firebase.json
├── vite.config.js
├── package.json
└── README.md
```

---
---

## Firestore Data Model

### `users` Collection
```js
{
  uid: string,
  email: string,
  displayName: string,
  role: "citizen" | "sweeper" | "admin",
  points: number,
  totalReports: number,
  totalCleaned: number,
  approved: boolean,
  createdAt: timestamp
}
### `reports` Collection
{
  citizenId: string,
  imageBefore: string,
  imageAfter: string,
  status: "pending" | "assigned" | "fake" | "verified",
  location: {
    lat: number,
    lng: number
  },
  assignedTo: string,
  wasteType: "dry" | "wet",
  priority: "red" | "yellow" | "green",
  createdAt: timestamp,
  cleanedAt: timestamp
}


**## Setup Instructions
**
**### Prerequisites
**- Node.js 18+ installed
- Firebase account
- Google Gemini API key (for AI-powered waste detection)
- Git (optional)

**### Step 1: Clone and Install
**
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

## Google Maps 
  Used for :
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
| Maps          | Google Maps                                |
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

## Security

- **Firebase Authentication**
- **Role-based routing**
- **Secure Firestore & Storage rules**
- **Live camera enforcement**
- **No gallery uploads**

---
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

CleanCity is not a form-based complaint app.  
It is an **autonomous sanitation agent** that:

- **Observes**
- **Understands**
- **Decides**
- **Acts**
- **Verifies**
- **Learns**

---

## Future Enhancements

  - Smart bins & IoT integration
  - Drone-based waste scanning
  - Predictive garbage hotspots
  - Government ERP integration
  - Citizen reward partnerships
---
---
## CleanCity = AI That Cleans Cities

*A real-time, AI-verified, location-trusted waste intelligence platform for smart cities.*

---

