# Financial Planner vs V2 Retirement Planner - Delta Analysis & Implementation Tasks

## Executive Summary
Your Financial Planner is a comprehensive tool with strong features like Sharia mode, portfolio holdings, spouse support, and pension planning. However, it lacks Monte Carlo simulation, the core differentiator of V2's probabilistic analysis.

**Key Gaps:** 
- No probabilistic analysis (Monte Carlo)
- Limited withdrawal strategies (only 4% rule)
- No scenario comparison
- No CSV export
- Fixed market assumptions

**Unique Strengths to Preserve:**
- Sharia-compliant mode
- Spouse/pension support
- Real-time price fetching
- Expense/dividend tracking
- Research database

## Feature Delta Table

| Feature | Current Status | V2 Status | Priority | Implementation Status |
|---------|---------------|-----------|----------|----------------------|
| **Monte Carlo Simulation** | ❌ Missing | ✅ Has | P0 - Critical | ⏳ Pending |
| **Success Probability** | ❌ Missing | ✅ Has | P0 - Critical | ⏳ Pending |
| **Percentile Outcomes** | ❌ Missing | ✅ Has | P0 - Critical | ⏳ Pending |
| **CSV Export** | ❌ Missing | ✅ Has | P0 - Critical | ⏳ Pending |
| **Market Assumptions Input** | ❌ Hardcoded | ✅ Has | P0 - Critical | ⏳ Pending |
| **Scenario Management** | ❌ Missing | ✅ Has | P1 - High | ⏳ Pending |
| **JSON Export/Import** | ⚠️ Partial | ✅ Has | P1 - High | ⏳ Pending |
| **Withdrawal Strategies** | ⚠️ 4% only | ✅ Multiple | P1 - High | ⏳ Pending |
| **Emergency Fund Engine** | ⚠️ Basic | ✅ Has | P2 - Medium | ⏳ Pending |
| **Debt Tracking** | ❌ Missing | ✅ Has | P2 - Medium | ⏳ Pending |
| **Portfolio Buckets** | ⚠️ Partial | ✅ Has | P2 - Medium | ⏳ Pending |
| **Sharia Mode** | ✅ Has | ❌ Missing | Advantage | ✅ Complete |
| **Spouse Support** | ✅ Has | ❌ Missing | Advantage | ✅ Complete |
| **Real-time Prices** | ✅ Has | ❌ Missing | Advantage | ✅ Complete |

## Phase 1: MVP Quick Wins (Target: 1-2 weeks)

### Task 1: CSV Export ⏳
**Priority:** P0 | **Effort:** 2 hours | **Status:** Not Started

**Implementation:**
```javascript
// Add to script.js
function exportToCSV(tableId, filename) {
    // Get table data
    // Convert to CSV format
    // Download file
}
```

**Acceptance Criteria:**
- [ ] Export button on projection table
- [ ] Export button on cashflow table
- [ ] CSV includes headers: Year, Age, Portfolio, Income, Expenses, Balance
- [ ] Files download with .csv extension
- [ ] Can open in Excel/Google Sheets

---

### Task 2: Market Assumptions Panel ⏳
**Priority:** P0 | **Effort:** 4 hours | **Status:** Not Started

**Implementation:**
- Add new fieldset in profile form for market assumptions
- Fields: Expected Return (%), Volatility (%), Inflation Rate (%)
- Presets dropdown: Conservative/Moderate/Aggressive

**Acceptance Criteria:**
- [ ] Input fields for return, volatility, inflation
- [ ] Preset buttons that populate fields
- [ ] Values persist in localStorage
- [ ] Calculations use these inputs instead of hardcoded values
- [ ] Conservative: 5%/10%/2.5%, Moderate: 7%/15%/3%, Aggressive: 9%/20%/3.5%

---

### Task 3: Basic Monte Carlo Simulation ⏳
**Priority:** P0 | **Effort:** 2 days | **Status:** Not Started

**Implementation:**
```javascript
class MonteCarloEngine {
    constructor(profile, assumptions) {
        this.iterations = 1000;
        this.profile = profile;
        this.assumptions = assumptions;
    }
    
    runSimulation() {
        // Generate random returns
        // Calculate portfolio survival
        // Return success probability
    }
    
    generateReturn(mean, stdDev) {
        // Box-Muller transform for normal distribution
    }
}
```

**Acceptance Criteria:**
- [ ] Run 1000 iterations minimum
- [ ] Use normal distribution for returns
- [ ] Calculate success rate (portfolio survives to age 100)
- [ ] Display success percentage prominently
- [ ] Complete in <3 seconds

---

### Task 4: Success Probability Display ⏳
**Priority:** P0 | **Effort:** 4 hours | **Status:** Not Started

**UI Elements:**
- Success gauge (0-100% circular or bar)
- Color coding: Red (<50%), Yellow (50-75%), Green (>75%)
- Interpretation text below gauge

**Acceptance Criteria:**
- [ ] Visual gauge shows success probability
- [ ] Updates after Monte Carlo run
- [ ] Shows loading state during calculation
- [ ] Includes interpretation text
- [ ] Mobile responsive

---

### Task 5: Scenario Management ⏳
**Priority:** P1 | **Effort:** 1 day | **Status:** Not Started

**Features:**
- Save current inputs as named scenario
- Load scenarios from dropdown
- Duplicate scenario function
- Delete scenario function

**Acceptance Criteria:**
- [ ] Save scenario with custom name
- [ ] Dropdown lists all saved scenarios
- [ ] Load scenario populates all fields
- [ ] Duplicate creates copy with "_copy" suffix
- [ ] Delete removes from storage
- [ ] Maximum 10 scenarios

