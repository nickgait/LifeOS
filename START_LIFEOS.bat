@echo off
REM LifeOS Launcher for Windows
REM Double-click this file to start LifeOS

title LifeOS Launcher

echo.
echo ========================================
echo          LifeOS Launcher v1.0
echo   Your Personal Life Operating System
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    echo.
    echo Please install npm ^(comes with Node.js^)
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected
echo [OK] npm detected
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] First time setup detected!
    echo [INFO] Installing dependencies... ^(this may take a minute^)
    echo.

    call npm install

    if %ERRORLEVEL% EQU 0 (
        echo.
        echo [OK] Dependencies installed successfully!
        echo.
    ) else (
        echo.
        echo [ERROR] Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
)

REM Start the development server
echo [INFO] Starting LifeOS...
echo.
echo Your browser will open automatically to:
echo http://localhost:3000
echo.
echo WARNING: Keep this window open while using LifeOS
echo WARNING: Press Ctrl+C to stop the server
echo.
echo ----------------------------------------
echo.

REM Start the server
call npm run dev

REM Wait for user input before closing (in case of error)
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server stopped with an error
    echo.
    pause
)
