/**
 * LifeOS Analytics System
 * Cross-app data aggregation and insights
 */

const Analytics = {
  /**
   * Get comprehensive analytics across all apps
   * @returns {object} Complete analytics data
   */
  getComprehensiveAnalytics() {
    return {
      overview: this.getOverviewStats(),
      fitness: this.getFitnessAnalytics(),
      goals: this.getGoalsAnalytics(),
      journal: this.getJournalAnalytics(),
      finance: this.getFinanceAnalytics(),
      correlations: this.getCorrelationAnalytics(),
      trends: this.getTrendAnalytics()
    };
  },

  /**
   * Get high-level overview statistics
   * @returns {object} Overview stats
   */
  getOverviewStats() {
    const fitnessActivities = StorageManager.get('fitness-activities') || [];
    const journalEntries = StorageManager.get('journal-entries') || [];
    const expenses = StorageManager.get('finance-expenses') || [];
    const allGoals = this.getAllGoalsFromApps();

    const today = new Date();
    const thisWeek = this.getWeekRange(today);
    const thisMonth = this.getMonthRange(today);

    return {
      totalActivities: fitnessActivities.length,
      totalJournalEntries: journalEntries.length,
      totalExpenses: expenses.length,
      totalGoals: allGoals.length,
      activeGoals: allGoals.filter(g => g.status === 'active').length,
      completedGoals: allGoals.filter(g => g.status === 'completed').length,
      weeklyActivity: {
        fitness: fitnessActivities.filter(a => this.isInDateRange(a.date, thisWeek.start, thisWeek.end)).length,
        journal: journalEntries.filter(e => this.isInDateRange(e.date, thisWeek.start, thisWeek.end)).length,
        expenses: expenses.filter(e => this.isInDateRange(e.date, thisWeek.start, thisWeek.end)).length
      },
      monthlyActivity: {
        fitness: fitnessActivities.filter(a => this.isInDateRange(a.date, thisMonth.start, thisMonth.end)).length,
        journal: journalEntries.filter(e => this.isInDateRange(e.date, thisMonth.start, thisMonth.end)).length,
        expenses: expenses.filter(e => this.isInDateRange(e.date, thisMonth.start, thisMonth.end)).length
      }
    };
  },

  /**
   * Get fitness-specific analytics
   * @returns {object} Fitness analytics
   */
  getFitnessAnalytics() {
    const activities = StorageManager.get('fitness-activities') || [];
    const goals = StorageManager.get('fitness-goals') || [];
    const badges = StorageManager.get('fitness-badges') || [];

    if (activities.length === 0) {
      return { hasData: false };
    }

    const last30Days = this.getLast30Days();
    const recentActivities = activities.filter(a => 
      this.isInDateRange(a.date, last30Days.start, last30Days.end)
    );

    const activityTypes = this.groupBy(activities, 'type');
    const dailyActivity = this.getDailyActivityCounts(activities);
    const streaks = this.calculateActivityStreaks(activities);

    return {
      hasData: true,
      totalActivities: activities.length,
      recentActivities: recentActivities.length,
      activityTypes: Object.keys(activityTypes).map(type => ({
        type,
        count: activityTypes[type].length,
        percentage: (activityTypes[type].length / activities.length * 100).toFixed(1)
      })),
      streaks,
      dailyActivity,
      goalProgress: goals.map(goal => ({
        ...goal,
        completionRate: goal.target > 0 ? (goal.current / goal.target * 100).toFixed(1) : 0
      })),
      earnedBadges: badges.filter(b => b.earned).length,
      totalBadges: badges.length
    };
  },

  /**
   * Get goals analytics across all apps
   * @returns {object} Goals analytics
   */
  getGoalsAnalytics() {
    const allGoals = this.getAllGoalsFromApps();

    if (allGoals.length === 0) {
      return { hasData: false };
    }

    const completionRates = this.calculateGoalCompletionRates(allGoals);
    const categoryBreakdown = this.groupBy(allGoals, 'category');
    const timeAnalysis = this.analyzeGoalTimelines(allGoals);

    return {
      hasData: true,
      total: allGoals.length,
      active: allGoals.filter(g => g.status === 'active').length,
      completed: allGoals.filter(g => g.status === 'completed').length,
      overdue: allGoals.filter(g => this.isGoalOverdue(g)).length,
      completionRates,
      categoryBreakdown: Object.keys(categoryBreakdown).map(category => ({
        category,
        total: categoryBreakdown[category].length,
        active: categoryBreakdown[category].filter(g => g.status === 'active').length,
        completed: categoryBreakdown[category].filter(g => g.status === 'completed').length
      })),
      timeAnalysis
    };
  },

  /**
   * Get journal analytics
   * @returns {object} Journal analytics
   */
  getJournalAnalytics() {
    const entries = StorageManager.get('journal-entries') || [];

    if (entries.length === 0) {
      return { hasData: false };
    }

    const moodAnalysis = this.analyzeMoods(entries);
    const writingPatterns = this.analyzeWritingPatterns(entries);
    const streaks = this.calculateJournalStreaks(entries);

    return {
      hasData: true,
      totalEntries: entries.length,
      averageWordCount: this.calculateAverageWordCount(entries),
      moodAnalysis,
      writingPatterns,
      streaks,
      tagsAnalysis: this.analyzeJournalTags(entries)
    };
  },

  /**
   * Get finance analytics
   * @returns {object} Finance analytics
   */
  getFinanceAnalytics() {
    const expenses = StorageManager.get('finance-expenses') || [];
    const budgets = StorageManager.get('finance-budgets') || [];

    if (expenses.length === 0) {
      return { hasData: false };
    }

    const monthlySpending = this.getMonthlySpendingTrends(expenses);
    const categoryBreakdown = this.getCategorySpendingBreakdown(expenses);
    const budgetAnalysis = this.analyzeBudgetPerformance(expenses, budgets);

    return {
      hasData: true,
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      monthlySpending,
      categoryBreakdown,
      budgetAnalysis,
      averageDaily: this.calculateAverageDaily(expenses)
    };
  },

  /**
   * Get correlation analytics between apps
   * @returns {object} Correlation insights
   */
  getCorrelationAnalytics() {
    const activities = StorageManager.get('fitness-activities') || [];
    const journalEntries = StorageManager.get('journal-entries') || [];
    const expenses = StorageManager.get('finance-expenses') || [];

    return {
      fitnessJournalCorrelation: this.correlateFitnessAndMood(activities, journalEntries),
      productivityPatterns: this.analyzeProductivityPatterns(activities, journalEntries),
      spendingMoodCorrelation: this.correlateSpendingAndMood(expenses, journalEntries)
    };
  },

  /**
   * Get trend analytics
   * @returns {object} Trend data
   */
  getTrendAnalytics() {
    const timeframes = ['week', 'month', '3months', '6months'];
    const trends = {};

    timeframes.forEach(timeframe => {
      trends[timeframe] = this.getTimeframeTrends(timeframe);
    });

    return trends;
  },

  // Helper methods
  getAllGoalsFromApps() {
    const fitnessGoals = (StorageManager.get('fitness-goals') || []).map(g => ({ ...g, category: 'fitness' }));
    const generalGoals = (StorageManager.get('goals-all') || []).map(g => ({ ...g, category: g.category || 'general' }));
    return [...fitnessGoals, ...generalGoals];
  },

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key] || 'unknown';
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  isInDateRange(dateStr, start, end) {
    const date = new Date(dateStr);
    return date >= start && date <= end;
  },

  getWeekRange(date) {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  },

  getMonthRange(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  },

  getLast30Days() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start, end };
  },

  calculateActivityStreaks(activities) {
    if (activities.length === 0) return { current: 0, longest: 0 };

    const sortedDates = [...new Set(activities.map(a => a.date.split('T')[0]))].sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak
    if (sortedDates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (sortedDates.includes(today) || sortedDates.includes(yesterdayStr)) {
        let i = sortedDates.length - 1;
        currentStreak = 1;
        
        while (i > 0) {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
          
          if (dayDiff === 1) {
            currentStreak++;
            i--;
          } else {
            break;
          }
        }
      }
    }

    return { current: currentStreak, longest: longestStreak };
  },

  getDailyActivityCounts(activities) {
    const dailyCounts = {};
    activities.forEach(activity => {
      const date = activity.date.split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return dailyCounts;
  },

  calculateGoalCompletionRates(goals) {
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const active = goals.filter(g => g.status === 'active').length;
    
    return {
      overall: total > 0 ? (completed / total * 100).toFixed(1) : 0,
      completed,
      active,
      total
    };
  },

  isGoalOverdue(goal) {
    if (!goal.targetDate) return false;
    const target = new Date(goal.targetDate);
    const today = new Date();
    return target < today && goal.status === 'active';
  },

  analyzeGoalTimelines(goals) {
    const withDates = goals.filter(g => g.targetDate);
    const overdue = withDates.filter(g => this.isGoalOverdue(g));
    const upcoming = withDates.filter(g => {
      const target = new Date(g.targetDate);
      const today = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);
      return target >= today && target <= weekFromNow && g.status === 'active';
    });

    return {
      totalWithDates: withDates.length,
      overdue: overdue.length,
      upcomingThisWeek: upcoming.length
    };
  },

  analyzeMoods(entries) {
    const moodsWithEntries = entries.filter(e => e.mood);
    if (moodsWithEntries.length === 0) return { hasData: false };

    const moodCounts = this.groupBy(moodsWithEntries, 'mood');
    const averageMood = this.calculateAverageMood(moodsWithEntries);

    return {
      hasData: true,
      distribution: Object.keys(moodCounts).map(mood => ({
        mood,
        count: moodCounts[mood].length,
        percentage: (moodCounts[mood].length / moodsWithEntries.length * 100).toFixed(1)
      })),
      averageMood,
      totalWithMood: moodsWithEntries.length
    };
  },

  calculateAverageMood(entries) {
    const moodValues = { '😢': 1, '😕': 2, '😐': 3, '😊': 4, '😄': 5 };
    const total = entries.reduce((sum, entry) => sum + (moodValues[entry.mood] || 3), 0);
    return (total / entries.length).toFixed(1);
  },

  analyzeWritingPatterns(entries) {
    const wordCounts = entries.map(e => (e.content || '').split(/\s+/).length);
    const avgWords = wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length;
    
    const timePatterns = this.groupBy(entries, e => {
      const hour = new Date(e.date).getHours();
      if (hour < 6) return 'night';
      if (hour < 12) return 'morning';
      if (hour < 18) return 'afternoon';
      return 'evening';
    });

    return {
      averageWordCount: Math.round(avgWords),
      timeOfDayPreference: Object.keys(timePatterns).map(time => ({
        time,
        count: timePatterns[time].length,
        percentage: (timePatterns[time].length / entries.length * 100).toFixed(1)
      }))
    };
  },

  calculateJournalStreaks(entries) {
    const dates = [...new Set(entries.map(e => e.date.split('T')[0]))].sort();
    return this.calculateActivityStreaks(entries.map(e => ({ date: e.date })));
  },

  analyzeJournalTags(entries) {
    const allTags = [];
    entries.forEach(entry => {
      if (entry.tags && Array.isArray(entry.tags)) {
        allTags.push(...entry.tags);
      }
    });

    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    return Object.keys(tagCounts)
      .map(tag => ({ tag, count: tagCounts[tag] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  calculateAverageWordCount(entries) {
    const wordCounts = entries.map(e => (e.content || '').split(/\s+/).filter(word => word.length > 0).length);
    return Math.round(wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length);
  },

  getMonthlySpendingTrends(expenses) {
    const monthlyTotals = {};
    expenses.forEach(expense => {
      const month = expense.date.substring(0, 7); // YYYY-MM
      monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount;
    });

    return Object.keys(monthlyTotals)
      .sort()
      .map(month => ({
        month,
        amount: monthlyTotals[month],
        count: expenses.filter(e => e.date.startsWith(month)).length
      }));
  },

  getCategorySpendingBreakdown(expenses) {
    const categoryTotals = {};
    expenses.forEach(expense => {
      const category = expense.category || 'other';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });

    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    return Object.keys(categoryTotals).map(category => ({
      category,
      amount: categoryTotals[category],
      percentage: total > 0 ? (categoryTotals[category] / total * 100).toFixed(1) : 0,
      count: expenses.filter(e => (e.category || 'other') === category).length
    }));
  },

  analyzeBudgetPerformance(expenses, budgets) {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));

    return budgets.map(budget => {
      const spent = monthlyExpenses
        .filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        category: budget.category,
        budget: budget.amount,
        spent,
        remaining: budget.amount - spent,
        percentage: budget.amount > 0 ? (spent / budget.amount * 100).toFixed(1) : 0,
        status: spent > budget.amount ? 'over' : spent > budget.amount * 0.8 ? 'warning' : 'good'
      };
    });
  },

  calculateAverageDaily(expenses) {
    if (expenses.length === 0) return 0;
    
    const dates = [...new Set(expenses.map(e => e.date.split('T')[0]))];
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    return (total / dates.length).toFixed(2);
  },

  correlateFitnessAndMood(activities, entries) {
    // Find days with both fitness activities and journal entries
    const activityDates = activities.map(a => a.date.split('T')[0]);
    const entryDates = entries.filter(e => e.mood).map(e => e.date.split('T')[0]);
    
    const commonDates = activityDates.filter(date => entryDates.includes(date));
    
    if (commonDates.length < 5) {
      return { hasData: false, message: 'Insufficient data for correlation analysis' };
    }

    const moodValues = { '😢': 1, '😕': 2, '😐': 3, '😊': 4, '😄': 5 };
    let correlationData = [];

    commonDates.forEach(date => {
      const dayActivities = activities.filter(a => a.date.startsWith(date)).length;
      const dayEntry = entries.find(e => e.date.startsWith(date) && e.mood);
      
      if (dayEntry) {
        correlationData.push({
          date,
          activities: dayActivities,
          mood: moodValues[dayEntry.mood]
        });
      }
    });

    return {
      hasData: true,
      correlation: this.calculateCorrelation(correlationData),
      dataPoints: correlationData.length
    };
  },

  calculateCorrelation(data) {
    if (data.length < 2) return 0;

    const activities = data.map(d => d.activities);
    const moods = data.map(d => d.mood);

    const meanActivities = activities.reduce((sum, val) => sum + val, 0) / activities.length;
    const meanMoods = moods.reduce((sum, val) => sum + val, 0) / moods.length;

    let numerator = 0;
    let denominatorA = 0;
    let denominatorB = 0;

    for (let i = 0; i < data.length; i++) {
      const diffA = activities[i] - meanActivities;
      const diffB = moods[i] - meanMoods;
      
      numerator += diffA * diffB;
      denominatorA += diffA * diffA;
      denominatorB += diffB * diffB;
    }

    const denominator = Math.sqrt(denominatorA * denominatorB);
    return denominator === 0 ? 0 : numerator / denominator;
  },

  analyzeProductivityPatterns(activities, entries) {
    // Analyze when people are most productive (when they exercise AND journal)
    const productiveDays = {};
    
    activities.forEach(activity => {
      const date = activity.date.split('T')[0];
      productiveDays[date] = productiveDays[date] || { fitness: false, journal: false };
      productiveDays[date].fitness = true;
    });

    entries.forEach(entry => {
      const date = entry.date.split('T')[0];
      if (productiveDays[date]) {
        productiveDays[date].journal = true;
      }
    });

    const fullyProductiveDays = Object.keys(productiveDays)
      .filter(date => productiveDays[date].fitness && productiveDays[date].journal);

    const dayOfWeekPatterns = {};
    fullyProductiveDays.forEach(date => {
      const dayOfWeek = new Date(date).getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      dayOfWeekPatterns[dayName] = (dayOfWeekPatterns[dayName] || 0) + 1;
    });

    return {
      totalProductiveDays: fullyProductiveDays.length,
      dayOfWeekPatterns,
      mostProductiveDay: Object.keys(dayOfWeekPatterns).reduce((a, b) => 
        dayOfWeekPatterns[a] > dayOfWeekPatterns[b] ? a : b, 'Monday')
    };
  },

  correlateSpendingAndMood(expenses, entries) {
    // Simple analysis of spending patterns vs mood
    const dailySpending = {};
    expenses.forEach(expense => {
      const date = expense.date.split('T')[0];
      dailySpending[date] = (dailySpending[date] || 0) + expense.amount;
    });

    const moodValues = { '😢': 1, '😕': 2, '😐': 3, '😊': 4, '😄': 5 };
    const correlationData = [];

    entries.filter(e => e.mood).forEach(entry => {
      const date = entry.date.split('T')[0];
      if (dailySpending[date]) {
        correlationData.push({
          date,
          spending: dailySpending[date],
          mood: moodValues[entry.mood]
        });
      }
    });

    if (correlationData.length < 5) {
      return { hasData: false, message: 'Insufficient data for spending-mood correlation' };
    }

    return {
      hasData: true,
      correlation: this.calculateCorrelation(correlationData.map(d => ({ activities: d.spending, mood: d.mood }))),
      dataPoints: correlationData.length,
      averageSpendingByMood: this.groupSpendingByMood(correlationData)
    };
  },

  groupSpendingByMood(data) {
    const moodEmojis = { 1: '😢', 2: '😕', 3: '😐', 4: '😊', 5: '😄' };
    const moodSpending = {};

    data.forEach(d => {
      const moodEmoji = moodEmojis[d.mood];
      moodSpending[moodEmoji] = moodSpending[moodEmoji] || [];
      moodSpending[moodEmoji].push(d.spending);
    });

    return Object.keys(moodSpending).map(mood => ({
      mood,
      averageSpending: (moodSpending[mood].reduce((sum, val) => sum + val, 0) / moodSpending[mood].length).toFixed(2),
      count: moodSpending[mood].length
    }));
  },

  getTimeframeTrends(timeframe) {
    const range = this.getTimeframeRange(timeframe);
    const activities = StorageManager.get('fitness-activities') || [];
    const entries = StorageManager.get('journal-entries') || [];
    const expenses = StorageManager.get('finance-expenses') || [];

    const filteredActivities = activities.filter(a => this.isInDateRange(a.date, range.start, range.end));
    const filteredEntries = entries.filter(e => this.isInDateRange(e.date, range.start, range.end));
    const filteredExpenses = expenses.filter(e => this.isInDateRange(e.date, range.start, range.end));

    return {
      fitness: {
        total: filteredActivities.length,
        types: this.groupBy(filteredActivities, 'type')
      },
      journal: {
        total: filteredEntries.length,
        averageMood: this.calculateAverageMood(filteredEntries.filter(e => e.mood))
      },
      finance: {
        total: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: filteredExpenses.length
      }
    };
  },

  getTimeframeRange(timeframe) {
    const end = new Date();
    const start = new Date();

    switch (timeframe) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case '3months':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6months':
        start.setMonth(end.getMonth() - 6);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return { start, end };
  }
};