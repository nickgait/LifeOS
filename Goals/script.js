/**
 * LifeOS Goals Tracker
 * Multi-category goal tracking app
 */

class GoalsApp extends BaseApp {
  constructor() {
    super('goals-all');

    this.goals = this.data;

















  setupEventListeners() {
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
      goalForm.addEventListener('submit', (e) => this.handleGoalSubmit(e));
    }

    // Category filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedCategory = e.target.dataset.category;
        this.renderGoals();
      });
    });
  }

  handleGoalSubmit(e) {
    e.preventDefault();

    // Extract and validate goal data
    const rawGoalData = {
      name: document.getElementById('goal-name').value,
      description: document.getElementById('goal-description').value,
      category: document.getElementById('goal-category').value,
      targetDate: document.getElementById('goal-target-date').value
    };

    // Validate the goal data using predefined schema
    const validation = Validator.goalSchema.safeParse(rawGoalData);
    if (!validation.success) {
      const errorMessages = validation.errors.map(err => err.message).join('\n');
      FormUtils.showNotification('Validation Error: ' + errorMessages, 'error');
      return;
    }

    // Create goal with validated data
    const goal = this.createItem({
      ...validation.data,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active',
      milestones: [],
      notes: []
    });

    this.goals.push(goal);
    this.save();

    FormUtils.resetFormWithSuccess(
      e.target,
      'Goal created successfully!',
      () => {
        this.setupDefaultDates();
        this.renderGoals();
        this.updateDashboard();
      }
    );
  }

  deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
      this.deleteById(goalId);
      this.renderGoals();
      this.updateDashboard();
    }
  }

  completeGoal(goalId) {
    const goal = this.findById(goalId);
    if (goal) {
      goal.status = 'completed';
      goal.completedDate = new Date().toISOString().split('T')[0];
      this.save();
      this.renderGoals();
      this.updateDashboard();
    }
  }

  getCategoryLabel(categoryId) {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Other';
  }

  getCategoryColor(categoryId) {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.color : '#6b7280';
  }

  renderGoals() {
    const goalsList = document.getElementById('goals-list');
    if (!goalsList) return;

    const allGoals = [...this.goals];

    let filteredGoals = allGoals;
    if (this.selectedCategory !== 'all') {
      filteredGoals = allGoals.filter(g => g.category === this.selectedCategory);
    }

    if (filteredGoals.length === 0) {
      goalsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <p>No goals in this category yet. Create your first goal!</p>
        </div>
      `;
      return;
    }

    goalsList.innerHTML = filteredGoals
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
      .map(goal => {
        const daysLeft = this.daysBetween(new Date(), new Date(goal.targetDate));
        const color = this.getCategoryColor(goal.category);
        const safeName = Sanitizer.escapeHTML(goal.name);
        const safeDescription = Sanitizer.escapeHTML(goal.description);

        return `
          <div class="goal-item">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <h3>${safeName}</h3>
                <div class="goal-meta">
                  <span class="category-badge category-${Sanitizer.escapeHTML(goal.category)}">
                    ${this.getCategoryLabel(goal.category)}
                  </span>
                  <span style="color: #999;">Due: ${Sanitizer.escapeHTML(goal.targetDate)}</span>
                </div>
                ${goal.description ? `<p style="margin: 8px 0; color: #666; font-size: 13px;">${safeDescription}</p>` : ''}
              </div>
            </div>
            <div>
              <div style="text-align: right; font-size: 12px; color: #999; margin-bottom: 8px;">
                ${Math.max(daysLeft, 0)} days remaining
              </div>
              <span class="status-badge ${goal.status === 'active' ? 'status-active' : 'status-completed'}">
                ${goal.status === 'active' ? 'Active' : 'Completed'}
              </span>
            </div>
            <div class="goal-actions">
              ${goal.status === 'active' ? `
                <button class="goals-btn goals-btn-small" onclick="goalsApp.completeGoal(${goal.id})">Mark Complete</button>
              ` : ''}
              <button class="goals-btn goals-btn-small goals-btn-danger" onclick="goalsApp.deleteGoal(${goal.id})">Delete</button>
            </div>
          </div>
        `;
      }).join('');
  }

  updateDashboard() {
    const totalGoals = this.goals.length;
    const activeGoals = this.goals.filter(g => g.status === 'active').length;
    const completedGoals = this.goals.filter(g => g.status === 'completed').length;

    document.getElementById('total-goals-count').textContent = totalGoals;
    document.getElementById('active-goals-count').textContent = activeGoals;
    document.getElementById('completed-goals-count').textContent = completedGoals;

    this.renderDashboardGoals();
    this.renderGoalsByCategory();
  }

  renderDashboardGoals() {
    const dashboardGoals = document.getElementById('dashboard-goals');
    if (!dashboardGoals) return;

    const recentGoals = this.goals
      .filter(g => g.status === 'active')
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
      .slice(0, 5);

    if (recentGoals.length === 0) {
      dashboardGoals.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <p>No active goals. Create your first goal!</p>
        </div>
      `;
      return;
    }

    dashboardGoals.innerHTML = recentGoals.map(goal => {
      const daysLeft = this.daysBetween(new Date(), new Date(goal.targetDate));
      const safeName = Sanitizer.escapeHTML(goal.name);
      return `
        <div class="goal-item">
          <h3 style="margin-bottom: 5px;">${safeName}</h3>
          <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
            <span class="category-badge category-${Sanitizer.escapeHTML(goal.category)}">${this.getCategoryLabel(goal.category)}</span>
          </div>
          <div style="font-size: 13px; color: #999;">
            ${Math.max(daysLeft, 0)} days remaining • Due ${Sanitizer.escapeHTML(goal.targetDate)}
          </div>
        </div>
      `;
    }).join('');
  }

  renderGoalsByCategory() {
    const byCategory = document.getElementById('goals-by-category');
    if (!byCategory) return;

    const categoryStats = {};
    this.categories.forEach(cat => {
      const goalsInCategory = this.goals.filter(g => g.category === cat.id);
      categoryStats[cat.id] = {
        total: goalsInCategory.length,
        completed: goalsInCategory.filter(g => g.status === 'completed').length,
        name: cat.name,
        icon: cat.icon
      };
    });

    byCategory.innerHTML = Object.entries(categoryStats)
      .filter(([_, stats]) => stats.total > 0)
      .map(([categoryId, stats]) => `
        <div class="goal-item">
          <h3>${stats.icon} ${stats.name}</h3>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${stats.total > 0 ? (stats.completed / stats.total * 100) : 0}%">
              ${stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0}%
            </div>
          </div>
          <div style="font-size: 13px; color: #666; margin-top: 8px;">
            ${stats.completed} of ${stats.total} completed
          </div>
        </div>
      `).join('');

    if (Object.values(categoryStats).every(s => s.total === 0)) {
      byCategory.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <p>Create goals to see your progress here</p>
        </div>
      `;
    }
  }

  refresh() {
    super.refresh();
    this.goals = this.data;
    this.renderGoals();
  }
}

// Tab switching
function switchTab(tabName) {
  UIUtils.switchTab(tabName, goalsApp, {
    'dashboard': () => goalsApp.updateDashboard(),
    'goals': () => goalsApp.renderGoals()
  });
}

// Initialize app
let goalsApp = UIUtils.initializeApp(GoalsApp, 'goalsApp');
