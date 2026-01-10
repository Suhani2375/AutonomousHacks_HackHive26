# Quick Start Guide

## Step 1: Start the Development Server

Open a terminal in the project directory and run:

```bash
npm run dev
```

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

## Step 2: Open in Browser

Click the link or manually open `http://localhost:3000` in your browser.

## Step 3: What You Should See

- **If Firebase is NOT configured**: You'll see the Login page with a red warning banner saying "Firebase not configured"
- **If Firebase IS configured**: You'll see the Login page normally

## Common Issues & Solutions

### Issue: "Cannot GET /" or 404 Error

**Solution**: Make sure the dev server is running. Check terminal for the Vite server output.

### Issue: Blank White Screen

**Check Browser Console (F12)**:
- If you see "Firebase config not set" - this is normal, the UI should still load
- If you see other errors, note them down

**Check Terminal**:
- Look for any error messages in red
- Make sure it says "ready" and shows a local URL

### Issue: "Module not found" errors

**Solution**: Run `npm install` again:
```bash
npm install
npm run dev
```

### Issue: Port 3000 already in use

**Solution**: Either:
1. Kill the process using port 3000
2. Or change the port in `vite.config.js`:
```javascript
server: {
  port: 3001,  // Change to another port
  open: true
}
```

## Verify Setup

Run this to check if all files are in place:
```bash
node test-server.js
```

## Still Having Issues?

1. **Check Browser Console (F12 → Console tab)**
   - Copy any red error messages
   - Share them for debugging

2. **Check Terminal Output**
   - Look for any error messages
   - Make sure it shows "ready"

3. **Try Hard Refresh**
   - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

4. **Clear Browser Cache**
   - Or try in an incognito/private window

## Expected Behavior

✅ **Working**: Login page loads, you can see the CleanCity logo and form
❌ **Not Working**: Blank page, 404 error, or JavaScript errors in console
