/**
 * LifeOS Dashboard Widgets
 * Display key metrics from each module on the main dashboard
 */

class DashboardWidgets {
    constructor() {
        this.widgets = new Map();
        this.refreshInterval = null;
    }

    /**
     * Initialize dashboard widgets
     */
    init() {
        this.setupWidgets();
        this.startAutoRefresh();
    }

    /**
     * Setup all module widgets
     */
    setupWidgets() {
        // Register all module widgets
        this.widgets.set('todo', {
            title: 'Tasks',
            icon: '✓',
            getData: this.getTodoData.bind(this),
            color: '#667eea'
        });

        this.widgets.set('habits', {
            title: 'Habits',
            icon: '🔄',
            getData: this.getHabitsData.bind(this),
            color: '#52c41a'
        });

        this.widgets.set('goals', {
            title: 'Goals',
            icon: '🎯',
            getData: this.getGoalsData.bind(this),
            color: '#fa8c16'
        });

        this.widgets.set('fitness', {
            title: 'Fitness',
            icon: '💪',
            getData: this.getFitnessData.bind(this),
            color: '#eb2f96'
        });

        this.widgets.set('finance', {
            title: 'Finance',
            icon: '💰',
            getData: this.getFinanceData.bind(this),
            color: '#13c2c2'
        });

        this.widgets.set('journal', {
            title: 'Journal',
            icon: '📝',
            getData: this.getJournalData.bind(this),
            color: '#722ed1'
        });

        this.widgets.set('poetry', {
            title: 'Poetry',
            icon: '🖋️',
            getData: this.getPoetryData.bind(this),
            color: '#2d1b4e'
        });
    }

    /**
     * Get Todo module data
     */
    getTodoData() {
        const tasks = StorageUtils.get('todoList_tasks', []);
        const completed = tasks.filter(task => task.completed).length;
        const total = tasks.length;
        const pending = total - completed;
        
        const highPriority = tasks.filter(task => !task.completed && task.priority === 'high').length;
        
        return {
            primary: pending,
            primaryLabel: 'Pending',
            secondary: `${completed}/${total}`,
            secondaryLabel: 'Completed',
            accent: highPriority > 0 ? `${highPriority} high priority` : 'All caught up!',
            trend: this.calculateTaskTrend(tasks)
        };
    }

    /**
     * Get Habits module data
     */
    getHabitsData() {
        const habits = StorageUtils.get('habits_list', []);
        const today = new Date().toDateString();
        
        const activeHabits = habits.filter(habit => habit.active !== false).length;
        const completedToday = habits.filter(habit => {
            const todayEntry = habit.entries?.[today];
            return todayEntry && todayEntry.completed;
        }).length;
        
        const streak = this.calculateBestStreak(habits);
        
        return {
            primary: completedToday,
            primaryLabel: 'Done Today',
            secondary: `${activeHabits}`,
            secondaryLabel: 'Active Habits',
            accent: streak > 0 ? `${streak} day streak` : 'Start your streak!',
            trend: this.calculateHabitTrend(habits)
        };
    }

    /**
     * Get Goals module data
     */
    getGoalsData() {
        const goals = StorageUtils.get('goals_list', []);
        const activeGoals = goals.filter(goal => goal.status === 'active').length;
        const completedGoals = goals.filter(goal => goal.status === 'completed').length;
        
        const avgProgress = goals.length > 0 ? 
            goals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / goals.length : 0;
        
        return {
            primary: activeGoals,
            primaryLabel: 'Active Goals',
            secondary: `${Math.round(avgProgress)}%`,
            secondaryLabel: 'Avg Progress',
            accent: completedGoals > 0 ? `${completedGoals} completed` : 'Set your first goal!',
            trend: 'stable'
        };
    }

    /**
     * Get Fitness module data
     */
    getFitnessData() {
        const workouts = StorageUtils.get('fitness_workouts', []);
        const goals = StorageUtils.get('fitness_goals', []);
        
        const thisWeek = this.getThisWeekWorkouts(workouts);
        const activeGoals = goals.filter(goal => goal.status === 'active').length;
        
        return {
            primary: thisWeek,
            primaryLabel: 'This Week',
            secondary: `${activeGoals}`,
            secondaryLabel: 'Active Goals',
            accent: thisWeek >= 3 ? 'Great week!' : 'Keep going!',
            trend: this.calculateFitnessTrend(workouts)
        };
    }

