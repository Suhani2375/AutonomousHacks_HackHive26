# CleanCity - Municipal Garbage Reporting

A citizen-facing web application for reporting garbage issues in municipal areas. Built with React and Firebase.

## Features

- 🔐 User Authentication (Email/Password)
- 📸 Camera-based garbage reporting (camera only, no gallery upload)
- 📍 GPS location capture
- 📊 Dashboard with statistics and recent activity
- 📋 Reports list with status tracking
- 🏆 Leaderboard showing top contributors
- ✅ Real-time status updates (pending → assigned/fake → verified)

## Project Structure

```
├── functions/          # Firebase Cloud Functions (Backend)
│   ├── index.js       # AI-powered report processing
│   └── package.json
├── src/
│   ├── pages/         # React page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Reports.jsx
│   │   ├── Leaderboard.jsx
│   │   └── Report.jsx  # Camera-based reporting
│   ├── firebase.js    # Firebase configuration
│   ├── App.jsx        # Main app with routing
│   └── App.css        # Styles
├── public/
│   └── index.html
└── package.json       # Frontend dependencies

```

## Firebase Collections

The app uses the following Firestore collections:

- **users**: User profiles with points, totalReports, totalCleaned
- **reports**: Garbage reports with citizenId, imageBefore, status, location, etc.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Set up Firebase Storage
5. Copy your Firebase config and update `src/firebase.js`:

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

### 3. Set Up Backend Functions

```bash
cd functions
npm install
```

Configure the Gemini API key:
```bash
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"
```

Deploy functions:
```bash
firebase deploy --only functions
```

### 4. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Backend Integration

The frontend integrates with Firebase Cloud Functions:

- **onReportUpload**: Triggered when a citizen uploads a report image. Uses Gemini AI to detect waste and classify it.
- **onAfterCleanUpload**: Triggered when a cleaner uploads an after-clean image. Verifies if the area is clean.

### Report Flow

1. Citizen captures photo → Uploads to `reports/before/{reportId}.jpg`
2. Report saved to Firestore with `status: "pending"`
3. Backend function processes image → Updates status to `"assigned"` or `"fake"`
4. If assigned, cleaner uploads after image → Status updates to `"verified"`

### Points System

- Real report detected: +2 points
- Report verified as cleaned: +2 points (citizen) + 2 points (cleaner)

## Important Notes

- **Camera Only**: The Report page only allows camera capture, no gallery uploads (backend requirement)
- **Location Required**: GPS location is captured at upload time
- **Field Names**: Uses exact field names expected by backend (`citizenId`, `imageBefore`, etc.)
- **Storage Path**: Images stored at `reports/before/{reportId}.jpg`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Technologies Used

- React 18
- React Router 6
- Firebase (Auth, Firestore, Storage)
- Vite
- Firebase Cloud Functions
- Google Gemini AI

## License

A Municipal Corporation Initiative
