#!/bin/bash
# Bash script to start all development servers
# Run this script to start all three portals

echo "🚀 Starting CleanCity Development Servers..."
echo ""

# Start Citizen Portal
echo "📱 Starting Citizen Portal on port 3000..."
cd citizen-portal && npm run dev &
CITIZEN_PID=$!

sleep 2

# Start Sweeper Portal
echo "🧹 Starting Sweeper Portal on port 3001..."
cd ../sweeper-portal && npm run dev &
SWEEPER_PID=$!

sleep 2

# Start Admin Portal
echo "👨‍💼 Starting Admin Portal on port 3002..."
cd ../admin-portal && npm run dev &
ADMIN_PID=$!

echo ""
echo "✅ All servers starting!"
echo ""
echo "Access the portals at:"
echo "  - Citizen Portal: http://localhost:3000"
echo "  - Sweeper Portal: http://localhost:3001"
echo "  - Admin Portal: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "kill $CITIZEN_PID $SWEEPER_PID $ADMIN_PID 2>/dev/null; exit" INT
wait