    /**
     * Get Finance module data
     */
    getFinanceData() {
        const transactions = StorageUtils.get('finance_transactions', []);
        const budgets = StorageUtils.get('finance_budgets', []);
        
        const thisMonth = this.getThisMonthTransactions(transactions);
        const totalSpent = thisMonth.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
        const totalIncome = thisMonth.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
        
        const balance = totalIncome - totalSpent;
        
        return {
            primary: `$${Math.abs(balance).toFixed(0)}`,
            primaryLabel: balance >= 0 ? 'Surplus' : 'Deficit',
            secondary: `${thisMonth.length}`,
            secondaryLabel: 'Transactions',
            accent: budgets.length > 0 ? `${budgets.length} budgets` : 'Set a budget',
            trend: balance >= 0 ? 'up' : 'down'
        };
    }

    /**
     * Get Journal module data
     */
    getJournalData() {
        const entries = StorageUtils.get('journal_entries', []);
        const thisMonth = this.getThisMonthEntries(entries);
        const totalEntries = entries.length;
        
        const avgMood = this.calculateAverageMood(entries);
        
        return {
            primary: thisMonth,
            primaryLabel: 'This Month',
            secondary: `${totalEntries}`,
            secondaryLabel: 'Total Entries',
            accent: avgMood ? `Mood: ${avgMood}` : 'Start journaling!',
            trend: 'stable'
        };
    }

    /**
     * Get Poetry module data
     */
    getPoetryData() {
        const poems = StorageUtils.get('poetry_collection', []);
        const recentPoems = poems.filter(poem => {
            const created = new Date(poem.dateCreated);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return created > monthAgo;
        }).length;
        
        return {
            primary: poems.length,
            primaryLabel: 'Total Poems',
            secondary: `${recentPoems}`,
            secondaryLabel: 'This Month',
            accent: poems.length > 0 ? 'Keep writing!' : 'Start creating!',
            trend: 'stable'
        };
    }

    /**
     * Render all widgets
     */
    renderWidgets(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const widgetsHtml = Array.from(this.widgets.entries())
            .map(([key, widget]) => {
                const data = widget.getData();
                return this.renderWidget(key, widget, data);
            })
            .join('');

        container.innerHTML = `
            <div class="dashboard-widgets">
                <h3 style="margin-bottom: 20px; color: #667eea; text-align: center;">Dashboard Overview</h3>
                <div class="widgets-grid">
                    ${widgetsHtml}
                </div>
            </div>
        `;

        this.addWidgetStyles();
    }

    /**
     * Render individual widget
     */
    renderWidget(key, widget, data) {
        const trendIcon = this.getTrendIcon(data.trend);
        
        return `
            <div class="widget" data-module="${key}" style="border-left: 4px solid ${widget.color}">
                <div class="widget-header">
                    <span class="widget-icon">${widget.icon}</span>
                    <span class="widget-title">${widget.title}</span>
                    <span class="widget-trend ${data.trend}">${trendIcon}</span>
                </div>
                <div class="widget-content">
                    <div class="widget-primary">
                        <span class="widget-number">${data.primary}</span>
                        <span class="widget-label">${data.primaryLabel}</span>
                    </div>
                    <div class="widget-secondary">
                        <span class="widget-sub-number">${data.secondary}</span>
                        <span class="widget-sub-label">${data.secondaryLabel}</span>
                    </div>
                </div>
                <div class="widget-accent">${data.accent}</div>
            </div>
        `;
    }

