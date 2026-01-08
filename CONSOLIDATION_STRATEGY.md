# Finance & Planning App Consolidation Strategy

## Overview
Consolidating 4 separate LifeOS financial apps into 1 unified "Finance & Planning" app with 6 tabs. Target structure: Dashboard, Portfolio, Expenses, Planning, Dividends, Research.

**Total Estimated Lines of Code: ~4,500-5,000 lines** (vs ~6,800 across 4 apps)

---

## 1. CLASS & FUNCTION INVENTORY

### Financial Planner App (script.js - ~1,500 lines)
**Main Class:** `FinancialPlanner`

#### Core Functions:
- **Profile Management:**
  - `handleProfileSubmit()` - Parse form into profile object
  - `populateProfileForm()` - Hydrate form from saved profile
  - `runFullAnalysis()` - Trigger all calculations

- **Holdings Management:**
  - `renderHoldings(type)` - Render brokerage/retirement holdings table
  - `addHolding(type)` - Add new holding row
  - `removeHolding(type, index)` - Delete holding
  - `updateHolding(type, index, field, value)` - Edit holding field
  - `refreshHoldingPrice(type, index)` - Lookup single stock price
  - `refreshAllPrices(type)` - Batch price lookup
  - `lookupStockPrice(ticker)` - API call to Yahoo Finance (with proxy)
  - `guessSectorFromTicker(ticker)` - Sector lookup table for common stocks

- **Cash Holdings:**
  - `updateCashHolding(type, value)` - Update cash balance
  - `updateCashDisplay()` - Render cash totals

- **Portfolio Analysis:**
  - `analyzePortfolio()` - Trigger all analysis functions
  - `analyzeBrokerageHoldings()` - Concentration, sector, compliance
  - `analyzeConcentration(holdings, totalValue)` - Find concentration risk
  - `calculateSectorBreakdown(holdings, totalValue, cashValue)` - Sector allocation
  - `renderSectorBreakdown(sectorData)` - HTML for sector bars
  - `analyzeCompliance(holdings, totalValue)` - Sharia compliance check
  - `generateRebalancingRecommendations(holdings, cashValue, holdingsValue)` - Cash allocation suggestions
  - `analyzeRetirementHoldings()` - Retirement-specific analysis
  - `drawSectorChart(sectorData)` - Chart.js sector chart

- **Projections & Retirement Readiness:**
  - `calculateProjections()` - Run scenario projections
  - `calculateFutureValue(annualReturn)` - Project investment growth
  - `calculateSpouseFutureValue(annualReturn)` - Spouse 401k projection
  - `renderProjectionResults(projection)` - Populate projection table
  - `setScenario(scenario)` - Switch between conservative/moderate/optimistic
  - `calculateRetirementReadiness()` - Calculate readiness score
  - `generateCashFlowProjection(startingPortfolio, startingCash)` - Project cash flow age 65-90
  - `drawCashFlowChart(cashFlowData)` - Chart.js cash flow chart

- **Stress Tests & Analysis:**
  - `runStressTests()` - Calculate impact of 20/30/40% market decline
  - `calculateFutureValueFromBalance(startBalance, rate, years)` - Projection from arbitrary balance
  - `generateRebalancingPlan()` - Target allocation recommendation
  - `analyzeCashReserves()` - Emergency fund analysis
  - `generateActionChecklists()` - Action items for user
  - `generateTradeRecommendations(equityTarget, fixedTarget, cashTarget)` - Which holdings to buy/sell
  - `runSensitivityAnalysis()` - Analyze impact of variable changes

- **UI & Data Management:**
  - `updateSummaryDashboard()` - Render main dashboard stats
  - `drawAllocationChart()` - Chart.js allocation pie chart
  - `drawSummaryGrowthChart()` - Chart.js growth chart
  - `drawProjectionChart(projection)` - Projection line chart
  - `toggleShariaMode()` - Switch Sharia compliance mode on/off
  - `updateShariaVisibility()` - Show/hide Sharia-only elements
  - `saveData()` - localStorage persistence
  - `loadData()` - localStorage loading
  - `migrateHoldingsToSharesBased(holdings)` - Migration helper
  - `formatCurrency(amount)` - Currency formatting

