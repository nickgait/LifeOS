/**
 * LifeOS Fitness Tracker
 * Modularized fitness tracking app with shared storage
 */

class FitnessTracker extends BaseApp {
  // This app owns all fitness goals - Goals app no longer includes fitness
  constructor() {
    super('fitness-goals');

    this.goals = this.data;
    this.activities = StorageManager.get('fitness-activities') || [];
    this.badges = StorageManager.get('fitness-badges') || DataManager.getDefaultFitnessBadges();
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

  handleGoalSubmit(e) {
    e.preventDefault();

    const goal = this.createItem({
      name: document.getElementById('goal-name').value,
      activity: document.getElementById('goal-activity').value,
      target: parseFloat(document.getElementById('goal-target').value),
      current: 0,
      targetDate: document.getElementById('goal-date').value,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });

    this.goals.push(goal);
    this.save();

    this.checkBadge('first-goal');

    e.target.reset();
    this.setupDefaultDates();
    alert('Goal created successfully!');
    this.renderGoals();
    this.updateDashboard();
  }

  handleActivitySubmit(e) {
    e.preventDefault();

    // Extract and validate activity data
    const rawActivityData = {
      type: document.getElementById('activity-type').value,
      amount: parseFloat(document.getElementById('activity-amount').value),
      date: document.getElementById('activity-date').value,
      notes: document.getElementById('activity-notes').value
    };

    // Validate the activity data using predefined schema
    const validation = Validator.activitySchema.safeParse(rawActivityData);
    if (!validation.success) {
      const errorMessages = validation.errors.map(err => err.message).join('\n');
      alert('Validation Error:\n' + errorMessages);
      return;
    }

    // Create activity with validated data
    const activity = this.createItem(validation.data);

    this.activities.push(activity);
    StorageManager.set('fitness-activities', this.activities);

    this.updateGoalProgress(activity.type, activity.amount);

    this.checkBadge('first-log');
    this.checkBadge('ten-activities');
    this.checkBadge('fifty-activities');
    this.checkActivityBadges(activity);
    this.checkStreakBadge();

    e.target.reset();
    this.setupDefaultDates();
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
      this.save();
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
      } else {
        streak = 1;
      }

      if (streak >= 7) {
        this.checkBadge('week-streak');
      }
      if (streak >= 30) {
        this.checkBadge('consistency');
      }
    }
  }

  checkBadge(badgeId) {
    const badge = this.badges.find(b => b.id === badgeId);
    if (badge && !badge.earned) {
      badge.earned = true;
      badge.earnedDate = new Date().toISOString().split('T')[0];
      StorageManager.set('fitness-badges', this.badges);
    }
  }

  deleteGoal(goalId) {
    if (confirm('Delete this goal?')) {
      this.deleteById(goalId);
      this.renderGoals();
      this.updateDashboard();
    }
  }

  deleteActivity(activityId) {
    if (confirm('Delete this activity?')) {
      this.activities = this.activities.filter(a => a.id !== activityId);
      StorageManager.set('fitness-activities', this.activities);
      this.renderActivityHistory();
      this.updateDashboard();
    }
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
      'planks': 'seconds',
      'crunches': 'reps',
      'bike': 'minutes',
      'jog': 'miles',
      'walk': 'miles',
      'weights': 'minutes'
    };
    return units[type] || '';
  }

  renderGoals() {
    const goalsList = document.getElementById('goals-list');
    if (!goalsList) return;

    if (this.goals.length === 0) {
      goalsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <p>No fitness goals yet. Create your first goal!</p>
        </div>
      `;
      return;
    }

    goalsList.innerHTML = this.goals
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
      .map(goal => {
        const progress = goal.target > 0 ? (goal.current / goal.target * 100) : 0;
        const daysLeft = this.daysBetween(new Date(), new Date(goal.targetDate));
        const safeName = Sanitizer.escapeHTML(goal.name);

        return `
          <div class="fitness-goal-item">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
              <div>
                <h3 style="margin-bottom: 5px;">${safeName}</h3>
                <div style="font-size: 13px; color: #666;">
                  ${this.getActivityLabel(goal.activity)} • Target: ${goal.target} ${this.getActivityUnit(goal.activity)}
                </div>
              </div>
              <span class="status-badge ${goal.status === 'active' ? 'status-active' : 'status-completed'}">
                ${goal.status === 'active' ? 'Active' : 'Completed'}
              </span>
            </div>

            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${Math.min(progress, 100)}%">
                ${progress.toFixed(1)}%
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 13px; color: #666;">
              <span>${goal.current} / ${goal.target} ${this.getActivityUnit(goal.activity)}</span>
              <span>${goal.status === 'active' ? `${Math.max(daysLeft, 0)} days left` : `Completed ${Sanitizer.escapeHTML(goal.completedDate)}`}</span>
            </div>

            <button class="fitness-btn fitness-btn-small fitness-btn-danger" style="margin-top: 10px;" onclick="fitnessApp.deleteGoal(${goal.id})">Delete</button>
          </div>
        `;
      }).join('');
  }

  renderActivityHistory() {
    const historyList = document.getElementById('activity-history');
    if (!historyList) return;

    if (this.activities.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p>No activities logged yet. Log your first activity!</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = this.activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20)
      .map(activity => {
        const safeNotes = Sanitizer.escapeHTML(activity.notes);
        return `
        <div class="activity-item">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; color: #333; margin-bottom: 3px;">
                ${this.getActivityLabel(activity.type)}
              </div>
              <div style="font-size: 13px; color: #666;">
                ${activity.amount} ${this.getActivityUnit(activity.type)}
                ${activity.notes ? ` • ${safeNotes}` : ''}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; color: #999; margin-bottom: 5px;">
                ${this.formatDate(activity.date)}
              </div>
              <button class="fitness-btn fitness-btn-small fitness-btn-danger" onclick="fitnessApp.deleteActivity(${activity.id})">Delete</button>
            </div>
          </div>
        </div>
      `;
      }).join('');
  }

  renderAllBadges() {
    const badgesList = document.getElementById('all-badges');
    if (!badgesList) return;

    const earnedBadges = this.badges.filter(b => b.earned);
    const unearnedBadges = this.badges.filter(b => !b.earned);

    badgesList.innerHTML = `
      ${earnedBadges.length > 0 ? `
        <h3 style="margin-bottom: 15px;">Earned Badges (${earnedBadges.length}/${this.badges.length})</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
          ${earnedBadges.map(badge => `
            <div class="badge-card earned">
              <div class="badge-icon">${Sanitizer.escapeHTML(badge.icon)}</div>
              <div class="badge-name">${Sanitizer.escapeHTML(badge.name)}</div>
              <div class="badge-requirement">${Sanitizer.escapeHTML(badge.requirement)}</div>
              <div style="font-size: 11px; color: #10b981; margin-top: 5px;">
                Earned ${this.formatDate(badge.earnedDate)}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${unearnedBadges.length > 0 ? `
        <h3 style="margin-bottom: 15px; color: #999;">Locked Badges</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
          ${unearnedBadges.map(badge => `
            <div class="badge-card">
              <div class="badge-icon" style="opacity: 0.3;">${Sanitizer.escapeHTML(badge.icon)}</div>
              <div class="badge-name" style="color: #999;">${Sanitizer.escapeHTML(badge.name)}</div>
              <div class="badge-requirement">${Sanitizer.escapeHTML(badge.requirement)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  updateDashboard() {
    const activeGoals = this.goals.filter(g => g.status === 'active').length;
    const completedGoals = this.goals.filter(g => g.status === 'completed').length;
    const totalActivities = this.activities.length;
    const earnedBadges = this.badges.filter(b => b.earned).length;

    document.getElementById('active-goals-count').textContent = activeGoals;
    document.getElementById('completed-goals-count').textContent = completedGoals;
    document.getElementById('total-activities-count').textContent = totalActivities;
    document.getElementById('earned-badges-count').textContent = `${earnedBadges}/${this.badges.length}`;

    this.renderRecentActivities();
    this.renderEarnedBadges();
  }

  renderRecentActivities() {
    const recentDiv = document.getElementById('recent-activities');
    if (!recentDiv) return;

    const recent = this.activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recent.length === 0) {
      recentDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏃</div>
          <p>No activities yet. Start logging!</p>
        </div>
      `;
      return;
    }

    recentDiv.innerHTML = recent.map(activity => `
      <div class="activity-item" style="margin-bottom: 10px;">
        <div style="font-weight: 500; color: #333;">${this.getActivityLabel(activity.type)}</div>
        <div style="font-size: 13px; color: #666;">
          ${activity.amount} ${this.getActivityUnit(activity.type)} • ${this.formatDate(activity.date)}
        </div>
      </div>
    `).join('');
  }

  renderEarnedBadges() {
    const badgesDiv = document.getElementById('earned-badges-display');
    if (!badgesDiv) return;

    const earned = this.badges.filter(b => b.earned);

    if (earned.length === 0) {
      badgesDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏆</div>
          <p>No badges earned yet. Keep working out!</p>
        </div>
      `;
      return;
    }

    badgesDiv.innerHTML = earned.map(badge => `
      <div class="badge-card earned" style="text-align: center;">
        <div style="font-size: 40px; margin-bottom: 5px;">${Sanitizer.escapeHTML(badge.icon)}</div>
        <div style="font-weight: 600; color: #333; font-size: 14px;">${Sanitizer.escapeHTML(badge.name)}</div>
      </div>
    `).join('');
  }

  refresh() {
    super.refresh();
    this.goals = this.data;
    this.activities = StorageManager.get('fitness-activities') || [];
    this.badges = StorageManager.get('fitness-badges') || DataManager.getDefaultFitnessBadges();
    this.updateDashboard();
  }
}

// Tab switching
function switchTab(tabName) {
  UIUtils.switchTab(tabName, fitnessApp, {
    'dashboard': () => fitnessApp.updateDashboard(),
    'goals': () => fitnessApp.renderGoals(),
    'log': () => fitnessApp.renderActivityHistory(),
    'badges': () => fitnessApp.renderAllBadges()
  });
}

// Initialize app
let fitnessApp = UIUtils.initializeApp(FitnessTracker, 'fitnessApp');