    /**
     * Add widget styles
     */
    addWidgetStyles() {
        if (document.querySelector('#dashboard-widget-styles')) return;

        const style = document.createElement('style');
        style.id = 'dashboard-widget-styles';
        style.textContent = `
            .dashboard-widgets {
                margin: 30px 0;
            }
            
            .widgets-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .widget {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                cursor: pointer;
            }
            
            .widget:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            }
            
            .widget-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
            }
            
            .widget-icon {
                font-size: 16px;
                margin-right: 8px;
            }
            
            .widget-title {
                font-size: 14px;
                font-weight: 600;
                color: #666;
                flex: 1;
            }
            
            .widget-trend {
                font-size: 12px;
                opacity: 0.7;
            }
            
            .widget-trend.up { color: #52c41a; }
            .widget-trend.down { color: #ff4d4f; }
            .widget-trend.stable { color: #faad14; }
            
            .widget-content {
                margin-bottom: 12px;
            }
            
            .widget-primary {
                display: flex;
                align-items: baseline;
                gap: 8px;
                margin-bottom: 8px;
            }
            
            .widget-number {
                font-size: 24px;
                font-weight: 700;
                color: #333;
            }
            
            .widget-label {
                font-size: 12px;
                color: #666;
                font-weight: 500;
            }
            
            .widget-secondary {
                display: flex;
                align-items: baseline;
                gap: 6px;
            }
            
            .widget-sub-number {
                font-size: 16px;
                font-weight: 600;
                color: #666;
            }
            
            .widget-sub-label {
                font-size: 11px;
                color: #999;
            }
            
            .widget-accent {
                font-size: 11px;
                color: #667eea;
                font-weight: 500;
                padding: 4px 8px;
                background: rgba(102, 126, 234, 0.1);
                border-radius: 6px;
                text-align: center;
            }
            
            @media (max-width: 768px) {
                .widgets-grid {
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 12px;
                }
                
                .widget {
                    padding: 12px;
                }
                
                .widget-number {
                    font-size: 20px;
                }
                
                .widget-sub-number {
                    font-size: 14px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Helper methods for data calculations
     */
    getTrendIcon(trend) {
        switch(trend) {
            case 'up': return '↗️';
            case 'down': return '↘️';
            case 'stable': return '→';
            default: return '→';
        }
    }

    calculateTaskTrend(tasks) {
        // Simple trend based on completion rate
        const completed = tasks.filter(task => task.completed).length;
        const total = tasks.length;
        const completionRate = total > 0 ? completed / total : 0;
        
        if (completionRate > 0.7) return 'up';
        if (completionRate < 0.3) return 'down';
        return 'stable';
    }

    calculateHabitTrend(habits) {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        const todayCount = habits.filter(habit => 
            habit.entries?.[today]?.completed).length;
        const yesterdayCount = habits.filter(habit => 
            habit.entries?.[yesterday]?.completed).length;
        
        if (todayCount > yesterdayCount) return 'up';
        if (todayCount < yesterdayCount) return 'down';
        return 'stable';
    }

    calculateFitnessTrend(workouts) {
        const thisWeek = this.getThisWeekWorkouts(workouts);
        const lastWeek = this.getLastWeekWorkouts(workouts);
        
        if (thisWeek > lastWeek) return 'up';
        if (thisWeek < lastWeek) return 'down';
        return 'stable';
    }

    calculateBestStreak(habits) {
        let maxStreak = 0;
        
        habits.forEach(habit => {
            const streak = this.calculateHabitStreak(habit);
            maxStreak = Math.max(maxStreak, streak);
        });
        
        return maxStreak;
    }

    calculateHabitStreak(habit) {
        if (!habit.entries) return 0;
        
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today - i * 86400000).toDateString();
            if (habit.entries[date]?.completed) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    getThisWeekWorkouts(workouts) {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        
        return workouts.filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= weekStart;
        }).length;
    }

    getLastWeekWorkouts(workouts) {
        const now = new Date();
        const lastWeekEnd = new Date(now.setDate(now.getDate() - now.getDay() - 1));
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);
        lastWeekStart.setHours(0, 0, 0, 0);
        lastWeekEnd.setHours(23, 59, 59, 999);
        
        return workouts.filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= lastWeekStart && workoutDate <= lastWeekEnd;
        }).length;
    }

    getThisMonthTransactions(transactions) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= monthStart;
        });
    }

    getThisMonthEntries(entries) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= monthStart;
        }).length;
    }

    calculateAverageMood(entries) {
        if (entries.length === 0) return null;
        
        const moodEntries = entries.filter(entry => entry.mood);
        if (moodEntries.length === 0) return null;
        
        const moodValues = {
            'great': 5,
            'good': 4,
            'okay': 3,
            'bad': 2,
            'terrible': 1
        };
        
        const sum = moodEntries.reduce((total, entry) => {
            return total + (moodValues[entry.mood] || 3);
        }, 0);
        
        const avg = sum / moodEntries.length;
        const moods = ['terrible', 'bad', 'okay', 'good', 'great'];
        
        return moods[Math.round(avg) - 1] || 'okay';
    }

    /**
     * Start auto-refresh of widgets
     */
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            const container = document.querySelector('.dashboard-widgets');
            if (container) {
                this.renderWidgets('module-content');
            }
        }, 30000); // Refresh every 30 seconds
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Add click handlers to widgets
     */
    addWidgetClickHandlers() {
        document.addEventListener('click', (e) => {
            const widget = e.target.closest('.widget');
            if (widget) {
                const module = widget.dataset.module;
                const moduleMap = {
                    'todo': 'ToDoList',
                    'habits': 'Habits',
                    'goals': 'Goals',
                    'fitness': 'Fitness',
                    'finance': 'Finance',
                    'journal': 'Journal',
                    'poetry': 'Poetry'
                };
                
                if (moduleMap[module]) {
                    window.location.href = `${moduleMap[module]}/index.html`;
                }
            }
        });
    }
}

// Create global instance
window.DashboardWidgets = new DashboardWidgets();