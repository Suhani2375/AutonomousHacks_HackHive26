# How to Restart the Server

## Steps:

1. **Stop the current server:**
   - In the terminal where `npm run dev` is running
   - Press `Ctrl+C` (or `Cmd+C` on Mac)
   - Wait for it to stop

2. **Start it again:**
   ```bash
   npm run dev
   ```

3. **Wait for this message:**
   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:3000/
   ```

4. **Open in browser:**
   - Click the link or manually go to `http://localhost:3000/`
   - Try hard refresh: `Ctrl+Shift+R` if you see cached content

## If Still Getting 404:

1. **Check you're in the right directory:**
   ```bash
   # Should show files like package.json, vite.config.js, src/, public/
   ls
   # or on Windows:
   dir
   ```

2. **Verify files exist:**
   ```bash
   # Check if these files exist:
   - public/index.html
   - src/index.jsx
   - src/App.jsx
   ```

3. **Try a different port:**
   - Edit `vite.config.js`
   - Change `port: 3000` to `port: 3001`
   - Restart server
   - Go to `http://localhost:3001/`

4. **Clear browser cache completely:**
   - Or use incognito/private window
