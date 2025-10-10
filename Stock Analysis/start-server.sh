#!/bin/bash
cd "/Users/mgaither/Documents/Program Changers/Website files/Stock Analysis"
echo "🚀 Starting Stock Dashboard server..."
echo "📊 Open your browser to: http://localhost:8000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""
python3 -m http.server 8000