**Key Properties:**
- `profile` - User financial profile (age, salary, goals, etc.)
- `holdings` - Object with `brokerage[]` and `retirement[]` arrays
- `cashHoldings` - Object with `brokerage` and `retirement` cash amounts
- `shariaMode` - Boolean for Islamic finance mode
- `charts` - Object holding Chart.js chart instances
- `projectionScenario` - Current scenario: 'conservative', 'moderate', 'optimistic'

---

### Investments App (script.js - ~1,270 lines)
**Main Class:** `InvestmentApp`

#### Core Functions:
- **Portfolio Management:**
  - `handleHoldingSubmit(e)` - Add/update holding
  - `editHolding(id)` - Pre-fill form for editing
  - `deleteHolding(id)` - Remove holding
  - `sellShares(id)` - Create modal for selling shares
  - `calculatePortfolioValue()` - Sum all holdings value
  - `calculateTotalCost()` - Total cost basis
  - `calculateUnrealizedGain()` - Unrealized P&L
  - `calculateRealizedGain()` - Realized P&L from sales
  - `renderPortfolio()` - Group holdings by symbol, show per-lot data

- **Dividend Tracking:**
  - `handleDividendSubmit(e)` - Record dividend payment
  - `promptDripLot(symbol, dividendAmount, dividendDate)` - Ask user to auto-create DRIP lot
  - `deleteDividend(id)` - Remove dividend record
  - `calculateTotalDividends()` - Sum all dividends
  - `renderDividends()` - Display dividend history
  - `renderMonthlyDividends()` - Group dividends by month
  - `renderDripSummary()` - List all DRIP lots

- **Interest Tracking:**
  - `handleInterestSubmit(e)` - Record interest payment
  - `deleteInterest(id)` - Remove interest record
  - `calculateTotalInterest()` - Sum all interest
  - `renderInterest()` - Display interest history

- **Cash Management:**
  - `handleCashSubmit(e)` - Update cash balance
  - (Cash rendering integrated into dashboard)

- **Stock Lookups:**
  - `lookupStock()` - Lookup holding ticker (Finnhub API)
  - `lookupResearchStock()` - Lookup research ticker (Finnhub API)
  - `lookupDividendStock()` - Lookup dividend ticker (Finnhub API)
  - **NOTE: 3 near-identical lookup functions - major consolidation candidate!**
  - **API Keys are hardcoded - security risk**

- **Research Tracking:**
  - `handleResearchSubmit(e)` - Add research entry
  - `deleteResearch(id)` - Remove research entry
  - `renderResearch()` - Display research with filtering by tab
  - **Tab filtering:**
    - selectedTab property stores current tab ('holdings', 'all', 'stock', 'etf', etc.)
    - Tab switching in setupEventListeners

- **Dashboard & Activity:**
  - `updateDashboard()` - Calculate and display summary stats
  - `renderPortfolioAllocation()` - Allocation pie/bar chart
  - `renderRecentActivity()` - Last 8 activities (holdings + dividends)
  - `refresh()` - Reload all data from localStorage

- **Utility:**
  - `setupEventListeners()` - Event binding
  - `setupDefaultDates()` - Pre-fill date fields
  - `init()` - Initialize app

**Key Properties:**
- `portfolio[]` - Holdings with: id, symbol, name, type, lotType, quantity, purchasePrice, purchaseDate, currentPrice, soldShares, soldPrice, notes, addedDate
- `dividends[]` - Dividend records with: id, symbol, amount, date, perShare, notes, recordedDate
- `research[]` - Research entries with: id, symbol, name, type, sector, notes, rating, addedDate
- `interest[]` - Interest records with: id, amount, source, date, notes, recordedDate
- `cash` - Object with: balance, notes, lastUpdated
- `selectedTab` - Current research filter tab

---

### Finance (Expense Tracking) App (script.js - ~340 lines)
**Main Class:** `FinanceApp extends BaseApp`

