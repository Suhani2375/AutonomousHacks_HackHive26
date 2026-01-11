# Quick Deployment Guide - AI Functions Fix

## What Was Fixed

### 1. Sweeper Dashboard Issues ✅
- **Fixed**: Removed double `orderBy` that required composite index
- **Fixed**: Added proper location permission requests with user notifications
- **Fixed**: Added real-time updates using `onSnapshot` for live task updates
- **Fixed**: Improved error handling and user feedback

### 2. AI Functions ✅
- **Fixed**: Added proper path filters (`matchGlob`) for storage triggers
- **Fixed**: Added better error handling and logging
- **Fixed**: Functions now properly trigger on `_before.jpg` and `_after.jpg` uploads

## Deployment Steps

### Step 1: Set GEMINI_KEY (REQUIRED for AI to work)
```bash
cd functions
firebase functions:secrets:set GEMINI_KEY
# When prompted, enter your Google Gemini API key
```

### Step 2: Deploy Functions
```bash
cd functions
npm install  # Make sure dependencies are installed
firebase deploy --only functions
```

### Step 3: Verify Functions Are Deployed
```bash
firebase functions:list
```

You should see:
- `onReportUpload` - triggers when citizens upload before images
- `onAfterCleanUpload` - triggers when sweepers upload after images

### Step 4: Test the System

1. **Test Citizen Portal**:
   - Upload a waste report with photo
   - Check Firebase Console → Functions → Logs to see AI analysis
   - Report should get AI classification (dry/wet/mixed) and priority

2. **Test Sweeper Portal**:
   - Login as sweeper
   - Dashboard should show tasks (not empty)
   - Location permission should be requested
   - Tasks should be sorted by distance if location is available

3. **Test Before/After AI**:
   - Sweeper uploads after-clean photo
   - Check Functions logs for before/after comparison
   - Report status should update to "verified" if cleaning is successful

## Troubleshooting

### If Dashboard is Still Empty:
1. Check if tasks are assigned to the sweeper in Firestore
2. Check browser console for errors
3. Verify location permission is granted
4. Check Firestore security rules allow reading reports

### If AI is Not Working:
1. Verify GEMINI_KEY is set: `firebase functions:secrets:access GEMINI_KEY`
2. Check Functions logs: `firebase functions:log`
3. Verify storage triggers are active in Firebase Console
4. Check that images are uploaded to `reports/**/*_before.jpg` or `reports/**/*_after.jpg`

### If Location Not Working:
1. Check browser permissions (Settings → Privacy → Location)
2. Try on HTTPS (required for geolocation)
3. Check browser console for errors

## Key Changes Made

### sweeper-portal/src/pages/Dashboard.jsx
- Removed double `orderBy` (caused index requirement error)
- Added `onSnapshot` for real-time updates
- Added location permission handling with user notifications
- Improved error handling

### functions/index.js
- Added `matchGlob` filters for storage triggers
- Added better logging and error handling
- Fixed function syntax

## Next Steps

1. Deploy functions with GEMINI_KEY set
2. Test citizen report upload → AI should analyze
3. Test sweeper dashboard → should show tasks
4. Test sweeper photo upload → AI should compare before/after

All AI functionality should now work correctly!
