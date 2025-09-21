# Investments Module - CLAUDE Configuration

## Project Overview
Investment dashboard and stock analysis module for LifeOS - provides technical analysis tools, portfolio tracking, and stock research capabilities for informed investment decisions.

## Commands
- **Test**: Open `index.html` in browser to test functionality
- **Lint**: No linting configured yet
- **Build**: Static HTML/CSS/JS - no build process required

## Tech Stack
- HTML5
- CSS3 (LifeOS design system)
- Vanilla JavaScript
- Local Storage for data persistence
- Chart.js for technical analysis charts
- Finnhub API for real-time stock data

## Key Features
- **Stock Search & Analysis** - Real-time stock data with technical indicators
- **Technical Analysis** - SMA, RSI, MACD calculations and visualizations
- **Watchlist Management** - Save and track favorite stocks
- **Portfolio Tracking** - Record buy/sell transactions and track performance
- **Price Charts** - Interactive charts with moving averages
- **Market Data** - Live quotes, volume, and price changes
- **Responsive Design** - Mobile-first approach matching LifeOS theme

## File Structure
```
Investments/
├── index.html          # Main application
├── styles.css          # LifeOS-themed styling
├── script.js           # Core functionality
├── CLAUDE.md           # This file
└── tasks.md            # Task tracking
```

## Data Structure
```javascript
watchlistItem = {
  id: string,
  ticker: string,
  addedAt: string (ISO date),
  currentPrice: number
}

portfolioTransaction = {
  id: string,
  symbol: string,
  type: 'buy' | 'sell',
  shares: number,
  price: number,
  date: string (YYYY-MM-DD),
  timestamp: string (ISO date)
}

stockData = {
  ticker: string,
  currentPrice: number,
  change: number,
  changePercent: number,
  high: number,
  low: number,
  open: number,
  previousClose: number,
  volume: number,
  historicalData: {
    timestamps: number[],
    closes: number[],
    opens: number[],
    highs: number[],
    lows: number[],
    volumes: number[]
  }
}
```

## API Integration
- **Finnhub API**: Real-time stock quotes and historical data
- **API Key**: Configured in script.js (consider environment variables for production)
- **Rate Limits**: Free tier allows 60 API calls/minute
- **Data Sources**: Stock quotes, historical candle data, company profiles

## Technical Analysis
- **Simple Moving Average (SMA)**: 50-day and 200-day calculations
- **Relative Strength Index (RSI)**: 14-period momentum oscillator
- **MACD**: Moving Average Convergence Divergence with signal line
- **Price Charts**: Interactive Chart.js visualizations with overlays

## Development Notes
- Uses localStorage for offline data persistence
- Follows LifeOS design system (gradient themes, card layouts)
- Mobile-responsive grid layout
- Real-time API integration with error handling
- Technical indicators calculated client-side
- Chart.js for advanced visualizations

## Integration with LifeOS
- **Design Consistency**: Matches LifeOS gradient theme and card-based layout
- **Navigation**: Integrated into main LifeOS navigation system
- **Data Storage**: Uses localStorage pattern consistent with other modules
- **Back Navigation**: Returns to main LifeOS hub
- **Responsive**: Works across all device sizes like other modules

## Task Management
When working on this project, use tasks.md to track development progress. Mark completed items with `- [x]` to show completion status. **Always update tasks.md immediately after completing features** to maintain accurate project status.

**Completed Core Features:**
- ✅ Module structure and LifeOS integration
- ✅ Stock search and real-time data fetching
- ✅ Technical analysis calculations (SMA, RSI, MACD)
- ✅ Interactive price charts with moving averages
- ✅ Watchlist management with localStorage
- ✅ Portfolio transaction tracking
- ✅ Responsive design with LifeOS theme
- ✅ Error handling and user feedback
- ✅ API integration with Finnhub

**Development Guidelines:**
- Maintain consistency with LifeOS design patterns
- Use localStorage for all data persistence
- Follow mobile-first responsive design
- Implement proper error handling for API calls
- Keep technical analysis calculations client-side
- Ensure smooth integration with main LifeOS navigation