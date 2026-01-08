/**
 * LifeOS Finance Tracker
 * Expense tracking and budget management app
 */

class FinanceApp extends BaseApp {
  constructor() {
    super('finance-expenses');

    this.expenses = this.data;
    this.budgets = StorageManager.get('finance-budgets') || [];
    this.categories = StorageManager.get('finance-categories') || DataManager.getDefaultFinanceCategories();
    this.selectedCategory = 'all';
  }

  setupEventListeners() {
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
      expenseForm.addEventListener('submit', (e) => this.handleExpenseSubmit(e));
    }

    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
      budgetForm.addEventListener('submit', (e) => this.handleBudgetSubmit(e));
    }

    // Category filter
    document.querySelectorAll('.category-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        document.querySelectorAll('.category-tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedCategory = e.target.dataset.category;
        this.renderExpenses();
      });
    });
  }

  init() {
    super.init();
    this.renderCategories();
  }

  renderCategories() {
    const container = document.getElementById('category-tags');
    if (!container) return;

    container.innerHTML = `
      <div class="category-tag active" data-category="all">All</div>
      ${this.categories.map(cat => `
        <div class="category-tag" data-category="${cat.id}">
          ${cat.icon} ${cat.name}
        </div>
      `).join('')}
    `;

    document.querySelectorAll('.category-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        document.querySelectorAll('.category-tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedCategory = e.target.dataset.category;
        this.renderExpenses();
      });
    });
  }

  handleExpenseSubmit(e) {
    e.preventDefault();

    const expense = this.createItem({
      description: document.getElementById('expense-description').value,
      category: document.getElementById('expense-category').value,
      amount: parseFloat(document.getElementById('expense-amount').value),
      date: document.getElementById('expense-date').value,
      notes: document.getElementById('expense-notes').value
    });

    this.expenses.push(expense);
    this.save();

    e.target.reset();
    this.setupDefaultDates();
    alert('Expense logged successfully!');
    this.renderExpenses();
    this.updateDashboard();
  }

  handleBudgetSubmit(e) {
    e.preventDefault();

    const budget = {
      id: Date.now(),
      name: document.getElementById('budget-name').value,
      category: document.getElementById('budget-category').value,
      limit: parseFloat(document.getElementById('budget-limit').value),
      month: document.getElementById('budget-month').value,
      createdDate: new Date().toISOString().split('T')[0]
    };

    this.budgets.push(budget);
    StorageManager.set('finance-budgets', this.budgets);

    e.target.reset();
    alert('Budget created successfully!');
    this.renderBudgets();
    this.updateDashboard();
  }

  deleteExpense(expenseId) {
    if (confirm('Delete this expense?')) {
      this.deleteById(expenseId);
      this.renderExpenses();
    }
  }

  deleteBudget(budgetId) {
    if (confirm('Delete this budget?')) {
      this.budgets = this.budgets.filter(b => b.id !== budgetId);
      StorageManager.set('finance-budgets', this.budgets);
      this.renderBudgets();
      this.updateDashboard();
    }
  }

  getCategoryName(categoryId) {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Other';
  }

  getCategoryIcon(categoryId) {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.icon : '📌';
  }

  getMonthYear(date) {
    const d = new Date(date);
    return d.toISOString().slice(0, 7);
  }

  getTotalExpensesForMonth(monthStr) {
    return this.expenses
      .filter(e => this.getMonthYear(e.date) === monthStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getCategoryTotalForMonth(categoryId, monthStr) {
    return this.expenses
      .filter(e => e.category === categoryId && this.getMonthYear(e.date) === monthStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  renderExpenses() {
    const expensesList = document.getElementById('expenses-list');
    if (!expensesList) return;

    let filtered = this.expenses;
    if (this.selectedCategory !== 'all') {
      filtered = this.expenses.filter(e => e.category === this.selectedCategory);
    }

    if (filtered.length === 0) {
      expensesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💸</div>
          <p>No expenses logged yet.</p>
        </div>
      `;
      return;
    }

    expensesList.innerHTML = filtered
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(expense => `
        <div class="expense-item">
          <div class="expense-info">
            <div class="expense-category">
              ${this.getCategoryIcon(expense.category)} ${this.getCategoryName(expense.category)}
            </div>
            <div class="expense-description">${expense.description}</div>
            <div class="expense-date">${this.formatDate(expense.date)}</div>
            ${expense.notes ? `<div style="font-size: 11px; color: #999; margin-top: 4px;">${expense.notes}</div>` : ''}
          </div>
          <div class="expense-amount">
            <div class="expense-value">${this.formatCurrency(expense.amount)}</div>
          </div>
          <div class="expense-actions">
            <button class="finance-btn finance-btn-small finance-btn-danger" onclick="financeApp.deleteExpense(${expense.id})">Delete</button>
          </div>
        </div>
      `).join('');
  }

  renderBudgets() {
    const budgetsList = document.getElementById('budgets-list');
    if (!budgetsList) return;

    if (this.budgets.length === 0) {
      budgetsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <p>No budgets created yet.</p>
        </div>
      `;
      return;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    budgetsList.innerHTML = this.budgets.map(budget => {
      const spent = this.getCategoryTotalForMonth(budget.category, budget.month || currentMonth);
      const percentage = (spent / budget.limit * 100).toFixed(1);
      let statusClass = '';
      if (percentage >= 100) statusClass = 'danger';
      else if (percentage >= 80) statusClass = 'warning';

      return `
        <div class="budget-item">
          <div class="budget-header">
            <div>
              <div class="budget-name">${this.getCategoryIcon(budget.category)} ${budget.name}</div>
              <div style="font-size: 12px; color: #999;">${budget.month || currentMonth}</div>
            </div>
            <div class="budget-amount">$${spent.toFixed(2)} / $${budget.limit.toFixed(2)}</div>
          </div>
          <div class="budget-progress">
            <div class="budget-bar ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px;">
            <span>${percentage}% spent</span>
            <button class="finance-btn finance-btn-small finance-btn-danger" onclick="financeApp.deleteBudget(${budget.id})">Remove</button>
          </div>
        </div>
      `;
    }).join('');
  }

  updateDashboard() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTotal = this.getTotalExpensesForMonth(currentMonth);
    const allTimeTotal = this.expenses.reduce((sum, e) => sum + e.amount, 0);
    const uniqueCategories = [...new Set(this.expenses.map(e => e.category))].length;

    document.getElementById('monthly-expenses').textContent = this.formatCurrency(monthlyTotal);
    document.getElementById('total-expenses').textContent = this.formatCurrency(allTimeTotal);
    document.getElementById('expense-count').textContent = this.expenses.length;
    document.getElementById('category-count').textContent = uniqueCategories;

    this.renderDashboardExpenses();
    this.renderCategoryBreakdown();
  }

  renderDashboardExpenses() {
    const recentDiv = document.getElementById('recent-expenses');
    if (!recentDiv) return;

    const recent = [...this.expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recent.length === 0) {
      recentDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💰</div>
          <p>No expenses yet. Start logging!</p>
        </div>
      `;
      return;
    }

    recentDiv.innerHTML = recent.map(expense => `
      <div class="expense-item" style="padding: 10px 12px;">
        <div class="expense-info">
          <div class="expense-category" style="margin-bottom: 2px;">
            ${this.getCategoryIcon(expense.category)} ${expense.description}
          </div>
          <div class="expense-date">${this.formatDate(expense.date)}</div>
        </div>
        <div class="expense-amount">
          <div class="expense-value" style="font-size: 14px;">${this.formatCurrency(expense.amount)}</div>
        </div>
      </div>
    `).join('');
  }

  renderCategoryBreakdown() {
    const breakdownDiv = document.getElementById('category-breakdown');
    if (!breakdownDiv) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const categoryTotals = {};

    this.expenses
      .filter(e => this.getMonthYear(e.date) === currentMonth)
      .forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      });

    if (Object.keys(categoryTotals).length === 0) {
      breakdownDiv.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p>No expenses this month</p>
        </div>
      `;
      return;
    }

    breakdownDiv.innerHTML = `
      <ul class="category-breakdown">
        ${Object.entries(categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .map(([catId, total]) => `
            <li class="category-item">
              <span class="category-name">${this.getCategoryIcon(catId)} ${this.getCategoryName(catId)}</span>
              <span class="category-amount">${this.formatCurrency(total)}</span>
            </li>
          `).join('')}
      </ul>
    `;
  }

  refresh() {
    super.refresh();
    this.expenses = this.data;
    this.budgets = StorageManager.get('finance-budgets') || [];
    this.categories = StorageManager.get('finance-categories') || DataManager.getDefaultFinanceCategories();
    this.renderExpenses();
  }
}

// Tab switching
function switchTab(tabName) {
  UIUtils.switchTab(tabName, financeApp, {
    'dashboard': () => financeApp.updateDashboard(),
    'expenses': () => financeApp.renderExpenses(),
    'budgets': () => financeApp.renderBudgets()
  });
}

// Initialize app
let financeApp = UIUtils.initializeApp(FinanceApp, 'financeApp');
