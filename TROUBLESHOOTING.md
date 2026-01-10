# Troubleshooting Guide

## UI Not Loading / Showing Blank Page

### 1. Check if Dev Server is Running
```bash
npm run dev
```
You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 2. Check Browser Console
Open browser DevTools (F12) and check the Console tab for errors.

Common errors:
- **Firebase not configured**: Update `src/firebase.js` with your Firebase credentials
- **Module not found**: Run `npm install` to install dependencies
- **Port already in use**: Change port in `vite.config.js` or kill the process using port 3000

### 3. Verify Dependencies
```bash
npm install
```

### 4. Check Firebase Configuration
Open `src/firebase.js` and ensure you've replaced the placeholder values:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  // ... etc
};
```

**Note**: The UI will still load even if Firebase isn't configured, but you'll see a warning message.

### 5. Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

### 6. Check File Structure
Ensure these files exist:
- `public/index.html`
- `src/index.js`
- `src/App.jsx`
- `src/firebase.js`
- `src/pages/Login.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/Reports.jsx`
- `src/pages/Leaderboard.jsx`
- `src/pages/Report.jsx`
- `src/App.css`

### 7. Verify Node.js Version
```bash
node --version
```
Should be Node.js 18 or higher.

### 8. Check for Port Conflicts
If port 3000 is in use, Vite will automatically use the next available port. Check the terminal output for the actual URL.

### 9. Rebuild Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Common Issues

### "Cannot find module" errors
- Run `npm install`
- Check that all files exist in the correct locations

### Firebase errors
- Update `src/firebase.js` with your Firebase project credentials
- Ensure Firebase services are enabled (Auth, Firestore, Storage)

### White/blank screen
- Check browser console for JavaScript errors
- Verify React is loading (check Network tab for `index.js`)
- Ensure `public/index.html` has the script tag: `<script type="module" src="/src/index.js"></script>`

### Styles not loading
- Check that `src/App.css` exists
- Verify it's imported in `src/App.jsx`: `import "./App.css";`

## Still Not Working?

1. Check terminal output for any error messages
2. Check browser console (F12) for JavaScript errors
3. Verify all files are saved
4. Try restarting the dev server
5. Check if antivirus/firewall is blocking the connection
