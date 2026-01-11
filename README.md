# NeuroClean - Municipal Garbage Reporting System

A comprehensive PWA solution for municipal garbage reporting with AI-powered waste detection, citizen engagement, sweeper management, and admin oversight.

## 🚀 Quick Start

### One Command to Run Everything!

```bash
npm run dev
```

This starts all three portals automatically:
- 🌐 Citizen Portal: http://localhost:3000
- 🧹 Sweeper Portal: http://localhost:3001
- 👨‍💼 Admin Portal: http://localhost:3002
- 🏠 Landing Page: http://localhost:3003

### First Time Setup

```bash
npm run setup
```

This will:
1. Create all `.env` files with Firebase configuration
2. Install all dependencies

## 🏗️ Project Structure

```
.
├── citizen-portal/      # React PWA for citizens
├── sweeper-portal/      # React PWA for sweepers
├── admin-portal/         # React PWA for admins
├── shared/               # Shared utilities and configs
└── functions/           # Firebase Cloud Functions (Backend)
```

## 📦 Available Commands

### Development
- `npm run dev` - Start all portals
- `npm run dev:citizen` - Start only Citizen Portal
- `npm run dev:sweeper` - Start only Sweeper Portal
- `npm run dev:admin` - Start only Admin Portal

### Build
- `npm run build` - Build all portals
- `npm run build:citizen` - Build Citizen Portal
- `npm run build:sweeper` - Build Sweeper Portal
- `npm run build:admin` - Build Admin Portal

### Setup
- `npm run install:all` - Install all dependencies
- `npm run setup` - Full setup (env + install)
- `npm run create-admin` - Create admin user

## 🎯 Tech Stack

### Frontend
- ⚛️ React 18
- 📱 PWA (Progressive Web App)
- 📷 Camera API (no gallery)
- 📍 Geolocation API
- 🗺️ Google Maps API

### Backend
- 🔥 Firebase
  - Authentication
  - Firestore
  - Storage
  - Cloud Functions
  - Cloud Messaging

### AI
- 🤖 Gemini AI (gemini-1.5-flash)
  - Image understanding
  - Waste detection
  - Dry/Wet/Mixed classification
  - Fake image detection
  - Before/After comparison

## 🔐 Firebase Configuration

Your Firebase configuration is already set up in:
- `shared/firebase-config.js`
- `.env` files in each portal

**Project**: `hackhive-autonomous`

### Required Environment Variables

Each portal needs a `.env` file with:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=hackhive-autonomous.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hackhive-autonomous
VITE_FIREBASE_STORAGE_BUCKET=hackhive-autonomous.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=853119952270
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Firebase Functions Setup

1. **Set Gemini API Key**:
```bash
cd functions
firebase functions:secrets:set GEMINI_KEY
# Paste your Gemini API key when prompted
```

2. **Deploy Functions**:
```bash
cd functions
firebase deploy --only functions
```

3. **Check Logs**:
```bash
firebase functions:log
```

## 📱 Features

### Citizen Portal
- 📱 Report garbage with camera (camera-only, no gallery)
- 📍 Automatic location capture with GPS
- 📊 View personal reports and points
- 🏆 Leaderboard
- 📱 PWA - Install as app
- 🏷️ View AI classification (dry/wet/mixed) for each report

### Sweeper Portal
- 📋 View assigned tasks
- 🔍 Filter by priority (High/Medium/Low)
- 📍 Navigate to task locations
- 📷 Capture after-cleaning photos
- ✅ Complete tasks
- 🏷️ View AI classification and severity for tasks

### Admin Portal
- 👥 Approve/Reject user registrations
- 📊 Dashboard with statistics
- 🗺️ Reports map visualization
- 🏆 Leaderboard management
- 📈 Weekly statistics
- 🏷️ View and manage AI classifications

## 🧩 How Everything Connects

1. **Citizen uploads photo** → Firebase Storage
2. **Cloud Function triggered** → `onReportUpload`
3. **AI Analysis** (Gemini 1.5 Flash):
   - ✅ Fake/Stock photo detection (STRICT)
   - ✅ Real waste detection (STRICT)
   - ✅ Dry/Wet/Mixed classification (PRECISE)
   - ✅ Severity assessment (Red/Yellow/Green)
4. **Validation**:
   - If fake → Status: "fake" (REJECTED)
   - If invalid → Status: "invalid" (REJECTED)
   - If no waste → Status: "no_waste" (REJECTED)
   - If valid → Status: "assigned" (ACCEPTED)
5. **Classification Stored**: Always in lowercase: "dry", "wet", "mixed", or "none"
6. **Location saved** with GPS coordinates
7. **Points assigned** (+2 for valid reports)
8. **Sweeper notified** of new task
9. **After cleaning** → sweeper uploads new image
10. **Gemini compares** before/after images
11. **Verifies cleaning** → Points updated (+2 to citizen, +2 to sweeper)

## 📝 Firestore Schema