#### Core Functions:
- **Expense Management:**
  - `handleExpenseSubmit(e)` - Add expense
  - `deleteExpense(expenseId)` - Remove expense
  - `renderExpenses()` - Display expenses with category filter
  - `renderDashboardExpenses()` - Show last 5 expenses
  - `renderCategoryBreakdown()` - Monthly category breakdown

- **Budget Management:**
  - `handleBudgetSubmit(e)` - Create budget
  - `deleteBudget(budgetId)` - Remove budget
  - `renderBudgets()` - Display budgets with progress bars

- **Data Calculations:**
  - `getTotalExpensesForMonth(monthStr)` - Sum expenses in month
  - `getCategoryTotalForMonth(categoryId, monthStr)` - Sum category expenses in month
  - `getCategoryName(categoryId)` - Lookup category name
  - `getCategoryIcon(categoryId)` - Lookup category icon
  - `getMonthYear(date)` - Format date as YYYY-MM

- **Category Management:**
  - `renderCategories()` - Display category filter tags
  - Uses `DataManager.getDefaultFinanceCategories()` for category list

- **Dashboard:**
  - `updateDashboard()` - Calculate and display stats
  - `renderCategoryBreakdown()` - Category breakdown for month

- **Base Class Methods (inherited):**
  - `createItem(data)` - Create new item with ID, timestamp
  - `deleteById(id)` - Delete item by ID
  - `save()` - Save to localStorage
  - `formatDate(date)` - Format date
  - `formatCurrency(amount)` - Format currency
  - `setupDefaultDates()` - Pre-fill date fields

**Key Properties:**
- `expenses[]` - Expense records with: id, description, category, amount, date, notes, createdDate
- `budgets[]` - Budget records with: id, name, category, limit, month, createdDate
- `categories[]` - Category list with: id, name, icon
- `selectedCategory` - Current category filter

---

### Road to Retirement App (script.js - ~1,230 lines)
**Main Class:** `RetirementPlanner`

#### Core Functions:
- **401(k) Calculator:**
  - `calculate401k(formData)` - Main 401k projection engine
  - `calculatePensionBenefit(finalSalary, pensionPercentage, yearsWorking, vestingYears)` - Pension income calculation
  - `renderRetirement401kResults(result)` - Display 401k results table
  - `handleRetirement401kSubmit(event)` - Form submission handler
  - `clearRetirement401k()` - Reset 401k calculator
  - `toggleSpouseFields()` - Show/hide spouse inputs
  - `togglePrimaryPensionFields()` - Show/hide pension inputs
  - `toggleSpousePensionFields()` - Show/hide spouse pension inputs
  - `autoFillYearsToRetirement()` - Calculate years from ages

- **Savings Calculator:**
  - `calculateSavings(formData)` - Project savings growth
  - `renderSavingsResults(result)` - Display savings table
  - `handleSavingsSubmit(event)` - Form submission handler
  - `clearSavings()` - Reset savings calculator
  - `updateContributionLabel()` - Update frequency label

- **Portfolio Tracker:**
  - `calculatePortfolio(formData)` - Calculate portfolio performance
  - `getFinancialPlannerTotal()` - Pull total from Financial Planner app (cross-app dependency!)
  - `fetchSP500Performance(updateDate)` - Fetch S&P 500 data (Alpha Vantage API)
  - `getClosestPrice(timeSeries, targetDate)` - Find price near target date
  - `findClosestBalance(history, targetDate)` - Find historical balance
  - `renderPortfolioResults(result)` - Display portfolio results
  - `renderSP500Comparison(portfolioReturn, sp500Data)` - Show vs S&P 500
  - `restorePortfolioDisplay()` - Hydrate form from saved data
  - `updateFinancialPlannerStatus()` - Show Financial Planner total
  - `handlePortfolioSubmit(event)` - Form submission handler
  - `updatePortfolio()` - Refresh portfolio display
  - `clearPortfolio()` - Reset portfolio tracker
  - `refreshFinancialPlannerData()` - Manually refresh FP data

- **Dashboard & Charts:**
  - `updateDashboard()` - Calculate combined summary
  - `drawCharts()` - Trigger chart rendering
  - `drawGrowthChart()` - 401k + Savings growth chart
  - `drawBreakdownChart()` - 401k vs Savings pie chart
  - `formatGain(amount)` - Format gain with sign
  - `formatPercent(percent)` - Format percentage with sign
  - `formatCurrency(amount)` - Currency formatting

