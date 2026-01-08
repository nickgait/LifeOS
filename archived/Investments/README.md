# LifeOS Investment Portfolio Tracker

A comprehensive investment management app for tracking your portfolio, recording dividends, and researching stocks and ETFs. Integrated with LifeOS for seamless personal wealth management.

## Features

### 📊 Dashboard
- **Portfolio Value**: Real-time total value of all holdings
- **Total Gain/Loss**: Dollar amount and percentage return
- **Total Dividends**: Cumulative dividend income received
- **Holdings Count**: Number of securities in your portfolio
- **Portfolio Allocation**: Visual breakdown showing percentage allocation by symbol
- **Recent Activity**: Timeline of recent trades and dividends

### 💼 Portfolio Management
Track all types of investments:
- **Stock**: Individual company shares
- **ETF**: Exchange-traded funds
- **Mutual Fund**: Pooled investment funds
- **Bond**: Fixed income securities
- **Cryptocurrency**: Digital assets
- **Other**: Custom investment types

For each holding, track:
- **Symbol**: Ticker symbol (e.g., AAPL, SPY)
- **Name**: Company or fund name
- **Quantity**: Number of shares/units owned
- **Purchase Price**: Original price per share
- **Current Price**: Current market price per share
- **Purchase Date**: When the investment was made
- **Notes**: Custom notes about the holding

Automatic Calculations:
- **Current Value**: Quantity × Current Price
- **Cost Basis**: Quantity × Purchase Price
- **Gain/Loss**: Current Value - Cost Basis
- **Return %**: (Gain/Loss ÷ Cost Basis) × 100
- **Allocation %**: (Holding Value ÷ Portfolio Value) × 100

### 💰 Dividend Tracking
Record dividend payments from your investments:
- **Symbol**: Which security paid the dividend
- **Amount Received**: Total dividend paid to you
- **Per-Share Dividend**: Dividend amount per share
- **Payment Date**: When dividend was received
- **Notes**: Dividend type, record date, remarks
- **History**: View all past dividends
- **Total**: See cumulative dividend income

### 🔬 Research Database
Build and maintain an investment research database:
- **Research Notes**: Save your analysis on potential investments
- **Sectors**: Track company/fund sectors
- **Ratings**: Rate investments (Buy/Hold/Sell or A-F grades)
- **Types**: Filter research by investment type
- **Symbols**: Quick reference for tickers
- **Google Search**: One-click links to search results
- **Organization**: Filter by type for easy browsing

## How to Use

### Adding a Holding
1. Click the "Portfolio" tab
2. Fill in the holding details:
   - Symbol (e.g., AAPL)
   - Company/Fund name
   - Type (Stock, ETF, etc.)
   - Quantity owned
   - Purchase price per share
   - Current price per share
   - Purchase date
   - Optional notes
3. Click "Add Holding"
4. The app automatically calculates gains/losses and allocation percentages

### Recording a Dividend
1. Click the "Dividends" tab
2. Enter:
   - Symbol of the dividend-paying security
   - Total amount received
   - Dividend per share
   - Payment date
   - Optional notes (e.g., "Regular quarterly dividend")
3. Click "Record Dividend"
4. Total dividends and activity feed update automatically

### Researching Investments
1. Click the "Research" tab
2. Fill in research details:
   - Symbol
   - Company/Fund name
   - Type (Stock, ETF, etc.)
   - Sector
   - Your rating (Buy, Hold, Sell, or A-F)
   - Detailed analysis notes
3. Click "Save Research"
4. Use the type filter buttons to organize research
5. Click "Google Search" for quick web searches

### Viewing Dashboard
1. Click the "Dashboard" tab
2. See:
   - Portfolio statistics (value, gains, dividends)
   - Allocation breakdown
   - Recent activity
3. Stats update automatically as you add holdings and dividends

## Data Storage

All data stored locally in your browser:
- `lifeos-investments-portfolio`: Your holdings
- `lifeos-investments-dividends`: Dividend history
- `lifeos-investments-research`: Research database

Data never leaves your computer. Open DevTools to backup/export.

## Calculation Examples

### Example 1: Stock Purchase
- Symbol: AAPL
- Quantity: 10 shares
- Purchase Price: $150/share
- Current Price: $180/share

Results:
- Cost Basis: 10 × $150 = $1,500
- Current Value: 10 × $180 = $1,800
- Gain: $1,800 - $1,500 = $300
- Return: ($300 ÷ $1,500) × 100 = 20%

### Example 2: Portfolio with Multiple Holdings
- AAPL: $1,800 (40%)
- SPY: $1,500 (33%)
- TSLA: $1,200 (27%)

Portfolio Value: $4,500
Allocation automatically shows percentages

### Example 3: Dividend Income
- AAPL paid: $10 (5 shares × $0.20/share)
- SPY paid: $8 (10 shares × $0.80/share)
- Total dividends: $18

## Tips & Best Practices

### Portfolio Management
- **Update prices regularly**: Adjust current price to keep calculations accurate
- **Use realistic prices**: Check financial websites for current prices
- **Add notes**: Track why you own each security
- **Manage expectations**: Markets fluctuate; track long-term trends

### Dividend Tracking
- **Record promptly**: Record dividends as soon as received
- **Note dividend type**: Regular, special, return of capital, etc.
- **Track total income**: Monitor passive income from dividends
- **Reinvestment**: Note if dividends are reinvested

### Research
- **Rate objectively**: Be honest about each security's prospects
- **Update notes**: Add new information as you learn more
- **Use ratings**: Buy/Hold/Sell helps track your thesis
- **Organize by sector**: Research helps identify exposure concentration

## Stock Lookup Feature

### 🔍 Automatic Price & Company Name Lookup
The app now includes stock lookup functionality powered by Finnhub API:

**How to Use:**
1. **Go to Portfolio or Research tab**
2. **Enter a stock symbol** (e.g., AAPL, TSLA, MSFT, SPY)
3. **Click "Lookup"** button
4. The app will automatically fill in:
   - Company/Fund name
   - Current market price (for Portfolio tab)

**API Information:**
- Uses Finnhub API for real-time stock data
- Included demo API key has limited requests
- **Get your own free API key:**
  1. Visit [https://finnhub.io](https://finnhub.io)
  2. Sign up for free account
  3. Copy your API key
  4. Replace `apiKey` in `script.js` (lines 96 and 164)

**Free tier includes:**
- 60 API calls/minute
- Real-time stock prices
- Company profiles
- Unlimited symbols

**Notes:**
- Stock prices may not be available when markets are closed
- Some symbols may not have company name data
- You can always enter data manually if lookup fails

## Limitations

- **Browser storage**: Data only on this device (import/export for backup)
- **No alerts**: No price alerts or notifications
- **API limits**: Demo key has usage limits (get free personal key for more)

## Future Enhancements

Potential features to add:
- Automatic price refresh for existing holdings
- Tax lot tracking for specific shares
- Performance charting and analysis
- Sector concentration analysis
- Rebalancing recommendations
- Historical price tracking
- Currency conversion
- Multiple portfolios (retirement, taxable, etc.)
- Export to CSV/PDF

## Investment Disclaimer

This app is for personal tracking and research only. It does not provide investment advice. Always:
- Do your own research (DYOR)
- Consult a financial advisor for major decisions
- Consider your risk tolerance
- Diversify your portfolio
- Invest for the long term
- Understand what you're buying

Remember: Past performance does not guarantee future results.

## Support

For help, issues, or feature requests:
1. Check LifeOS main README
2. Review this documentation
3. Examine your data in browser DevTools
4. Check calculation examples above

Happy investing! 📈
