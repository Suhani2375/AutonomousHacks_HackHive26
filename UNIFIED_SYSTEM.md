# ✅ Unified System Setup Complete!

## 🎯 What's Been Done

I've integrated everything so you can run all portals with **ONE COMMAND**!

## 🚀 How to Use

### Simple Command (Recommended)
```bash
npm run dev
```

This single command will:
- ✅ Start Citizen Portal on http://localhost:3000
- ✅ Start Sweeper Portal on http://localhost:3001
- ✅ Start Admin Portal on http://localhost:3002
- ✅ Run all three in parallel

### Alternative Methods

**Windows PowerShell:**
```powershell
.\start-all.ps1
```

**Linux/Mac:**
```bash
chmod +x start-all.sh
./start-all.sh
```

**Node.js (Cross-platform):**
```bash
node start-all.js
```

## 📦 Available Commands

### Development
```bash
npm run dev              # Start ALL portals (recommended)
npm run dev:citizen      # Start only Citizen Portal
npm run dev:sweeper      # Start only Sweeper Portal
npm run dev:admin        # Start only Admin Portal
```

### Build
```bash
npm run build            # Build ALL portals
npm run build:citizen    # Build only Citizen Portal
npm run build:sweeper    # Build only Sweeper Portal
npm run build:admin      # Build only Admin Portal
```

### Setup & Installation
```bash
npm run install:all      # Install dependencies for all portals
npm run setup           # Full setup (env files + install all)
```

## 📁 Files Created

1. **Root `package.json`** - Unified scripts for all portals
2. **`start-all.js`** - Node.js script to start all portals
3. **`start-all.ps1`** - PowerShell script for Windows
4. **`start-all.sh`** - Bash script for Linux/Mac
5. **`QUICK_START.md`** - Quick reference guide
6. **Updated `README.md`** - Complete documentation

## 🔧 How It Works

The `npm run dev` command uses `npm-run-all` to:
1. Run all three portal dev servers in parallel
2. Show output from all three in the same terminal
3. Allow you to stop all with Ctrl+C

## ✨ Benefits

- ✅ **One command** to start everything
- ✅ **Parallel execution** - all portals start simultaneously
- ✅ **Unified output** - see all logs in one place
- ✅ **Easy to stop** - Ctrl+C stops everything
- ✅ **Cross-platform** - works on Windows, Mac, Linux

## 🎯 Next Steps

1. **Start everything:**
   ```bash
   npm run dev
   ```

2. **Access your portals:**
   - Citizen: http://localhost:3000
   - Sweeper: http://localhost:3001
   - Admin: http://localhost:3002

3. **Test the application** (see `NEXT_STEPS.md`)

## 🛑 Stopping Servers

Simply press `Ctrl+C` in the terminal where you ran `npm run dev`

---

**🎉 Everything is now integrated! Just run `npm run dev` and you're ready to go!**

