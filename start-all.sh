#!/bin/bash
# Unified script to start all development servers

echo "🚀 Starting CleanCity Development Servers..."
echo ""

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Array of portals
declare -a portals=(
    "Citizen Portal:3000:citizen-portal"
    "Sweeper Portal:3001:sweeper-portal"
    "Admin Portal:3002:admin-portal"
)

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all servers..."
    kill $CITIZEN_PID $SWEEPER_PID $ADMIN_PID 2>/dev/null
    exit
}

trap cleanup INT TERM

# Start Citizen Portal
echo -e "${CYAN}📱 Starting Citizen Portal on port 3000...${NC}"
cd citizen-portal && npm run dev &
CITIZEN_PID=$!
cd ..

sleep 2

# Start Sweeper Portal
echo -e "${CYAN}🧹 Starting Sweeper Portal on port 3001...${NC}"
cd sweeper-portal && npm run dev &
SWEEPER_PID=$!
cd ..

sleep 2

# Start Admin Portal
echo -e "${CYAN}👨‍💼 Starting Admin Portal on port 3002...${NC}"
cd admin-portal && npm run dev &
ADMIN_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ All servers starting!${NC}"
echo ""
echo -e "${YELLOW}📍 Access the portals at:${NC}"
echo -e "${WHITE}   - Citizen Portal: http://localhost:3000${NC}"
echo -e "${WHITE}   - Sweeper Portal: http://localhost:3001${NC}"
echo -e "${WHITE}   - Admin Portal: http://localhost:3002${NC}"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for all background processes
wait

