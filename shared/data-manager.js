/**
 * LifeOS Data Manager
 * Manages cross-app data sharing and coordination
 */

const DataManager = {
  /**
   * Initialize all app data structures
   */
  init() {
    // Initialize Fitness data
    if (!StorageManager.has('fitness-goals')) {
      StorageManager.set('fitness-goals', []);
    }
    if (!StorageManager.has('fitness-activities')) {
      StorageManager.set('fitness-activities', []);
    }
    if (!StorageManager.has('fitness-badges')) {
      StorageManager.set('fitness-badges', this.getDefaultFitnessBadges());
    }

    // Initialize Goals data
    if (!StorageManager.has('goals-all')) {
      StorageManager.set('goals-all', []);
    }

    // Initialize Finance data
    if (!StorageManager.has('finance-expenses')) {
      StorageManager.set('finance-expenses', []);
    }
    if (!StorageManager.has('finance-budgets')) {
      StorageManager.set('finance-budgets', []);
    }
    if (!StorageManager.has('finance-categories')) {
      StorageManager.set('finance-categories', this.getDefaultFinanceCategories());
    }

    // Initialize Journal data
    if (!StorageManager.has('journal-entries')) {
      StorageManager.set('journal-entries', []);
    }

    // Initialize app metadata
    if (!StorageManager.has('app-metadata')) {
      StorageManager.set('app-metadata', {
        lastAccessed: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  },

  /**
   * Get default fitness badges
   * @returns {array} Array of badge objects
   */
  getDefaultFitnessBadges() {
    return [
      { id: 'first-log', name: 'First Step', icon: '👟', earned: false, requirement: 'Log your first activity' },
      { id: 'week-streak', name: 'Week Warrior', icon: '🔥', earned: false, requirement: 'Log activities for 7 days straight' },
      { id: 'first-goal', name: 'Goal Setter', icon: '🎯', earned: false, requirement: 'Create your first goal' },
      { id: 'goal-complete', name: 'Achiever', icon: '⭐', earned: false, requirement: 'Complete your first goal' },
      { id: 'ten-activities', name: 'Dedicated', icon: '💪', earned: false, requirement: 'Log 10 activities' },
      { id: 'fifty-activities', name: 'Committed', icon: '🏆', earned: false, requirement: 'Log 50 activities' },
      { id: 'hundred-pushups', name: 'Push-up Pro', icon: '💥', earned: false, requirement: 'Complete 100 push-ups in one session' },
      { id: 'five-mile', name: 'Distance Runner', icon: '🏃', earned: false, requirement: 'Run 5 miles in one session' },
      { id: 'consistency', name: 'Consistent', icon: '📅', earned: false, requirement: 'Log activities for 30 days' }
    ];
  },

  /**
   * Get default finance categories
   * @returns {array} Array of category objects
   */
  getDefaultFinanceCategories() {
    return [
      { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#f59e0b' },
      { id: 'transport', name: 'Transportation', icon: '🚗', color: '#3b82f6' },
      { id: 'utilities', name: 'Utilities', icon: '💡', color: '#8b5cf6' },
      { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#ec4899' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#06b6d4' },
      { id: 'healthcare', name: 'Healthcare', icon: '⚕️', color: '#10b981' },
      { id: 'education', name: 'Education', icon: '📚', color: '#6366f1' },
      { id: 'other', name: 'Other', icon: '📌', color: '#6b7280' }
    ];
  },

  /**
   * Get all active goals (across all categories)
   * @returns {array} Active goals
   */
  getAllActiveGoals() {
    const fitnessGoals = StorageManager.get('fitness-goals') || [];
    const generalGoals = StorageManager.get('goals-all') || [];

    const active = [
      ...fitnessGoals.map(g => ({ ...g, category: 'fitness' })),
      ...generalGoals.map(g => ({ ...g, category: 'general' }))
    ];

    return active.filter(g => g.status === 'active');
  },

  /**
   * Get dashboard summary stats
   * @returns {object} Summary statistics
   */
  getDashboardStats() {
    const fitnessGoals = StorageManager.get('fitness-goals') || [];
    const fitnessActivities = StorageManager.get('fitness-activities') || [];
    const expenses = StorageManager.get('finance-expenses') || [];
    const journalEntries = StorageManager.get('journal-entries') || [];
    const generalGoals = StorageManager.get('goals-all') || [];

    // Calculate fitness stats
    const fitnessActiveGoals = fitnessGoals.filter(g => g.status === 'active').length;
    const totalActivities = fitnessActivities.length;

    // Calculate finance stats
    const monthlyExpenses = expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        const now = new Date();
        return expenseDate.getMonth() === now.getMonth() &&
               expenseDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // Count stats
    const totalGoals = fitnessGoals.length + generalGoals.length;
    const completedGoals = [...fitnessGoals, ...generalGoals].filter(g => g.status === 'completed').length;
    const totalExpenses = expenses.length;
    const totalJournalEntries = journalEntries.length;

    return {
      fitness: {
        activeGoals: fitnessActiveGoals,
        totalActivities,
        completedGoals: fitnessGoals.filter(g => g.status === 'completed').length
      },
      goals: {
        total: totalGoals,
        completed: completedGoals,
        active: totalGoals - completedGoals
      },
      finance: {
        monthlyExpenses,
        totalExpenses,
        categories: [...new Set(expenses.map(e => e.category))].length
      },
      journal: {
        totalEntries: totalJournalEntries,
        thisMonth: journalEntries.filter(e => {
          const entryDate = new Date(e.date);
          const now = new Date();
          return entryDate.getMonth() === now.getMonth() &&
                 entryDate.getFullYear() === now.getFullYear();
        }).length
      }
    };
  },

  /**
   * Export all app data
   * @returns {object} Complete data snapshot
   */
  exportAllData() {
    return {
      fitness: {
        goals: StorageManager.get('fitness-goals'),
        activities: StorageManager.get('fitness-activities'),
        badges: StorageManager.get('fitness-badges')
      },
      goals: {
        all: StorageManager.get('goals-all')
      },
      finance: {
        expenses: StorageManager.get('finance-expenses'),
        budgets: StorageManager.get('finance-budgets'),
        categories: StorageManager.get('finance-categories')
      },
      journal: {
        entries: StorageManager.get('journal-entries')
      },
      metadata: StorageManager.get('app-metadata')
    };
  },

  /**
   * Import all app data
   * @param {object} data - Data to import
   * @param {boolean} merge - If true, merge with existing
   */
  importAllData(data, merge = false) {
    if (!merge) {
      StorageManager.clearAll();
      this.init();
    }

    if (data.fitness) {
      if (data.fitness.goals) StorageManager.set('fitness-goals', data.fitness.goals);
      if (data.fitness.activities) StorageManager.set('fitness-activities', data.fitness.activities);
      if (data.fitness.badges) StorageManager.set('fitness-badges', data.fitness.badges);
    }

    if (data.goals?.all) StorageManager.set('goals-all', data.goals.all);

    if (data.finance) {
      if (data.finance.expenses) StorageManager.set('finance-expenses', data.finance.expenses);
      if (data.finance.budgets) StorageManager.set('finance-budgets', data.finance.budgets);
      if (data.finance.categories) StorageManager.set('finance-categories', data.finance.categories);
    }

    if (data.journal?.entries) StorageManager.set('journal-entries', data.journal.entries);

    if (data.metadata) StorageManager.set('app-metadata', data.metadata);
  },

  /**
   * Get recentActivity across all apps
   * @param {number} limit - Number of recent items to return
   * @returns {array} Recent activities sorted by date
   */
  getRecentActivity(limit = 10) {
    const activities = [];

    // Fitness activities
    const fitnessActivities = StorageManager.get('fitness-activities') || [];
    activities.push(...fitnessActivities.map(a => ({
      ...a,
      app: 'fitness',
      type: 'activity',
      timestamp: new Date(a.date).getTime()
    })));

    // Journal entries
    const journalEntries = StorageManager.get('journal-entries') || [];
    activities.push(...journalEntries.map(e => ({
      ...e,
      app: 'journal',
      type: 'entry',
      timestamp: new Date(e.date).getTime()
    })));

    // Finance expenses
    const expenses = StorageManager.get('finance-expenses') || [];
    activities.push(...expenses.map(e => ({
      ...e,
      app: 'finance',
      type: 'expense',
      timestamp: new Date(e.date).getTime()
    })));

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },

  /**
   * Get app launch history
   * @returns {array} List of app launches
   */
  getAppLaunchHistory() {
    return StorageManager.get('app-launch-history') || [];
  },

  /**
   * Record app launch
   * @param {string} appName - Name of app
   */
  recordAppLaunch(appName) {
    const history = this.getAppLaunchHistory();
    history.push({
      app: appName,
      timestamp: new Date().toISOString()
    });
    // Keep only last 100 launches
    StorageManager.set('app-launch-history', history.slice(-100));
  }
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DataManager.init());
} else {
  DataManager.init();
}

// Make available globally
window.DataManager = DataManager;
