# Finance Manager - CLAUDE Configuration

## Project Overview
Personal finance management application for LifeOS - helps users track expenses, manage budgets, monitor income, and achieve financial goals through comprehensive money management tools.

## Commands
- **Test**: No specific test framework configured yet
- **Lint**: No linting configured yet
- **Build**: Static HTML/CSS/JS - no build process required

## Tech Stack
- HTML5
- CSS3 (with CSS Grid/Flexbox)
- Vanilla JavaScript
- Local Storage for data persistence
- Chart.js for financial visualizations (optional)

## Key Features
- **Expense Tracking** - Add, edit, delete transactions with categories
- **Income Management** - Track multiple income sources
- **Budget Planning** - Set monthly budgets per category with alerts
- **Category System** - Customizable expense/income categories
- **Financial Dashboard** - Overview of spending, income, and savings
- **Transaction Search** - Filter by date, category, amount, description
- **Reports & Analytics** - Monthly/yearly summaries with charts
- **Goal Tracking** - Savings goals and debt reduction targets
- **Account Management** - Multiple accounts (checking, savings, credit cards)
- **Recurring Transactions** - Set up automatic recurring entries
- **Export/Import** - CSV and JSON data exchange
- **Responsive Design** - Mobile-first approach

## File Structure
```
Finance/
├── index.html          # Main application
├── styles.css          # Styling
├── script.js           # Core functionality
├── CLAUDE.md           # This file
└── tasks.md            # Task tracking
```

## Data Structure
```javascript
transaction = {
  id: string,
  type: 'income' | 'expense',
  amount: number,
  category: string,
  description: string,
  date: string (YYYY-MM-DD),
  account: string,
  recurring: boolean,
  recurringId: string,
  tags: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}

budget = {
  id: string,
  category: string,
  monthlyLimit: number,
  currentSpent: number,
  alertThreshold: number (percentage),
  year: number,
  month: number
}

account = {
  id: string,
  name: string,
  type: 'checking' | 'savings' | 'credit' | 'investment',
  balance: number,
  color: string
}

goal = {
  id: string,
  name: string,
  type: 'savings' | 'debt',
  targetAmount: number,
  currentAmount: number,
  targetDate: string,
  description: string
}
```

## Development Notes
- Uses localStorage for persistence
- Mobile-first responsive design
- Follows LifeOS design system (gradient themes, card layouts)
- Currency formatting with locale support
- Date range filtering and sorting
- Real-time budget calculations
- Optional chart visualizations for better insights

## Task Management
When working on this project, use tasks.md to track development progress. Mark completed items with `- [x]` to show completion status. **Always update tasks.md immediately after completing features** to maintain accurate project status. **Cross out completed items in CLAUDE.md using ~~strikethrough~~ ✓ format**.

**IMPORTANT: After completing any feature or task:**
1. **Update tasks.md** - Change `- [ ]` to `- [x]` for completed items
2. **Update CLAUDE.md** - Cross out completed items using `~~[x] Feature Name~~ ✓`
3. **Maintain accurate documentation** - Keep both files in sync with actual progress

**Completed Core Features:**
- ~~[x] Main HTML structure~~ ✓
- ~~[x] CSS styling with LifeOS theme~~ ✓
- ~~[x] JavaScript functionality for finance management~~ ✓
- ~~[x] Local storage persistence~~ ✓
- ~~[x] Transaction management (add/edit/delete)~~ ✓
- ~~[x] Budget planning and tracking~~ ✓
- ~~[x] Account management~~ ✓
- ~~[x] Category system~~ ✓

**Completed UI Components:**
- ~~[x] Header with app title and navigation~~ ✓
- ~~[x] Financial dashboard overview~~ ✓
- ~~[x] Transaction entry form~~ ✓
- ~~[x] Transaction list with filtering~~ ✓
- ~~[x] Budget management interface~~ ✓
- ~~[x] Account balance displays~~ ✓
- ~~[x] Reports and analytics view~~ ✓
- ~~[x] Goal tracking interface~~ ✓

**Completed Data Management:**
- ~~[x] Transaction data structure design~~ ✓
- ~~[x] Budget data structure design~~ ✓
- ~~[x] Account data structure design~~ ✓
- ~~[x] Local storage implementation~~ ✓
- ~~[x] Data validation and error handling~~ ✓
- ~~[x] Export/import functionality~~ ✓

**Completed Advanced Features:**
- ~~[x] Financial calculations engine~~ ✓
- ~~[x] Budget alerts and notifications~~ ✓
- ~~[x] Recurring transactions~~ ✓
- ~~[x] Financial goal tracking~~ ✓
- ~~[x] Reports and visualizations (placeholder)~~ ✓
- ~~[x] Currency formatting~~ ✓
- ~~[x] Cross-browser compatibility~~ ✓
- ~~[x] Mobile device optimization~~ ✓
- ~~[x] Bulk transaction operations~~ ✓
- ~~[x] CSV import with duplicate detection~~ ✓
- ~~[x] Custom category management~~ ✓
- ~~[x] Settings and preferences system~~ ✓
- ~~[x] Multi-currency support~~ ✓
- ~~[x] Data export/import functionality~~ ✓
- ~~[x] Budget rollover functionality~~ ✓
- ~~[x] Account transfer system~~ ✓
- ~~[x] Account reconciliation tools~~ ✓
- ~~[x] Category icons and colors~~ ✓
- ~~[x] Goal achievement celebrations~~ ✓
- ~~[x] Intelligent goal recommendations~~ ✓
- ~~[x] Advanced trend analysis with time-based filtering~~ ✓
- ~~[x] Comprehensive CSV report export system~~ ✓
- ~~[x] Interactive financial charts and visualizations~~ ✓
- ~~[x] Monthly/yearly financial summaries~~ ✓

**NEW: Growth Projections System:**
- ~~[x] Savings growth calculator with compound interest~~ ✓
- ~~[x] Investment projection calculator with expected returns~~ ✓
- ~~[x] Monthly contribution modeling and yearly breakdowns~~ ✓
- ~~[x] Scenario comparison functionality~~ ✓
- ~~[x] What-if analysis with different parameters~~ ✓
- ~~[x] Projection results storage and management~~ ✓
- ~~[x] Reset and clear projection data functionality~~ ✓