**Key Properties:**
- `retirement401kData` - 401k projection result
- `savingsData` - Savings projection result
- `portfolioData` - Portfolio tracking result
- `growthChart` - Chart.js instance
- `breakdownChart` - Chart.js instance

**Notable Dependencies:**
- Calls `StorageManager.get('financial-planner-holdings')` to get FP data
- Uses Alpha Vantage API for S&P 500 data
- Uses Chart.js for visualization

---

## 2. STORAGE KEY MAPPING

### Current Storage Keys by App:

**Financial Planner:**
- `financial-planner-profile` → Profile object
- `financial-planner-holdings` → {brokerage: [], retirement: []}
- `financial-planner-cash` → {brokerage: 0, retirement: 0}
- `financial-planner-sharia-mode` → boolean
- `financial-planner-migrated-v3` → Migration marker
- `financial-planner-migrated-v4` → Migration marker

**Investments:**
- `investments-portfolio` → Holdings array
- `investments-dividends` → Dividends array
- `investments-research` → Research array
- `investments-interest` → Interest array
- `investments-cash` → {balance, notes, lastUpdated}

**Finance (Expenses):**
- `finance-expenses` → Expenses array (stored in BaseApp.data)
- `finance-budgets` → Budgets array
- `finance-categories` → Categories array

**Road to Retirement:**
- `retirement-401k` → 401k calculation result
- `retirement-savings` → Savings calculation result
- `retirement-portfolio` → Portfolio tracking result

### Proposed Unified Keys:

| Old Key | New Key | Module | Notes |
|---------|---------|--------|-------|
| `financial-planner-profile` | `finance-profile` | Core | Primary financial profile |
| `financial-planner-holdings` | `finance-portfolio-holdings` | Portfolio | Brokerage + retirement holdings |
| `financial-planner-cash` | `finance-portfolio-cash` | Portfolio | Cash in accounts |
| `investments-portfolio` | `finance-portfolio-lots` | Portfolio | Individual investment lots |
| `investments-dividends` | `finance-dividends` | Dividends | Dividend payments |
| `investments-interest` | `finance-interest` | Dividends | Interest payments |
| `investments-research` | `finance-research` | Research | Stock research notes |
| `finance-expenses` | `finance-expenses` | Expenses | Expense transactions |
| `finance-budgets` | `finance-budgets` | Expenses | Budget limits |
| `finance-categories` | `finance-expense-categories` | Expenses | Expense categories |
| `retirement-401k` | `finance-planning-401k` | Planning | 401k projection result |
| `retirement-savings` | `finance-planning-savings` | Planning | Savings projection result |
| `retirement-portfolio` | `finance-planning-portfolio` | Planning | Portfolio performance tracking |
| `investments-cash` | `[REMOVE - merge with finance-portfolio-cash]` | - | Consolidate with FP version |

---

## 3. FUNCTION CONSOLIDATION OPPORTUNITIES

### HIGH PRIORITY - Code Duplication

#### 1. **Stock Lookup Functions** (Investments App)
**Problem:** Three nearly identical functions with hardcoded API keys
- `lookupStock()` - For holding symbol lookup
- `lookupResearchStock()` - For research symbol lookup
- `lookupDividendStock()` - For dividend symbol lookup

**Solution:** Create parameterized `lookupSymbol(symbolInput, nameInput, statusDiv, lookupBtn)` function
```javascript
// New unified function
async lookupSymbol(symbolInputSelector, nameInputSelector, statusDivSelector, lookupBtnSelector) {
  const symbolInput = document.querySelector(symbolInputSelector);
  const nameInput = document.querySelector(nameInputSelector);
  const statusDiv = document.querySelector(statusDivSelector);
  const lookupBtn = document.querySelector(lookupBtnSelector);
  // ... shared logic
}

// Called as:
lookupSymbol('#holding-symbol', '#holding-name', '#lookup-status', '#lookup-btn');
lookupSymbol('#research-symbol', '#research-name', '#research-lookup-status', '#research-lookup-btn');
lookupSymbol('#dividend-symbol', '#dividend-symbol', '#dividend-lookup-status', '#dividend-lookup-btn');
```

