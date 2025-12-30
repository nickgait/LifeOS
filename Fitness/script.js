/**
 * LifeOS Fitness Tracker
 * Modularized fitness tracking app with shared storage
 */

class FitnessTracker {
  constructor() {
    this.goals = StorageManager.get('fitness-goals') || [];
    this.activities = StorageManager.get('fitness-activities') || [];
    this.badges = StorageManager.get('fitness-badges') || DataManager.getDefaultFitnessBadges();

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setDefaultDates();
    this.updateDashboard();

    // Listen for data changes
    StorageManager.onChange('fitness-*', () => {
      this.refresh();
    });
  }

  setupEventListeners() {
    const goalForm = document.getElementById('goal-form');
    const activityForm = document.getElementById('activity-form');

    if (goalForm) {
      goalForm.addEventListener('submit', (e) => this.handleGoalSubmit(e));
    }

    if (activityForm) {
      activityForm.addEventListener('submit', (e) => this.handleActivitySubmit(e));
    }
  }

  setDefaultDates() {
    const activityDate = document.getElementById('activity-date');
    const goalDate = document.getElementById('goal-date');

    if (activityDate) {
      activityDate.value = new Date().toISOString().split('T')[0];
    }

    if (goalDate) {
      goalDate.value = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  }


  handleGoalSubmit(e) {
    e.preventDefault();

    const goal = {
      id: Date.now(),
      name: document.getElementById('goal-name').value,
      activity: document.getElementById('goal-activity').value,
      target: parseFloat(document.getElementById('goal-target').value),
      current: 0,
      targetDate: document.getElementById('goal-date').value,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    this.goals.push(goal);
    StorageManager.set('fitness-goals', this.goals);

    this.checkBadge('first-goal');

    e.target.reset();
    this.setDefaultDates();
    alert('Goal created successfully!');
    this.renderGoals();
    this.updateDashboard();
  }

  handleActivitySubmit(e) {
    e.preventDefault();

    const activity = {
      id: Date.now(),
      type: document.getElementById('activity-type').value,
      amount: parseFloat(document.getElementById('activity-amount').value),
      date: document.getElementById('activity-date').value,
      notes: document.getElementById('activity-notes').value
    };

    this.activities.push(activity);
    StorageManager.set('fitness-activities', this.activities);

    this.updateGoalProgress(activity.type, activity.amount);

    this.checkBadge('first-log');
    this.checkBadge('ten-activities');
    this.checkBadge('fifty-activities');
    this.checkActivityBadges(activity);
    this.checkStreakBadge();

    e.target.reset();
    this.setDefaultDates();
    alert('Activity logged successfully!');
    this.renderActivityHistory();
    this.updateDashboard();
  }

  updateGoalProgress(activityType, amount) {
    let updated = false;
    this.goals = this.goals.map(goal => {
      if (goal.activity === activityType && goal.status === 'active') {
        goal.current += amount;
        if (goal.current >= goal.target) {
          goal.status = 'completed';
          goal.completedDate = new Date().toISOString().split('T')[0];
          this.checkBadge('goal-complete');
        }
        updated = true;
      }
      return goal;
    });

    if (updated) {
      StorageManager.set('fitness-goals', this.goals);
    }
  }

  checkActivityBadges(activity) {
    if (activity.type === 'pushups' && activity.amount >= 100) {
      this.checkBadge('hundred-pushups');
    }
    if (activity.type === 'jog' && activity.amount >= 5) {
      this.checkBadge('five-mile');
    }
  }

  checkStreakBadge() {
    const sortedActivities = this.activities
      .map(a => a.date)
      .sort()
      .filter((date, index, arr) => arr.indexOf(date) === index);

    let streak = 1;
    for (let i = 1; i < sortedActivities.length; i++) {
      const date1 = new Date(sortedActivities[i - 1]);
      const date2 = new Date(sortedActivities[i]);
      const diffDays = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else if (diffDays > 1) {
        streak = 1;
      }
    }

    if (streak >= 7) this.checkBadge('week-streak');
    if (sortedActivities.length >= 30) this.checkBadge('consistency');
  }

  checkBadge(badgeId) {
    const badge = this.badges.find(b => b.id === badgeId);
    if (badge && !badge.earned) {
      let shouldEarn = false;

      if (badgeId === 'first-log' && this.activities.length >= 1) {
        shouldEarn = true;
      } else if (badgeId === 'first-goal' && this.goals.length >= 1) {
        shouldEarn = true;
      } else if (badgeId === 'goal-complete' && this.goals.some(g => g.status === 'completed')) {
        shouldEarn = true;
      } else if (badgeId === 'ten-activities' && this.activities.length >= 10) {
        shouldEarn = true;
      } else if (badgeId === 'fifty-activities' && this.activities.length >= 50) {
        shouldEarn = true;
      } else if (badgeId === 'hundred-pushups' || badgeId === 'five-mile') {
        shouldEarn = true;
      } else if (badgeId === 'week-streak' || badgeId === 'consistency') {
        shouldEarn = true;
      }

      if (shouldEarn) {
        badge.earned = true;
        this.showBadgeNotification(badge);
        StorageManager.set('fitness-badges', this.badges);
      }
    }
  }

  showBadgeNotification(badge) {
    alert(`🎉 Badge Earned: ${badge.icon} ${badge.name}!\n${badge.requirement}`);
  }

  renderGoals() {
    const goalsList = document.getElementById('goals-list');

    if (!goalsList) return;

    if (this.goals.length === 0) {
      goalsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <p>No goals yet. Create your first goal to get started!</p>
        </div>
      `;
      return;
    }

    goalsList.innerHTML = this.goals.map(goal => {
      const progress = (goal.current / goal.target * 100).toFixed(1);
      const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
      const daysTotal = Math.ceil((new Date(goal.targetDate) - new Date(goal.createdDate)) / (1000 * 60 * 60 * 24));
      const expectedProgress = ((daysTotal - daysLeft) / daysTotal * 100).toFixed(1);

      let status = 'on-pace';
      let statusText = 'On Pace';

      if (goal.status === 'completed') {
        status = 'ahead';
        statusText = 'Completed!';
      } else if (progress < expectedProgress) {
        status = 'behind';
        statusText = 'Behind Pace';
      } else if (progress > expectedProgress) {
        status = 'ahead';
        statusText = 'Ahead of Pace';
      }

      return `
        <div class="goal-item">
          <h3>${goal.name}</h3>
          <div class="goal-details">
            ${this.getActivityLabel(goal.activity)} • Target: ${goal.target} • Due: ${goal.targetDate}
            ${goal.status === 'active' ? `<br>Days remaining: ${daysLeft}` : ''}
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${Math.min(progress, 100)}%">
              ${progress}%
            </div>
          </div>
          <div>
            Current: ${goal.current.toFixed(1)} / ${goal.target}
            <span class="status-badge status-${status}">${statusText}</span>
          </div>
          ${goal.status === 'active' ? `
            <div class="goal-actions">
              <button class="fitness-btn fitness-btn-small fitness-btn-danger" onclick="fitnessApp.deleteGoal(${goal.id})">Delete Goal</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
      this.goals = this.goals.filter(g => g.id !== goalId);
      StorageManager.set('fitness-goals', this.goals);
      this.renderGoals();
      this.updateDashboard();
    }
  }

  renderActivityHistory() {
    const historyDiv = document.getElementById('activity-history');

    if (!historyDiv) return;

    if (this.activities.length === 0) {
      historyDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p>No activities logged yet. Start logging your workouts!</p>
        </div>
      `;
      return;
    }

    const sortedActivities = [...this.activities].sort((a, b) => new Date(b.date) - new Date(a.date));

    historyDiv.innerHTML = sortedActivities.map(activity => `
      <div class="log-entry">
        <div class="log-info">
          <div class="log-activity">${this.getActivityLabel(activity.type)}</div>
          <div class="log-date">${activity.date}</div>
          ${activity.notes ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${activity.notes}</div>` : ''}
        </div>
        <div class="log-amount">${activity.amount} ${this.getActivityUnit(activity.type)}</div>
      </div>
    `).join('');
  }

  renderAllBadges() {
    const badgesDiv = document.getElementById('all-badges');

    if (!badgesDiv) return;

    badgesDiv.innerHTML = this.badges.map(badge => `
      <div class="badge ${badge.earned ? 'earned' : 'locked'}">
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
        <div style="font-size: 10px; color: #666; margin-top: 5px;">${badge.requirement}</div>
      </div>
    `).join('');
  }

  updateDashboard() {
    document.getElementById('active-goals-count').textContent = this.goals.filter(g => g.status === 'active').length;
    document.getElementById('total-activities-count').textContent = this.activities.length;
    document.getElementById('badges-earned-count').textContent = this.badges.filter(b => b.earned).length;

    this.renderDashboardGoals();
    this.renderDashboardActivities();
    this.renderDashboardBadges();
  }

  renderDashboardGoals() {
    const activeGoalsList = document.getElementById('active-goals-list');
    if (!activeGoalsList) return;

    const activeGoals = this.goals.filter(g => g.status === 'active').slice(0, 3);

    if (activeGoals.length === 0) {
      activeGoalsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <p>No active goals. Create a goal to start tracking!</p>
        </div>
      `;
      return;
    }

    activeGoalsList.innerHTML = activeGoals.map(goal => {
      const progress = (goal.current / goal.target * 100).toFixed(1);
      const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));

      return `
        <div class="goal-item">
          <h3>${goal.name}</h3>
          <div class="goal-details">
            ${this.getActivityLabel(goal.activity)} • ${daysLeft} days left
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${Math.min(progress, 100)}%">
              ${progress}%
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderDashboardActivities() {
    const recentList = document.getElementById('recent-activity-list');
    if (!recentList) return;

    const recentActivities = [...this.activities].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (recentActivities.length === 0) {
      recentList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p>No activities yet. Log your first workout!</p>
        </div>
      `;
      return;
    }

    recentList.innerHTML = recentActivities.map(activity => `
      <div class="log-entry">
        <div class="log-info">
          <div class="log-activity">${this.getActivityLabel(activity.type)}</div>
          <div class="log-date">${activity.date}</div>
        </div>
        <div class="log-amount">${activity.amount} ${this.getActivityUnit(activity.type)}</div>
      </div>
    `).join('');
  }

  renderDashboardBadges() {
    const dashboardBadges = document.getElementById('dashboard-badges');
    if (!dashboardBadges) return;

    const earnedBadges = this.badges.filter(b => b.earned).slice(-4);

    if (earnedBadges.length === 0) {
      dashboardBadges.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-state-icon">🏅</div>
          <p>No badges earned yet. Keep working out!</p>
        </div>
      `;
      return;
    }

    dashboardBadges.innerHTML = earnedBadges.map(badge => `
      <div class="badge earned">
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
      </div>
    `).join('');
  }

  getActivityLabel(type) {
    const labels = {
      'pushups': 'Push-ups',
      'planks': 'Planks',
      'crunches': 'Crunches',
      'bike': 'Stationary Bike',
      'jog': 'Jogging',
      'walk': 'Walking',
      'weights': 'Weight Lifting'
    };
    return labels[type] || type;
  }

  getActivityUnit(type) {
    const units = {
      'pushups': 'reps',
      'planks': 'sec',
      'crunches': 'reps',
      'bike': 'min',
      'jog': 'mi',
      'walk': 'mi',
      'weights': 'lbs'
    };
    return units[type] || '';
  }

  refresh() {
    this.goals = StorageManager.get('fitness-goals') || [];
    this.activities = StorageManager.get('fitness-activities') || [];
    this.badges = StorageManager.get('fitness-badges') || DataManager.getDefaultFitnessBadges();
    this.updateDashboard();
  }
}

// Tab switching
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));

  const tab = document.getElementById(`${tabName}-tab`);
  if (tab) {
    tab.classList.add('active');
  }

  event.target.classList.add('active');

  if (tabName === 'dashboard') fitnessApp.updateDashboard();
  if (tabName === 'goals') fitnessApp.renderGoals();
  if (tabName === 'log') fitnessApp.renderActivityHistory();
  if (tabName === 'badges') fitnessApp.renderAllBadges();
}

// Initialize app
let fitnessApp;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    fitnessApp = new FitnessTracker();
  });
} else {
  fitnessApp = new FitnessTracker();
}
