/**
 * Finance & Planning App
 * Unified financial management: Portfolio, Expenses, Retirement Planning, Dividends & Research
 *
 * Consolidated from:
 * - Financial Planner (2,402 lines)
 * - Investments (1,271 lines)
 * - Finance / Expense Tracker (356 lines)
 * - Road to Retirement (1,232 lines)
 */

class FinancePlanningApp {
    constructor() {
        // Data structures - mirrored from old apps
        this.profile = {};
        this.holdings = {
            brokerage: [],
            retirement: []
        };
        this.portfolio = []; // Detailed holdings from Investments app
        this.expenses = [];
        this.budgets = [];
        this.dividends = [];
        this.interest = [];
        this.research = [];
        this.cash = {
            brokerage: 0,
            retirement: 0
        };

        // UI state
        this.shariaMode = false;
        this.charts = {};
        this.currentTab = 'dashboard';
        this.researchFilter = 'all';
        this.projectionScenario = 'moderate';

        // Initialize
        this.init();
    }

    /**
     * Initialize the app
     */
    init() {
        console.log('Initializing Finance & Planning App...');

        // Load data from localStorage
        this.loadData();

        // Setup event listeners
        this.setupEventListeners();

        // Set default dates
        this.setupDefaultDates();

        // Render dashboard
        this.updateDashboard();

        console.log('✓ Finance & Planning App initialized');
    }

    /**
     * Load all data from localStorage
     */
    loadData() {
        // Load profile
        const profileData = localStorage.getItem('lifeos-finance-planning-profile');
        if (profileData) {
            try {
                this.profile = JSON.parse(profileData);
            } catch (e) {
                console.warn('Failed to parse profile data:', e);
                this.profile = {};
            }
        }

        // Load brokerage holdings
        const brokerageData = localStorage.getItem('lifeos-finance-planning-brokerage-holdings');
        if (brokerageData) {
            try {
                this.holdings.brokerage = JSON.parse(brokerageData);
            } catch (e) {
                console.warn('Failed to parse brokerage holdings:', e);
                this.holdings.brokerage = [];
            }
        }

        // Load retirement holdings
        const retirementData = localStorage.getItem('lifeos-finance-planning-retirement-holdings');
        if (retirementData) {
            try {
                this.holdings.retirement = JSON.parse(retirementData);
            } catch (e) {
                console.warn('Failed to parse retirement holdings:', e);
                this.holdings.retirement = [];
            }
        }

        // Load portfolio (detailed holdings)
        const portfolioData = localStorage.getItem('lifeos-finance-planning-portfolio');
        if (portfolioData) {
            try {
                this.portfolio = JSON.parse(portfolioData);
            } catch (e) {
                console.warn('Failed to parse portfolio:', e);
                this.portfolio = [];
            }
        }

        // Load expenses
        const expenseData = localStorage.getItem('lifeos-finance-planning-expenses');
        if (expenseData) {
            try {
                this.expenses = JSON.parse(expenseData);
            } catch (e) {
                console.warn('Failed to parse expenses:', e);
                this.expenses = [];
            }
        }

        // Load budgets
        const budgetData = localStorage.getItem('lifeos-finance-planning-budgets');
        if (budgetData) {
            try {
                this.budgets = JSON.parse(budgetData);
            } catch (e) {
                console.warn('Failed to parse budgets:', e);
                this.budgets = [];
            }
        }

        // Load dividends
        const dividendData = localStorage.getItem('lifeos-finance-planning-dividends');
        if (dividendData) {
            try {
                this.dividends = JSON.parse(dividendData);
            } catch (e) {
                console.warn('Failed to parse dividends:', e);
                this.dividends = [];
            }
        }

        // Load research
        const researchData = localStorage.getItem('lifeos-finance-planning-research');
        if (researchData) {
            try {
                this.research = JSON.parse(researchData);
            } catch (e) {
                console.warn('Failed to parse research:', e);
                this.research = [];
            }
        }

        // Load cash
        const cashData = localStorage.getItem('lifeos-finance-planning-cash');
        if (cashData) {
            try {
                const cashObj = JSON.parse(cashData);
                this.cash = { ...this.cash, ...cashObj };
            } catch (e) {
                console.warn('Failed to parse cash data:', e);
            }
        }

        // Load Sharia mode preference
        const shariaMode = localStorage.getItem('lifeos-finance-planning-sharia-mode');
        this.shariaMode = shariaMode === 'true';
        if (this.shariaMode) {
            document.body.classList.add('sharia-mode');
            const shariaModeCheckbox = document.getElementById('sharia-mode');
            if (shariaModeCheckbox) {
                shariaModeCheckbox.checked = true;
            }
        }
    }