**Security Fix:** Externalize API keys to config file or environment variables

#### 2. **Dashboard Update Pattern** (All Apps)
**Problem:** Each app recalculates totals, updates DOM elements separately
- Financial Planner: `updateSummaryDashboard()`
- Investments: `updateDashboard()`
- Finance: `updateDashboard()`
- Road to Retirement: `updateDashboard()`

**Solution:** Create unified dashboard controller that aggregates data from all modules
```javascript
class DashboardController {
  updateAllDashboards() {
    const portfolio = this.portfolioModule.getTotalValue();
    const expenses = this.expenseModule.getMonthlyTotal();
    const dividends = this.dividendModule.getTotalDividends();
    const retirementProjection = this.planningModule.getRetirementReadiness();

    this.renderDashboard({portfolio, expenses, dividends, retirementProjection});
  }
}
```

#### 3. **Format Functions** (All Apps)
**Problem:** Each app implements own formatting
- `formatCurrency()` - Appears in FP, Investments, Road to Retirement
- `formatDate()` - Appears in Finance, Investments
- `formatPercent()` - Only in Road to Retirement but needed elsewhere

**Solution:** Consolidate into shared `UtilityFormatter` class
```javascript
class UtilityFormatter {
  static formatCurrency(amount) { /* ... */ }
  static formatDate(date, format = 'short') { /* ... */ }
  static formatPercent(percent) { /* ... */ }
  static formatGain(amount) { /* ... */ }
}
```

#### 4. **Price Lookup Logic**
**Current State:**
- Financial Planner uses `lookupStockPrice()` with Yahoo Finance API + proxy
- Investments uses Finnhub API for stock/dividend lookups
- Both have sector mapping logic

**Opportunity:** Unify to single `StockDataService` with:
- API abstraction (switch between Yahoo/Finnhub)
- Cached sector lookups
- Retry logic
- Rate limiting

#### 5. **Chart Rendering**
**Current State:**
- Financial Planner: `drawAllocationChart()`, `drawSummaryGrowthChart()`, `drawProjectionChart()`, `drawCashFlowChart()`, `drawSectorChart()`
- Road to Retirement: `drawGrowthChart()`, `drawBreakdownChart()`
- Investments: No charts (has allocation bars but not Chart.js)

**Opportunity:** Create `ChartManager` class
```javascript
class ChartManager {
  drawAllocationChart(elementId, data) { /* ... */ }
  drawGrowthChart(elementId, datasets, labels) { /* ... */ }
  drawBreakdownChart(elementId, data) { /* ... */ }
  // ... etc
}
```

#### 6. **Tab Switching Pattern**
**Current State:**
- Financial Planner: Inline `switchTab(tabName)` function
- Investments: Inline `switchTab(tabName)` function
- Road to Retirement: Inline `switchTab(tabName)` function
- Finance: Uses `UIUtils.switchTab()` (shared utility)

**Opportunity:** Use consistent `TabManager.switchTab()` across all modules

---

### MEDIUM PRIORITY - Architectural Improvements

#### 1. **Holding/Lot Data Structure Consolidation**
**Current State:**
- Financial Planner: Holdings with ticker, name, shares, price, sector, compliant (Sharia)
- Investments: Holdings with symbol, name, type, lotType, quantity, purchasePrice, currentPrice, soldShares, soldPrice
- Different field names: (ticker vs symbol, shares vs quantity, compliant vs none)

**Solution:** Create unified `HoldingRecord` interface
```javascript
class HoldingRecord {
  symbol;
  name;
  type; // 'stock', 'etf', 'bond'
  accountType; // 'brokerage', 'retirement'
  shares;
  purchasePrice;
  currentPrice;
  purchaseDate;
  soldShares = 0;
  soldPrice = 0;
  lotType; // 'purchase', 'drip', 'contribution'
  sector;
  shariaCompliant = false;
  notes;
  id = Date.now();
  lastUpdated;
  addedDate;
}
```

