class FinanceManager {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('finance_transactions') || '[]');
        this.accounts = JSON.parse(localStorage.getItem('finance_accounts') || '[]');
        this.budgets = JSON.parse(localStorage.getItem('finance_budgets') || '[]');
        this.goals = JSON.parse(localStorage.getItem('finance_goals') || '[]');
        this.recurringTransactions = JSON.parse(localStorage.getItem('finance_recurring_transactions') || '[]');
        this.mealBudget = JSON.parse(localStorage.getItem('finance_meal_budget') || '{"breakfast": 0, "lunch": 0, "dinner": 0, "savingsGoal": 0}');
        this.mealLogs = JSON.parse(localStorage.getItem('finance_meal_logs') || '[]');
        this.categories = {
            expense: [
                'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
                'Bills & Utilities', 'Health & Fitness', 'Travel', 'Education',
                'Personal Care', 'Gifts & Donations', 'Business', 'Other'
            ],
            income: [
                'Salary', 'Freelance', 'Investment', 'Business', 'Gift',
                'Refund', 'Bonus', 'Other'
            ]
        };
        
        this.currentView = 'dashboard';
        this.editingTransaction = null;
        this.editingAccount = null;
        this.editingBudget = null;
        this.editingGoal = null;
        this.editingRecurring = null;
        this.editingMeal = null;
        this.selectedTransactions = new Set();
        this.settings = JSON.parse(localStorage.getItem('finance_settings') || '{}');
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.createDefaultAccounts();
        this.migrateMealLogsToTransactions(); // Convert existing meal logs to transactions
        this.processMonthlyBudgetRollover();
        this.checkGoalAchievements();
        this.showView('dashboard');
        this.updateDashboard();
    }

    // Loading state management methods
    showSkeleton(containerId, type = 'default') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let skeletonHTML = '';
        
        switch (type) {
            case 'transactions':
                skeletonHTML = this.createTransactionsSkeleton();
                break;
            case 'chart':
                skeletonHTML = this.createChartSkeleton();
                break;
            case 'cards':
                skeletonHTML = this.createCardsSkeleton();
                break;
            case 'dashboard':
                skeletonHTML = this.createDashboardSkeleton();
                break;
            default:
                skeletonHTML = '<div class="loading">Loading...</div>';
        }
        
        container.innerHTML = skeletonHTML;
    }

    createTransactionsSkeleton() {
        let html = '<div class="skeleton-card">';
        for (let i = 0; i < 5; i++) {
            html += `
                <div class="skeleton-transaction">
                    <div class="skeleton skeleton-avatar"></div>
                    <div class="skeleton-transaction-content">
                        <div class="skeleton skeleton-transaction-title"></div>
                        <div class="skeleton skeleton-transaction-subtitle"></div>
                    </div>
                    <div class="skeleton skeleton-transaction-amount"></div>
                </div>
            `;
        }
        html += '</div>';
        return html;
    }

    createChartSkeleton() {
        return '<div class="skeleton skeleton-chart"></div>';
    }

    createCardsSkeleton() {
        let html = '';
        for (let i = 0; i < 3; i++) {
            html += `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text long"></div>
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-bar" style="margin-top: 15px;"></div>
                </div>
            `;
        }
        return html;
    }

    createDashboardSkeleton() {
        return `
            <div class="skeleton-card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text short" style="margin-bottom: 20px;"></div>
                <div class="skeleton skeleton-bar"></div>
                <div class="skeleton skeleton-bar"></div>
                <div class="skeleton skeleton-bar"></div>
            </div>
        `;
    }

    showChartLoading(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (canvas && canvas.parentElement) {
            canvas.parentElement.classList.add('chart-loading');
        }
    }

    hideChartLoading(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (canvas && canvas.parentElement) {
            canvas.parentElement.classList.remove('chart-loading');
        }
    }

    async simulateDataLoad(duration = 500) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.showView(view);
            });
        });

        // Mobile menu toggle
        const menuBtn = document.getElementById('menuBtn');
        const mainNav = document.getElementById('mainNav');
        menuBtn?.addEventListener('click', () => {
            mainNav.classList.toggle('mobile-open');
        });

        // Transaction modal
        document.getElementById('quickAddBtn').addEventListener('click', () => this.showTransactionModal());
        document.getElementById('addTransactionBtn').addEventListener('click', () => this.showTransactionModal());
        document.getElementById('closeTransactionModal').addEventListener('click', () => this.hideTransactionModal());
        document.getElementById('cancelTransaction').addEventListener('click', () => this.hideTransactionModal());
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.handleTransactionSubmit(e));

        // Account modal
        document.getElementById('addAccountBtn').addEventListener('click', () => this.showAccountModal());
        document.getElementById('closeAccountModal').addEventListener('click', () => this.hideAccountModal());
        document.getElementById('cancelAccount').addEventListener('click', () => this.hideAccountModal());
        document.getElementById('accountForm').addEventListener('submit', (e) => this.handleAccountSubmit(e));

        // Budget modal
        document.getElementById('addBudgetBtn').addEventListener('click', () => this.showBudgetModal());
        document.getElementById('closeBudgetModal').addEventListener('click', () => this.hideBudgetModal());
        document.getElementById('cancelBudget').addEventListener('click', () => this.hideBudgetModal());
        document.getElementById('budgetForm').addEventListener('submit', (e) => this.handleBudgetSubmit(e));
        
        // Multi-month budget controls
        document.getElementById('budgetDuration').addEventListener('change', (e) => this.toggleMultiMonthOptions(e));
        document.getElementById('budgetVaryByMonth').addEventListener('change', (e) => this.toggleMonthlyBreakdown(e));
        document.getElementById('budgetStartMonth').addEventListener('change', () => this.updateMonthlyBreakdown());
        document.getElementById('budgetEndMonth').addEventListener('change', () => this.updateMonthlyBreakdown());
        
        // Budget view controls
        document.getElementById('budgetTimeView').addEventListener('change', (e) => this.toggleBudgetTimeView(e));
        document.getElementById('applyBudgetRange').addEventListener('click', () => this.updateBudgetsList());

        // Goal modal
        document.getElementById('addGoalBtn').addEventListener('click', () => this.showGoalModal());
        document.getElementById('closeGoalModal').addEventListener('click', () => this.hideGoalModal());
        document.getElementById('cancelGoal').addEventListener('click', () => this.hideGoalModal());
        document.getElementById('goalForm').addEventListener('submit', (e) => this.handleGoalSubmit(e));

        // Recurring transaction modal
        document.getElementById('addRecurringBtn').addEventListener('click', () => this.showRecurringModal());
        document.getElementById('closeRecurringModal').addEventListener('click', () => this.hideRecurringModal());
        document.getElementById('cancelRecurring').addEventListener('click', () => this.hideRecurringModal());
        document.getElementById('recurringForm').addEventListener('submit', (e) => this.handleRecurringSubmit(e));

        // Meal budget functionality
        document.getElementById('addMealBtn').addEventListener('click', () => this.showMealModal());
        document.getElementById('closeMealModal').addEventListener('click', () => this.hideMealModal());
        document.getElementById('cancelMeal').addEventListener('click', () => this.hideMealModal());
        document.getElementById('mealForm').addEventListener('submit', (e) => this.handleMealSubmit(e));
        document.getElementById('saveMealSettings').addEventListener('click', () => this.saveMealSettings());
        document.getElementById('mealHistoryFilter').addEventListener('change', () => this.updateMealHistory());
        document.getElementById('mealType').addEventListener('change', () => this.updateMealBudgetInfo());
        document.getElementById('mealAmount').addEventListener('input', () => this.updateMealBudgetInfo());

        // Transfer modal
        document.getElementById('transferBtn')?.addEventListener('click', () => this.showTransferModal());
        document.getElementById('closeTransferModal')?.addEventListener('click', () => this.hideTransferModal());
        document.getElementById('cancelTransfer')?.addEventListener('click', () => this.hideTransferModal());
        document.getElementById('transferForm')?.addEventListener('submit', (e) => this.handleTransferSubmit(e));

        // Reconcile modal
        document.getElementById('reconcileBtn')?.addEventListener('click', () => this.showReconcileModal());
        document.getElementById('closeReconcileModal')?.addEventListener('click', () => this.hideReconcileModal());
        document.getElementById('cancelReconcile')?.addEventListener('click', () => this.hideReconcileModal());
        document.getElementById('calculateReconcile')?.addEventListener('click', () => this.calculateReconciliation());
        document.getElementById('reconcileForm')?.addEventListener('submit', (e) => this.handleReconcileSubmit(e));

        // Reports
        document.getElementById('exportReportsBtn')?.addEventListener('click', () => this.exportReports());
        document.getElementById('reportTimeRange')?.addEventListener('change', () => this.updateReports());

        // Projections
        document.getElementById('resetProjectionsBtn')?.addEventListener('click', () => this.resetProjections());

        // Transaction type change
        document.getElementById('transactionType').addEventListener('change', (e) => {
            this.updateCategoryOptions(e.target.value);
        });

        // Recurring transaction type change
        document.getElementById('recurringType')?.addEventListener('change', (e) => {
            this.updateRecurringCategoryOptions();
        });

        // Filters
        document.getElementById('searchTransactions')?.addEventListener('input', () => this.filterTransactions());
        document.getElementById('filterCategory')?.addEventListener('change', () => this.filterTransactions());
        document.getElementById('filterAccount')?.addEventListener('change', () => this.filterTransactions());
        document.getElementById('filterType')?.addEventListener('change', () => this.filterTransactions());
        document.getElementById('startDate')?.addEventListener('change', () => this.filterTransactions());
        document.getElementById('endDate')?.addEventListener('change', () => this.filterTransactions());

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });

        // Bulk actions
        document.getElementById('selectAllBtn')?.addEventListener('click', () => this.selectAllTransactions());
        document.getElementById('deselectAllBtn')?.addEventListener('click', () => this.deselectAllTransactions());
        document.getElementById('bulkDeleteBtn')?.addEventListener('click', () => this.bulkDeleteTransactions());
        document.getElementById('exportSelectedBtn')?.addEventListener('click', () => this.exportSelectedTransactions());
        document.getElementById('importCsvBtn')?.addEventListener('change', (e) => this.importCsv(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.target.matches('input, textarea, select')) {
                e.preventDefault();
                this.showTransactionModal();
            }
        });
    }

    createDefaultAccounts() {
        if (this.accounts.length === 0) {
            const defaultAccounts = [
                {
                    id: this.generateId(),
                    name: 'Checking Account',
                    type: 'checking',
                    balance: 1000,
                    color: '#28a745'
                },
                {
                    id: this.generateId(),
                    name: 'Savings Account',
                    type: 'savings',
                    balance: 5000,
                    color: '#007bff'
                }
            ];
            this.accounts = defaultAccounts;
            this.saveAccounts();
        }
    }

    showView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

        // Update content
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(viewName)?.classList.add('active');

        this.currentView = viewName;

        // Close mobile menu
        document.getElementById('mainNav').classList.remove('mobile-open');

        // Load view-specific content
        switch (viewName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'transactions':
                this.updateTransactionsList();
                this.updateTransactionFilters();
                break;
            case 'recurring':
                this.updateRecurringList();
                break;
            case 'budgets':
                this.updateBudgetsList();
                break;
            case 'meals':
                this.updateMealBudgetView();
                break;
            case 'accounts':
                this.updateAccountsList();
                break;
            case 'goals':
                this.updateGoalsList();
                break;
            case 'reports':
                this.updateReports();
                break;
            case 'projections':
                this.updateProjections();
                break;
            case 'settings':
                this.updateSettings();
                break;
        }
    }

    // Dashboard Methods
    async updateDashboard() {
        // Show loading skeletons first
        this.showSkeleton('accountBalances', 'cards');
        this.showSkeleton('recentTransactions', 'transactions');
        this.showSkeleton('budgetStatus', 'dashboard');
        
        // Simulate loading time for better UX
        await this.simulateDataLoad(300);
        
        // Update with real data
        this.updateAccountBalances();
        this.updateMonthlySummary();
        this.updateRecentTransactions();
        this.updateBudgetStatus();
    }

    updateAccountBalances() {
        const container = document.getElementById('accountBalances');
        if (!container) return;

        if (this.accounts.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No accounts found. Add your first account!</p></div>';
            return;
        }

        container.innerHTML = this.accounts.map(account => `
            <div class="account-item">
                <div class="account-name">
                    <div class="account-color" style="background: ${account.color}"></div>
                    <span>${account.name}</span>
                </div>
                <div class="account-balance ${account.balance >= 0 ? 'positive' : 'negative'}">
                    ${this.formatCurrency(account.balance)}
                </div>
            </div>
        `).join('');
    }

    updateMonthlySummary() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });

        const income = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const net = income - expenses;

        document.getElementById('monthlyIncome').textContent = this.formatCurrency(income);
        document.getElementById('monthlyExpenses').textContent = this.formatCurrency(expenses);
        
        const netElement = document.getElementById('monthlyNet');
        netElement.textContent = this.formatCurrency(net);
        netElement.className = `stat-value ${net >= 0 ? 'income' : 'expense'}`;
    }

    updateRecentTransactions() {
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        const recentTransactions = this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recentTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No transactions yet. Add your first transaction!</p></div>';
            return;
        }

        container.innerHTML = recentTransactions.map(transaction => {
            const account = this.accounts.find(a => a.id === transaction.account);
            return `
                <div class="transaction-item" onclick="financeManager.editTransaction('${transaction.id}')">
                    <div class="transaction-info">
                        <h4>${transaction.description || transaction.category}</h4>
                        <div class="transaction-details">
                            ${transaction.category} • ${account?.name || 'Unknown Account'}
                        </div>
                    </div>
                    <div class="transaction-amount">
                        <span class="amount ${transaction.type}">
                            ${transaction.type === 'expense' ? '-' : '+'}${this.formatCurrency(transaction.amount)}
                        </span>
                        <div class="transaction-date">${this.formatDate(transaction.date)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateBudgetStatus() {
        const container = document.getElementById('budgetStatus');
        if (!container) return;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        if (this.budgets.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No budgets set. Create your first budget!</p></div>';
            return;
        }

        const currentBudgets = this.budgets.filter(b => 
            b.year === currentYear && b.month === currentMonth
        );

        if (currentBudgets.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No budgets for this month.</p></div>';
            return;
        }

        container.innerHTML = currentBudgets.slice(0, 3).map(budget => {
            const spent = this.getBudgetSpent(budget);
            const percentage = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
            const status = percentage >= 100 ? 'danger' : percentage >= budget.alertThreshold ? 'warning' : '';

            return `
                <div class="budget-item">
                    <div class="budget-header">
                        <span class="budget-category">${budget.category}</span>
                        <span class="budget-amounts">
                            ${this.formatCurrency(spent)} / ${this.formatCurrency(budget.monthlyLimit)}
                        </span>
                    </div>
                    <div class="budget-progress">
                        <div class="budget-progress-bar ${status}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Transaction Methods
    showTransactionModal() {
        this.editingTransaction = null;
        this.resetTransactionForm();
        this.updateCategoryOptions('expense');
        this.updateAccountOptions();
        document.getElementById('transactionModalTitle').textContent = 'Add Transaction';
        document.getElementById('transactionModal').classList.add('active');
    }

    hideTransactionModal() {
        document.getElementById('transactionModal').classList.remove('active');
        this.editingTransaction = null;
    }

    resetTransactionForm() {
        const form = document.getElementById('transactionForm');
        form.reset();
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    }

    updateCategoryOptions(type) {
        const select = document.getElementById('transactionCategory');
        select.innerHTML = this.categories[type].map(category => 
            `<option value="${category}">${category}</option>`
        ).join('');
    }

    updateAccountOptions() {
        const select = document.getElementById('transactionAccount');
        select.innerHTML = this.accounts.map(account => 
            `<option value="${account.id}">${account.name}</option>`
        ).join('');
    }

    handleTransactionSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const transaction = {
            id: this.editingTransaction?.id || this.generateId(),
            type: document.getElementById('transactionType').value,
            amount: parseFloat(document.getElementById('transactionAmount').value),
            category: document.getElementById('transactionCategory').value,
            account: document.getElementById('transactionAccount').value,
            description: document.getElementById('transactionDescription').value,
            date: document.getElementById('transactionDate').value,
            recurring: document.getElementById('transactionRecurring').checked,
            tags: [],
            createdAt: this.editingTransaction?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingTransaction) {
            const index = this.transactions.findIndex(t => t.id === this.editingTransaction.id);
            this.transactions[index] = transaction;
            this.showToast('Transaction updated successfully', 'success');
        } else {
            this.transactions.push(transaction);
            this.showToast('Transaction added successfully', 'success');
        }

        this.updateAccountBalance(transaction);
        this.saveTransactions();
        this.hideTransactionModal();
        this.updateDashboard();
        
        if (this.currentView === 'transactions') {
            this.updateTransactionsList();
        }
    }

    updateAccountBalance(transaction) {
        const account = this.accounts.find(a => a.id === transaction.account);
        if (!account) return;

        if (this.editingTransaction) {
            // Reverse previous transaction
            const oldTransaction = this.editingTransaction;
            if (oldTransaction.type === 'income') {
                account.balance -= oldTransaction.amount;
            } else {
                account.balance += oldTransaction.amount;
            }
        }

        // Apply new transaction
        if (transaction.type === 'income') {
            account.balance += transaction.amount;
        } else {
            account.balance -= transaction.amount;
        }

        this.saveAccounts();
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.editingTransaction = transaction;
        
        // Populate form
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('transactionAmount').value = transaction.amount;
        document.getElementById('transactionCategory').value = transaction.category;
        document.getElementById('transactionAccount').value = transaction.account;
        document.getElementById('transactionDescription').value = transaction.description;
        document.getElementById('transactionDate').value = transaction.date;
        document.getElementById('transactionRecurring').checked = transaction.recurring;

        this.updateCategoryOptions(transaction.type);
        this.updateAccountOptions();
        
        document.getElementById('transactionModalTitle').textContent = 'Edit Transaction';
        document.getElementById('transactionModal').classList.add('active');
    }

    deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        // Reverse account balance
        const account = this.accounts.find(a => a.id === transaction.account);
        if (account) {
            if (transaction.type === 'income') {
                account.balance -= transaction.amount;
            } else {
                account.balance += transaction.amount;
            }
            this.saveAccounts();
        }

        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
        this.updateDashboard();
        this.updateTransactionsList();
        this.showToast('Transaction deleted successfully', 'success');
    }

    async updateTransactionsList() {
        const container = document.getElementById('transactionsList');
        if (!container) return;

        // Show loading skeleton
        this.showSkeleton('transactionsList', 'transactions');
        
        // Simulate processing time for large transaction lists
        await this.simulateDataLoad(400);

        const filteredTransactions = this.getFilteredTransactions();

        if (filteredTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No transactions found</h3><p>Try adjusting your filters or add your first transaction.</p></div>';
            return;
        }

        container.innerHTML = `
            <div class="card">
                ${filteredTransactions.map(transaction => {
                    const account = this.accounts.find(a => a.id === transaction.account);
                    const isSelected = this.selectedTransactions.has(transaction.id);
                    return `
                        <div class="transaction-item ${isSelected ? 'selected' : ''}" data-transaction-id="${transaction.id}">
                            <input type="checkbox" class="transaction-checkbox" ${isSelected ? 'checked' : ''} 
                                   onchange="financeManager.toggleTransactionSelection('${transaction.id}')">
                            <div class="transaction-info">
                                <h4>${transaction.description || transaction.category}</h4>
                                <div class="transaction-details">
                                    ${transaction.category} • ${account?.name || 'Unknown Account'}
                                </div>
                            </div>
                            <div class="transaction-amount">
                                <span class="amount ${transaction.type}">
                                    ${transaction.type === 'expense' ? '-' : '+'}${this.formatCurrency(transaction.amount)}
                                </span>
                                <div class="transaction-date">${this.formatDate(transaction.date)}</div>
                            </div>
                            <div class="transaction-actions" style="display: none;">
                                <button class="btn btn-sm" onclick="financeManager.editTransaction('${transaction.id}')">Edit</button>
                                <button class="btn btn-sm btn-secondary" onclick="financeManager.deleteTransaction('${transaction.id}')">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Add hover effect to show actions
        container.querySelectorAll('.transaction-item').forEach(item => {
            const actions = item.querySelector('.transaction-actions');
            item.addEventListener('mouseenter', () => {
                actions.style.display = 'flex';
            });
            item.addEventListener('mouseleave', () => {
                actions.style.display = 'none';
            });
        });
    }

    updateTransactionFilters() {
        // Update category filter
        const categoryFilter = document.getElementById('filterCategory');
        if (categoryFilter) {
            const allCategories = [...new Set([...this.categories.expense, ...this.categories.income])];
            categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }

        // Update account filter
        const accountFilter = document.getElementById('filterAccount');
        if (accountFilter) {
            accountFilter.innerHTML = '<option value="">All Accounts</option>' +
                this.accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('');
        }
    }

    getFilteredTransactions() {
        let filtered = [...this.transactions];

        const search = document.getElementById('searchTransactions')?.value.toLowerCase();
        const categoryFilter = document.getElementById('filterCategory')?.value;
        const accountFilter = document.getElementById('filterAccount')?.value;
        const typeFilter = document.getElementById('filterType')?.value;
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;

        if (search) {
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(search) ||
                t.category.toLowerCase().includes(search)
            );
        }

        if (categoryFilter) {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        if (accountFilter) {
            filtered = filtered.filter(t => t.account === accountFilter);
        }

        if (typeFilter) {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        if (startDate) {
            filtered = filtered.filter(t => t.date >= startDate);
        }

        if (endDate) {
            filtered = filtered.filter(t => t.date <= endDate);
        }

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    filterTransactions() {
        this.updateTransactionsList();
    }

    // Account Methods
    showAccountModal() {
        this.editingAccount = null;
        this.resetAccountForm();
        document.getElementById('accountModalTitle').textContent = 'Add Account';
        document.getElementById('accountModal').classList.add('active');
    }

    hideAccountModal() {
        document.getElementById('accountModal').classList.remove('active');
        this.editingAccount = null;
    }

    resetAccountForm() {
        document.getElementById('accountForm').reset();
        document.getElementById('accountColor').value = '#667eea';
    }

    handleAccountSubmit(e) {
        e.preventDefault();

        const account = {
            id: this.editingAccount?.id || this.generateId(),
            name: document.getElementById('accountName').value,
            type: document.getElementById('accountType').value,
            balance: parseFloat(document.getElementById('accountBalance').value),
            color: document.getElementById('accountColor').value
        };

        if (this.editingAccount) {
            const index = this.accounts.findIndex(a => a.id === this.editingAccount.id);
            this.accounts[index] = account;
            this.showToast('Account updated successfully', 'success');
        } else {
            this.accounts.push(account);
            this.showToast('Account added successfully', 'success');
        }

        this.saveAccounts();
        this.hideAccountModal();
        this.updateDashboard();
        
        if (this.currentView === 'accounts') {
            this.updateAccountsList();
        }
    }

    updateAccountsList() {
        const container = document.getElementById('accountsList');
        if (!container) return;

        if (this.accounts.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No accounts found</h3><p>Add your first account to get started.</p><button class="btn btn-primary" onclick="financeManager.showAccountModal()">+ Add Account</button></div>';
            return;
        }

        container.innerHTML = this.accounts.map(account => `
            <div class="card">
                <div class="account-item">
                    <div class="account-name">
                        <div class="account-color" style="background: ${account.color}"></div>
                        <div>
                            <h4>${account.name}</h4>
                            <span style="color: #666; text-transform: capitalize;">${account.type}</span>
                        </div>
                    </div>
                    <div class="account-balance ${account.balance >= 0 ? 'positive' : 'negative'}">
                        ${this.formatCurrency(account.balance)}
                    </div>
                </div>
                <div class="form-actions" style="margin-top: 15px;">
                    <button class="btn btn-sm" onclick="financeManager.editAccount('${account.id}')">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="financeManager.deleteAccount('${account.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    editAccount(id) {
        const account = this.accounts.find(a => a.id === id);
        if (!account) return;

        this.editingAccount = account;
        
        document.getElementById('accountName').value = account.name;
        document.getElementById('accountType').value = account.type;
        document.getElementById('accountBalance').value = account.balance;
        document.getElementById('accountColor').value = account.color;
        
        document.getElementById('accountModalTitle').textContent = 'Edit Account';
        document.getElementById('accountModal').classList.add('active');
    }

    deleteAccount(id) {
        if (!confirm('Are you sure you want to delete this account? This will also delete all associated transactions.')) return;

        this.accounts = this.accounts.filter(a => a.id !== id);
        this.transactions = this.transactions.filter(t => t.account !== id);
        
        this.saveAccounts();
        this.saveTransactions();
        this.updateDashboard();
        this.updateAccountsList();
        this.showToast('Account deleted successfully', 'success');
    }

    // Budget Methods
    showBudgetModal() {
        this.editingBudget = null;
        this.resetBudgetForm();
        this.updateBudgetCategoryOptions();
        document.getElementById('budgetModalTitle').textContent = 'Create Budget';
        document.getElementById('budgetModal').classList.add('active');
    }

    hideBudgetModal() {
        document.getElementById('budgetModal').classList.remove('active');
        this.editingBudget = null;
    }

    resetBudgetForm() {
        document.getElementById('budgetForm').reset();
        document.getElementById('budgetAlert').value = 80;
        document.getElementById('budgetDuration').value = 'single';
        document.getElementById('multiMonthOptions').style.display = 'none';
        document.getElementById('monthlyBudgetBreakdown').style.display = 'none';
        document.getElementById('budgetVaryByMonth').checked = false;
        
        // Reset label text
        const budgetAmountLabel = document.getElementById('budgetAmount').previousElementSibling;
        budgetAmountLabel.textContent = 'Monthly Limit';
    }

    updateBudgetCategoryOptions() {
        const select = document.getElementById('budgetCategory');
        select.innerHTML = this.categories.expense.map(category => 
            `<option value="${category}">${category}</option>`
        ).join('');
    }

    handleBudgetSubmit(e) {
        e.preventDefault();

        const budgetDuration = document.getElementById('budgetDuration').value;
        
        if (budgetDuration === 'multi') {
            this.handleMultiMonthBudgetSubmit();
        } else {
            this.handleSingleMonthBudgetSubmit();
        }
    }

    handleSingleMonthBudgetSubmit() {
        const now = new Date();
        const budget = {
            id: this.editingBudget?.id || this.generateId(),
            category: document.getElementById('budgetCategory').value,
            monthlyLimit: parseFloat(document.getElementById('budgetAmount').value),
            alertThreshold: parseFloat(document.getElementById('budgetAlert').value),
            year: now.getFullYear(),
            month: now.getMonth(),
            currentSpent: this.editingBudget?.currentSpent || 0,
            rolloverEnabled: document.getElementById('budgetRollover')?.checked || false,
            rolloverAmount: 0
        };

        if (this.editingBudget) {
            const index = this.budgets.findIndex(b => b.id === this.editingBudget.id);
            this.budgets[index] = budget;
            this.showToast('Budget updated successfully', 'success');
        } else {
            // Check if budget already exists for this category and month
            const existingBudget = this.budgets.find(b => 
                b.category === budget.category && 
                b.year === budget.year && 
                b.month === budget.month
            );

            if (existingBudget) {
                this.showToast('Budget already exists for this category this month', 'error');
                return;
            }

            budget.currentSpent = this.getBudgetSpent(budget);
            this.budgets.push(budget);
            this.showToast('Budget created successfully', 'success');
        }

        this.completeBudgetSubmit();
    }

    handleMultiMonthBudgetSubmit() {
        const category = document.getElementById('budgetCategory').value;
        const startMonth = document.getElementById('budgetStartMonth').value;
        const endMonth = document.getElementById('budgetEndMonth').value;
        const alertThreshold = parseFloat(document.getElementById('budgetAlert').value);
        const rolloverEnabled = document.getElementById('budgetRollover')?.checked || false;
        const varyByMonth = document.getElementById('budgetVaryByMonth').checked;
        
        if (!startMonth || !endMonth) {
            this.showToast('Please select start and end months', 'error');
            return;
        }

        const months = this.getMonthsInRange(startMonth, endMonth);
        const budgetsToCreate = [];
        let conflictFound = false;

        // Check for existing budgets first
        for (const month of months) {
            const existingBudget = this.budgets.find(b => 
                b.category === category && 
                b.year === month.year && 
                b.month === month.month
            );

            if (existingBudget) {
                this.showToast(`Budget already exists for ${category} in ${month.display}`, 'error');
                conflictFound = true;
                break;
            }
        }

        if (conflictFound) return;

        // Create budgets for each month
        for (const month of months) {
            let monthlyLimit;
            
            if (varyByMonth) {
                const monthInput = document.getElementById(`budget_${month.key}`);
                monthlyLimit = parseFloat(monthInput?.value || 0);
            } else {
                monthlyLimit = parseFloat(document.getElementById('budgetAmount').value);
            }

            const budget = {
                id: this.generateId(),
                category: category,
                monthlyLimit: monthlyLimit,
                alertThreshold: alertThreshold,
                year: month.year,
                month: month.month,
                currentSpent: 0,
                rolloverEnabled: rolloverEnabled,
                rolloverAmount: 0,
                isMultiMonth: true,
                multiMonthGroup: this.generateId() // Group ID for related budgets
            };

            budget.currentSpent = this.getBudgetSpent(budget);
            budgetsToCreate.push(budget);
        }

        // Add all budgets
        this.budgets.push(...budgetsToCreate);
        this.showToast(`Multi-month budget created for ${budgetsToCreate.length} months`, 'success');
        
        this.completeBudgetSubmit();
    }

    completeBudgetSubmit() {

        this.saveBudgets();
        this.hideBudgetModal();
        this.updateDashboard();
        
        if (this.currentView === 'budgets') {
            this.updateBudgetsList();
        }
    }

    getBudgetSpent(budget) {
        return this.transactions
            .filter(t => 
                t.type === 'expense' &&
                t.category === budget.category &&
                new Date(t.date).getFullYear() === budget.year &&
                new Date(t.date).getMonth() === budget.month
            )
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // Budget rollover functionality
    processMonthlyBudgetRollover() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Find last month's budgets
        let lastMonth = currentMonth - 1;
        let lastYear = currentYear;
        if (lastMonth < 0) {
            lastMonth = 11;
            lastYear = currentYear - 1;
        }

        const lastMonthBudgets = this.budgets.filter(b => 
            b.year === lastYear && 
            b.month === lastMonth && 
            b.rolloverEnabled
        );

        lastMonthBudgets.forEach(lastBudget => {
            const spent = this.getBudgetSpent(lastBudget);
            const remaining = lastBudget.monthlyLimit - spent;
            
            if (remaining > 0) {
                // Find or create current month budget
                let currentBudget = this.budgets.find(b => 
                    b.category === lastBudget.category &&
                    b.year === currentYear &&
                    b.month === currentMonth
                );

                if (currentBudget) {
                    // Add rollover to existing budget
                    currentBudget.rolloverAmount = (currentBudget.rolloverAmount || 0) + remaining;
                    currentBudget.monthlyLimit += remaining;
                } else {
                    // Create new budget with rollover
                    const newBudget = {
                        id: this.generateId(),
                        category: lastBudget.category,
                        monthlyLimit: lastBudget.monthlyLimit + remaining,
                        alertThreshold: lastBudget.alertThreshold,
                        year: currentYear,
                        month: currentMonth,
                        currentSpent: 0,
                        rolloverEnabled: lastBudget.rolloverEnabled,
                        rolloverAmount: remaining
                    };
                    this.budgets.push(newBudget);
                }
                
                this.showToast(`Rolled over ${this.formatCurrency(remaining)} from ${lastBudget.category} budget`, 'success');
            }
        });

        this.saveBudgets();
    }

    updateBudgetsList() {
        const container = document.getElementById('budgetsList');
        if (!container) return;

        const budgets = this.getFilteredBudgets();

        if (budgets.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No budgets found</h3><p>Create your first budget to track spending.</p><button class="btn btn-primary" onclick="financeManager.showBudgetModal()">+ Create Budget</button></div>';
            return;
        }

        const timeView = document.getElementById('budgetTimeView').value;
        
        if (timeView === 'multi') {
            container.innerHTML = this.renderMultiMonthBudgets(budgets);
        } else {
            container.innerHTML = budgets.map(budget => this.renderSingleBudget(budget)).join('');
        }
    }

    getFilteredBudgets() {
        const timeView = document.getElementById('budgetTimeView').value;
        const now = new Date();
        
        switch (timeView) {
            case 'current':
                return this.budgets.filter(b => 
                    b.year === now.getFullYear() && b.month === now.getMonth()
                );
            case 'next':
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                return this.budgets.filter(b => 
                    b.year === nextMonth.getFullYear() && b.month === nextMonth.getMonth()
                );
            case 'multi':
                const startMonth = document.getElementById('budgetRangeStart').value;
                const endMonth = document.getElementById('budgetRangeEnd').value;
                
                if (!startMonth || !endMonth) return this.budgets;
                
                const months = this.getMonthsInRange(startMonth, endMonth);
                return this.budgets.filter(b => 
                    months.some(m => m.year === b.year && m.month === b.month)
                );
            case 'all':
            default:
                return this.budgets;
        }
    }

    renderSingleBudget(budget) {
        const spent = this.getBudgetSpent(budget);
        const percentage = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
        const status = percentage >= 100 ? 'danger' : percentage >= budget.alertThreshold ? 'warning' : '';
        const monthDisplay = new Date(budget.year, budget.month, 1).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
        
        return `
            <div class="card">
                <div class="budget-item">
                    <div class="budget-header">
                        <div>
                            <span class="budget-category">${budget.category}</span>
                            <div style="font-size: 0.85rem; color: #666; margin-top: 2px;">${monthDisplay}</div>
                        </div>
                        <span class="budget-amounts">
                            ${this.formatCurrency(spent)} / ${this.formatCurrency(budget.monthlyLimit)}
                        </span>
                    </div>
                    <div class="budget-progress">
                        <div class="budget-progress-bar ${status}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                        ${percentage.toFixed(1)}% used • Alert at ${budget.alertThreshold}%
                        ${budget.isMultiMonth ? ' • Part of multi-month budget' : ''}
                    </div>
                </div>
                <div class="form-actions" style="margin-top: 15px;">
                    <button class="btn btn-sm" onclick="financeManager.editBudget('${budget.id}')">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="financeManager.deleteBudget('${budget.id}')">Delete</button>
                </div>
            </div>
        `;
    }

    renderMultiMonthBudgets(budgets) {
        // Group budgets by category for multi-month view
        const grouped = {};
        budgets.forEach(budget => {
            if (!grouped[budget.category]) {
                grouped[budget.category] = [];
            }
            grouped[budget.category].push(budget);
        });

        return Object.entries(grouped).map(([category, categoryBudgets]) => {
            categoryBudgets.sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

            const totalBudget = categoryBudgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
            const totalSpent = categoryBudgets.reduce((sum, b) => sum + this.getBudgetSpent(b), 0);
            const avgPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
            const status = avgPercentage >= 100 ? 'danger' : avgPercentage >= 80 ? 'warning' : '';

            const monthlyBreakdown = categoryBudgets.map(budget => {
                const spent = this.getBudgetSpent(budget);
                const percentage = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
                const monthDisplay = new Date(budget.year, budget.month, 1).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: '2-digit' 
                });
                
                return `
                    <div class="monthly-budget-breakdown">
                        <div class="breakdown-month">${monthDisplay}</div>
                        <div class="breakdown-amounts">${this.formatCurrency(spent)} / ${this.formatCurrency(budget.monthlyLimit)}</div>
                        <div class="breakdown-progress">
                            <div class="budget-progress-bar ${percentage >= 100 ? 'danger' : percentage >= budget.alertThreshold ? 'warning' : ''}" 
                                 style="width: ${Math.min(percentage, 100)}%; height: 4px;"></div>
                        </div>
                        <div class="breakdown-percentage">${percentage.toFixed(1)}%</div>
                    </div>
                `;
            }).join('');

            return `
                <div class="card multi-month-budget-card">
                    <div class="budget-item">
                        <div class="budget-header">
                            <div>
                                <span class="budget-category">${category}</span>
                                <div style="font-size: 0.85rem; color: #666; margin-top: 2px;">
                                    ${categoryBudgets.length} months • ${avgPercentage.toFixed(1)}% average usage
                                </div>
                            </div>
                            <span class="budget-amounts">
                                ${this.formatCurrency(totalSpent)} / ${this.formatCurrency(totalBudget)}
                            </span>
                        </div>
                        <div class="budget-progress">
                            <div class="budget-progress-bar ${status}" style="width: ${Math.min(avgPercentage, 100)}%"></div>
                        </div>
                        <div class="monthly-breakdowns">
                            ${monthlyBreakdown}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    editBudget(id) {
        const budget = this.budgets.find(b => b.id === id);
        if (!budget) return;

        this.editingBudget = budget;
        
        document.getElementById('budgetCategory').value = budget.category;
        document.getElementById('budgetAmount').value = budget.monthlyLimit;
        document.getElementById('budgetAlert').value = budget.alertThreshold;
        
        document.getElementById('budgetModalTitle').textContent = 'Edit Budget';
        document.getElementById('budgetModal').classList.add('active');
    }

    deleteBudget(id) {
        if (!confirm('Are you sure you want to delete this budget?')) return;

        this.budgets = this.budgets.filter(b => b.id !== id);
        this.saveBudgets();
        this.updateDashboard();
        this.updateBudgetsList();
        this.showToast('Budget deleted successfully', 'success');
    }

    // Multi-month budget methods
    toggleMultiMonthOptions(e) {
        const isMultiMonth = e.target.value === 'multi';
        const multiMonthOptions = document.getElementById('multiMonthOptions');
        const budgetAmountField = document.getElementById('budgetAmount');
        const budgetAmountLabel = budgetAmountField.previousElementSibling;
        
        multiMonthOptions.style.display = isMultiMonth ? 'block' : 'none';
        
        if (isMultiMonth) {
            budgetAmountLabel.textContent = 'Monthly Limit (for each month)';
            // Set default dates
            const now = new Date();
            const currentMonth = now.toISOString().slice(0, 7);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 7);
            
            document.getElementById('budgetStartMonth').value = currentMonth;
            document.getElementById('budgetEndMonth').value = nextMonth;
        } else {
            budgetAmountLabel.textContent = 'Monthly Limit';
            document.getElementById('monthlyBudgetBreakdown').style.display = 'none';
            document.getElementById('budgetVaryByMonth').checked = false;
        }
    }

    toggleMonthlyBreakdown(e) {
        const breakdown = document.getElementById('monthlyBudgetBreakdown');
        breakdown.style.display = e.target.checked ? 'block' : 'none';
        
        if (e.target.checked) {
            this.updateMonthlyBreakdown();
        }
    }

    updateMonthlyBreakdown() {
        const startMonth = document.getElementById('budgetStartMonth').value;
        const endMonth = document.getElementById('budgetEndMonth').value;
        const breakdown = document.getElementById('monthlyBudgetBreakdown');
        
        if (!startMonth || !endMonth || !document.getElementById('budgetVaryByMonth').checked) {
            return;
        }

        const months = this.getMonthsInRange(startMonth, endMonth);
        const defaultAmount = document.getElementById('budgetAmount').value || '';
        
        breakdown.innerHTML = months.map(month => `
            <div class="monthly-budget-item">
                <div>
                    <label>${month.display}</label>
                </div>
                <div>
                    <input type="number" step="0.01" min="0" placeholder="0.00" 
                           id="budget_${month.key}" value="${defaultAmount}">
                </div>
            </div>
        `).join('');
    }

    getMonthsInRange(startMonth, endMonth) {
        const months = [];
        const start = new Date(startMonth + '-01');
        const end = new Date(endMonth + '-01');
        
        const current = new Date(start);
        while (current <= end) {
            const monthKey = current.toISOString().slice(0, 7);
            const monthDisplay = current.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
            });
            
            months.push({
                key: monthKey,
                display: monthDisplay,
                year: current.getFullYear(),
                month: current.getMonth()
            });
            
            current.setMonth(current.getMonth() + 1);
        }
        
        return months;
    }

    toggleBudgetTimeView(e) {
        const isMultiMonth = e.target.value === 'multi';
        const multiMonthRange = document.getElementById('multiMonthRange');
        
        multiMonthRange.style.display = isMultiMonth ? 'block' : 'none';
        
        if (isMultiMonth) {
            // Set default range to current month + next 2 months
            const now = new Date();
            const currentMonth = now.toISOString().slice(0, 7);
            const endMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString().slice(0, 7);
            
            document.getElementById('budgetRangeStart').value = currentMonth;
            document.getElementById('budgetRangeEnd').value = endMonth;
        }
        
        this.updateBudgetsList();
    }

    // Goal Methods
    showGoalModal() {
        this.editingGoal = null;
        this.resetGoalForm();
        document.getElementById('goalModalTitle').textContent = 'Create Financial Goal';
        document.getElementById('goalModal').classList.add('active');
    }

    hideGoalModal() {
        document.getElementById('goalModal').classList.remove('active');
        this.editingGoal = null;
    }

    resetGoalForm() {
        document.getElementById('goalForm').reset();
        document.getElementById('goalCurrent').value = 0;
    }

    handleGoalSubmit(e) {
        e.preventDefault();

        const goal = {
            id: this.editingGoal?.id || this.generateId(),
            name: document.getElementById('goalName').value,
            type: document.getElementById('goalType').value,
            targetAmount: parseFloat(document.getElementById('goalTarget').value),
            currentAmount: parseFloat(document.getElementById('goalCurrent').value),
            targetDate: document.getElementById('goalDate').value,
            description: document.getElementById('goalDescription').value
        };

        if (this.editingGoal) {
            const index = this.goals.findIndex(g => g.id === this.editingGoal.id);
            this.goals[index] = goal;
            this.showToast('Goal updated successfully', 'success');
        } else {
            this.goals.push(goal);
            this.showToast('Goal created successfully', 'success');
        }

        this.saveGoals();
        this.hideGoalModal();
        
        if (this.currentView === 'goals') {
            this.updateGoalsList();
        }
    }

    updateGoalsList() {
        const container = document.getElementById('goalsList');
        if (!container) return;

        if (this.goals.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No goals found</h3><p>Create your first financial goal to stay motivated.</p><button class="btn btn-primary" onclick="financeManager.showGoalModal()">+ Create Goal</button></div>';
            return;
        }

        container.innerHTML = this.goals.map(goal => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const isOverdue = new Date(goal.targetDate) < new Date() && progress < 100;
            
            return `
                <div class="card">
                    <h4 style="color: #667eea; margin-bottom: 10px;">${goal.name}</h4>
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: #666; text-transform: capitalize;">${goal.type} Goal</span>
                            <span style="font-weight: 600;">
                                ${this.formatCurrency(goal.currentAmount)} / ${this.formatCurrency(goal.targetAmount)}
                            </span>
                        </div>
                        <div class="budget-progress">
                            <div class="budget-progress-bar ${isOverdue ? 'danger' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                        <div style="margin-top: 5px; display: flex; justify-content: space-between; font-size: 0.9rem; color: #666;">
                            <span>${progress.toFixed(1)}% complete</span>
                            <span>Due: ${this.formatDate(goal.targetDate)} ${isOverdue ? '(Overdue)' : ''}</span>
                        </div>
                    </div>
                    ${goal.description ? `<p style="color: #666; margin-bottom: 15px;">${goal.description}</p>` : ''}
                    <div class="form-actions">
                        <button class="btn btn-sm" onclick="financeManager.editGoal('${goal.id}')">Edit</button>
                        <button class="btn btn-sm btn-secondary" onclick="financeManager.deleteGoal('${goal.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    editGoal(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;

        this.editingGoal = goal;
        
        document.getElementById('goalName').value = goal.name;
        document.getElementById('goalType').value = goal.type;
        document.getElementById('goalTarget').value = goal.targetAmount;
        document.getElementById('goalCurrent').value = goal.currentAmount;
        document.getElementById('goalDate').value = goal.targetDate;
        document.getElementById('goalDescription').value = goal.description;
        
        document.getElementById('goalModalTitle').textContent = 'Edit Financial Goal';
        document.getElementById('goalModal').classList.add('active');
    }

    deleteGoal(id) {
        if (!confirm('Are you sure you want to delete this goal?')) return;

        this.goals = this.goals.filter(g => g.id !== id);
        this.saveGoals();
        this.updateGoalsList();
        this.showToast('Goal deleted successfully', 'success');
    }

    // Meal Budget Methods
    updateMealBudgetView() {
        this.loadMealSettings();
        this.updateMealKitty();
        this.updateTodayMeals();
        this.updateMealHistory();
    }

    showMealModal() {
        this.resetMealForm();
        document.getElementById('mealModalTitle').textContent = 'Log Meal';
        document.getElementById('mealModal').classList.add('active');
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('mealDate').value = today;
    }

    hideMealModal() {
        document.getElementById('mealModal').classList.remove('active');
    }

    resetMealForm() {
        document.getElementById('mealForm').reset();
        document.getElementById('mealBudgetInfo').innerHTML = '';
        
        // Reset editing state
        this.editingMeal = null;
        
        // Set default date to today
        document.getElementById('mealDate').value = this.getCurrentDateString();
    }

    handleMealSubmit(e) {
        e.preventDefault();

        const mealType = document.getElementById('mealType').value;
        const amount = parseFloat(document.getElementById('mealAmount').value);
        const description = document.getElementById('mealDescription').value || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} meal`;
        const date = document.getElementById('mealDate').value;

        // Calculate savings based on meal type and amount
        let savings;
        let contributesToKitty = true;
        
        if (mealType === 'dinner') {
            // For dinner, only calculate savings (and contribute to kitty) if amount > 0
            if (amount > 0) {
                savings = this.mealBudget[mealType] - amount;
            } else {
                savings = 0;
                contributesToKitty = false;
            }
        } else {
            // For breakfast and lunch, calculate savings normally
            savings = this.mealBudget[mealType] - amount;
        }

        if (this.editingMeal) {
            // Update existing meal
            const mealIndex = this.mealLogs.findIndex(log => log.id === this.editingMeal.id);
            if (mealIndex !== -1) {
                const oldMeal = this.mealLogs[mealIndex];
                
                // Update meal log
                this.mealLogs[mealIndex] = {
                    ...oldMeal,
                    type: mealType,
                    amount: amount,
                    description: description,
                    date: date,
                    budgetAmount: this.mealBudget[mealType],
                    savings: savings,
                    contributesToKitty: contributesToKitty,
                    updatedAt: new Date().toISOString()
                };

                // Update corresponding transaction if it exists
                const transactionIndex = this.transactions.findIndex(t => 
                    t.tags && t.tags.includes('meal') && 
                    t.tags.includes(oldMeal.type) && 
                    t.date === oldMeal.date && 
                    t.amount === oldMeal.amount &&
                    t.description.includes(oldMeal.type)
                );

                if (transactionIndex !== -1) {
                    const transaction = this.transactions[transactionIndex];
                    
                    // Restore old amount to account balance
                    const account = this.accounts.find(a => a.id === transaction.account);
                    if (account) {
                        account.balance += oldMeal.amount; // restore old amount
                        account.balance -= amount; // deduct new amount
                    }
                    
                    // Update transaction
                    if (amount > 0) {
                        this.transactions[transactionIndex] = {
                            ...transaction,
                            amount: amount,
                            description: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${description}`,
                            date: date,
                            tags: ['meal', mealType],
                            updatedAt: new Date().toISOString()
                        };
                    } else {
                        // Remove transaction if amount is 0
                        this.transactions.splice(transactionIndex, 1);
                        account.balance += oldMeal.amount; // fully restore balance
                    }
                    
                    this.saveAccounts();
                    this.saveTransactions();
                } else if (amount > 0) {
                    // Create new transaction if one didn't exist but amount > 0 now
                    const transaction = {
                        id: this.generateId(),
                        type: 'expense',
                        amount: amount,
                        category: 'Food & Dining',
                        account: this.accounts.length > 0 ? this.accounts[0].id : 'default',
                        description: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${description}`,
                        date: date,
                        recurring: false,
                        tags: ['meal', mealType],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    this.transactions.push(transaction);
                    this.saveTransactions();
                    
                    // Update account balance
                    if (this.accounts.length > 0) {
                        const account = this.accounts.find(a => a.id === transaction.account);
                        if (account) {
                            account.balance -= amount;
                            this.saveAccounts();
                        }
                    }
                }
            }
            
            this.editingMeal = null;
            this.showToast('Meal entry updated successfully!', 'success');
        } else {
            // Create new meal
            const mealLog = {
                id: this.generateId(),
                type: mealType,
                amount: amount,
                description: description,
                date: date,
                budgetAmount: this.mealBudget[mealType],
                savings: savings,
                contributesToKitty: contributesToKitty,
                createdAt: new Date().toISOString()
            };

            this.mealLogs.push(mealLog);
            
            // Create a transaction entry for this meal expense (only if amount > 0)
            if (amount > 0) {
                const transaction = {
                    id: this.generateId(),
                    type: 'expense',
                    amount: amount,
                    category: 'Food & Dining',
                    account: this.accounts.length > 0 ? this.accounts[0].id : 'default', // Use first account or default
                    description: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${description}`,
                    date: date,
                    recurring: false,
                    tags: ['meal', mealType],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                this.transactions.push(transaction);
                this.saveTransactions();
                
                // Update account balance
                if (this.accounts.length > 0) {
                    const account = this.accounts.find(a => a.id === transaction.account);
                    if (account) {
                        account.balance -= amount;
                        this.saveAccounts();
                    }
                }
            }
            
            const savingsText = savings >= 0 ? `Saved $${savings.toFixed(2)}!` : `Over budget by $${Math.abs(savings).toFixed(2)}`;
            const transactionText = amount > 0 ? ' Added to expenses.' : '';
            this.showToast(`Meal logged! ${savingsText}${transactionText}`, savings >= 0 ? 'success' : 'warning');
        }

        this.saveMealLogs();
        
        this.hideMealModal();
        this.updateMealBudgetView();
        this.updateDashboard(); // Refresh dashboard to show new transaction
        
        const savingsText = savings >= 0 ? `Saved $${savings.toFixed(2)}!` : `Over budget by $${Math.abs(savings).toFixed(2)}`;
        const transactionText = amount > 0 ? ' Added to expenses.' : '';
        this.showToast(`Meal logged! ${savingsText}${transactionText}`, savings >= 0 ? 'success' : 'warning');
    }

    saveMealSettings() {
        this.mealBudget.breakfast = parseFloat(document.getElementById('breakfastBudget').value) || 0;
        this.mealBudget.lunch = parseFloat(document.getElementById('lunchBudget').value) || 0;
        this.mealBudget.dinner = parseFloat(document.getElementById('dinnerBudget').value) || 0;
        this.mealBudget.savingsGoal = parseFloat(document.getElementById('mealSavingsGoal').value) || 0;

        localStorage.setItem('finance_meal_budget', JSON.stringify(this.mealBudget));
        this.updateMealBudgetView();
        this.showToast('Meal budget settings saved!', 'success');
    }

    loadMealSettings() {
        document.getElementById('breakfastBudget').value = this.mealBudget.breakfast || '';
        document.getElementById('lunchBudget').value = this.mealBudget.lunch || '';
        document.getElementById('dinnerBudget').value = this.mealBudget.dinner || '';
        document.getElementById('mealSavingsGoal').value = this.mealBudget.savingsGoal || '';
    }

    updateMealKitty() {
        const totalSavings = this.calculateTotalMealSavings();
        const goal = this.mealBudget.savingsGoal || 0;
        const progressPercentage = goal > 0 ? Math.min((totalSavings / goal) * 100, 100) : 0;

        document.getElementById('mealKittyAmount').textContent = this.formatCurrency(totalSavings);
        document.getElementById('mealKittyProgress').style.width = `${progressPercentage}%`;
        document.getElementById('mealKittyProgressText').textContent = `${this.formatCurrency(totalSavings)} of ${this.formatCurrency(goal)} goal`;

        // Update kitty card color based on progress
        const kittyCard = document.querySelector('.meal-kitty-card');
        if (progressPercentage >= 100) {
            kittyCard.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        } else if (progressPercentage >= 75) {
            kittyCard.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
        } else {
            kittyCard.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
        }
    }

    calculateTotalMealSavings() {
        return this.mealLogs.reduce((total, log) => {
            // Only count savings that contribute to the kitty (positive savings)
            // For dinner entries, check contributesToKitty flag; for older entries without this flag, use existing logic
            const shouldCount = log.contributesToKitty !== false; // Default to true for backwards compatibility
            return total + (shouldCount ? Math.max(0, log.savings) : 0);
        }, 0);
    }

    updateTodayMeals() {
        const today = this.getCurrentDateString();
        const todayLogs = this.mealLogs.filter(log => log.date === today);
        const container = document.getElementById('todayMealGrid');

        const mealTypes = [
            { type: 'breakfast', icon: '🌅', name: 'Breakfast' },
            { type: 'lunch', icon: '🌞', name: 'Lunch' },
            { type: 'dinner', icon: '🌙', name: 'Dinner' }
        ];

        container.innerHTML = mealTypes.map(meal => {
            const log = todayLogs.find(l => l.type === meal.type);
            const budget = this.mealBudget[meal.type] || 0;

            if (log) {
                const isUnder = log.savings >= 0;
                const statusClass = isUnder ? 'under-budget' : 'over-budget';
                const savingsText = isUnder ? `+${this.formatCurrency(log.savings)}` : `-${this.formatCurrency(Math.abs(log.savings))}`;
                const savingsClass = isUnder ? 'positive' : 'negative';

                return `
                    <div class="meal-slot logged ${statusClass}">
                        <div class="meal-type">${meal.icon}</div>
                        <div class="meal-amount">${this.formatCurrency(log.amount)}</div>
                        <div class="meal-vs-budget">vs ${this.formatCurrency(budget)} budget</div>
                        <div class="meal-savings ${savingsClass}">${savingsText}</div>
                    </div>
                `;
            } else {
                return `
                    <div class="meal-slot">
                        <div class="meal-type">${meal.icon}</div>
                        <div>No ${meal.name} logged</div>
                        <div class="meal-vs-budget">Budget: ${this.formatCurrency(budget)}</div>
                    </div>
                `;
            }
        }).join('');
    }

    updateMealHistory() {
        const filter = document.getElementById('mealHistoryFilter').value;
        const filteredLogs = this.getFilteredMealLogs(filter);
        const container = document.getElementById('mealHistoryList');

        if (filteredLogs.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No meals logged yet.</p></div>';
            return;
        }

        container.innerHTML = filteredLogs.map(log => {
            const isUnder = log.savings >= 0;
            const savingsText = isUnder ? `+${this.formatCurrency(log.savings)}` : `-${this.formatCurrency(Math.abs(log.savings))}`;
            const savingsClass = isUnder ? 'positive' : 'negative';
            const icon = log.type === 'breakfast' ? '🌅' : log.type === 'lunch' ? '🌞' : '🌙';

            return `
                <div class="meal-entry">
                    <div class="meal-entry-icon">${icon}</div>
                    <div class="meal-entry-details">
                        <div class="meal-entry-description">${log.description}</div>
                        <div class="meal-entry-date">${this.formatDateForDisplay(log.date)}</div>
                    </div>
                    <div class="meal-entry-amount">${this.formatCurrency(log.amount)}</div>
                    <div class="meal-entry-savings ${savingsClass}">${savingsText}</div>
                    <div class="meal-entry-actions">
                        <button class="btn btn-sm btn-secondary" onclick="financeManager.editMeal('${log.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="financeManager.deleteMeal('${log.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getFilteredMealLogs(filter) {
        const now = new Date();
        let startDate;

        switch (filter) {
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'all':
            default:
                return this.mealLogs.sort((a, b) => this.parseLocalDate(b.date) - this.parseLocalDate(a.date));
        }

        return this.mealLogs
            .filter(log => this.parseLocalDate(log.date) >= startDate)
            .sort((a, b) => this.parseLocalDate(b.date) - this.parseLocalDate(a.date));
    }

    updateMealBudgetInfo() {
        const mealType = document.getElementById('mealType').value;
        const amount = parseFloat(document.getElementById('mealAmount').value) || 0;
        const budget = this.mealBudget[mealType] || 0;
        const savings = budget - amount;
        const container = document.getElementById('mealBudgetInfo');

        if (amount === 0 || budget === 0) {
            container.innerHTML = '';
            return;
        }

        const isUnder = savings >= 0;
        const impactClass = isUnder ? 'positive' : 'negative';
        const impactText = isUnder ? `You'll save ${this.formatCurrency(savings)}!` : `You'll be over budget by ${this.formatCurrency(Math.abs(savings))}`;

        container.innerHTML = `
            <div class="budget-comparison">
                <span>Budget for ${mealType}: ${this.formatCurrency(budget)}</span>
                <span>Amount: ${this.formatCurrency(amount)}</span>
            </div>
            <div class="savings-impact ${impactClass}">
                ${impactText}
            </div>
        `;
    }

    saveMealLogs() {
        localStorage.setItem('finance_meal_logs', JSON.stringify(this.mealLogs));
    }

    editMeal(mealId) {
        const meal = this.mealLogs.find(log => log.id === mealId);
        if (!meal) {
            this.showToast('Meal entry not found', 'error');
            return;
        }

        // Set up the modal for editing
        this.editingMeal = meal;
        document.getElementById('mealModalTitle').textContent = 'Edit Meal';
        
        // Populate the form with existing data
        document.getElementById('mealType').value = meal.type;
        document.getElementById('mealAmount').value = meal.amount;
        document.getElementById('mealDescription').value = meal.description;
        document.getElementById('mealDate').value = meal.date;
        
        // Update budget info display
        this.updateMealBudgetInfo();
        
        // Show the modal
        document.getElementById('mealModal').classList.add('active');
    }

    deleteMeal(mealId) {
        if (!confirm('Are you sure you want to delete this meal entry?')) {
            return;
        }

        const mealIndex = this.mealLogs.findIndex(log => log.id === mealId);
        if (mealIndex === -1) {
            this.showToast('Meal entry not found', 'error');
            return;
        }

        const meal = this.mealLogs[mealIndex];
        
        // Remove the meal log
        this.mealLogs.splice(mealIndex, 1);
        this.saveMealLogs();

        // Also remove the corresponding transaction if it exists
        const transactionIndex = this.transactions.findIndex(t => 
            t.tags && t.tags.includes('meal') && 
            t.tags.includes(meal.type) && 
            t.date === meal.date && 
            t.amount === meal.amount &&
            t.description.includes(meal.type)
        );

        if (transactionIndex !== -1) {
            const transaction = this.transactions[transactionIndex];
            
            // Restore account balance
            const account = this.accounts.find(a => a.id === transaction.account);
            if (account) {
                account.balance += transaction.amount;
                this.saveAccounts();
            }
            
            // Remove the transaction
            this.transactions.splice(transactionIndex, 1);
            this.saveTransactions();
        }

        // Update displays
        this.updateMealBudgetView();
        this.updateDashboard();
        
        this.showToast('Meal entry deleted successfully', 'success');
    }

    // Reports Methods
    async updateReports() {
        // Show loading states for all charts
        this.showChartLoading('monthlyTrendChart');
        this.showChartLoading('categoryPieChart');
        this.showChartLoading('incomeExpenseChart');
        this.showChartLoading('balanceTrendChart');
        this.showChartLoading('budgetVsActualChart');
        this.showChartLoading('goalProgressChart');
        
        this.destroyExistingCharts();
        
        // Simulate data processing time
        await this.simulateDataLoad(800);
        
        // Update charts and hide loading states
        this.updateMonthlyTrendsChart();
        this.hideChartLoading('monthlyTrendChart');
        
        await this.simulateDataLoad(200);
        this.updateCategoryPieChart();
        this.hideChartLoading('categoryPieChart');
        
        await this.simulateDataLoad(200);
        this.updateIncomeExpenseChart();
        this.hideChartLoading('incomeExpenseChart');
        
        await this.simulateDataLoad(200);
        this.updateBalanceTrendsChart();
        this.hideChartLoading('balanceTrendChart');
        
        await this.simulateDataLoad(200);
        this.updateBudgetVsActualChart();
        this.hideChartLoading('budgetVsActualChart');
        
        await this.simulateDataLoad(200);
        this.updateGoalProgressChart();
        this.hideChartLoading('goalProgressChart');
        
        this.updateSummaryReport();
    }

    destroyExistingCharts() {
        // Destroy existing chart instances to prevent memory leaks
        if (this.monthlyChart) { this.monthlyChart.destroy(); }
        if (this.categoryChart) { this.categoryChart.destroy(); }
        if (this.incomeExpenseChart) { this.incomeExpenseChart.destroy(); }
        if (this.balanceChart) { this.balanceChart.destroy(); }
        if (this.budgetChart) { this.budgetChart.destroy(); }
        if (this.goalChart) { this.goalChart.destroy(); }
    }

    // Projections Methods
    updateProjections() {
        this.displayScenarios();
    }

    getReportDateRange() {
        const timeRange = document.getElementById('reportTimeRange')?.value || '1year';
        const endDate = new Date();
        let startDate = new Date();

        switch (timeRange) {
            case '3months':
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case '6months':
                startDate.setMonth(endDate.getMonth() - 6);
                break;
            case '1year':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            case '2years':
                startDate.setFullYear(endDate.getFullYear() - 2);
                break;
            case 'all':
                startDate = new Date('2020-01-01'); // Reasonable start date
                break;
        }

        return { startDate, endDate };
    }

    updateMonthlyTrendsChart() {
        const canvas = document.getElementById('monthlyTrendChart');
        if (!canvas) return;

        const { startDate, endDate } = this.getReportDateRange();
        const monthlyData = this.getMonthlyTrendData(startDate, endDate);

        if (monthlyData.length === 0) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const ctx = canvas.getContext('2d');
        this.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.map(d => this.formatMonthYear(d.month)),
                datasets: [
                    {
                        label: 'Income',
                        data: monthlyData.map(d => d.income),
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Expenses',
                        data: monthlyData.map(d => d.expense),
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Net',
                        data: monthlyData.map(d => d.net),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    getMonthlyTrendData(startDate, endDate) {
        const monthlyData = {};
        
        this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            })
            .forEach(t => {
                const monthKey = t.date.substring(0, 7); // YYYY-MM
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { income: 0, expense: 0 };
                }
                monthlyData[monthKey][t.type] += t.amount;
            });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                income: data.income,
                expense: data.expense,
                net: data.income - data.expense
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }

    createTrendChart(data, title) {
        const maxValue = Math.max(...data.map(d => Math.max(d.income || 0, d.expense || 0)));
        const chartHeight = 250;
        const chartWidth = 100;
        const padding = 40;

        let html = `
            <div class="trend-chart">
                <h4 style="text-align: center; margin-bottom: 20px;">${title}</h4>
                <svg width="100%" height="${chartHeight + padding * 2}" viewBox="0 0 ${chartWidth + padding * 2} ${chartHeight + padding * 2}">
                    <!-- Grid lines -->
                    ${this.createChartGrid(chartWidth, chartHeight, padding, maxValue)}
                    
                    <!-- Data lines -->
                    ${this.createDataLines(data, chartWidth, chartHeight, padding, maxValue)}
                    
                    <!-- Axes -->
                    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${chartHeight + padding}" class="chart-axis"/>
                    <line x1="${padding}" y1="${chartHeight + padding}" x2="${chartWidth + padding}" y2="${chartHeight + padding}" class="chart-axis"/>
                </svg>
                
                <div class="chart-legend">
                    <div class="legend-item">
                        <div class="legend-color" style="background: #28a745;"></div>
                        <span>Income</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #dc3545;"></div>
                        <span>Expenses</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #667eea;"></div>
                        <span>Net</span>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    createChartGrid(width, height, padding, maxValue) {
        const gridLines = [];
        const steps = 5;
        
        for (let i = 0; i <= steps; i++) {
            const y = padding + (height * i / steps);
            const value = maxValue * (1 - i / steps);
            
            gridLines.push(`
                <line x1="${padding}" y1="${y}" x2="${width + padding}" y2="${y}" class="chart-grid"/>
                <text x="${padding - 5}" y="${y + 5}" class="chart-label" text-anchor="end">${this.formatCurrency(value)}</text>
            `);
        }
        
        return gridLines.join('');
    }

    createDataLines(data, width, height, padding, maxValue) {
        if (data.length === 0) return '';
        
        const stepX = width / (data.length - 1 || 1);
        
        const incomePoints = data.map((d, i) => {
            const x = padding + (i * stepX);
            const y = padding + height - ((d.income / maxValue) * height);
            return `${x},${y}`;
        }).join(' ');
        
        const expensePoints = data.map((d, i) => {
            const x = padding + (i * stepX);
            const y = padding + height - ((d.expense / maxValue) * height);
            return `${x},${y}`;
        }).join(' ');
        
        const netPoints = data.map((d, i) => {
            const x = padding + (i * stepX);
            const y = padding + height - (((d.net + maxValue) / (maxValue * 2)) * height);
            return `${x},${y}`;
        }).join(' ');

        return `
            <polyline points="${incomePoints}" fill="none" stroke="#28a745" stroke-width="3"/>
            <polyline points="${expensePoints}" fill="none" stroke="#dc3545" stroke-width="3"/>
            <polyline points="${netPoints}" fill="none" stroke="#667eea" stroke-width="3"/>
        `;
    }

    updateCategoryPieChart() {
        const canvas = document.getElementById('categoryPieChart');
        if (!canvas) return;

        const { startDate, endDate } = this.getReportDateRange();
        const categoryData = this.getCategoryTrendData(startDate, endDate);

        if (categoryData.length === 0) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const ctx = canvas.getContext('2d');
        this.categoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categoryData.map(d => d.category),
                datasets: [{
                    data: categoryData.map(d => d.amount),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return context.label + ': $' + value.toLocaleString() + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    getCategoryTrendData(startDate, endDate) {
        const categoryTotals = {};
        
        this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= startDate && transactionDate <= endDate && t.type === 'expense';
            })
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

        return Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8); // Top 8 categories
    }

    createCategoryChart(data) {
        if (data.length === 0) {
            return '<div class="chart-placeholder">No expense data available</div>';
        }

        const total = data.reduce((sum, d) => sum + d.amount, 0);
        
        return `
            <div class="category-breakdown">
                ${data.map(d => {
                    const percentage = (d.amount / total) * 100;
                    const color = this.settings.categoryColors?.[d.category] || '#667eea';
                    
                    return `
                        <div class="category-item" style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="category-icon" style="background: ${color}"></div>
                                    <span>${d.category}</span>
                                </div>
                                <span style="font-weight: 600;">${this.formatCurrency(d.amount)} (${percentage.toFixed(1)}%)</span>
                            </div>
                            <div class="budget-progress">
                                <div class="budget-progress-bar" style="width: ${percentage}%; background: ${color};"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    updateIncomeExpenseChart() {
        const canvas = document.getElementById('incomeExpenseChart');
        if (!canvas) return;

        const { startDate, endDate } = this.getReportDateRange();
        const trendData = this.getIncomeExpenseTrendData(startDate, endDate);

        if (trendData.length === 0) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const ctx = canvas.getContext('2d');
        this.incomeExpenseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: trendData.map(d => this.formatMonthYear(d.month)),
                datasets: [
                    {
                        label: 'Income',
                        data: trendData.map(d => d.income),
                        backgroundColor: 'rgba(40, 167, 69, 0.8)',
                        borderColor: '#28a745',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: trendData.map(d => d.expense),
                        backgroundColor: 'rgba(220, 53, 69, 0.8)',
                        borderColor: '#dc3545',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    getIncomeExpenseTrendData(startDate, endDate) {
        const monthlyData = this.getMonthlyTrendData(startDate, endDate);
        return monthlyData;
    }

    createIncomeExpenseChart(data) {
        if (data.length === 0) {
            return '<div class="chart-placeholder">No data available</div>';
        }

        const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
        const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);
        const averageNet = data.reduce((sum, d) => sum + d.net, 0) / data.length;

        return `
            <div class="income-expense-analysis">
                <div class="summary-stats" style="margin-bottom: 20px;">
                    <div class="summary-stat">
                        <span class="stat-value" style="color: #28a745;">${this.formatCurrency(totalIncome)}</span>
                        <span class="stat-label">Total Income</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value" style="color: #dc3545;">${this.formatCurrency(totalExpense)}</span>
                        <span class="stat-label">Total Expenses</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value" style="color: ${averageNet >= 0 ? '#28a745' : '#dc3545'};">${this.formatCurrency(averageNet)}</span>
                        <span class="stat-label">Avg Monthly Net</span>
                    </div>
                </div>
                
                <div class="monthly-breakdown">
                    <h5 style="margin-bottom: 15px;">Monthly Breakdown</h5>
                    ${data.map(d => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                            <span>${this.formatMonthYear(d.month)}</span>
                            <div style="display: flex; gap: 15px;">
                                <span style="color: #28a745;">+${this.formatCurrency(d.income)}</span>
                                <span style="color: #dc3545;">-${this.formatCurrency(d.expense)}</span>
                                <span style="color: ${d.net >= 0 ? '#28a745' : '#dc3545'}; font-weight: 600;">${this.formatCurrency(d.net)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    formatMonthYear(monthString) {
        const [year, month] = monthString.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }

    updateBalanceTrendsChart() {
        const canvas = document.getElementById('balanceTrendChart');
        if (!canvas) return;

        const balanceHistory = this.getAccountBalanceHistory();
        const accountsWithData = Object.values(balanceHistory).filter(acc => acc.balances.length > 1);
        
        if (accountsWithData.length === 0) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const ctx = canvas.getContext('2d');
        const datasets = accountsWithData.map((account, index) => ({
            label: account.name,
            data: account.balances.map(b => b.balance),
            borderColor: account.color || `hsl(${index * 60}, 70%, 50%)`,
            backgroundColor: account.color + '20' || `hsla(${index * 60}, 70%, 50%, 0.1)`,
            fill: false,
            tension: 0.4
        }));

        // Get all unique dates
        const allDates = [...new Set(accountsWithData.flatMap(acc => 
            acc.balances.map(b => b.date)
        ))].sort();

        this.balanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allDates.map(date => this.formatDate(date)),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    updateBudgetVsActualChart() {
        const canvas = document.getElementById('budgetVsActualChart');
        if (!canvas) return;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const currentBudgets = this.budgets.filter(b => 
            b.year === currentYear && b.month === currentMonth
        );

        if (currentBudgets.length === 0) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const budgetData = currentBudgets.map(budget => ({
            category: budget.category,
            budgeted: budget.monthlyLimit,
            actual: this.getBudgetSpent(budget)
        }));

        const ctx = canvas.getContext('2d');
        this.budgetChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: budgetData.map(d => d.category),
                datasets: [
                    {
                        label: 'Budgeted',
                        data: budgetData.map(d => d.budgeted),
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: '#667eea',
                        borderWidth: 1
                    },
                    {
                        label: 'Actual',
                        data: budgetData.map(d => d.actual),
                        backgroundColor: 'rgba(220, 53, 69, 0.8)',
                        borderColor: '#dc3545',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    updateGoalProgressChart() {
        const canvas = document.getElementById('goalProgressChart');
        if (!canvas) return;

        if (this.goals.length === 0) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const goalData = this.goals.map(goal => ({
            name: goal.name,
            progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
            current: goal.currentAmount,
            target: goal.targetAmount
        }));

        const ctx = canvas.getContext('2d');
        this.goalChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: goalData.map(d => d.name),
                datasets: [{
                    label: 'Progress %',
                    data: goalData.map(d => d.progress),
                    backgroundColor: goalData.map(d => d.progress >= 100 ? '#28a745' : d.progress >= 50 ? '#ffc107' : '#dc3545'),
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const goalIndex = context.dataIndex;
                                const goal = goalData[goalIndex];
                                return `Progress: ${context.parsed.x.toFixed(1)}% (${financeManager.formatCurrency(goal.current)} / ${financeManager.formatCurrency(goal.target)})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    getAccountBalanceHistory() {
        // Simulate balance history based on transactions
        const history = {};
        this.accounts.forEach(account => {
            history[account.id] = {
                name: account.name,
                color: account.color,
                balances: []
            };
        });

        // Calculate running balances
        const sortedTransactions = [...this.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        const runningBalances = {};
        
        this.accounts.forEach(account => {
            runningBalances[account.id] = account.balance;
        });

        // Work backwards from current balances
        for (let i = sortedTransactions.length - 1; i >= 0; i--) {
            const t = sortedTransactions[i];
            if (t.type === 'income') {
                runningBalances[t.account] -= t.amount;
            } else {
                runningBalances[t.account] += t.amount;
            }
        }

        // Now work forward to build history
        this.accounts.forEach(account => {
            history[account.id].balances.push({
                date: sortedTransactions[0]?.date || new Date().toISOString().split('T')[0],
                balance: runningBalances[account.id]
            });
        });

        sortedTransactions.forEach(t => {
            if (t.type === 'income') {
                runningBalances[t.account] += t.amount;
            } else {
                runningBalances[t.account] -= t.amount;
            }
            
            history[t.account].balances.push({
                date: t.date,
                balance: runningBalances[t.account]
            });
        });

        return history;
    }

    createBalanceHistoryChart(history) {
        const accountsWithData = Object.values(history).filter(acc => acc.balances.length > 1);
        
        if (accountsWithData.length === 0) {
            return '<div class="chart-placeholder">No balance history available</div>';
        }

        return `
            <div class="balance-history">
                ${accountsWithData.map(account => `
                    <div style="margin-bottom: 20px;">
                        <h5 style="color: ${account.color}; margin-bottom: 10px;">${account.name}</h5>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>Starting Balance:</span>
                                <span style="font-weight: 600;">${this.formatCurrency(account.balances[0].balance)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Current Balance:</span>
                                <span style="font-weight: 600;">${this.formatCurrency(account.balances[account.balances.length - 1].balance)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateSummaryReport() {
        const container = document.getElementById('summaryReport');
        if (!container) return;

        const { startDate, endDate } = this.getReportDateRange();
        const summary = this.generateFinancialSummary(startDate, endDate);

        container.innerHTML = summary;
    }

    generateFinancialSummary(startDate, endDate) {
        const filteredTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        const totalIncome = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const netWorth = totalIncome - totalExpenses;
        const transactionCount = filteredTransactions.length;
        const avgTransactionAmount = transactionCount > 0 ? (totalIncome + totalExpenses) / transactionCount : 0;

        // Top categories
        const categoryTotals = {};
        filteredTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

        const topCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        return `
            <div class="summary-section">
                <h4>Financial Overview</h4>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <span class="stat-value">${this.formatCurrency(totalIncome)}</span>
                        <span class="stat-label">Total Income</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${this.formatCurrency(totalExpenses)}</span>
                        <span class="stat-label">Total Expenses</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value" style="color: ${netWorth >= 0 ? '#28a745' : '#dc3545'};">${this.formatCurrency(netWorth)}</span>
                        <span class="stat-label">Net Amount</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${transactionCount}</span>
                        <span class="stat-label">Total Transactions</span>
                    </div>
                </div>
            </div>

            <div class="summary-section">
                <h4>Top Expense Categories</h4>
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>% of Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topCategories.map(([category, amount]) => `
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="category-icon" style="background: ${this.settings.categoryColors?.[category] || '#dc3545'}"></div>
                                        ${category}
                                    </div>
                                </td>
                                <td class="amount expense">${this.formatCurrency(amount)}</td>
                                <td>${((amount / totalExpenses) * 100).toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="summary-section">
                <h4>Budget Performance</h4>
                <div class="budget-performance">
                    ${this.budgets.length > 0 ? this.generateBudgetPerformance() : '<p>No budgets configured for analysis.</p>'}
                </div>
            </div>
        `;
    }

    generateBudgetPerformance() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const currentBudgets = this.budgets.filter(b => 
            b.year === currentYear && b.month === currentMonth
        );

        if (currentBudgets.length === 0) {
            return '<p>No budgets set for current month.</p>';
        }

        return currentBudgets.map(budget => {
            const spent = this.getBudgetSpent(budget);
            const percentage = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
            const remaining = budget.monthlyLimit - spent;
            const status = percentage >= 100 ? 'Over Budget' : percentage >= budget.alertThreshold ? 'Near Limit' : 'On Track';
            
            return `
                <div style="margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <strong>${budget.category}</strong>
                        <span class="trend-indicator ${percentage >= budget.alertThreshold ? 'down' : 'up'}">
                            ${status}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Spent: ${this.formatCurrency(spent)}</span>
                        <span>Budget: ${this.formatCurrency(budget.monthlyLimit)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Remaining: ${this.formatCurrency(remaining)}</span>
                        <span>${percentage.toFixed(1)}% used</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Export reports functionality
    exportReports() {
        const { startDate, endDate } = this.getReportDateRange();
        const reportData = this.generateReportData(startDate, endDate);
        
        // Create CSV content
        const csvContent = this.generateCSVReport(reportData);
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Financial report exported successfully', 'success');
    }

    generateReportData(startDate, endDate) {
        const filteredTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        const summary = {
            totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            totalExpenses: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            transactionCount: filteredTransactions.length,
            dateRange: { startDate, endDate }
        };

        const categoryBreakdown = {};
        filteredTransactions.forEach(t => {
            const key = `${t.type}_${t.category}`;
            categoryBreakdown[key] = (categoryBreakdown[key] || 0) + t.amount;
        });

        const monthlyData = this.getMonthlyTrendData(startDate, endDate);

        return {
            summary,
            transactions: filteredTransactions,
            categoryBreakdown,
            monthlyData
        };
    }

    generateCSVReport(data) {
        let csv = 'Financial Report\n\n';
        
        // Summary section
        csv += 'SUMMARY\n';
        csv += `Report Period,${data.summary.dateRange.startDate.toISOString().split('T')[0]} to ${data.summary.dateRange.endDate.toISOString().split('T')[0]}\n`;
        csv += `Total Income,${data.summary.totalIncome}\n`;
        csv += `Total Expenses,${data.summary.totalExpenses}\n`;
        csv += `Net Amount,${data.summary.totalIncome - data.summary.totalExpenses}\n`;
        csv += `Transaction Count,${data.summary.transactionCount}\n\n`;
        
        // Category breakdown
        csv += 'CATEGORY BREAKDOWN\n';
        csv += 'Category,Type,Amount\n';
        Object.entries(data.categoryBreakdown).forEach(([key, amount]) => {
            const [type, category] = key.split('_');
            csv += `"${category}",${type},${amount}\n`;
        });
        csv += '\n';
        
        // Monthly data
        csv += 'MONTHLY TRENDS\n';
        csv += 'Month,Income,Expenses,Net\n';
        data.monthlyData.forEach(d => {
            csv += `${d.month},${d.income},${d.expense},${d.net}\n`;
        });
        csv += '\n';
        
        // Transaction details
        csv += 'TRANSACTION DETAILS\n';
        csv += 'Date,Type,Amount,Category,Account,Description\n';
        data.transactions.forEach(t => {
            const account = this.accounts.find(a => a.id === t.account);
            csv += `${t.date},${t.type},${t.amount},"${t.category}","${account?.name || 'Unknown'}","${t.description}"\n`;
        });
        
        return csv;
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Helper function to get current date in YYYY-MM-DD format without timezone issues
    getCurrentDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Helper function to safely parse date strings and format them for display
    formatDateForDisplay(dateString) {
        // Parse the date string as local date (not UTC)
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString();
    }

    // Helper function to safely parse date strings for comparison
    parseLocalDate(dateString) {
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day); // month is 0-indexed
    }

    formatDate(dateString) {
        // Use timezone-safe date parsing
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        toast.addEventListener('click', () => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        });
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.editingTransaction = null;
        this.editingAccount = null;
        this.editingBudget = null;
        this.editingGoal = null;
    }

    // Data persistence
    saveTransactions() {
        localStorage.setItem('finance_transactions', JSON.stringify(this.transactions));
    }

    // Migration function to convert existing meal logs to transactions
    migrateMealLogsToTransactions() {
        // Check if migration has already been done
        const migrationDone = localStorage.getItem('finance_meal_migration_done');
        if (migrationDone === 'true') {
            return; // Migration already completed
        }

        let migratedCount = 0;
        
        // Convert existing meal logs to transactions (only if they have amount > 0)
        this.mealLogs.forEach(mealLog => {
            if (mealLog.amount > 0) {
                // Check if a transaction already exists for this meal log
                const existingTransaction = this.transactions.find(t => 
                    t.tags && t.tags.includes('meal') && 
                    t.tags.includes(mealLog.type) && 
                    t.date === mealLog.date && 
                    t.amount === mealLog.amount &&
                    t.description.includes(mealLog.type)
                );

                if (!existingTransaction) {
                    // Ensure date is in correct YYYY-MM-DD format without timezone issues
                    let transactionDate = mealLog.date;
                    
                    // If the date looks like it might be causing timezone issues, normalize it
                    if (typeof transactionDate === 'string' && transactionDate.includes('-')) {
                        // Split and reconstruct to ensure proper local date formatting
                        const dateParts = transactionDate.split('-');
                        if (dateParts.length === 3) {
                            const year = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]);
                            const day = parseInt(dateParts[2]);
                            
                            // Reconstruct date ensuring proper padding
                            transactionDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            
                            // Debug logging
                            console.log(`Migrating meal: ${mealLog.type} - Original date: ${mealLog.date} - Processed date: ${transactionDate}`);
                        }
                    }
                    
                    const transaction = {
                        id: this.generateId(),
                        type: 'expense',
                        amount: mealLog.amount,
                        category: 'Food & Dining',
                        account: this.accounts.length > 0 ? this.accounts[0].id : 'default',
                        description: `${mealLog.type.charAt(0).toUpperCase() + mealLog.type.slice(1)}: ${mealLog.description}`,
                        date: transactionDate,
                        recurring: false,
                        tags: ['meal', mealLog.type],
                        createdAt: mealLog.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    this.transactions.push(transaction);
                    migratedCount++;
                }
            }
        });

        if (migratedCount > 0) {
            this.saveTransactions();
            console.log(`Migrated ${migratedCount} meal logs to transactions`);
        }

        // Mark migration as completed
        localStorage.setItem('finance_meal_migration_done', 'true');
    }

    // Manual migration trigger for settings page
    migrateMealData() {
        // Reset migration flag to allow re-migration
        localStorage.removeItem('finance_meal_migration_done');
        
        // Remove any existing meal-tagged transactions to avoid duplicates
        this.transactions = this.transactions.filter(t => 
            !(t.tags && t.tags.includes('meal'))
        );
        
        // Run migration
        this.migrateMealLogsToTransactions();
        
        // Update the dashboard to show new transactions
        this.updateDashboard();
        this.updateTransactionsList();
        
        this.showToast('Meal data migration completed! Your existing meal logs have been converted to transactions.', 'success');
    }

    saveAccounts() {
        localStorage.setItem('finance_accounts', JSON.stringify(this.accounts));
    }

    saveBudgets() {
        localStorage.setItem('finance_budgets', JSON.stringify(this.budgets));
    }

    saveGoals() {
        localStorage.setItem('finance_goals', JSON.stringify(this.goals));
    }

    // Bulk Operations
    toggleTransactionSelection(id) {
        if (this.selectedTransactions.has(id)) {
            this.selectedTransactions.delete(id);
        } else {
            this.selectedTransactions.add(id);
        }
        this.updateBulkActionButtons();
        this.updateTransactionSelection();
    }

    selectAllTransactions() {
        const filteredTransactions = this.getFilteredTransactions();
        filteredTransactions.forEach(t => this.selectedTransactions.add(t.id));
        this.updateBulkActionButtons();
        this.updateTransactionsList();
    }

    deselectAllTransactions() {
        this.selectedTransactions.clear();
        this.updateBulkActionButtons();
        this.updateTransactionsList();
    }

    updateBulkActionButtons() {
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        const exportSelectedBtn = document.getElementById('exportSelectedBtn');
        const hasSelection = this.selectedTransactions.size > 0;
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = !hasSelection;
            bulkDeleteBtn.textContent = `Delete Selected (${this.selectedTransactions.size})`;
        }
        
        if (exportSelectedBtn) {
            exportSelectedBtn.disabled = !hasSelection;
            exportSelectedBtn.textContent = `Export Selected (${this.selectedTransactions.size})`;
        }
    }

    updateTransactionSelection() {
        document.querySelectorAll('.transaction-item').forEach(item => {
            const id = item.dataset.transactionId;
            const checkbox = item.querySelector('.transaction-checkbox');
            const isSelected = this.selectedTransactions.has(id);
            
            checkbox.checked = isSelected;
            item.classList.toggle('selected', isSelected);
        });
    }

    bulkDeleteTransactions() {
        if (this.selectedTransactions.size === 0) return;
        
        if (!confirm(`Are you sure you want to delete ${this.selectedTransactions.size} selected transactions?`)) return;

        // Reverse account balances for deleted transactions
        this.selectedTransactions.forEach(id => {
            const transaction = this.transactions.find(t => t.id === id);
            if (transaction) {
                const account = this.accounts.find(a => a.id === transaction.account);
                if (account) {
                    if (transaction.type === 'income') {
                        account.balance -= transaction.amount;
                    } else {
                        account.balance += transaction.amount;
                    }
                }
            }
        });

        this.transactions = this.transactions.filter(t => !this.selectedTransactions.has(t.id));
        this.selectedTransactions.clear();
        
        this.saveTransactions();
        this.saveAccounts();
        this.updateDashboard();
        this.updateTransactionsList();
        this.updateBulkActionButtons();
        this.showToast('Selected transactions deleted successfully', 'success');
    }

    exportSelectedTransactions() {
        if (this.selectedTransactions.size === 0) return;

        const selectedTransactions = this.transactions.filter(t => this.selectedTransactions.has(t.id));
        const data = {
            transactions: selectedTransactions,
            exportDate: new Date().toISOString(),
            exportType: 'selected_transactions'
        };

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected-transactions-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast(`${this.selectedTransactions.size} transactions exported successfully`, 'success');
    }

    // CSV Import
    importCsv(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const rows = this.parseCSV(csv);
                
                if (rows.length < 2) {
                    this.showToast('CSV file must contain at least a header row and one data row', 'error');
                    return;
                }

                this.showCsvImportModal(rows);
            } catch (error) {
                this.showToast('Error reading CSV file', 'error');
                console.error('CSV import error:', error);
            }
        };
        reader.readAsText(file);
    }

    parseCSV(csv) {
        const lines = csv.split('\n').filter(line => line.trim());
        return lines.map(line => {
            const row = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    row.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            row.push(current.trim());
            return row;
        });
    }

    showCsvImportModal(rows) {
        const headers = rows[0];
        const data = rows.slice(1);

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>Import CSV</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <p>Map your CSV columns to transaction fields:</p>
                    
                    <div class="csv-mapping">
                        <div class="form-group">
                            <label>Date Column:</label>
                            <select id="dateColumn">
                                <option value="">Select column...</option>
                                ${headers.map((h, i) => `<option value="${i}">${h}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Amount Column:</label>
                            <select id="amountColumn">
                                <option value="">Select column...</option>
                                ${headers.map((h, i) => `<option value="${i}">${h}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Description Column:</label>
                            <select id="descriptionColumn">
                                <option value="">Select column...</option>
                                ${headers.map((h, i) => `<option value="${i}">${h}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Category Column (optional):</label>
                            <select id="categoryColumn">
                                <option value="">Select column...</option>
                                ${headers.map((h, i) => `<option value="${i}">${h}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Default Account:</label>
                            <select id="defaultAccount">
                                ${this.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Default Transaction Type:</label>
                            <select id="defaultType">
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                    </div>

                    <div class="csv-preview">
                        <h4>Preview (first 5 rows):</h4>
                        <table>
                            <thead>
                                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                            </thead>
                            <tbody>
                                ${data.slice(0, 5).map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button class="btn btn-primary" onclick="financeManager.processCsvImport([${JSON.stringify(headers)}, ...${JSON.stringify(data)}]); this.closest('.modal').remove()">Import Transactions</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    processCsvImport(rows) {
        const dateCol = parseInt(document.getElementById('dateColumn').value);
        const amountCol = parseInt(document.getElementById('amountColumn').value);
        const descCol = parseInt(document.getElementById('descriptionColumn').value);
        const catCol = document.getElementById('categoryColumn').value ? parseInt(document.getElementById('categoryColumn').value) : null;
        const defaultAccount = document.getElementById('defaultAccount').value;
        const defaultType = document.getElementById('defaultType').value;

        if (isNaN(dateCol) || isNaN(amountCol) || isNaN(descCol)) {
            this.showToast('Please map required columns: Date, Amount, and Description', 'error');
            return;
        }

        const data = rows.slice(1); // Skip header
        let imported = 0;
        let duplicates = 0;

        data.forEach(row => {
            try {
                const dateStr = row[dateCol];
                const amount = parseFloat(row[amountCol]);
                const description = row[descCol];
                const category = catCol !== null ? row[catCol] : 'Other';

                // Basic validation
                if (!dateStr || isNaN(amount) || !description) return;

                // Convert date to YYYY-MM-DD format
                const date = this.parseDate(dateStr);
                if (!date) return;

                // Check for duplicates
                const isDuplicate = this.transactions.some(t => 
                    t.date === date && 
                    Math.abs(t.amount - Math.abs(amount)) < 0.01 && 
                    t.description.toLowerCase() === description.toLowerCase()
                );

                if (isDuplicate) {
                    duplicates++;
                    return;
                }

                const transaction = {
                    id: this.generateId(),
                    type: amount < 0 ? 'expense' : defaultType,
                    amount: Math.abs(amount),
                    category: this.categories[defaultType].includes(category) ? category : 'Other',
                    account: defaultAccount,
                    description: description,
                    date: date,
                    recurring: false,
                    tags: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                this.transactions.push(transaction);
                imported++;
            } catch (error) {
                console.error('Error importing row:', row, error);
            }
        });

        this.saveTransactions();
        this.updateDashboard();
        this.updateTransactionsList();
        
        let message = `${imported} transactions imported successfully`;
        if (duplicates > 0) {
            message += `, ${duplicates} duplicates skipped`;
        }
        this.showToast(message, 'success');
    }

    parseDate(dateStr) {
        // Try different date formats
        const formats = [
            /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
            /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
            /^(\d{2})\/(\d{2})\/(\d{2})$/, // MM/DD/YY
            /^(\d{2})-(\d{2})-(\d{4})$/, // MM-DD-YYYY
        ];

        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                let year, month, day;
                if (format === formats[0]) { // YYYY-MM-DD
                    [, year, month, day] = match;
                } else { // MM/DD/YYYY or MM-DD-YYYY
                    [, month, day, year] = match;
                    if (year.length === 2) {
                        year = '20' + year; // Assume 20xx for 2-digit years
                    }
                }
                
                const date = new Date(year, month - 1, day);
                if (date.getFullYear() == year && date.getMonth() == month - 1 && date.getDate() == day) {
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
            }
        }
        return null;
    }

    // Export/Import functionality
    exportData() {
        const data = {
            transactions: this.transactions,
            accounts: this.accounts,
            budgets: this.budgets,
            goals: this.goals,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('This will replace all existing data. Are you sure?')) {
                    this.transactions = data.transactions || [];
                    this.accounts = data.accounts || [];
                    this.budgets = data.budgets || [];
                    this.goals = data.goals || [];
                    this.settings = data.settings || {};
                    
                    this.saveTransactions();
                    this.saveAccounts();
                    this.saveBudgets();
                    this.saveGoals();
                    this.saveSettings();
                    
                    this.updateDashboard();
                    this.showToast('Data imported successfully', 'success');
                }
            } catch (error) {
                this.showToast('Error importing data. Please check file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Settings Methods
    updateSettings() {
        this.updateCategorySettings();
        this.loadPreferences();
    }

    updateCategorySettings() {
        const expenseContainer = document.getElementById('expenseCategories');
        const incomeContainer = document.getElementById('incomeCategories');

        if (expenseContainer) {
            expenseContainer.innerHTML = this.categories.expense.map((cat, index) => {
                const isCustom = !this.getDefaultCategories().expense.includes(cat);
                const color = this.settings.categoryColors?.[cat] || '#dc3545';
                return `
                    <div class="category-tag ${isCustom ? 'custom' : ''}">
                        <div class="category-icon" style="background: ${color}"></div>
                        ${cat}
                        ${isCustom ? `<button class="category-remove" onclick="financeManager.removeCustomCategory('expense', ${index})">&times;</button>` : ''}
                    </div>
                `;
            }).join('');
        }

        if (incomeContainer) {
            incomeContainer.innerHTML = this.categories.income.map((cat, index) => {
                const isCustom = !this.getDefaultCategories().income.includes(cat);
                const color = this.settings.categoryColors?.[cat] || '#28a745';
                return `
                    <div class="category-tag ${isCustom ? 'custom' : ''}">
                        <div class="category-icon" style="background: ${color}"></div>
                        ${cat}
                        ${isCustom ? `<button class="category-remove" onclick="financeManager.removeCustomCategory('income', ${index})">&times;</button>` : ''}
                    </div>
                `;
            }).join('');
        }
    }

    getDefaultCategories() {
        return {
            expense: [
                'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
                'Bills & Utilities', 'Health & Fitness', 'Travel', 'Education',
                'Personal Care', 'Gifts & Donations', 'Business', 'Other'
            ],
            income: [
                'Salary', 'Freelance', 'Investment', 'Business', 'Gift',
                'Refund', 'Bonus', 'Other'
            ]
        };
    }

    addCustomCategory(type) {
        const inputId = type === 'expense' ? 'newExpenseCategory' : 'newIncomeCategory';
        const colorId = type === 'expense' ? 'newExpenseCategoryColor' : 'newIncomeCategoryColor';
        const input = document.getElementById(inputId);
        const colorInput = document.getElementById(colorId);
        const newCategory = input.value.trim();
        const color = colorInput?.value || (type === 'expense' ? '#dc3545' : '#28a745');

        if (!newCategory) {
            this.showToast('Please enter a category name', 'error');
            return;
        }

        if (this.categories[type].includes(newCategory)) {
            this.showToast('Category already exists', 'error');
            return;
        }

        this.categories[type].push(newCategory);
        
        // Store category colors
        if (!this.settings.categoryColors) {
            this.settings.categoryColors = {};
        }
        this.settings.categoryColors[newCategory] = color;
        
        this.saveSettings();
        this.updateCategorySettings();
        this.updateTransactionFilters();
        input.value = '';
        this.showToast(`${newCategory} category added successfully`, 'success');
    }

    removeCustomCategory(type, index) {
        const category = this.categories[type][index];
        const defaultCategories = this.getDefaultCategories();
        
        if (defaultCategories[type].includes(category)) {
            this.showToast('Cannot remove default categories', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to remove the "${category}" category?`)) return;

        // Check if category is being used
        const inUse = this.transactions.some(t => t.category === category);
        if (inUse && !confirm(`This category is being used by existing transactions. Remove anyway?`)) {
            return;
        }

        this.categories[type].splice(index, 1);
        this.saveSettings();
        this.updateCategorySettings();
        this.updateTransactionFilters();
        this.showToast(`${category} category removed successfully`, 'success');
    }

    loadPreferences() {
        document.getElementById('defaultCurrency').value = this.settings.currency || 'USD';
        document.getElementById('dateFormat').value = this.settings.dateFormat || 'MM/dd/yyyy';
        document.getElementById('enableNotifications').checked = this.settings.enableNotifications !== false;
        document.getElementById('enableAutoSave').checked = this.settings.enableAutoSave !== false;
    }

    saveSettings() {
        this.settings = {
            ...this.settings,
            categories: this.categories,
            currency: document.getElementById('defaultCurrency')?.value || 'USD',
            dateFormat: document.getElementById('dateFormat')?.value || 'MM/dd/yyyy',
            enableNotifications: document.getElementById('enableNotifications')?.checked !== false,
            enableAutoSave: document.getElementById('enableAutoSave')?.checked !== false
        };

        localStorage.setItem('finance_settings', JSON.stringify(this.settings));
        this.showToast('Settings saved successfully', 'success');
    }

    clearAllData() {
        if (!confirm('This will permanently delete all your financial data. This action cannot be undone. Are you sure?')) {
            return;
        }

        if (!prompt('Type "DELETE" to confirm this action') === 'DELETE') {
            return;
        }

        localStorage.removeItem('finance_transactions');
        localStorage.removeItem('finance_accounts');
        localStorage.removeItem('finance_budgets');
        localStorage.removeItem('finance_goals');
        localStorage.removeItem('finance_settings');

        this.transactions = [];
        this.accounts = [];
        this.budgets = [];
        this.goals = [];
        this.settings = {};
        this.selectedTransactions.clear();

        this.createDefaultAccounts();
        this.updateDashboard();
        this.showToast('All data cleared successfully', 'success');
    }

    // Load custom categories on initialization
    loadSettings() {
        if (this.settings.categories) {
            this.categories = this.settings.categories;
        }
    }

    // Transfer functionality
    showTransferModal() {
        this.updateTransferAccountOptions();
        document.getElementById('transferDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('transferModal').classList.add('active');
    }

    hideTransferModal() {
        document.getElementById('transferModal').classList.remove('active');
        document.getElementById('transferForm').reset();
    }

    updateTransferAccountOptions() {
        const fromSelect = document.getElementById('transferFrom');
        const toSelect = document.getElementById('transferTo');
        
        const options = this.accounts.map(account => 
            `<option value="${account.id}">${account.name} (${this.formatCurrency(account.balance)})</option>`
        ).join('');
        
        fromSelect.innerHTML = options;
        toSelect.innerHTML = options;
    }

    handleTransferSubmit(e) {
        e.preventDefault();
        
        const fromAccountId = document.getElementById('transferFrom').value;
        const toAccountId = document.getElementById('transferTo').value;
        const amount = parseFloat(document.getElementById('transferAmount').value);
        const description = document.getElementById('transferDescription').value || 'Account Transfer';
        const date = document.getElementById('transferDate').value;

        if (fromAccountId === toAccountId) {
            this.showToast('Cannot transfer to the same account', 'error');
            return;
        }

        const fromAccount = this.accounts.find(a => a.id === fromAccountId);
        const toAccount = this.accounts.find(a => a.id === toAccountId);

        if (!fromAccount || !toAccount) {
            this.showToast('Invalid account selection', 'error');
            return;
        }

        if (fromAccount.balance < amount) {
            this.showToast('Insufficient funds in source account', 'error');
            return;
        }

        // Create transfer transactions
        const transferOut = {
            id: this.generateId(),
            type: 'expense',
            amount: amount,
            category: 'Transfer',
            account: fromAccountId,
            description: `Transfer to ${toAccount.name}: ${description}`,
            date: date,
            recurring: false,
            tags: ['transfer'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const transferIn = {
            id: this.generateId(),
            type: 'income',
            amount: amount,
            category: 'Transfer',
            account: toAccountId,
            description: `Transfer from ${fromAccount.name}: ${description}`,
            date: date,
            recurring: false,
            tags: ['transfer'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Update account balances
        fromAccount.balance -= amount;
        toAccount.balance += amount;

        // Add transactions
        this.transactions.push(transferOut, transferIn);

        // Save data
        this.saveTransactions();
        this.saveAccounts();

        this.hideTransferModal();
        this.updateDashboard();
        this.updateAccountsList();
        this.showToast(`Transferred ${this.formatCurrency(amount)} from ${fromAccount.name} to ${toAccount.name}`, 'success');
    }

    // Goal achievements
    checkGoalAchievements() {
        this.goals.forEach(goal => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            
            if (progress >= 100 && !goal.achieved) {
                goal.achieved = true;
                goal.achievedDate = new Date().toISOString();
                this.showAchievementModal(goal);
            }
        });
        
        this.saveGoals();
    }

    showAchievementModal(goal) {
        const modal = document.getElementById('achievementModal');
        document.getElementById('achievementTitle').textContent = `"${goal.name}" Completed!`;
        document.getElementById('achievementDescription').textContent = 
            goal.type === 'savings' ? 
            `Congratulations! You've successfully saved ${this.formatCurrency(goal.targetAmount)}!` :
            `Amazing! You've paid off your ${goal.name} debt of ${this.formatCurrency(goal.targetAmount)}!`;
        
        const timeTaken = new Date(goal.achievedDate) - new Date(goal.createdAt || Date.now());
        const daysTaken = Math.floor(timeTaken / (1000 * 60 * 60 * 24));
        const targetDate = new Date(goal.targetDate);
        const achievedDate = new Date(goal.achievedDate);
        const daysEarly = Math.floor((targetDate - achievedDate) / (1000 * 60 * 60 * 24));
        
        document.getElementById('achievementStats').innerHTML = `
            <div><strong>Achievement Date:</strong> ${this.formatDate(goal.achievedDate)}</div>
            <div><strong>Time Taken:</strong> ${daysTaken} days</div>
            ${daysEarly > 0 ? `<div><strong>Completed:</strong> ${daysEarly} days early!</div>` : ''}
        `;
        
        modal.classList.add('active');
    }

    // Goal recommendations
    getGoalRecommendations() {
        const recommendations = [];
        
        // Analyze spending patterns
        const monthlyIncome = this.getMonthlyIncome();
        const monthlyExpenses = this.getMonthlyExpenses();
        const netIncome = monthlyIncome - monthlyExpenses;
        
        // Emergency fund recommendation
        const emergencyFund = this.goals.find(g => g.name.toLowerCase().includes('emergency'));
        if (!emergencyFund && netIncome > 0) {
            const recommended = monthlyExpenses * 6;
            recommendations.push({
                title: 'Emergency Fund',
                description: `Build an emergency fund of ${this.formatCurrency(recommended)} (6 months of expenses)`,
                priority: 'high',
                amount: recommended
            });
        }

        // Savings goal based on income
        if (netIncome > 500 && this.goals.filter(g => g.type === 'savings').length < 2) {
            const recommended = netIncome * 0.2 * 12; // 20% of net income for a year
            recommendations.push({
                title: 'Annual Savings Goal',
                description: `Save ${this.formatCurrency(recommended)} this year (20% of your net income)`,
                priority: 'medium',
                amount: recommended
            });
        }

        // Debt reduction recommendation
        const highExpenseCategories = this.getHighestExpenseCategories();
        if (highExpenseCategories.length > 0) {
            const topCategory = highExpenseCategories[0];
            if (topCategory.amount > monthlyIncome * 0.3) {
                recommendations.push({
                    title: `Reduce ${topCategory.category} Spending`,
                    description: `Consider reducing ${topCategory.category} expenses (currently ${this.formatCurrency(topCategory.amount)}/month)`,
                    priority: 'medium',
                    category: topCategory.category
                });
            }
        }

        return recommendations;
    }

    getMonthlyIncome() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return this.transactions
            .filter(t => t.type === 'income' && 
                    new Date(t.date).getMonth() === currentMonth && 
                    new Date(t.date).getFullYear() === currentYear)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getMonthlyExpenses() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return this.transactions
            .filter(t => t.type === 'expense' && 
                    new Date(t.date).getMonth() === currentMonth && 
                    new Date(t.date).getFullYear() === currentYear)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getHighestExpenseCategories() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const categoryTotals = {};
        this.transactions
            .filter(t => t.type === 'expense' && 
                    new Date(t.date).getMonth() === currentMonth && 
                    new Date(t.date).getFullYear() === currentYear)
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

        return Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }

    // Enhanced goal list with recommendations
    updateGoalsList() {
        const container = document.getElementById('goalsList');
        if (!container) return;

        const recommendations = this.getGoalRecommendations();

        let content = '';

        // Add recommendations section
        if (recommendations.length > 0) {
            content += `
                <div class="goal-recommendations">
                    <h4>💡 Goal Recommendations</h4>
                    ${recommendations.map(rec => `
                        <div class="recommendation-item">
                            <h5>${rec.title}</h5>
                            <p>${rec.description}</p>
                            ${rec.amount ? `<button class="btn btn-sm" onclick="financeManager.createRecommendedGoal('${rec.title}', ${rec.amount}, '${rec.title.toLowerCase().includes('emergency') ? 'savings' : 'savings'}')">Create Goal</button>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (this.goals.length === 0) {
            content += '<div class="empty-state"><h3>No goals found</h3><p>Create your first financial goal to stay motivated.</p><button class="btn btn-primary" onclick="financeManager.showGoalModal()">+ Create Goal</button></div>';
        } else {
            content += this.goals.map(goal => {
                const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                const isOverdue = new Date(goal.targetDate) < new Date() && progress < 100;
                const isAchieved = goal.achieved;
                
                return `
                    <div class="card ${isAchieved ? 'achievement-card' : ''}">
                        ${isAchieved ? '<div class="achievement-badge">🏆 Achieved!</div>' : ''}
                        <h4 style="color: #667eea; margin-bottom: 10px;">${goal.name}</h4>
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #666; text-transform: capitalize;">${goal.type} Goal</span>
                                <span style="font-weight: 600;">
                                    ${this.formatCurrency(goal.currentAmount)} / ${this.formatCurrency(goal.targetAmount)}
                                </span>
                            </div>
                            <div class="budget-progress">
                                <div class="budget-progress-bar ${isOverdue ? 'danger' : isAchieved ? 'success' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
                            </div>
                            <div style="margin-top: 5px; display: flex; justify-content: space-between; font-size: 0.9rem; color: #666;">
                                <span>${progress.toFixed(1)}% complete</span>
                                <span>Due: ${this.formatDate(goal.targetDate)} ${isOverdue ? '(Overdue)' : isAchieved ? '(Completed)' : ''}</span>
                            </div>
                        </div>
                        ${goal.description ? `<p style="color: #666; margin-bottom: 15px;">${goal.description}</p>` : ''}
                        <div class="form-actions">
                            <button class="btn btn-sm" onclick="financeManager.editGoal('${goal.id}')">Edit</button>
                            <button class="btn btn-sm btn-secondary" onclick="financeManager.deleteGoal('${goal.id}')">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        container.innerHTML = content;
    }

    createRecommendedGoal(name, amount, type) {
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + 1); // One year from now
        
        document.getElementById('goalName').value = name;
        document.getElementById('goalType').value = type;
        document.getElementById('goalTarget').value = amount;
        document.getElementById('goalCurrent').value = 0;
        document.getElementById('goalDate').value = targetDate.toISOString().split('T')[0];
        document.getElementById('goalDescription').value = `Recommended goal based on your financial analysis.`;
        
        this.showGoalModal();
    }

    // Recurring Transaction Methods
    showRecurringModal() {
        this.editingRecurring = null;
        this.resetRecurringForm();
        this.updateRecurringCategoryOptions();
        this.updateRecurringAccountOptions();
        document.getElementById('recurringModalTitle').textContent = 'Add Recurring Transaction';
        document.getElementById('recurringModal').classList.add('active');
    }

    hideRecurringModal() {
        document.getElementById('recurringModal').classList.remove('active');
        this.editingRecurring = null;
    }

    resetRecurringForm() {
        document.getElementById('recurringForm').reset();
        document.getElementById('recurringStartDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('recurringDayOfMonth').value = 'same';
        document.getElementById('customDayGroup').style.display = 'none';
    }

    updateRecurringCategoryOptions() {
        const categorySelect = document.getElementById('recurringCategory');
        const type = document.getElementById('recurringType').value;
        
        categorySelect.innerHTML = this.categories[type].map(category => 
            `<option value="${category}">${category}</option>`
        ).join('');
    }

    updateRecurringAccountOptions() {
        const accountSelect = document.getElementById('recurringAccount');
        accountSelect.innerHTML = this.accounts.map(account => 
            `<option value="${account.id}">${account.name}</option>`
        ).join('');
    }

    handleRecurringSubmit(e) {
        e.preventDefault();

        const recurring = {
            id: this.editingRecurring?.id || this.generateId(),
            type: document.getElementById('recurringType').value,
            amount: parseFloat(document.getElementById('recurringAmount').value),
            category: document.getElementById('recurringCategory').value,
            account: document.getElementById('recurringAccount').value,
            description: document.getElementById('recurringDescription').value,
            frequency: document.getElementById('recurringFrequency').value,
            startDate: document.getElementById('recurringStartDate').value,
            endDate: document.getElementById('recurringEndDate').value || null,
            dayOfMonth: document.getElementById('recurringDayOfMonth').value,
            customDay: document.getElementById('recurringCustomDay').value || null,
            autoProcess: document.getElementById('recurringAutoProcess').checked,
            status: 'active',
            lastProcessed: null,
            createdAt: this.editingRecurring?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!this.recurringTransactions) {
            this.recurringTransactions = [];
        }

        if (this.editingRecurring) {
            const index = this.recurringTransactions.findIndex(r => r.id === this.editingRecurring.id);
            this.recurringTransactions[index] = recurring;
            this.showToast('Recurring transaction updated successfully', 'success');
        } else {
            this.recurringTransactions.push(recurring);
            this.showToast('Recurring transaction created successfully', 'success');
        }

        this.saveRecurringTransactions();
        this.hideRecurringModal();
        
        if (this.currentView === 'recurring') {
            this.updateRecurringList();
        }
    }

    saveRecurringTransactions() {
        localStorage.setItem('finance_recurring_transactions', JSON.stringify(this.recurringTransactions || []));
    }

    updateRecurringList() {
        const container = document.getElementById('recurringList');
        if (!container) return;

        if (!this.recurringTransactions || this.recurringTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No recurring transactions found</h3><p>Set up recurring transactions to automate your finances.</p><button class="btn btn-primary" onclick="financeManager.showRecurringModal()">+ Add Recurring</button></div>';
            return;
        }

        container.innerHTML = this.recurringTransactions.map(recurring => {
            const nextDue = this.calculateNextDueDate(recurring);
            const isDue = new Date(nextDue) <= new Date();
            
            return `
                <div class="card recurring-item">
                    <div class="recurring-header">
                        <h4 style="color: #667eea; margin-bottom: 10px;">${recurring.description}</h4>
                        <span class="recurring-status ${recurring.status}">${recurring.status.toUpperCase()}</span>
                    </div>
                    <div class="recurring-details">
                        <div class="recurring-info">
                            <span class="recurring-amount ${recurring.type}">${recurring.type === 'expense' ? '-' : '+'}${this.formatCurrency(recurring.amount)}</span>
                            <span class="recurring-category">${recurring.category}</span>
                            <span class="recurring-frequency">${recurring.frequency}</span>
                        </div>
                        <div class="recurring-dates">
                            <span class="next-due ${isDue ? 'due' : ''}">Next: ${this.formatDate(nextDue)}</span>
                            ${recurring.endDate ? `<span class="end-date">Until: ${this.formatDate(recurring.endDate)}</span>` : ''}
                        </div>
                    </div>
                    <div class="recurring-actions">
                        ${isDue ? '<button class="btn btn-sm btn-primary" onclick="financeManager.processRecurringTransaction(\'' + recurring.id + '\')">Process Now</button>' : ''}
                        <button class="btn btn-sm btn-secondary" onclick="financeManager.editRecurringTransaction(\'' + recurring.id + '\')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="financeManager.deleteRecurringTransaction(\'' + recurring.id + '\')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    calculateNextDueDate(recurring) {
        const startDate = new Date(recurring.startDate);
        const today = new Date();
        let nextDue = new Date(startDate);

        // If we haven't processed this yet and start date is in the future, return start date
        if (startDate > today && !recurring.lastProcessed) {
            return startDate.toISOString().split('T')[0];
        }

        // Calculate based on frequency
        const lastProcessed = recurring.lastProcessed ? new Date(recurring.lastProcessed) : startDate;
        
        switch (recurring.frequency) {
            case 'weekly':
                nextDue = new Date(lastProcessed);
                nextDue.setDate(nextDue.getDate() + 7);
                break;
            case 'bi-weekly':
                nextDue = new Date(lastProcessed);
                nextDue.setDate(nextDue.getDate() + 14);
                break;
            case 'monthly':
                nextDue = new Date(lastProcessed);
                nextDue.setMonth(nextDue.getMonth() + 1);
                break;
            case 'quarterly':
                nextDue = new Date(lastProcessed);
                nextDue.setMonth(nextDue.getMonth() + 3);
                break;
            case 'yearly':
                nextDue = new Date(lastProcessed);
                nextDue.setFullYear(nextDue.getFullYear() + 1);
                break;
        }

        return nextDue.toISOString().split('T')[0];
    }

    processRecurringTransaction(recurringId) {
        const recurring = this.recurringTransactions.find(r => r.id === recurringId);
        if (!recurring) return;

        // Create a new transaction from the recurring template
        const transaction = {
            id: this.generateId(),
            type: recurring.type,
            amount: recurring.amount,
            category: recurring.category,
            account: recurring.account,
            description: recurring.description,
            date: new Date().toISOString().split('T')[0],
            recurring: true,
            recurringId: recurring.id,
            tags: ['recurring'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add transaction
        this.transactions.push(transaction);
        this.saveTransactions();

        // Update recurring transaction last processed date
        recurring.lastProcessed = new Date().toISOString().split('T')[0];
        this.saveRecurringTransactions();

        this.showToast(`Processed recurring transaction: ${recurring.description}`, 'success');
        this.updateRecurringList();
        this.updateDashboard();
    }

    editRecurringTransaction(recurringId) {
        const recurring = this.recurringTransactions.find(r => r.id === recurringId);
        if (!recurring) return;

        this.editingRecurring = recurring;
        
        // Populate form with existing data
        document.getElementById('recurringType').value = recurring.type;
        document.getElementById('recurringAmount').value = recurring.amount;
        document.getElementById('recurringDescription').value = recurring.description;
        document.getElementById('recurringFrequency').value = recurring.frequency;
        document.getElementById('recurringStartDate').value = recurring.startDate;
        document.getElementById('recurringEndDate').value = recurring.endDate || '';
        document.getElementById('recurringDayOfMonth').value = recurring.dayOfMonth;
        document.getElementById('recurringCustomDay').value = recurring.customDay || '';
        document.getElementById('recurringAutoProcess').checked = recurring.autoProcess;

        this.updateRecurringCategoryOptions();
        this.updateRecurringAccountOptions();
        
        document.getElementById('recurringCategory').value = recurring.category;
        document.getElementById('recurringAccount').value = recurring.account;
        
        document.getElementById('recurringModalTitle').textContent = 'Edit Recurring Transaction';
        document.getElementById('recurringModal').classList.add('active');
    }

    deleteRecurringTransaction(recurringId) {
        if (!confirm('Are you sure you want to delete this recurring transaction?')) return;

        this.recurringTransactions = this.recurringTransactions.filter(r => r.id !== recurringId);
        this.saveRecurringTransactions();
        
        this.showToast('Recurring transaction deleted', 'success');
        this.updateRecurringList();
    }

    // Account reconciliation
    showReconcileModal() {
        this.updateReconcileAccountOptions();
        document.getElementById('reconcileDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('reconcileModal').classList.add('active');
    }

    hideReconcileModal() {
        document.getElementById('reconcileModal').classList.remove('active');
        document.getElementById('reconcileForm').reset();
        document.getElementById('reconcileResults').style.display = 'none';
        document.getElementById('completeReconcile').style.display = 'none';
    }

    updateReconcileAccountOptions() {
        const select = document.getElementById('reconcileAccount');
        select.innerHTML = this.accounts.map(account => 
            `<option value="${account.id}">${account.name} (Current: ${this.formatCurrency(account.balance)})</option>`
        ).join('');
    }

    calculateReconciliation() {
        const accountId = document.getElementById('reconcileAccount').value;
        const statementBalance = parseFloat(document.getElementById('reconcileStatement').value);
        const statementDate = document.getElementById('reconcileDate').value;

        const account = this.accounts.find(a => a.id === accountId);
        if (!account) return;

        // Calculate balance as of statement date
        const transactionsUpToDate = this.transactions
            .filter(t => t.account === accountId && t.date <= statementDate)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        let calculatedBalance = 0;
        transactionsUpToDate.forEach(t => {
            if (t.type === 'income') {
                calculatedBalance += t.amount;
            } else {
                calculatedBalance -= t.amount;
            }
        });

        // Find the initial account balance (if any transactions exist before the first recorded one)
        const firstTransaction = transactionsUpToDate[0];
        if (firstTransaction) {
            // For simplicity, assume the account started with the current balance minus all recorded transactions
            const allAccountTransactions = this.transactions.filter(t => t.account === accountId);
            let totalTransactionEffect = 0;
            allAccountTransactions.forEach(t => {
                if (t.type === 'income') {
                    totalTransactionEffect += t.amount;
                } else {
                    totalTransactionEffect -= t.amount;
                }
            });
            
            const initialBalance = account.balance - totalTransactionEffect;
            calculatedBalance += initialBalance;
        } else {
            calculatedBalance = account.balance;
        }

        const difference = statementBalance - calculatedBalance;

        // Show results
        const resultsDiv = document.getElementById('reconcileResults');
        const summaryDiv = resultsDiv.querySelector('.reconcile-summary');
        const differencesDiv = resultsDiv.querySelector('.reconcile-differences');

        summaryDiv.innerHTML = `
            <div class="reconcile-item">
                <strong>Statement Balance:</strong> ${this.formatCurrency(statementBalance)}
            </div>
            <div class="reconcile-item">
                <strong>Calculated Balance:</strong> ${this.formatCurrency(calculatedBalance)}
            </div>
            <div class="reconcile-item reconcile-difference">
                <strong>Difference:</strong> ${this.formatCurrency(Math.abs(difference))}
                ${difference !== 0 ? `(${difference > 0 ? 'Missing income or extra expenses' : 'Extra income or missing expenses'})` : '(Perfect match!)'}
            </div>
        `;

        if (Math.abs(difference) > 0.01) {
            differencesDiv.innerHTML = `
                <h5>Possible Issues:</h5>
                <ul>
                    <li>Missing transactions not recorded in the app</li>
                    <li>Bank fees or interest not accounted for</li>
                    <li>Timing differences in transaction dates</li>
                    <li>Data entry errors in amounts</li>
                </ul>
                <p><strong>Recommendation:</strong> Review recent transactions and bank statement for discrepancies.</p>
            `;
        } else {
            differencesDiv.innerHTML = `
                <div class="reconcile-success">
                    <h5>✅ Perfect Match!</h5>
                    <p>Your records are in sync with the bank statement.</p>
                </div>
            `;
        }

        resultsDiv.style.display = 'block';
        document.getElementById('completeReconcile').style.display = 'inline-block';
    }

    handleReconcileSubmit(e) {
        e.preventDefault();
        
        const accountId = document.getElementById('reconcileAccount').value;
        const statementBalance = parseFloat(document.getElementById('reconcileStatement').value);
        const statementDate = document.getElementById('reconcileDate').value;

        // Record reconciliation
        const reconciliation = {
            id: this.generateId(),
            accountId: accountId,
            statementBalance: statementBalance,
            statementDate: statementDate,
            reconcileDate: new Date().toISOString(),
            calculatedBalance: this.accounts.find(a => a.id === accountId)?.balance || 0
        };

        if (!this.reconciliations) {
            this.reconciliations = [];
        }
        this.reconciliations.push(reconciliation);
        
        localStorage.setItem('finance_reconciliations', JSON.stringify(this.reconciliations));
        
        this.hideReconcileModal();
        this.showToast('Account reconciliation completed and recorded', 'success');
    }

    // Enhanced updateGoalsList is already included above

    // Projections functionality
    calculateSavingsProjection() {
        const initial = parseFloat(document.getElementById('savingsInitial').value) || 0;
        const monthly = parseFloat(document.getElementById('savingsMonthly').value) || 0;
        const rate = parseFloat(document.getElementById('savingsRate').value) / 100 || 0;
        const years = parseInt(document.getElementById('savingsYears').value) || 0;

        if (years <= 0) {
            this.showToast('Please enter a valid time period', 'error');
            return;
        }

        const monthlyRate = rate / 12;
        const months = years * 12;
        let balance = initial;
        const yearlyBreakdown = [];
        
        // Calculate year by year
        for (let year = 1; year <= years; year++) {
            for (let month = 1; month <= 12; month++) {
                // Add interest to current balance
                balance = balance * (1 + monthlyRate);
                // Add monthly contribution
                balance += monthly;
            }
            
            yearlyBreakdown.push({
                year: year,
                balance: balance,
                totalContributions: initial + (monthly * year * 12),
                interestEarned: balance - initial - (monthly * year * 12)
            });
        }

        const finalAmount = balance;
        const totalContributions = initial + (monthly * months);
        const interestEarned = finalAmount - totalContributions;

        // Display results
        document.getElementById('savingsFinalAmount').textContent = this.formatCurrency(finalAmount);
        document.getElementById('savingsTotalContributions').textContent = this.formatCurrency(totalContributions);
        document.getElementById('savingsInterestEarned').textContent = this.formatCurrency(interestEarned);

        // Show yearly breakdown
        this.displayYearlyBreakdown('savingsYearlyBreakdown', yearlyBreakdown, 'savings');
        
        // Show results section
        document.getElementById('savingsResults').style.display = 'block';
        
        // Store for scenario comparison
        this.lastSavingsProjection = {
            type: 'savings',
            initial: initial,
            monthly: monthly,
            rate: rate * 100,
            years: years,
            finalAmount: finalAmount,
            totalContributions: totalContributions,
            interestEarned: interestEarned
        };
    }

    calculateInvestmentProjection() {
        const initial = parseFloat(document.getElementById('investmentInitial').value) || 0;
        const monthly = parseFloat(document.getElementById('investmentMonthly').value) || 0;
        const returnRate = parseFloat(document.getElementById('investmentReturn').value) / 100 || 0;
        const years = parseInt(document.getElementById('investmentYears').value) || 0;

        if (years <= 0) {
            this.showToast('Please enter a valid investment period', 'error');
            return;
        }

        const monthlyReturn = returnRate / 12;
        const months = years * 12;
        let portfolioValue = initial;
        const yearlyBreakdown = [];
        
        // Calculate year by year with compound growth
        for (let year = 1; year <= years; year++) {
            for (let month = 1; month <= 12; month++) {
                // Apply monthly return to current portfolio value
                portfolioValue = portfolioValue * (1 + monthlyReturn);
                // Add monthly investment
                portfolioValue += monthly;
            }
            
            yearlyBreakdown.push({
                year: year,
                balance: portfolioValue,
                totalInvested: initial + (monthly * year * 12),
                gains: portfolioValue - initial - (monthly * year * 12)
            });
        }

        const finalAmount = portfolioValue;
        const totalInvested = initial + (monthly * months);
        const investmentGains = finalAmount - totalInvested;

        // Display results
        document.getElementById('investmentFinalAmount').textContent = this.formatCurrency(finalAmount);
        document.getElementById('investmentTotalInvested').textContent = this.formatCurrency(totalInvested);
        document.getElementById('investmentGains').textContent = this.formatCurrency(investmentGains);

        // Show yearly breakdown
        this.displayYearlyBreakdown('investmentYearlyBreakdown', yearlyBreakdown, 'investment');
        
        // Show results section
        document.getElementById('investmentResults').style.display = 'block';
        
        // Store for scenario comparison
        this.lastInvestmentProjection = {
            type: 'investment',
            initial: initial,
            monthly: monthly,
            returnRate: returnRate * 100,
            years: years,
            finalAmount: finalAmount,
            totalInvested: totalInvested,
            gains: investmentGains
        };
    }

    displayYearlyBreakdown(containerId, yearlyData, type) {
        const container = document.getElementById(containerId);
        
        let html = '<div class="year-item header">';
        html += '<div>Year</div>';
        html += '<div>Balance</div>';
        if (type === 'savings') {
            html += '<div>Contributions</div>';
            html += '<div>Interest</div>';
        } else {
            html += '<div>Total Invested</div>';
            html += '<div>Gains</div>';
        }
        html += '</div>';
        
        yearlyData.forEach(data => {
            html += '<div class="year-item">';
            html += `<div>${data.year}</div>`;
            html += `<div>${this.formatCurrency(data.balance)}</div>`;
            if (type === 'savings') {
                html += `<div>${this.formatCurrency(data.totalContributions)}</div>`;
                html += `<div>${this.formatCurrency(data.interestEarned)}</div>`;
            } else {
                html += `<div>${this.formatCurrency(data.totalInvested)}</div>`;
                html += `<div>${this.formatCurrency(data.gains)}</div>`;
            }
            html += '</div>';
        });
        
        container.innerHTML = html;
    }

    addScenario() {
        const scenarios = JSON.parse(localStorage.getItem('finance_scenarios') || '[]');
        
        if (this.lastSavingsProjection) {
            const scenarioName = `Savings: ${this.formatCurrency(this.lastSavingsProjection.initial)} + ${this.formatCurrency(this.lastSavingsProjection.monthly)}/mo`;
            scenarios.push({
                ...this.lastSavingsProjection,
                name: scenarioName,
                id: Date.now() + '_savings'
            });
        }
        
        if (this.lastInvestmentProjection) {
            const scenarioName = `Investment: ${this.formatCurrency(this.lastInvestmentProjection.initial)} + ${this.formatCurrency(this.lastInvestmentProjection.monthly)}/mo`;
            scenarios.push({
                ...this.lastInvestmentProjection,
                name: scenarioName,
                id: Date.now() + '_investment'
            });
        }
        
        if (scenarios.length === JSON.parse(localStorage.getItem('finance_scenarios') || '[]').length) {
            this.showToast('Calculate a projection first to add a scenario', 'warning');
            return;
        }
        
        localStorage.setItem('finance_scenarios', JSON.stringify(scenarios));
        this.displayScenarios();
        this.showToast('Scenario added for comparison', 'success');
    }

    displayScenarios() {
        const scenarios = JSON.parse(localStorage.getItem('finance_scenarios') || '[]');
        const container = document.getElementById('scenarioComparison');
        
        if (scenarios.length === 0) {
            container.innerHTML = '<div class="scenario-placeholder"><p>Use the calculators above to create scenarios, then add them here for comparison.</p></div>';
            return;
        }
        
        let html = '';
        scenarios.forEach(scenario => {
            html += '<div class="scenario-card">';
            html += '<div class="scenario-header">';
            html += `<div class="scenario-title">${scenario.name}</div>`;
            html += `<button class="scenario-remove" onclick="financeManager.removeScenario('${scenario.id}')">Remove</button>`;
            html += '</div>';
            html += '<div class="scenario-details">';
            html += `<div class="scenario-detail"><span class="label">Initial</span><span class="value">${this.formatCurrency(scenario.initial)}</span></div>`;
            html += `<div class="scenario-detail"><span class="label">Monthly</span><span class="value">${this.formatCurrency(scenario.monthly)}</span></div>`;
            html += `<div class="scenario-detail"><span class="label">${scenario.type === 'savings' ? 'Interest Rate' : 'Return Rate'}</span><span class="value">${scenario.rate || scenario.returnRate}%</span></div>`;
            html += `<div class="scenario-detail"><span class="label">Years</span><span class="value">${scenario.years}</span></div>`;
            html += `<div class="scenario-detail"><span class="label">Final Amount</span><span class="value">${this.formatCurrency(scenario.finalAmount)}</span></div>`;
            html += `<div class="scenario-detail"><span class="label">${scenario.type === 'savings' ? 'Interest Earned' : 'Investment Gains'}</span><span class="value">${this.formatCurrency(scenario.interestEarned || scenario.gains)}</span></div>`;
            html += '</div>';
            html += '</div>';
        });
        
        container.innerHTML = html;
    }

    removeScenario(scenarioId) {
        const scenarios = JSON.parse(localStorage.getItem('finance_scenarios') || '[]');
        const filteredScenarios = scenarios.filter(s => s.id !== scenarioId);
        localStorage.setItem('finance_scenarios', JSON.stringify(filteredScenarios));
        this.displayScenarios();
        this.showToast('Scenario removed', 'success');
    }

    compareScenarios() {
        const scenarios = JSON.parse(localStorage.getItem('finance_scenarios') || '[]');
        
        if (scenarios.length < 2) {
            this.showToast('Add at least 2 scenarios to compare', 'warning');
            return;
        }
        
        // Sort scenarios by final amount
        scenarios.sort((a, b) => b.finalAmount - a.finalAmount);
        
        const best = scenarios[0];
        const worst = scenarios[scenarios.length - 1];
        const difference = best.finalAmount - worst.finalAmount;
        
        let message = `Comparison: Best scenario (${best.name}) vs Worst scenario (${worst.name})\n`;
        message += `Difference: ${this.formatCurrency(difference)}`;
        
        this.showToast(message, 'success');
    }

    clearScenarios() {
        if (confirm('Clear all scenarios? This cannot be undone.')) {
            localStorage.removeItem('finance_scenarios');
            this.displayScenarios();
            this.showToast('All scenarios cleared', 'success');
        }
    }

    resetProjections() {
        if (confirm('Reset all projection calculations? This will clear results and scenarios.')) {
            // Clear form inputs
            document.getElementById('savingsInitial').value = '20000';
            document.getElementById('savingsMonthly').value = '';
            document.getElementById('savingsRate').value = '2.5';
            document.getElementById('savingsYears').value = '10';
            
            document.getElementById('investmentInitial').value = '20000';
            document.getElementById('investmentMonthly').value = '';
            document.getElementById('investmentReturn').value = '7';
            document.getElementById('investmentYears').value = '20';
            
            // Hide results
            document.getElementById('savingsResults').style.display = 'none';
            document.getElementById('investmentResults').style.display = 'none';
            
            // Clear scenarios
            this.clearScenarios();
            
            // Clear stored projections
            delete this.lastSavingsProjection;
            delete this.lastInvestmentProjection;
            
            this.showToast('All projections reset', 'success');
        }
    }
}

// Global function for external access
function showView(viewName) {
    financeManager.showView(viewName);
}

// Initialize the application
let financeManager;
document.addEventListener('DOMContentLoaded', () => {
    // Load daily Quran verse
    loadQuranVerse('daily-verse-container');
    
    financeManager = new FinanceManager();
});