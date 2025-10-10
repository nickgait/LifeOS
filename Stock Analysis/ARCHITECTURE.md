# Stock Dashboard Architecture Documentation

## Current Architecture (Single File)

### Overview
The stock dashboard is currently implemented as a single HTML file (`stock_dashboard.html`) containing all application logic, styling, and markup. This monolithic approach works for prototyping but has scalability and maintainability limitations.

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Styling**: Tailwind CSS (CDN)
- **Charts**: Chart.js (CDN)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (anonymous + custom tokens)
- **API**: Financial Modeling Prep API
- **Hosting**: Static file hosting (any web server)

### Current File Structure
```
Stock Analysis/
├── stock_dashboard.html     # Monolithic application file
├── CLAUDE.md               # Development guidance
└── ARCHITECTURE.md         # This documentation
```

### Application Flow
1. **Initialization**: Firebase services initialize on page load
2. **Authentication**: Anonymous auth or custom token sign-in
3. **UI Setup**: Event listeners and DOM element references
4. **Stock Search**: User enters ticker → API call → data processing → UI update
5. **Watchlist**: CRUD operations with Firestore real-time sync
6. **Technical Analysis**: Client-side calculations for indicators
7. **Visualization**: Chart.js renders price data with moving averages

### Key Components (Current Implementation)

#### Firebase Integration
- **Path Structure**: `artifacts/{appId}/users/{userId}/watchlist`
- **Real-time Sync**: `onSnapshot` for live watchlist updates
- **Operations**: Add/remove stocks from watchlist

#### Technical Analysis Engine
- **SMA Calculation**: Simple moving averages (50-day, 200-day)
- **RSI Calculation**: 14-period relative strength index
- **MACD Calculation**: 12-26-9 period moving average convergence divergence
- **Data Window**: 200 days of historical data

#### API Integration
- **Endpoint**: Financial Modeling Prep historical price API
- **Data Processing**: Price arrays, date arrays, volume extraction
- **Limitations**: Hardcoded API key, no rate limiting, no caching

#### UI Components
- **Search Interface**: Ticker input and search button
- **Dashboard Cards**: Price, volume, and technical indicators
- **Price Chart**: Line chart with moving averages overlay
- **Watchlist**: Dynamic list with click-to-search functionality

## Planned Architecture (Modular)

### Proposed File Structure
```
Stock Analysis/
├── index.html              # Main HTML structure
├── css/
│   └── styles.css          # Custom styles
├── js/
│   ├── main.js            # Application entry point
│   ├── modules/
│   │   ├── firebase.js    # Firebase configuration and operations
│   │   ├── api.js         # Stock data API integration
│   │   ├── technical.js   # Technical analysis calculations
│   │   ├── chart.js       # Chart.js integration
│   │   ├── watchlist.js   # Watchlist management
│   │   └── ui.js          # UI utilities and DOM manipulation
│   └── config/
│       └── config.js      # Environment configuration
├── tests/
│   └── technical.test.js  # Unit tests for calculations
├── package.json           # Dependencies and scripts
├── vite.config.js         # Build configuration
├── CLAUDE.md              # Development guidance
└── ARCHITECTURE.md        # This documentation
```

### Module Responsibilities

#### `firebase.js`
- Firebase initialization and configuration
- Authentication management
- Firestore operations
- Real-time listeners

#### `api.js`
- Stock data fetching
- Error handling and retries
- Response validation
- Local caching implementation

#### `technical.js`
- SMA, RSI, MACD calculations
- Data validation
- Mathematical utilities
- Pure functions for testability

#### `chart.js`
- Chart.js configuration
- Data formatting for visualization
- Chart updates and interactions
- Responsive chart handling

#### `watchlist.js`
- Watchlist CRUD operations
- UI rendering for watchlist items
- Click handlers and interactions
- Sync with Firebase

#### `ui.js`
- DOM manipulation utilities
- Loading states and error messages
- Form validation
- Event handling helpers

#### `config.js`
- Environment-specific configuration
- API endpoints and keys
- Firebase configuration
- Feature flags

### Benefits of Modular Architecture
1. **Maintainability**: Easier to locate and modify specific functionality
2. **Testability**: Individual modules can be unit tested
3. **Reusability**: Components can be reused across different parts of the app
4. **Collaboration**: Multiple developers can work on different modules
5. **Code Quality**: Smaller files are easier to review and understand
6. **Performance**: Ability to code-split and lazy load modules

### Free Tools Integration
- **Vite**: Fast build tool and dev server (free)
- **Vitest**: Unit testing framework (free)
- **ESLint**: Code linting (free)
- **Prettier**: Code formatting (free)
- **GitHub Actions**: CI/CD (free tier)
- **Netlify/Vercel**: Static hosting (free tier)

### Security Improvements
- Environment variables for API keys
- Input validation and sanitization
- Rate limiting on client side
- Error message sanitization
- Content Security Policy headers

### Performance Optimizations
- Local storage caching for API responses
- Debounced search input
- Lazy loading of chart library
- Image optimization
- Minification and compression

This modular architecture maintains the free hosting model while significantly improving code organization, maintainability, and developer experience.