#### 2. **Cross-Module Data Dependencies**
**Current State:** Road to Retirement directly reads Financial Planner storage
```javascript
const holdings = StorageManager.get('financial-planner-holdings');
```

**Better:** Use event-based system or shared data layer
```javascript
// Instead of direct localStorage access:
const holdings = this.portfolio.getHoldings(); // Cleaner interface
```

---

## 4. DEPENDENCIES BETWEEN FILES

### Import Map:
```
Finance & Planning (Unified)
├── portfolio-module.ts [consolidate FP + Investments]
│   ├── holdings.service.ts [stock lookups, price fetching]
│   └── portfolio.calculator.ts [gain calculations, allocations]
├── expenses-module.ts [from Finance]
│   ├── expense.service.ts [CRUD operations]
│   └── budget.service.ts [budget logic]
├── dividends-module.ts [from Investments]
│   ├── dividend.service.ts [recording, history]
│   └── interest.service.ts [interest tracking]
├── research-module.ts [from Investments]
│   └── research.service.ts [research notes]
├── planning-module.ts [from Road to Retirement + FP projections]
│   ├── retirement-401k.calculator.ts
│   ├── savings.calculator.ts
│   ├── portfolio-tracker.calculator.ts
│   └── pension.calculator.ts
├── shared/
│   ├── utility-formatter.ts [date, currency, percent]
│   ├── chart-manager.ts [Chart.js abstractions]
│   ├── tab-manager.ts [tab switching]
│   ├── storage-manager.ts [localStorage wrapper]
│   └── api-service.ts [stock data APIs]
└── dashboard-controller.ts [unified dashboard]
```

### External Dependencies:
- **Chart.js** - Used by FP, Road to Retirement
- **Finnhub API** - Used by Investments (stock lookups)
- **Yahoo Finance API** - Used by FP (stock lookups with proxy)
- **Alpha Vantage API** - Used by Road to Retirement (S&P 500 data)
- **StorageManager** - Custom wrapper, used by all apps
- **DataManager** - Custom utility (Finance app uses for categories)
- **UIUtils** - Custom utility (Finance app uses for tab switching)
- **BaseApp** - Custom base class (Finance extends it)

**Consolidation Note:** Finance extends `BaseApp` but other apps don't - need to unify inheritance

---

## 5. DATA STRUCTURE MAPPINGS

### Holdings Array Structure (Current)

**Financial Planner:**
```javascript
holdings = {
  brokerage: [
    {
      ticker: "AAPL",
      name: "Apple Inc",
      shares: 100,
      price: 150.25,
      lastUpdated: "2026-01-08T...",
      sector: "Technology",
      compliant: true
    }
  ],
  retirement: [ /* same */ ]
}
```

**Investments:**
```javascript
portfolio = [
  {
    id: Date.now(),
    symbol: "AAPL",
    name: "Apple Inc",
    type: "Stock",
    lotType: "Purchase",
    quantity: 100,
    purchasePrice: 145.00,
    purchaseDate: "2023-01-15",
    currentPrice: 150.25,
    soldShares: 0,
    soldPrice: 0,
    notes: "",
    addedDate: "2023-01-15"
  }
]
```

**Unified Structure (Proposed):**
```javascript
portfolio = {
  brokerage: [
    {
      id: Date.now(),
      symbol: "AAPL",
      name: "Apple Inc",
      accountType: "brokerage",
      type: "Stock", // or 'ETF', 'Bond'
      sector: "Technology",

      // Purchase info
      lotType: "Purchase", // or 'DRIP', 'Contribution'
      shares: 100,
      purchasePrice: 145.00,
      purchaseDate: "2023-01-15",

      // Current value
      currentPrice: 150.25,
      lastUpdated: "2026-01-08T...",

      // Sale info
      soldShares: 0,
      soldPrice: 0,
      saleDate: null,

      // Metadata
      shariaCompliant: true,
      notes: "",
      addedDate: "2023-01-15"
    }
  ],
  retirement: [ /* same structure */ ]
}
```

### Expense Categories (Current vs Unified)

