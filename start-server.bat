@echo off
REM LifeOS Local Server Launcher for Windows
REM Double-click this file to start the server

echo 🚀 LifeOS Server Starting...
echo 📁 Current directory: %cd%
echo.

REM Try Python 3 first, then Python 2
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Found Python
    python start-server.py
) else (
    echo ❌ Python not found. Please install Python and try again.
    echo 💡 Download from: https://python.org
    pause
)