### Users Collection
```
users/{userId}
  - email: string
  - name: string
  - role: 'citizen' | 'sweeper' | 'admin'
  - points: number
  - status: 'pending' | 'approved' | 'rejected'
  - employeeId: string (for sweepers)
  - createdAt: timestamp
```

### Reports Collection
```
reports/{reportId}
  - citizenId: string
  - imageBefore: string (URL)
  - imageAfter: string (URL)
  - location: { 
      lat: number, 
      lng: number, 
      address: string,
      timestamp: timestamp
    }
  - status: 'pending' | 'assigned' | 'cleaned' | 'verified' | 'fake' | 'invalid' | 'no_waste'
  - priority: 1 | 2 | 3 (1 = red/high, 2 = yellow/medium, 3 = green/low)
  - wasteDetected: 'yes' | 'no'
  - wasteType: string
  - classification: 'dry' | 'wet' | 'mixed' | 'none'
  - level: 'red' | 'yellow' | 'green'
  - assignedSweeper: string
  - aiConfidence: number (0.0-1.0)
  - aiDescription: string
  - imageValid: boolean
  - isRealPhoto: boolean
  - isFake: boolean
  - aiAnalysisDetails: object
  - autonomousAnalysis: object
  - createdAt: timestamp
  - cleanedAt: timestamp
  - verifiedAt: timestamp
  - history: array
```

## 🤖 AI Features

### Image Analysis
- **Fake Detection**: Rejects stock photos, professional photography, screenshots
- **Waste Detection**: Identifies actual garbage/waste in images
- **Classification**: Precisely classifies as:
  - `dry`: Plastic, paper, metal, glass (recyclable)
  - `wet`: Food scraps, organic matter, compostable
  - `mixed`: Both dry and wet waste present
  - `none`: No waste detected
- **Severity Assessment**: 
  - `red`: Urgent (large accumulation, health hazard)
  - `yellow`: Moderate (manageable amount)
  - `green`: Low (small amount, minimal impact)

### Before/After Comparison
- Verifies same location
- Checks if cleaning was successful
- Detects suspicious activity (after image not cleaner)
- Awards points only for verified cleaning

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### Deploy Cloud Functions
```bash
cd functions
firebase deploy --only functions
```

## 🔍 Troubleshooting

### Port Already in Use
Change ports in `vite.config.js` of the respective portal.

### Dependencies Not Installed
```bash
npm run install:all
```

### Environment Variables Missing
```bash
node setup-env.js
```

### AI Not Working
1. **Check Gemini API Key**:
   ```bash
   firebase functions:secrets:access GEMINI_KEY
   ```
   If not set:
   ```bash
   firebase functions:secrets:set GEMINI_KEY
   ```

2. **Check Function Logs**:
   ```bash
   firebase functions:log
   ```

3. **Verify Model**: Functions use `gemini-1.5-flash` (fast and efficient)

### Camera Not Working
- Ensure HTTPS or localhost (required for camera API)
- Check browser permissions for camera access

### Geolocation Not Working
- Check browser permissions for location access
- Ensure HTTPS or localhost

### Points Not Awarded
Points are only awarded if:
- `isValid === true` (all validations pass)
- `status === "assigned"` (for initial report)
- `status === "verified"` (for completed cleaning)

Check Cloud Functions logs to see which validation failed.

### Classification Not Showing
1. Check Firestore - `classification` field should be populated
2. Check Cloud Functions logs for AI analysis
3. Verify UI components are displaying the field

## 👥 Creating Admin User

### Method 1: Using Script
```bash
npm run create-admin
```

### Method 2: Using Browser Tool
Open `create-admin-browser.html` in your browser and follow the instructions.

### Method 3: Firebase Console
1. Go to Firebase Console → Authentication
2. Add user manually
3. Go to Firestore → `users` collection
4. Create document with:
   - `email`: admin email
   - `role`: "admin"
   - `status`: "approved"

## 📊 Expected AI Behavior

### Valid Waste Image (Real Photo):
- ✅ `isFake: false`
- ✅ `wasteDetected: "yes"`
- ✅ `classification: "dry"` or `"wet"` or `"mixed"`
- ✅ `status: "assigned"`
- ✅ Points awarded (+2)

### Fake/Stock Photo:
- ❌ `isFake: true`
- ❌ `status: "fake"`
- ❌ No points awarded
- ❌ Report rejected

### No Waste Detected:
- ❌ `wasteDetected: "no"`
- ❌ `status: "no_waste"`
- ❌ No points awarded
- ❌ Report rejected

### Invalid Image:
- ❌ `imageValid: false` or `isRealPhoto: false`
- ❌ `status: "invalid"`
- ❌ No points awarded
- ❌ Report rejected

## 👥 Team

- Member 1: Frontend (Citizen Side)
- Member 2: Sweeper + Admin UI
- Member 3: Firebase & Backend
- Member 4: AI & Maps

## 📄 License

This project is part of HackHive26 hackathon.

---

**🎉 Just run `npm run dev` and everything starts automatically!**