    /**
     * Save all data to localStorage
     */
    saveData() {
        localStorage.setItem('lifeos-finance-planning-profile', JSON.stringify(this.profile));
        localStorage.setItem('lifeos-finance-planning-brokerage-holdings', JSON.stringify(this.holdings.brokerage));
        localStorage.setItem('lifeos-finance-planning-retirement-holdings', JSON.stringify(this.holdings.retirement));
        localStorage.setItem('lifeos-finance-planning-portfolio', JSON.stringify(this.portfolio));
        localStorage.setItem('lifeos-finance-planning-expenses', JSON.stringify(this.expenses));
        localStorage.setItem('lifeos-finance-planning-budgets', JSON.stringify(this.budgets));
        localStorage.setItem('lifeos-finance-planning-dividends', JSON.stringify(this.dividends));
        localStorage.setItem('lifeos-finance-planning-research', JSON.stringify(this.research));
        localStorage.setItem('lifeos-finance-planning-cash', JSON.stringify(this.cash));
        localStorage.setItem('lifeos-finance-planning-sharia-mode', this.shariaMode.toString());
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
        }

        // Expense form
        const expenseForm = document.getElementById('expense-form');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => this.handleExpenseSubmit(e));
        }

        // Budget form
        const budgetForm = document.getElementById('budget-form');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => this.handleBudgetSubmit(e));
        }

        // Dividend form
        const dividendForm = document.getElementById('dividend-form');
        if (dividendForm) {
            dividendForm.addEventListener('submit', (e) => this.handleDividendSubmit(e));
        }

        // Retirement form
        const retirementForm = document.getElementById('retirement-form');
        if (retirementForm) {
            retirementForm.addEventListener('submit', (e) => this.handleRetirementSubmit(e));
        }

        // Research form
        const researchForm = document.getElementById('research-form');
        if (researchForm) {
            researchForm.addEventListener('submit', (e) => this.handleResearchSubmit(e));
        }

        // Cash inputs
        const brokerageCash = document.getElementById('brokerage-cash');
        if (brokerageCash) {
            brokerageCash.addEventListener('change', (e) => {
                this.cash.brokerage = parseFloat(e.target.value) || 0;
                this.updateCashDisplay();
            });
        }

        const retirementCash = document.getElementById('retirement-cash');
        if (retirementCash) {
            retirementCash.addEventListener('change', (e) => {
                this.cash.retirement = parseFloat(e.target.value) || 0;
                this.updateCashDisplay();
            });
        }
    }

    /**
     * Setup default dates on forms
     */
    setupDefaultDates() {
        // Set today's date on date input fields
        const today = new Date().toISOString().split('T')[0];

        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = today;
            }
        });
    }

    /**
     * ============ DASHBOARD METHODS ============
     */

    /**
     * Update dashboard display
     */
    updateDashboard() {
        this.updateNetWorth();
        this.renderRecentActivity();
        this.updateStats();
        this.renderCharts();
    }

    /**
     * Calculate and display net worth
     */
    updateNetWorth() {
        const portfolioValue = this.calculatePortfolioValue();
        const totalCash = this.cash.brokerage + this.cash.retirement;
        const netWorth = portfolioValue + totalCash;

        const netWorthEl = document.getElementById('net-worth');
        if (netWorthEl) {
            netWorthEl.textContent = this.formatCurrency(netWorth);
        }

        const portfolioEl = document.getElementById('portfolio-total');
        if (portfolioEl) {
            portfolioEl.textContent = this.formatCurrency(portfolioValue);
        }

        const cashEl = document.getElementById('cash-total');
        if (cashEl) {
            cashEl.textContent = this.formatCurrency(totalCash);
        }

        return netWorth;
    }

    /**
     * Calculate total portfolio value
     */
    calculatePortfolioValue() {
        let total = 0;

        // Brokerage holdings
        for (const holding of this.holdings.brokerage) {
            const value = (holding.currentPrice || holding.price || 0) * (holding.quantity || holding.shares || 0);
            total += value;
        }

        // Retirement holdings
        for (const holding of this.holdings.retirement) {
            const value = (holding.currentPrice || holding.price || 0) * (holding.quantity || holding.shares || 0);
            total += value;
        }

        return total;
    }

    /**
     * Render recent activity feed
     */
    renderRecentActivity() {
        const activityEl = document.getElementById('recent-activity');
        if (!activityEl) return;

        const activities = [];

        // Collect recent transactions
        for (const holding of [...this.holdings.brokerage, ...this.holdings.retirement]) {
            activities.push({
                type: 'holding',
                description: `${holding.quantity} shares of ${holding.ticker || holding.symbol}`,
                amount: holding.quantity * (holding.currentPrice || 0),
                date: holding.addedDate || new Date().toISOString(),
                icon: '📈'
            });
        }

        for (const expense of this.expenses.slice(-5)) {
            activities.push({
                type: 'expense',
                description: expense.description,
                amount: -expense.amount,
                date: expense.date,
                icon: '💰'
            });
        }

        for (const dividend of this.dividends.slice(-5)) {
            activities.push({
                type: 'dividend',
                description: `Dividend: ${dividend.symbol}`,
                amount: dividend.amount,
                date: dividend.date,
                icon: '💵'
            });
        }

        // Sort by date descending
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Take last 10
        const recentActivities = activities.slice(0, 10);

        if (recentActivities.length === 0) {
            activityEl.innerHTML = '<p style="color: #999; text-align: center;">No recent activity</p>';
            return;
        }

        activityEl.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <span style="font-size: 1.5rem;">${activity.icon}</span>
                    <div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-date">${this.formatDate(activity.date)}</div>
                    </div>
                </div>
                <div class="activity-amount">${this.formatCurrency(activity.amount)}</div>
            </div>
        `).join('');
    }

    /**
     * Update stats cards
     */
    updateStats() {
        // Unrealized gains
        let unrealizedGains = 0;
        for (const holding of [...this.holdings.brokerage, ...this.holdings.retirement]) {
            const currentValue = (holding.currentPrice || 0) * (holding.quantity || 0);
            const costBasis = (holding.purchasePrice || 0) * (holding.quantity || 0);
            unrealizedGains += (currentValue - costBasis);
        }

        const unrealizedEl = document.getElementById('unrealized-gains');
        if (unrealizedEl) {
            unrealizedEl.textContent = this.formatCurrency(unrealizedGains);
        }

        // Total dividends
        let totalDividends = 0;
        for (const dividend of this.dividends) {
            totalDividends += (dividend.amount || 0);
        }

        const dividendsEl = document.getElementById('total-dividends');
        if (dividendsEl) {
            dividendsEl.textContent = this.formatCurrency(totalDividends);
        }

        // Holding count
        const holdingCount = new Set([
            ...this.holdings.brokerage.map(h => h.ticker || h.symbol),
            ...this.holdings.retirement.map(h => h.ticker || h.symbol)
        ]).size;

        const countEl = document.getElementById('holding-count');
        if (countEl) {
            countEl.textContent = holdingCount.toString();
        }
    }

    /**
     * Render charts
     */
    renderCharts() {
        // Allocation chart
        this.renderAllocationChart();

        // Asset chart
        this.renderAssetChart();
    }

    /**
     * Render allocation pie chart
     */
    renderAllocationChart() {
        const ctx = document.getElementById('allocationChart');
        if (!ctx) return;

        const brokerage = this.holdings.brokerage.reduce((sum, h) => sum + (h.quantity || 0) * (h.currentPrice || 0), 0);
        const retirement = this.holdings.retirement.reduce((sum, h) => sum + (h.quantity || 0) * (h.currentPrice || 0), 0);
        const cash = this.cash.brokerage + this.cash.retirement;

        // Destroy existing chart
        if (this.charts.allocation) {
            this.charts.allocation.destroy();
        }

        this.charts.allocation = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Brokerage', 'Retirement', 'Cash'],
                datasets: [{
                    data: [brokerage, retirement, cash],
                    backgroundColor: ['#667eea', '#764ba2', '#10b981']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * Render asset breakdown chart
     */
    renderAssetChart() {
        const ctx = document.getElementById('assetChart');
        if (!ctx) return;

        // Group by ticker
        const assets = {};
        for (const holding of [...this.holdings.brokerage, ...this.holdings.retirement]) {
            const ticker = holding.ticker || holding.symbol || 'Unknown';
            const value = (holding.quantity || 0) * (holding.currentPrice || 0);
            assets[ticker] = (assets[ticker] || 0) + value;
        }

        const labels = Object.keys(assets).slice(0, 10); // Top 10
        const data = labels.map(label => assets[label]);

        // Destroy existing chart
        if (this.charts.assets) {
            this.charts.assets.destroy();
        }

        this.charts.assets = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Holdings Value',
                    data: data,
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    /**
     * ============ PORTFOLIO METHODS ============
     */

    /**
     * Handle profile form submission
     */
    handleProfileSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const data = {
            currentAge: parseInt(form['current-age'].value),
            targetAge: parseInt(form['retirement-age'].value),
            riskTolerance: form['risk-tolerance'].value,
            timestamp: new Date().toISOString()
        };

        this.profile = data;
        this.saveData();

        UIUtils.showNotification('Profile saved', 'success', 2000);
    }

    /**
     * Add a new holding
     */
    addHolding(type) {
        // Show modal or inline form for adding holding
        const newHolding = {
            id: 'holding-' + Date.now(),
            ticker: '',
            quantity: 0,
            purchasePrice: 0,
            currentPrice: 0,
            addedDate: new Date().toISOString()
        };

        if (type === 'brokerage') {
            this.holdings.brokerage.push(newHolding);
        } else {
            this.holdings.retirement.push(newHolding);
        }

        this.renderPortfolioHoldings(type);
        this.saveData();
    }

    /**
     * Delete a holding
     */
    deleteHolding(type, id) {
        if (type === 'brokerage') {
            this.holdings.brokerage = this.holdings.brokerage.filter(h => h.id !== id);
        } else {
            this.holdings.retirement = this.holdings.retirement.filter(h => h.id !== id);
        }

        this.renderPortfolioHoldings(type);
        this.saveData();
        UIUtils.showNotification('Holding removed', 'success', 2000);
    }

    /**
     * Render holdings for a type
     */
    renderPortfolioHoldings(type) {
        const containerId = type === 'brokerage' ? 'brokerage-holdings-container' : 'retirement-holdings-container';
        const container = document.getElementById(containerId);
        if (!container) return;

        const holdings = type === 'brokerage' ? this.holdings.brokerage : this.holdings.retirement;

        if (holdings.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No holdings added yet</p>';
            return;
        }

        container.innerHTML = holdings.map(holding => `
            <div class="holding-row">
                <input type="text" placeholder="AAPL" value="${holding.ticker || ''}" onchange="financeApp.updateHolding('${type}', '${holding.id}', 'ticker', this.value)">
                <input type="number" placeholder="100" value="${holding.quantity || 0}" onchange="financeApp.updateHolding('${type}', '${holding.id}', 'quantity', this.value)">
                <input type="number" placeholder="Price" value="${holding.currentPrice || 0}" onchange="financeApp.updateHolding('${type}', '${holding.id}', 'currentPrice', this.value)">
                <div>${this.formatCurrency((holding.quantity || 0) * (holding.currentPrice || 0))}</div>
                <div>${holding.purchasePrice ? this.formatCurrency((holding.currentPrice || 0) - (holding.purchasePrice || 0)) : '-'}</div>
                <small>${holding.lastUpdated || 'Never'}</small>
                <button type="button" class="btn btn-danger" style="padding: 0.5rem; font-size: 0.8rem;" onclick="financeApp.deleteHolding('${type}', '${holding.id}')">×</button>
            </div>
        `).join('');
    }

    /**
     * Update a holding field
     */
    updateHolding(type, id, field, value) {
        const holdings = type === 'brokerage' ? this.holdings.brokerage : this.holdings.retirement;
        const holding = holdings.find(h => h.id === id);
        if (holding) {
            holding[field] = isNaN(value) ? value : parseFloat(value);
            holding.lastUpdated = new Date().toLocaleString();
            this.saveData();
        }
    }

    /**
     * Refresh all prices for a type
     */
    async refreshAllPrices(type) {
        const holdings = type === 'brokerage' ? this.holdings.brokerage : this.holdings.retirement;
        const symbols = holdings.map(h => h.ticker || h.symbol).filter(s => s);

        if (symbols.length === 0) {
            UIUtils.showNotification('No holdings to refresh', 'warning', 2000);
            return;
        }

        UIUtils.showNotification('Refreshing prices...', 'info', 3000);

        const results = await StockService.lookupMultiple(symbols);

        for (const holding of holdings) {
            const ticker = holding.ticker || holding.symbol;
            const result = results[ticker];
            if (result && result.price) {
                holding.currentPrice = result.price;
                holding.lastUpdated = new Date().toLocaleString();
            }
        }

        this.saveData();
        this.renderPortfolioHoldings(type);
        this.updateDashboard();

        UIUtils.showNotification('Prices updated', 'success', 2000);
    }

    /**
     * Save cash amounts
     */
    saveCash() {
        this.saveData();
        this.updateCashDisplay();
        UIUtils.showNotification('Cash saved', 'success', 2000);
    }

    /**
     * Update cash display
     */
    updateCashDisplay() {
        const total = this.cash.brokerage + this.cash.retirement;
        const cashDisplay = document.getElementById('cash-display');
        if (cashDisplay) {
            cashDisplay.textContent = this.formatCurrency(total);
        }

        const brokerageCash = document.getElementById('brokerage-cash');
        if (brokerageCash && !brokerageCash.value) {
            brokerageCash.value = this.cash.brokerage || 0;
        }

        const retirementCash = document.getElementById('retirement-cash');
        if (retirementCash && !retirementCash.value) {
            retirementCash.value = this.cash.retirement || 0;
        }
    }

    /**
     * ============ EXPENSES METHODS ============
     */

    /**
     * Handle expense form submission
     */
    handleExpenseSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const expense = {
            id: 'expense-' + Date.now(),
            date: form['expense-date'].value,
            category: form['expense-category'].value,
            amount: parseFloat(form['expense-amount'].value),
            description: form['expense-description'].value,
            createdAt: new Date().toISOString()
        };

        this.expenses.push(expense);
        this.saveData();
        this.renderExpenses();
        form.reset();
        this.setupDefaultDates();

        UIUtils.showNotification('Expense added', 'success', 2000);
    }

    /**
     * Delete an expense
     */
    deleteExpense(id) {
        this.expenses = this.expenses.filter(e => e.id !== id);
        this.saveData();
        this.renderExpenses();
        UIUtils.showNotification('Expense deleted', 'success', 2000);
    }

    /**
     * Render expenses list
     */
    renderExpenses() {
        const container = document.getElementById('expenses-list');
        if (!container) return;

        const monthExpenses = this.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            const now = new Date();
            return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        });

        if (monthExpenses.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No expenses this month</p>';
            return;
        }

        const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

        container.innerHTML = `
            <div style="margin-bottom: 1rem; padding: 1rem; background: #f9fafb; border-radius: 8px;">
                <strong>Total this month:</strong> ${this.formatCurrency(total)}
            </div>
            ${monthExpenses.map(expense => `
                <div class="expense-item">
                    <div class="expense-date">${this.formatDate(expense.date)}</div>
                    <div class="expense-category">${expense.category}</div>
                    <div>${expense.description || '-'}</div>
                    <div class="expense-amount">${this.formatCurrency(expense.amount)}</div>
                    <button type="button" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="financeApp.deleteExpense('${expense.id}')">Delete</button>
                </div>
            `).join('')}
        `;
    }

    /**
     * Handle budget form submission
     */
    handleBudgetSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const budget = {
            id: 'budget-' + Date.now(),
            category: form['budget-category'].value,
            limit: parseFloat(form['budget-limit'].value),
            month: new Date().toISOString().slice(0, 7),
            createdAt: new Date().toISOString()
        };

        this.budgets.push(budget);
        this.saveData();
        this.renderBudgets();
        form.reset();

        UIUtils.showNotification('Budget set', 'success', 2000);
    }

    /**
     * Delete a budget
     */
    deleteBudget(id) {
        this.budgets = this.budgets.filter(b => b.id !== id);
        this.saveData();
        this.renderBudgets();
        UIUtils.showNotification('Budget deleted', 'success', 2000);
    }

    /**
     * Render budgets list
     */
    renderBudgets() {
        const container = document.getElementById('budgets-list');
        if (!container) return;

        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthBudgets = this.budgets.filter(b => b.month === currentMonth);

        if (monthBudgets.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No budgets set for this month</p>';
            return;
        }

        container.innerHTML = monthBudgets.map(budget => {
            const spent = this.expenses
                .filter(e => e.category === budget.category && e.date.startsWith(currentMonth))
                .reduce((sum, e) => sum + e.amount, 0);

            const percent = Math.min(100, (spent / budget.limit) * 100);
            const status = spent > budget.limit ? 'Over budget' : 'On track';

            return `
                <div style="margin-bottom: 1rem; padding: 1rem; background: white; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong>${budget.category}</strong>
                        <span>${this.formatCurrency(spent)} / ${this.formatCurrency(budget.limit)}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;">
                        <div style="height: 100%; width: ${percent}%; background: ${spent > budget.limit ? '#ef4444' : '#10b981'};"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <small style="color: ${spent > budget.limit ? '#ef4444' : '#10b981'};">${status}</small>
                        <button type="button" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="financeApp.deleteBudget('${budget.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * ============ PLANNING METHODS ============
     */

    /**
     * Handle retirement form submission
     */
    handleRetirementSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const plan = {
            currentAssets: parseFloat(form['current-assets'].value) || 0,
            annualContribution: parseFloat(form['annual-contribution'].value) || 0,
            expectedReturn: parseFloat(form['expected-return'].value) || 7.5,
            monthlySpending: parseFloat(form['monthly-spending-retirement'].value) || 0,
            socialSecurity: parseFloat(form['social-security'].value) || 0,
            pension: parseFloat(form['pension-income'].value) || 0,
            timestamp: new Date().toISOString()
        };

        this.profile.retirement = plan;
        this.saveData();

        // Calculate and display results
        this.calculateRetirementReadiness();

        UIUtils.showNotification('Retirement plan calculated', 'success', 2000);
    }

    /**
     * Calculate retirement readiness
     */
    calculateRetirementReadiness() {
        const plan = this.profile.retirement;
        if (!plan) return;

        const projectedValue = this.projectPortfolioValue(plan.currentAssets, plan.annualContribution, plan.expectedReturn, 30);
        const annualNeed = plan.monthlySpending * 12;
        const withdrawal4pct = projectedValue * 0.04;
        const totalIncome = withdrawal4pct + plan.socialSecurity + plan.pension;
        const readinessPercent = Math.min(100, (totalIncome / annualNeed) * 100);

        const readinessEl = document.getElementById('readiness-score');
        if (readinessEl) {
            readinessEl.textContent = Math.round(readinessPercent) + '%';
        }

        const projectedEl = document.getElementById('projected-value');
        if (projectedEl) {
            projectedEl.textContent = this.formatCurrency(projectedValue);
        }

        const needEl = document.getElementById('annual-need');
        if (needEl) {
            needEl.textContent = this.formatCurrency(annualNeed);
        }

        const withdrawalEl = document.getElementById('withdrawal-4pct');
        if (withdrawalEl) {
            withdrawalEl.textContent = this.formatCurrency(withdrawal4pct);
        }

        const incomeEl = document.getElementById('total-income');
        if (incomeEl) {
            incomeEl.textContent = this.formatCurrency(totalIncome);
        }

        const readinessSection = document.getElementById('retirement-readiness');
        if (readinessSection) {
            readinessSection.style.display = 'block';
        }

        // Show projection chart
        this.renderProjectionChart(plan);
    }

    /**
     * Project portfolio value
     */
    projectPortfolioValue(initial, annual, rate, years) {
        let value = initial;
        for (let i = 0; i < years; i++) {
            value = (value + annual) * (1 + rate / 100);
        }
        return value;
    }

    /**
     * Render projection chart
     */
    renderProjectionChart(plan) {
        const ctx = document.getElementById('projectionChart');
        if (!ctx) return;

        const years = 30;
        const labels = [];
        const data = [];

        for (let i = 0; i <= years; i++) {
            labels.push(i.toString());
            data.push(this.projectPortfolioValue(plan.currentAssets, plan.annualContribution, plan.expectedReturn, i));
        }

        if (this.charts.projection) {
            this.charts.projection.destroy();
        }

        this.charts.projection = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '$' + (value / 1000000).toFixed(1) + 'M'
                        }
                    }
                }
            }
        });
    }

    /**
     * Set projection scenario
     */
    setProjectionScenario(scenario) {
        this.projectionScenario = scenario;

        // Update active button
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.scenario-btn').classList.add('active');

        // Recalculate with new rate
        const rates = {
            'conservative': 6,
            'moderate': 7.5,
            'optimistic': 9
        };

        if (this.profile.retirement) {
            this.profile.retirement.expectedReturn = rates[scenario];
            this.calculateRetirementReadiness();
        }
    }

    /**
     * ============ DIVIDENDS METHODS ============
     */

    /**
     * Handle dividend form submission
     */
    handleDividendSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const dividend = {
            id: 'dividend-' + Date.now(),
            symbol: form['dividend-symbol'].value.toUpperCase(),
            date: form['dividend-date'].value,
            amount: parseFloat(form['dividend-amount'].value),
            reinvested: form['dividend-drip'].checked,
            createdAt: new Date().toISOString()
        };

        this.dividends.push(dividend);
        this.saveData();
        this.renderDividends();
        form.reset();
        this.setupDefaultDates();

        UIUtils.showNotification('Dividend recorded', 'success', 2000);
    }

    /**
     * Delete a dividend
     */
    deleteDividend(id) {
        this.dividends = this.dividends.filter(d => d.id !== id);
        this.saveData();
        this.renderDividends();
        UIUtils.showNotification('Dividend deleted', 'success', 2000);
    }

    /**
     * Render dividends list
     */
    renderDividends() {
        const container = document.getElementById('dividends-list');
        if (!container) return;

        if (this.dividends.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No dividends recorded</p>';
            return;
        }

        const sorted = [...this.dividends].sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sorted.map(dividend => `
            <div class="dividend-item">
                <div class="dividend-symbol">${dividend.symbol}</div>
                <div>${this.formatDate(dividend.date)}</div>
                <div class="dividend-amount">${this.formatCurrency(dividend.amount)}</div>
                ${dividend.reinvested ? '<span class="drip-badge">DRIP</span>' : '<span>Received</span>'}
                <button type="button" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="financeApp.deleteDividend('${dividend.id}')">Delete</button>
            </div>
        `).join('');
    }

    /**
     * ============ RESEARCH METHODS ============
     */

    /**
     * Handle research form submission
     */
    handleResearchSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const research = {
            id: 'research-' + Date.now(),
            symbol: form['research-symbol'].value.toUpperCase(),
            name: form['research-name'].value,
            type: form['research-type'].value,
            rating: form['research-rating'].value,
            sector: form['research-sector'].value,
            notes: form['research-notes'].value,
            createdAt: new Date().toISOString()
        };

        this.research.push(research);
        this.saveData();
        this.renderResearch();
        form.reset();

        UIUtils.showNotification('Research entry saved', 'success', 2000);
    }

    /**
     * Delete research entry
     */
    deleteResearch(id) {
        this.research = this.research.filter(r => r.id !== id);
        this.saveData();
        this.renderResearch();
        UIUtils.showNotification('Research deleted', 'success', 2000);
    }

    /**
     * Set research filter
     */
    setResearchFilter(filter) {
        this.researchFilter = filter;

        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        this.renderResearch();
    }

    /**
     * Render research entries
     */
    renderResearch() {
        const container = document.getElementById('research-list');
        if (!container) return;

        let entries = this.research;

        if (this.researchFilter !== 'all') {
            entries = entries.filter(r => r.type === this.researchFilter);
        }

        if (entries.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No research entries</p>';
            return;
        }

        container.innerHTML = entries.map(research => `
            <div class="research-card">
                <div class="research-header">
                    <div>
                        <div class="research-symbol">${research.symbol}</div>
                        <div class="research-name">${research.name}</div>
                    </div>
                    <button type="button" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="financeApp.deleteResearch('${research.id}')">×</button>
                </div>
                ${research.rating ? `<div class="research-rating">${research.rating}</div>` : ''}
                ${research.sector ? `<small>${research.sector}</small>` : ''}
                ${research.notes ? `<div class="research-notes">${research.notes}</div>` : ''}
            </div>
        `).join('');
    }

    /**
     * ============ SHARIA MODE ============
     */

    /**
     * Toggle Sharia-compliant mode
     */
    toggleShariaMode() {
        this.shariaMode = !this.shariaMode;

        if (this.shariaMode) {
            document.body.classList.add('sharia-mode');
        } else {
            document.body.classList.remove('sharia-mode');
        }

        this.saveData();
        UIUtils.showNotification(this.shariaMode ? '✓ Sharia-Compliant Mode Enabled' : '✓ Sharia-Compliant Mode Disabled', 'success', 2000);
    }

    /**
     * ============ UTILITY METHODS ============
     */

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }

    /**
     * Format date
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

/**
 * Global tab switching function
 */
function switchTab(tabName) {
    UIUtils.switchTab(tabName, financeApp, {
        'dashboard': () => financeApp.updateDashboard(),
        'portfolio': () => {
            financeApp.renderPortfolioHoldings('brokerage');
            financeApp.renderPortfolioHoldings('retirement');
            financeApp.updateCashDisplay();
        },
        'expenses': () => financeApp.renderExpenses(),
        'dividends': () => financeApp.renderDividends(),
        'research': () => financeApp.renderResearch()
    });
}

/**
 * Initialize app globally
 */
let financeApp = null;

document.addEventListener('DOMContentLoaded', () => {
    financeApp = new FinancePlanningApp();
});

// Also support UIUtils initialization pattern
if (typeof UIUtils !== 'undefined') {
    financeApp = UIUtils.initializeApp(FinancePlanningApp, 'financeApp');
}
