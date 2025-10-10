# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client-side stock analysis web application built as a single HTML file with embedded JavaScript. The application provides technical analysis tools and a watchlist feature backed by Firebase for data persistence.

## Development Commands

This project runs entirely in the browser - simply open `stock_dashboard.html` in a web browser to run the application. No build process, test runner, or linting tools are configured.

## Architecture

### Core Components
- **Single HTML File**: `stock_dashboard.html` contains all HTML, CSS, and JavaScript
- **Firebase Integration**: Uses Firebase Auth and Firestore for user authentication and watchlist persistence
- **Financial Data**: Fetches stock data from Financial Modeling Prep API
- **Technical Analysis**: Client-side calculations for SMA, RSI, and MACD indicators
- **Charting**: Uses Chart.js for price visualization with moving averages

### Key Technical Details
- Uses ES6 modules with Firebase SDK imported via CDN
- Tailwind CSS for styling via CDN
- Chart.js for data visualization via CDN
- Anonymous authentication with optional custom token support
- Real-time watchlist updates using Firestore listeners

### Firebase Configuration
The app expects these global variables to be injected:
- `__firebase_config`: Firebase configuration object
- `__app_id`: Application identifier for Firestore paths
- `__initial_auth_token` (optional): Custom authentication token

### API Integration
- Uses Financial Modeling Prep API for historical stock data
- API key is hardcoded in the source (line 191)
- Fetches 200 days of historical data for technical analysis

### Technical Analysis Functions
- `calculateSMA()`: Simple Moving Average calculation
- `calculateRSI()`: Relative Strength Index with 14-period default
- `calculateMACD()`: Moving Average Convergence Divergence with standard periods (12, 26, 9)