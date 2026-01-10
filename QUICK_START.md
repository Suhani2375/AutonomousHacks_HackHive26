# 🚀 Quick Start Guide

## One Command to Run Everything!

### Windows (PowerShell)
```powershell
npm run dev
```

Or use the script:
```powershell
.\start-all.ps1
```

### Linux/Mac (Bash)
```bash
npm run dev
```

Or use the script:
```bash
chmod +x start-all.sh
./start-all.sh
```

### Node.js (Cross-platform)
```bash
node start-all.js
```

## What This Does

Running `npm run dev` will automatically:
- ✅ Start Citizen Portal on http://localhost:3000
- ✅ Start Sweeper Portal on http://localhost:3001
- ✅ Start Admin Portal on http://localhost:3002

All three servers run in parallel!

## First Time Setup

If this is your first time, run:

```bash
npm run setup
```

This will:
1. Create all `.env` files
2. Install dependencies for all portals
3. Install root dependencies

## Available Commands

### Development
```bash
npm run dev              # Start all portals
npm run dev:citizen      # Start only Citizen Portal
npm run dev:sweeper      # Start only Sweeper Portal
npm run dev:admin        # Start only Admin Portal
```

### Build
```bash
npm run build            # Build all portals
npm run build:citizen    # Build only Citizen Portal
npm run build:sweeper    # Build only Sweeper Portal
npm run build:admin      # Build only Admin Portal
```

### Setup
```bash
npm run install:all      # Install all dependencies
npm run setup           # Full setup (env + install)
```

## Access Your Portals

Once running, access:
- 🌐 **Citizen Portal**: http://localhost:3000
- 🧹 **Sweeper Portal**: http://localhost:3001
- 👨‍💼 **Admin Portal**: http://localhost:3002

## Stopping Servers

Press `Ctrl+C` in the terminal where you ran `npm run dev` to stop all servers.

## Troubleshooting

### Port Already in Use
If a port is already in use, you can:
1. Stop the process using that port
2. Or change the port in the portal's `vite.config.js`

### Dependencies Not Installed
Run:
```bash
npm run install:all
```

### Environment Variables Missing
Run:
```bash
node setup-env.js
```

---

**That's it! Just run `npm run dev` and everything starts automatically! 🎉**

