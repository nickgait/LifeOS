# LifeOS Launcher Guide

Easy ways to start LifeOS with a double-click!

## 🍎 macOS Users (Recommended)

### Option 1: Use the LifeOS.app (Easiest!)

**The LifeOS.app has been created for you!**

1. **Double-click `LifeOS.app`** in the LifeOS folder
2. Terminal will open and start the server automatically
3. Your browser will open to http://localhost:3000
4. Start using LifeOS!

**Pro Tips:**
- Drag `LifeOS.app` to your **Applications** folder
- Drag it to your **Dock** for quick access
- Right-click → Get Info → Change the icon if you want

### Option 2: Use START_LIFEOS.command

1. **Double-click `START_LIFEOS.command`**
2. Terminal opens and starts LifeOS
3. Browser opens automatically

**First time:** macOS might ask permission to run the script. Click "Open" to allow it.

---

## 🪟 Windows Users

1. **Double-click `START_LIFEOS.bat`**
2. Command Prompt opens and starts LifeOS
3. Browser opens automatically at http://localhost:3000

**Optional:** Create a shortcut:
- Right-click `START_LIFEOS.bat` → Create shortcut
- Drag shortcut to Desktop or Pin to Taskbar

---

## 🐧 Linux / Cross-Platform

### Option 1: Node.js launcher (works everywhere)

```bash
node start.js
```

### Option 2: Command line

```bash
npm run dev
```

---

## 🔧 First Time Setup

The launchers will automatically:
1. ✅ Check if Node.js is installed
2. ✅ Check if npm is available
3. ✅ Install dependencies (first time only)
4. ✅ Start the development server
5. ✅ Open your browser

**The first time might take 1-2 minutes to install dependencies. After that, it starts instantly!**

---

## 📋 What Each Launcher Does

| File | Platform | Description |
|------|----------|-------------|
| `LifeOS.app` | macOS | Native macOS application bundle (double-click) |
| `START_LIFEOS.command` | macOS | Terminal script (double-click) |
| `START_LIFEOS.bat` | Windows | Batch file (double-click) |
| `start.js` | All | Node.js script (cross-platform) |

---

## ⚠️ Important Notes

### Keep Terminal/Command Prompt Open
- **Don't close** the Terminal or Command Prompt window
- The server runs in this window
- Closing it will stop LifeOS

### Stopping LifeOS
- Press **Ctrl+C** in the Terminal/Command Prompt
- Or simply close the window

### If Browser Doesn't Open
- Manually open: http://localhost:3000
- The server is still running in the background

---

## 🐛 Troubleshooting

### "Node.js is not installed"
**Solution:** Install Node.js from https://nodejs.org/
- Download the LTS version
- Run the installer
- Restart your computer
- Try the launcher again

### "Permission denied" (macOS)
**Solution:**
```bash
chmod +x START_LIFEOS.command
chmod +x start.js
```

### "Cannot find module" errors
**Solution:** Install dependencies manually:
```bash
npm install
```

### Port 3000 already in use
**Solution:** Another app is using port 3000
- Stop the other app
- Or edit `vite.config.ts` to change the port

---

## 💡 Advanced Usage

### Create macOS .app from scratch
```bash
bash create-mac-app.sh
```

### Customize the launcher
Edit the launcher files to:
- Change the port
- Add custom startup messages
- Run additional commands

---

## 🎯 Recommended Setup

### For Daily Use (macOS)
1. Double-click `LifeOS.app` once to test
2. Drag `LifeOS.app` to **Applications** folder
3. Drag from Applications to **Dock**
4. Now you can start LifeOS with one click from Dock!

### For Daily Use (Windows)
1. Right-click `START_LIFEOS.bat`
2. Create shortcut
3. Pin shortcut to Taskbar
4. Click from Taskbar to start!

---

## 🎨 Customizing LifeOS.app Icon (macOS)

Want a custom icon?

1. Find an icon you like (.icns or .png format)
2. Right-click `LifeOS.app` → Get Info
3. Drag your icon to the small icon in top-left
4. Close the Info window

Or use an icon generator:
- https://cloudconvert.com/png-to-icns
- https://iconverticons.com/online/

---

## 📝 Quick Reference

```bash
# Start LifeOS (any method)
./LifeOS.app              # macOS (double-click)
./START_LIFEOS.command    # macOS (double-click)
START_LIFEOS.bat          # Windows (double-click)
node start.js             # Cross-platform
npm run dev               # Standard way

# Stop LifeOS
Ctrl+C                    # In Terminal/Command Prompt

# Re-install dependencies
npm install               # If something breaks
```

---

## ✨ Features

All launchers include:
- ✅ Automatic dependency installation (first time)
- ✅ Node.js version checking
- ✅ Browser auto-open
- ✅ Colored terminal output
- ✅ Error messages
- ✅ Graceful shutdown

---

**Now you can start LifeOS with just a double-click! 🚀**

*Having issues? Check the main README.md or create an issue on GitHub.*
