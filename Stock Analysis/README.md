# 📈 Stock Dashboard

A modern, real-time stock technical analysis dashboard with Firebase integration.

## ✨ Features

- **Real-time Stock Data** - Live prices from Finnhub API
- **Technical Analysis** - SMA, RSI, MACD calculations with interactive charts
- **Watchlist Management** - Save and sync favorite stocks with Firebase
- **Mobile Responsive** - Works on desktop and mobile devices
- **Professional Design** - Clean, modern interface with dark theme

## 🚀 Quick Start

### 1. Start the Server
```bash
./start-server.sh
```
Or manually:
```bash
python3 -m http.server 8000
```

### 2. Open Your Browser
Navigate to: **http://localhost:8000**

## 📁 Project Structure

```
Stock Analysis/
├── index.html              # Main application
├── index-no-firebase.html  # Version without watchlist
├── start-server.sh         # Server startup script
├── js/
│   ├── main.js             # Application entry point
│   ├── config/
│   │   └── config.js       # Configuration management
│   └── modules/
│       ├── api.js          # Stock data API
│       ├── chart.js        # Chart.js integration
│       ├── firebase.js     # Firebase services
│       ├── technical.js    # Technical analysis
│       ├── ui.js           # UI utilities
│       └── finnhub-*.js    # Finnhub API modules
├── css/
│   └── styles.css          # Custom styles
├── tests/
│   └── technical.test.js   # Unit tests
└── docs/
    ├── START_SERVER.md     # Startup instructions
    ├── FIREBASE_SETUP.md   # Firebase configuration
    └── ARCHITECTURE.md     # Technical documentation
```

## 🔧 Configuration

### API Keys
- **Finnhub API**: Configured in `js/config/config.js`
- **Firebase**: Configured in `index.html`

### Environment Variables
Create `.env` file for production:
```bash
VITE_API_KEY=your_finnhub_key
VITE_FIREBASE_CONFIG=your_firebase_config
VITE_APP_ID=your_app_id
```

## 🧪 Development

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```

### Lint Code
```bash
npm run lint
```

## 📊 Technical Analysis

The dashboard calculates and displays:
- **Simple Moving Averages** (50-day, 200-day)
- **RSI** (Relative Strength Index, 14-period)
- **MACD** (Moving Average Convergence Divergence)

All calculations are performed client-side using custom algorithms.

## 🔥 Firebase Features

- **Anonymous Authentication** - No account required
- **Real-time Watchlist** - Syncs across devices
- **Cloud Storage** - Persistent data storage

## 🌐 Deployment

This app can be deployed to any static hosting service:
- **Netlify** - Connect Git repository for auto-deploy
- **Vercel** - Zero-config deployment
- **GitHub Pages** - Host directly from repository
- **Firebase Hosting** - Integrate with Firebase project

## 📈 Usage

1. **Search for stocks** using ticker symbols (AAPL, TSLA, etc.)
2. **View real-time data** including price, volume, and technical indicators
3. **Analyze charts** with moving averages and historical data
4. **Add to watchlist** to save favorite stocks
5. **Click watchlist items** to quickly switch between stocks

## 🛠️ Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

---

**Happy Trading!** 📊🚀