# CleanCity - Municipal Garbage Reporting System

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
- 🤖 Gemini AI
  - Image understanding
  - Waste detection
  - Dry/Wet classification
  - Fake image detection
  - Before/After comparison

## 🔐 Firebase Configuration

Your Firebase configuration is already set up in:
- `shared/firebase-config.js`
- `.env` files in each portal

Project: `hackhive-autonomous`

## 📱 Features

### Citizen Portal
- 📱 Report garbage with camera
- 📍 Automatic location capture
- 📊 View personal reports and points
- 🏆 Leaderboard
- 📱 PWA - Install as app

### Sweeper Portal
- 📋 View assigned tasks
- 🔍 Filter by priority (High/Medium/Low)
- 📍 Navigate to task locations
- 📷 Capture after-cleaning photos
- ✅ Complete tasks

### Admin Portal
- 👥 Approve/Reject user registrations
- 📊 Dashboard with statistics
- 🗺️ Reports map visualization
- 🏆 Leaderboard management
- 📈 Weekly statistics

## 🧩 How Everything Connects

1. Citizen uploads photo → Firebase Storage
2. Cloud Function sends image to Gemini
3. Gemini returns:
   - Waste or not
   - Dry/Wet
   - Level (red/yellow/green)
4. Location saved
5. Points assigned
6. Sweeper notified
7. After cleaning → new image
8. Gemini compares → verifies
9. Points updated

## 📝 Firestore Schema

### Users Collection
```
users/{userId}
  - email: string
  - role: 'citizen' | 'sweeper' | 'admin'
  - points: number
  - status: 'pending' | 'approved' | 'rejected'
  - createdAt: timestamp
```

### Reports Collection
```
reports/{reportId}
  - citizenId: string
  - imageBefore: string (URL)
  - imageAfter: string (URL)
  - location: { lat: number, lng: number, address: string }
  - status: 'pending' | 'assigned' | 'cleaned' | 'verified' | 'fake'
  - priority: 1 | 2 | 3
  - wasteDetected: 'yes' | 'no'
  - wasteType: 'dry' | 'wet'
  - level: 'red' | 'yellow' | 'green'
  - assignedSweeper: string
  - createdAt: timestamp
  - cleanedAt: timestamp
  - history: array
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

## 📚 Documentation

- `QUICK_START.md` - Quick start guide
- `NEXT_STEPS.md` - Testing and setup guide
- `SETUP.md` - Detailed setup instructions
- `FIREBASE_CONFIGURED.md` - Firebase configuration details

## 🐛 Troubleshooting

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

## 👥 Team

- Member 1: Frontend (Citizen Side)
- Member 2: Sweeper + Admin UI
- Member 3: Firebase & Backend
- Member 4: AI & Maps

## 📄 License

This project is part of HackHive26 hackathon.

---

**🎉 Just run `npm run dev` and everything starts automatically!**
