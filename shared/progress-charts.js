/**
 * LifeOS Progress Charts
 * Visualize progress and trends across all modules using Chart.js
 */

class ProgressCharts {
    constructor() {
        this.charts = new Map();
        this.chartColors = {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#52c41a',
            warning: '#faad14',
            error: '#ff4d4f',
            info: '#13c2c2'
        };
    }

    /**
     * Initialize progress charts
     */
    init() {
        this.renderProgressCharts();
    }

    /**
     * Render all progress charts
     */
    renderProgressCharts() {
        const container = document.getElementById('progress-charts-section');
        if (!container) return;

        container.innerHTML = `
            <div class="progress-charts">
                <h3 style="margin-bottom: 20px; color: #667eea; text-align: center;">Progress Overview</h3>
                <div class="charts-grid">
                    <div class="chart-container">
                        <h4>Weekly Activity</h4>
                        <canvas id="weeklyActivityChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Module Progress</h4>
                        <canvas id="moduleProgressChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Goal Completion</h4>
                        <canvas id="goalCompletionChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Habit Streaks</h4>
                        <canvas id="habitStreaksChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Goal Milestones</h4>
                        <canvas id="goalMilestonesChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Progress Trends</h4>
                        <canvas id="progressTrendsChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.addChartStyles();
        
        // Create charts
        this.createWeeklyActivityChart();
        this.createModuleProgressChart();
        this.createGoalCompletionChart();
        this.createHabitStreaksChart();
        this.createGoalMilestonesChart();
        this.createProgressTrendsChart();
    }

    /**
     * Create weekly activity chart
     */
    createWeeklyActivityChart() {
        const ctx = document.getElementById('weeklyActivityChart');
        if (!ctx) return;

        const weekData = this.getWeeklyActivityData();
        
        if (this.charts.has('weeklyActivity')) {
            this.charts.get('weeklyActivity').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weekData.labels,
                datasets: [{
                    label: 'Daily Activities',
                    data: weekData.values,
                    borderColor: this.chartColors.primary,
                    backgroundColor: `${this.chartColors.primary}20`,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        this.charts.set('weeklyActivity', chart);
    }

    /**
     * Create module progress chart
     */
    createModuleProgressChart() {
        const ctx = document.getElementById('moduleProgressChart');
        if (!ctx) return;

        const progressData = this.getModuleProgressData();
        
        if (this.charts.has('moduleProgress')) {
            this.charts.get('moduleProgress').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: progressData.labels,
                datasets: [{
                    data: progressData.values,
                    backgroundColor: [
                        this.chartColors.primary,
                        this.chartColors.success,
                        this.chartColors.warning,
                        this.chartColors.info,
                        this.chartColors.secondary,
                        '#722ed1',
                        '#2d1b4e'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            usePointStyle: true
                        }
                    }
                }
            }
        });

        this.charts.set('moduleProgress', chart);
    }

    /**
     * Create goal completion chart
     */
    createGoalCompletionChart() {
        const ctx = document.getElementById('goalCompletionChart');
        if (!ctx) return;

        const goalData = this.getGoalCompletionData();
        
        if (this.charts.has('goalCompletion')) {
            this.charts.get('goalCompletion').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: goalData.labels,
                datasets: [{
                    label: 'Progress %',
                    data: goalData.values,
                    backgroundColor: goalData.values.map(val => 
                        val >= 80 ? this.chartColors.success :
                        val >= 50 ? this.chartColors.warning :
                        this.chartColors.error
                    )
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
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

        this.charts.set('goalCompletion', chart);
    }

    /**
     * Create habit streaks chart
     */
    createHabitStreaksChart() {
        const ctx = document.getElementById('habitStreaksChart');
        if (!ctx) return;

        const habitData = this.getHabitStreaksData();
        
        if (this.charts.has('habitStreaks')) {
            this.charts.get('habitStreaks').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: habitData.labels,
                datasets: [{
                    label: 'Streak Days',
                    data: habitData.values,
                    borderColor: this.chartColors.primary,
                    backgroundColor: `${this.chartColors.primary}30`,
                    pointBackgroundColor: this.chartColors.primary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.chartColors.primary
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 30
                    }
                }
            }
        });

        this.charts.set('habitStreaks', chart);
    }

    /**
     * Create goal milestones chart
     */
    createGoalMilestonesChart() {
        const ctx = document.getElementById('goalMilestonesChart');
        if (!ctx) return;

        const milestoneData = this.getGoalMilestonesData();
        
        if (this.charts.has('goalMilestones')) {
            this.charts.get('goalMilestones').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Goal Progress',
                    data: milestoneData.points,
                    backgroundColor: milestoneData.points.map(point => 
                        point.y >= 100 ? this.chartColors.success :
                        point.y >= 75 ? this.chartColors.warning :
                        point.y >= 50 ? this.chartColors.info :
                        this.chartColors.error
                    ),
                    borderColor: this.chartColors.primary,
                    pointRadius: 8,
                    pointHoverRadius: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = milestoneData.points[context.dataIndex];
                                return `${point.name}: ${point.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Progress %'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Days Since Created'
                        }
                    }
                }
            }
        });

        this.charts.set('goalMilestones', chart);
    }

    /**
     * Create progress trends chart
     */
    createProgressTrendsChart() {
        const ctx = document.getElementById('progressTrendsChart');
        if (!ctx) return;

        const trendData = this.getProgressTrendsData();
        
        if (this.charts.has('progressTrends')) {
            this.charts.get('progressTrends').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'Overall Progress',
                    data: trendData.overall,
                    borderColor: this.chartColors.primary,
                    backgroundColor: `${this.chartColors.primary}20`,
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Goals Average',
                    data: trendData.goals,
                    borderColor: this.chartColors.warning,
                    backgroundColor: 'transparent',
                    tension: 0.4
                }, {
                    label: 'Habits Rate',
                    data: trendData.habits,
                    borderColor: this.chartColors.success,
                    backgroundColor: 'transparent',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    y: {
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

        this.charts.set('progressTrends', chart);
    }

    /**
     * Get weekly activity data
     */
    getWeeklyActivityData() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const activities = new Array(7).fill(0);

        // Get data from various modules
        const habits = window.StorageUtils.get('lifeos-habits', []);
        const fitnessGoals = window.StorageUtils.get('fitnessGoals', []);
        const tasks = window.StorageUtils.get('myEnhancedTodos', []);

        // Calculate activity for each day
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toDateString();

            // Count habit completions
            habits.forEach(habit => {
                if (habit.entries?.[dateStr]?.completed) {
                    activities[i]++;
                }
            });

            // Count fitness activities
            fitnessGoals.forEach(goal => {
                if (goal.history) {
                    const dayEntry = goal.history.find(entry => {
                        const entryDate = new Date(entry.fullDate || entry.date).toDateString();
                        return entryDate === dateStr;
                    });
                    if (dayEntry && dayEntry.amount > 0) {
                        activities[i]++;
                    }
                }
            });

            // Count completed tasks
            const completedTasks = tasks.filter(task => {
                if (task.completed && task.completedAt) {
                    const completedDate = new Date(task.completedAt).toDateString();
                    return completedDate === dateStr;
                }
                return false;
            }).length;
            activities[i] += completedTasks;
        }

        return {
            labels: days,
            values: activities
        };
    }

    /**
     * Get module progress data
     */
    getModuleProgressData() {
        const modules = [
            { name: 'Tasks', key: 'myEnhancedTodos', calc: this.getTaskProgress.bind(this) },
            { name: 'Habits', key: 'lifeos-habits', calc: this.getHabitProgress.bind(this) },
            { name: 'Goals', key: 'lifeos-goals', calc: this.getGoalProgress.bind(this) },
            { name: 'Fitness', key: 'fitnessGoals', calc: this.getFitnessProgress.bind(this) },
            { name: 'Finance', key: 'finance_budgets', calc: this.getFinanceProgress.bind(this) },
            { name: 'Journal', key: 'lifeos-journal', calc: this.getJournalProgress.bind(this) },
            { name: 'Poetry', key: 'lifeos_poems', calc: this.getPoetryProgress.bind(this) }
        ];

        const labels = [];
        const values = [];

        modules.forEach(module => {
            const data = window.StorageUtils.get(module.key, []);
            const progress = module.calc(data);
            if (progress > 0) {
                labels.push(module.name);
                values.push(progress);
            }
        });

        return { labels, values };
    }

    /**
     * Get goal completion data
     */
    getGoalCompletionData() {
        const goals = window.StorageUtils.get('lifeos-goals', []);
        const activeGoals = goals.filter(goal => goal.status === 'active');

        const labels = [];
        const values = [];

        activeGoals.forEach(goal => {
            if (goal.name && goal.progress !== undefined) {
                labels.push(goal.name.length > 15 ? goal.name.substring(0, 15) + '...' : goal.name);
                values.push(goal.progress || 0);
            }
        });

        return { labels, values };
    }

    /**
     * Get habit streaks data
     */
    getHabitStreaksData() {
        const habits = window.StorageUtils.get('lifeos-habits', []);
        const activeHabits = habits.filter(habit => habit.active !== false);

        const labels = [];
        const values = [];

        activeHabits.forEach(habit => {
            if (habit.name) {
                const streak = this.calculateHabitStreak(habit);
                labels.push(habit.name.length > 15 ? habit.name.substring(0, 15) + '...' : habit.name);
                values.push(streak);
            }
        });

        // Limit to top 6 habits
        const sorted = labels.map((label, i) => ({ label, value: values[i] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        return {
            labels: sorted.map(item => item.label),
            values: sorted.map(item => item.value)
        };
    }

    /**
     * Helper methods for progress calculations
     */
    getTaskProgress(tasks) {
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(task => task.completed).length;
        return Math.round((completed / tasks.length) * 100);
    }

    getHabitProgress(habits) {
        if (habits.length === 0) return 0;
        const today = new Date().toDateString();
        const completed = habits.filter(habit => habit.entries?.[today]?.completed).length;
        return Math.round((completed / habits.length) * 100);
    }

    getGoalProgress(goals) {
        if (goals.length === 0) return 0;
        const activeGoals = goals.filter(goal => goal.status === 'active');
        if (activeGoals.length === 0) return 0;
        const avgProgress = activeGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / activeGoals.length;
        return Math.round(avgProgress);
    }

    getFitnessProgress(fitnessGoals) {
        if (fitnessGoals.length === 0) return 0;
        const today = new Date().toDateString();
        const completed = fitnessGoals.filter(goal => {
            if (goal.history) {
                return goal.history.some(entry => {
                    const entryDate = new Date(entry.fullDate || entry.date).toDateString();
                    return entryDate === today && entry.amount > 0;
                });
            }
            return false;
        }).length;
        return Math.round((completed / fitnessGoals.length) * 100);
    }

    getFinanceProgress(budgets) {
        if (budgets.length === 0) return 0;
        const transactions = window.StorageUtils.get('finance_transactions', []);
        const thisMonth = this.getThisMonthTransactions(transactions);
        const totalSpent = thisMonth.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
        const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
        if (totalBudget === 0) return 0;
        const remaining = Math.max(0, totalBudget - totalSpent);
        return Math.round((remaining / totalBudget) * 100);
    }

    getJournalProgress(entries) {
        const thisMonth = this.getThisMonthEntries(entries);
        const daysInMonth = new Date().getDate();
        return Math.min(100, Math.round((thisMonth / daysInMonth) * 100));
    }

    getPoetryProgress(poems) {
        const thisMonth = poems.filter(poem => {
            const created = new Date(poem.dateCreated);
            const now = new Date();
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length;
        return Math.min(100, thisMonth * 20); // Each poem = 20%
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

    /**
     * Get goal milestones data
     */
    getGoalMilestonesData() {
        const goals = window.StorageUtils.get('lifeos-goals', []);
        const allGoals = goals.filter(goal => goal.name);
        
        const points = [];
        
        allGoals.forEach(goal => {
            const createdDate = new Date(goal.createdAt || Date.now());
            const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            
            points.push({
                x: daysSinceCreated,
                y: goal.progress || 0,
                name: goal.name.length > 20 ? goal.name.substring(0, 20) + '...' : goal.name
            });
        });

        return { points };
    }

    /**
     * Get progress trends data
     */
    getProgressTrendsData() {
        const days = 7;
        const labels = [];
        const overall = [];
        const goals = [];
        const habits = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

            // Calculate overall progress for this day
            const dayOverall = this.calculateDayOverallProgress(date);
            overall.push(dayOverall);

            // Calculate goals progress
            const dayGoals = this.calculateDayGoalsProgress(date);
            goals.push(dayGoals);

            // Calculate habits completion rate
            const dayHabits = this.calculateDayHabitsProgress(date);
            habits.push(dayHabits);
        }

        return { labels, overall, goals, habits };
    }

    /**
     * Calculate overall progress for a specific day
     */
    calculateDayOverallProgress(date) {
        const goalsProgress = this.calculateDayGoalsProgress(date);
        const habitsProgress = this.calculateDayHabitsProgress(date);
        const tasksProgress = this.calculateDayTasksProgress(date);
        
        return Math.round((goalsProgress + habitsProgress + tasksProgress) / 3);
    }

    /**
     * Calculate goals progress for a specific day
     */
    calculateDayGoalsProgress(date) {
        const allGoals = window.StorageUtils.get('lifeos-goals', []);
        const activeGoals = allGoals.filter(goal => goal.status === 'active');
        
        if (activeGoals.length === 0) return 0;
        
        const avgProgress = activeGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / activeGoals.length;
        return Math.round(avgProgress);
    }

    /**
     * Calculate habits progress for a specific day
     */
    calculateDayHabitsProgress(date) {
        const allHabits = window.StorageUtils.get('lifeos-habits', []);
        const activeHabits = allHabits.filter(habit => habit.active !== false);
        
        if (activeHabits.length === 0) return 0;
        
        const dateStr = date.toDateString();
        const completedCount = activeHabits.filter(habit => 
            habit.entries?.[dateStr]?.completed
        ).length;
        
        return Math.round((completedCount / activeHabits.length) * 100);
    }

    /**
     * Calculate tasks progress for a specific day
     */
    calculateDayTasksProgress(date) {
        const allTasks = window.StorageUtils.get('myEnhancedTodos', []);
        
        if (allTasks.length === 0) return 0;
        
        const completedCount = allTasks.filter(task => task.completed).length;
        return Math.round((completedCount / allTasks.length) * 100);
    }

    /**
     * Add chart styles
     */
    addChartStyles() {
        if (document.querySelector('#progress-chart-styles')) return;

        const style = document.createElement('style');
        style.id = 'progress-chart-styles';
        style.textContent = `
            .progress-charts {
                margin: 30px 0;
                padding: 20px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            
            .charts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 25px;
                margin-top: 20px;
            }
            
            .chart-container {
                background: white;
                border-radius: 12px;
                padding: 15px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                position: relative;
                height: 250px;
            }
            
            .chart-container h4 {
                margin: 0 0 15px 0;
                color: #667eea;
                font-size: 14px;
                font-weight: 600;
                text-align: center;
            }
            
            .chart-container canvas {
                max-height: 200px !important;
            }
            
            @media (max-width: 768px) {
                .charts-grid {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                
                .chart-container {
                    height: 220px;
                    padding: 12px;
                }
                
                .chart-container canvas {
                    max-height: 180px !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Refresh all charts
     */
    refreshCharts() {
        this.createWeeklyActivityChart();
        this.createModuleProgressChart();
        this.createGoalCompletionChart();
        this.createHabitStreaksChart();
        this.createGoalMilestonesChart();
        this.createProgressTrendsChart();
    }

    /**
     * Destroy all charts
     */
    destroy() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }
}

// Create global instance
window.ProgressCharts = new ProgressCharts();