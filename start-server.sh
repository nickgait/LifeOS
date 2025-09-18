#!/bin/bash
# LifeOS Local Server Launcher for Unix/macOS
# Run with: ./start-server.sh or bash start-server.sh

# Change to script directory
cd "$(dirname "$0")" || {
    echo "❌ Failed to change to script directory"
    exit 1
}

echo "🚀 LifeOS Server Starting..."
echo "📁 Current directory: $(pwd)"
echo ""

# Check if start-server.py exists
if [ ! -f "start-server.py" ]; then
    echo "❌ start-server.py not found in current directory"
    echo "📁 Please make sure you're running this from the LifeOS directory"
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Found Python 3"
    echo "🌐 Starting server... (Press Ctrl+C to stop)"
    echo ""
    python3 start-server.py
    echo ""
    echo "🛑 Server stopped"
    read -p "Press Enter to close..."
elif command -v python &> /dev/null; then
    echo "✅ Found Python"
    echo "🌐 Starting server... (Press Ctrl+C to stop)"
    echo ""
    python start-server.py
    echo ""
    echo "🛑 Server stopped"
    read -p "Press Enter to close..."
else
    echo "❌ Python not found. Please install Python and try again."
    echo "💡 macOS: Install via Homebrew or python.org"
    echo "💡 Ubuntu/Debian: sudo apt install python3"
    echo "💡 CentOS/RHEL: sudo yum install python3"
    read -p "Press Enter to exit..."
    exit 1
fi