---

### Task 6: JSON Export/Import ⏳
**Priority:** P1 | **Effort:** 2 hours | **Status:** Not Started

**Implementation:**
```javascript
function exportProfile() {
    const data = {
        version: '1.0',
        profile: planner.profile,
        holdings: planner.holdings,
        scenarios: planner.scenarios,
        exportDate: new Date().toISOString()
    };
    // Download as JSON file
}

function importProfile(file) {
    // Read JSON file
    // Validate structure
    // Load data into app
}
```

**Acceptance Criteria:**
- [ ] Export includes all profile data
- [ ] Export includes portfolio holdings
- [ ] Export includes saved scenarios
- [ ] Import validates JSON structure
- [ ] Import restores complete state
- [ ] Error handling for invalid files

---

## Phase 2: V2 Feature Parity (Target: 2-3 weeks)

### Task 7: Full Monte Carlo Engine ⏳
**Priority:** P0 | **Effort:** 3 days | **Status:** Not Started

**Features:**
- Percentile calculations (10th, 25th, 50th, 75th, 90th)
- Distribution chart
- Variable inflation
- Sequence of returns risk

**Acceptance Criteria:**
- [ ] Calculate all percentiles
- [ ] Display distribution chart
- [ ] Model variable inflation
- [ ] Account for sequence risk
- [ ] 5000+ iteration option
- [ ] Export simulation results

---

### Task 8: Withdrawal Strategies ⏳
**Priority:** P1 | **Effort:** 2 days | **Status:** Not Started

**Strategies to Implement:**
1. **Fixed 4%** (current)
2. **Guardrails** (Guyton-Klinger)
3. **Dynamic Spending**
4. **Bucket Strategy**
5. **Cash First**

**Acceptance Criteria:**
- [ ] Strategy selector in UI
- [ ] Each strategy properly implemented
- [ ] Strategies affect Monte Carlo
- [ ] Documentation for each strategy
- [ ] Comparison of strategies

---

### Task 9: Scenario Comparison View ⏳
**Priority:** P1 | **Effort:** 2 days | **Status:** Not Started

**Features:**
- Side-by-side comparison table
- Overlay scenarios on same chart
- Highlight differences
- Export comparison

**Acceptance Criteria:**
- [ ] Select 2-3 scenarios to compare
- [ ] Table shows key metrics side-by-side
- [ ] Charts overlay multiple scenarios
- [ ] Differences highlighted
- [ ] Export comparison to CSV

---

### Task 10: Debt Module ⏳
**Priority:** P2 | **Effort:** 1 day | **Status:** Not Started

**Features:**
- Add debt inputs (balance, rate, payment)
- Include in net worth calculation
- Project payoff dates
- Factor into cash flow

**Acceptance Criteria:**
- [ ] Input multiple debts
- [ ] Calculate payoff schedules
- [ ] Reduce cash flow by payments
- [ ] Show in net worth
- [ ] Debt-free date calculation

---

## Testing Checklist

### Monte Carlo Tests
- [ ] **Basic Test:** Age 40, Retire 65, $500k portfolio, $60k spending → 75-85% success
- [ ] **Stress Test:** Same but with 40% market crash in year 1 → <50% success
- [ ] **Percentile Test:** 50th percentile ≈ deterministic calculation

### Export/Import Tests
- [ ] **CSV Export:** 30-year projection exports with correct formulas
- [ ] **JSON Round-trip:** Complex profile exports and reimports perfectly
- [ ] **Scenario Export:** All scenarios included in JSON export

### Scenario Tests
- [ ] **Comparison Test:** Create 3 scenarios, compare shows correct differences
- [ ] **Duplication Test:** Duplicate preserves all data with new name
- [ ] **Loading Test:** Switching scenarios updates all calculations

### Strategy Tests
- [ ] **Guardrails Test:** 30% drop triggers 10% spending reduction
- [ ] **Bucket Test:** Cash bucket depletes first, then bonds, then stocks
- [ ] **Dynamic Test:** Spending adjusts based on portfolio performance

### Sharia Mode Tests
- [ ] **Monte Carlo Sharia:** Returns 1-2% lower, volatility reduced
- [ ] **Sukuk Allocation:** Properly models Islamic bonds
- [ ] **Compliance Check:** Non-compliant holdings flagged

## Implementation Notes

### Monte Carlo Implementation Formula
```javascript
// Box-Muller transform for normal distribution
function normalRandom(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
}

// Annual return with volatility
function generateAnnualReturn(expectedReturn, volatility) {
    return normalRandom(expectedReturn, volatility);
}
```

### Guardrails Rules
1. **Prosperity Rule:** If current withdrawal rate < initial rate - 20%, increase spending by 10%
2. **Capital Preservation:** If current withdrawal rate > initial rate + 20%, decrease spending by 10%
3. **Portfolio Management:** Never let withdrawal rate exceed 6% or fall below 2.5%

### Success Metrics
- **Success Rate:** Portfolio survives to end of plan
- **Median Portfolio:** 50th percentile ending value
- **Failure Year:** Average year of portfolio depletion in failed scenarios
- **Legacy Value:** Probability of leaving inheritance >$500k

## Progress Tracking

**Phase 1 Completion:** 0/6 tasks (0%)
**Phase 2 Completion:** 0/4 tasks (0%)
**Tests Passing:** 0/15 (0%)

**Last Updated:** [Session start date]
**Target Completion:** Phase 1 by [Date], Phase 2 by [Date]

## Session Notes
- Session 1: Initial analysis and task creation
- [Add notes for each work session]

---

**Mark tasks complete by changing ⏳ to ✅ and updating the completion percentages**