**Current (Finance):**
```javascript
categories = [
  { id: 'food', name: 'Food & Dining', icon: '🍔' },
  { id: 'transport', name: 'Transportation', icon: '🚗' },
  // ...
]
```

**Proposed:** Same structure, but moved to shared config

---

## 6. ESTIMATED LINE COUNT BREAKDOWN

### Current Apps:
| App | Main Script | HTML | CSS | Total |
|-----|-------------|------|-----|-------|
| Financial Planner | ~1,500 | ~600 | ~500 | 2,600 |
| Investments | ~1,270 | ~800 | ~400 | 2,470 |
| Finance | ~340 | ~400 | ~300 | 1,040 |
| Road to Retirement | ~1,230 | ~800 | ~400 | 2,430 |
| **TOTAL** | **~4,340** | **~2,600** | **~1,600** | **8,540** |

### Unified App Estimate:
| Component | Lines | Notes |
|-----------|-------|-------|
| **Core Classes** |
| Portfolio Module | 1,800 | Merge FP holdings + Investments lots |
| Expenses Module | 350 | Minor changes |
| Dividends/Interest Module | 400 | From Investments |
| Research Module | 300 | From Investments |
| Planning Module | 1,200 | Merge FP projections + Road to Retirement |
| **Utilities** |
| Shared Services | 600 | Formatter, ChartManager, TabManager, APIService |
| StorageManager | 150 | Existing (refactored for new keys) |
| Dashboard Controller | 250 | New unified dashboard |
| **UI** |
| HTML | ~2,200 | 6 tabs instead of separate apps |
| CSS | ~1,400 | Consolidated styles |
| **Total** | **~4,500-5,000** | **30-40% reduction** |

---

## 7. IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- [ ] Create unified HTML structure with 6 tabs
- [ ] Create StorageManager refactoring (new keys)
- [ ] Create Utilities module (Formatter, ChartManager)
- [ ] Migrate data from old apps to new storage keys
- [ ] Set up data migration script

### Phase 2: Core Modules (Week 2)
- [ ] Build Portfolio Module (merge FP + Investments)
  - Holdings management
  - Stock price lookups (parameterized)
  - Sector analysis
  - Concentration analysis
- [ ] Build Expense Module (from Finance)
  - Expense tracking
  - Budget management
  - Category system

### Phase 3: Tracking Modules (Week 3)
- [ ] Build Dividend Module (from Investments)
  - Dividend tracking
  - DRIP handling
  - Interest tracking
- [ ] Build Research Module (from Investments)
  - Research notes
  - Tab filtering

### Phase 4: Planning & Projections (Week 4)
- [ ] Build Planning Module
  - Merge FP projections + Road to Retirement
  - 401k calculator
  - Savings calculator
  - Portfolio tracker
  - Retirement readiness
  - Stress tests
  - Rebalancing recommendations

### Phase 5: Integration & Polish (Week 5)
- [ ] Unified Dashboard
  - Aggregate data from all modules
  - Cross-module analytics
- [ ] Charts integration
- [ ] Testing & bug fixes
- [ ] Performance optimization
- [ ] Decommission old apps

---

## 8. KEY CONSOLIDATION STRATEGIES

### Strategy 1: Parameterized Stock Lookups
**From:** 3 hardcoded lookup functions in Investments
**To:** Single service with parameters

```javascript
class StockDataService {
  async lookupStockData(symbol) {
    // Single unified implementation
    // Try Yahoo Finance, fallback to Finnhub
    // Cache results locally
    // Handle errors gracefully
  }

  getSectorForTicker(ticker) {
    // Unified sector lookup table
  }
}
```

### Strategy 2: Shared Data Layer
**From:** Direct localStorage access throughout apps
**To:** Centralized StorageManager with typed interfaces

```javascript
class StorageManager {
  get(key, schema = null) {
    // With optional validation/transformation
  }

  set(key, value, schema = null) {
    // With optional validation/transformation
  }
}
```

### Strategy 3: Event-Based Module Communication
**From:** Road to Retirement reading FP storage directly
**To:** Pub/Sub event system

