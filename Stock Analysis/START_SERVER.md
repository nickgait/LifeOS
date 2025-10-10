# 🚀 How to Start Your Stock Dashboard

## Quick Start (After Reboot)

### Method 1: Terminal Command
```bash
cd "/Users/mgaither/Documents/Program Changers/Website files/Stock Analysis"
python3 -m http.server 8000
```

### Method 2: Create a Shortcut Script

1. **Create a startup script:**
```bash
echo '#!/bin/bash
cd "/Users/mgaither/Documents/Program Changers/Website files/Stock Analysis"
echo "Starting Stock Dashboard server..."
echo "Open your browser to: http://localhost:8000"
python3 -m http.server 8000' > ~/Desktop/start-stock-dashboard.sh

chmod +x ~/Desktop/start-stock-dashboard.sh
```

2. **Double-click the script** on your Desktop to start the server

### Method 3: Finder Shortcut
1. **Open Finder** → Navigate to your project folder
2. **Right-click** in the folder → **Services** → **New Terminal at Folder**
3. **Type**: `python3 -m http.server 8000`

## 📱 Access Your Dashboard

Once the server starts, open your browser to:
- **Main App**: http://localhost:8000/index.html
- **No Firebase Version**: http://localhost:8000/index-no-firebase.html

## 🔧 What Each File Does

### **Essential Files:**
- `index.html` - **Main application** (with Firebase watchlist)
- `index-no-firebase.html` - **Backup version** (without watchlist)

### **Test/Debug Files:**
- `firebase-test.html` - Test Firebase connection
- `finnhub-free-test.html` - Test Finnhub API

### **Folders:**
- `js/` - All JavaScript modules
- `css/` - Stylesheets
- `tests/` - Unit tests

## 🛑 To Stop the Server

Press `Ctrl + C` in the terminal window

## 🔄 Auto-Start on Boot (Optional)

### Create a Launch Agent:
```bash
cat > ~/Library/LaunchAgents/com.stock-dashboard.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.stock-dashboard</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>-m</string>
        <string>http.server</string>
        <string>8000</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/mgaither/Documents/Program Changers/Website files/Stock Analysis</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.stock-dashboard.plist
```

**To disable auto-start:**
```bash
launchctl unload ~/Library/LaunchAgents/com.stock-dashboard.plist
```

## 📖 Usage Tips

1. **Bookmark** http://localhost:8000 in your browser
2. **Add to dock/favorites** for quick access
3. **Keep terminal window** open while using the app
4. **Use Cmd+R** to refresh if you make changes

## 🎯 Your Dashboard Features

✅ **Real-time stock prices** from Finnhub API  
✅ **Technical analysis** (SMA, RSI, MACD)  
✅ **Interactive charts** with moving averages  
✅ **Watchlist** with Firebase sync  
✅ **Mobile responsive** design  
✅ **Professional styling**  

Happy trading! 📈