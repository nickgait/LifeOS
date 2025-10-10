#!/bin/bash

# LifeOS Launcher for macOS
# Double-click this file to start LifeOS

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Change to script directory
cd "$(dirname "$0")"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║         LifeOS Launcher v1.0          ║"
echo "║  Your Personal Life Operating System  ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    echo ""
    echo "Please install npm (comes with Node.js)"
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

echo -e "${GREEN}✅ Node.js detected:${NC} $(node --version)"
echo -e "${GREEN}✅ npm detected:${NC} $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 First time setup detected!${NC}"
    echo -e "${YELLOW}Installing dependencies... (this may take a minute)${NC}"
    echo ""

    npm install

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"
        echo ""
    else
        echo ""
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        echo "Press any key to exit..."
        read -n 1
        exit 1
    fi
fi

# Start the development server
echo -e "${BLUE}🚀 Starting LifeOS...${NC}"
echo ""
echo -e "${GREEN}Your browser will open automatically to:${NC}"
echo -e "${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}⚠️  Keep this window open while using LifeOS${NC}"
echo -e "${YELLOW}⚠️  Press Ctrl+C to stop the server${NC}"
echo ""
echo "────────────────────────────────────────"
echo ""

# Start the server
npm run dev

# Wait for user input before closing (in case of error)
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Server stopped with an error${NC}"
    echo "Press any key to exit..."
    read -n 1
fi