```javascript
// Portfolio module emits when holdings change
portfolio.on('holdingsUpdated', (holdings) => {
  // Planning module receives update
});

// Planning module can request current data
portfolio.getHoldings() // Clean API
```

### Strategy 4: Shared Chart Manager
**From:** Multiple Chart.js calls scattered throughout
**To:** Centralized chart management

```javascript
charts.drawAllocationChart('chart-container', data);
charts.drawGrowthChart('chart-container', datasets, labels);
charts.clear('chart-container'); // Cleanup
```

---

## 9. SECURITY CONSIDERATIONS

### Current Issues:
1. **Hardcoded API Keys** (Investments)
   - `d379vepr01qskrefa3u0` (Finnhub)
   - `ctckit9r01qjc7r3u7ng` (Finnhub)
   - Should be in backend or config

2. **Sensitive Data in localStorage**
   - Profile with personal financial info
   - All holdings and transaction history
   - Should consider encryption

### Recommendations:
1. Move API keys to backend proxy endpoint
2. Use environment variables for API configuration
3. Consider encrypting sensitive storage
4. Validate all user inputs before calculation

---

## 10. TESTING CHECKLIST

### Unit Tests Needed:
- [ ] Stock price lookups (mock API responses)
- [ ] Gain calculations (various scenarios)
- [ ] Date formatting (edge cases)
- [ ] Currency formatting
- [ ] Projection calculations
- [ ] Pension calculations
- [ ] Cash flow projections
- [ ] Rebalancing recommendations

### Integration Tests Needed:
- [ ] Data migration (old → new storage keys)
- [ ] Cross-module data access
- [ ] Dashboard aggregation
- [ ] Chart rendering with various data sizes
- [ ] Tab switching with unsaved changes

### User Acceptance Tests:
- [ ] Portfolio module features (from both FP + Investments)
- [ ] All 6 tabs load correctly
- [ ] Data persists across sessions
- [ ] All calculations match original apps
- [ ] Performance is acceptable
- [ ] Mobile responsiveness

---

## 11. QUICK REFERENCE: FUNCTION MAPPING

### Dashboard Tab
Functions needed from: Financial Planner, Investments, Finance, Road to Retirement
- Summary stats aggregation
- Portfolio allocation chart
- Monthly expenses
- Recent activity
- Retirement projection

### Portfolio Tab
Functions needed from: Financial Planner, Investments
- Holdings list (unified with lot details from Investments)
- Add/edit/delete holdings
- Stock price lookup and refresh
- Sector breakdown
- Concentration analysis
- Rebalancing recommendations
- Sharia compliance (if enabled)

### Expenses Tab
Functions needed from: Finance
- Expense logging
- Budget management
- Category filtering
- Monthly breakdown
- Category trends

### Planning Tab
Functions needed from: Road to Retirement, Financial Planner
- 401k calculator
- Savings calculator
- Retirement readiness
- Cash flow projection
- Stress tests
- Asset allocation recommendations
- SDBA allocation (Sharia mode)

### Dividends Tab
Functions needed from: Investments
- Dividend tracking
- DRIP management
- Interest tracking
- Monthly dividend summary
- Dividend history

### Research Tab
Functions needed from: Investments
- Research notes
- Stock/ETF research
- Tab filtering
- Google search links

---

## SUMMARY

**Consolidation reduces:**
- Files: 4 apps → 1 app
- Lines of code: ~8,540 → ~4,500-5,000 (40% reduction)
- Duplicate functions: 6+ → 1 (stock lookups, dashboard updates, formatting)
- Storage keys: 12+ → 9 (better organization)

**Key wins:**
- Single source of truth for stock data
- Unified dashboard across all modules
- Shared formatting and utility functions
- Easier maintenance and bug fixes
- Better data consistency
- Simplified API key management

**Consolidation candidates to prioritize:**
1. **Stock lookup functions** (3 → 1) - HIGH IMPACT
2. **Dashboard aggregation** (4 → 1) - HIGH IMPACT
3. **Format functions** (multiple → 1) - MEDIUM IMPACT
4. **Chart rendering** (scattered → centralized) - MEDIUM IMPACT
5. **Tab switching** (multiple → 1) - LOW EFFORT
