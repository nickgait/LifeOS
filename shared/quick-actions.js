/**
 * LifeOS Quick Actions
 * Provide quick access buttons for common tasks across modules
 */

class QuickActions {
    constructor() {
        this.actions = [
            {
                id: 'add-task',
                icon: '➕',
                label: 'Add Task',
                description: 'Quick add new task',
                color: '#667eea',
                action: this.addTask.bind(this)
            },
            {
                id: 'log-habit',
                icon: '✅',
                label: 'Log Habit',
                description: 'Mark habit complete',
                color: '#52c41a',
                action: this.logHabit.bind(this)
            },
            {
                id: 'add-workout',
                icon: '💪',
                label: 'Log Workout',
                description: 'Record fitness activity',
                color: '#eb2f96',
                action: this.addWorkout.bind(this)
            },
            {
                id: 'add-expense',
                icon: '💳',
                label: 'Add Expense',
                description: 'Record spending',
                color: '#13c2c2',
                action: this.addExpense.bind(this)
            },
            {
                id: 'journal-entry',
                icon: '📝',
                label: 'Journal',
                description: 'Write journal entry',
                color: '#722ed1',
                action: this.addJournalEntry.bind(this)
            },
            {
                id: 'update-goal',
                icon: '🎯',
                label: 'Update Goal',
                description: 'Update goal progress',
                color: '#fa8c16',
                action: this.updateGoalProgress.bind(this)
            },
            {
                id: 'view-progress',
                icon: '📊',
                label: 'Progress',
                description: 'View detailed analytics',
                color: '#1890ff',
                action: this.viewProgress.bind(this)
            }
        ];
    }

    /**
     * Initialize quick actions
     */
    init() {
        this.renderQuickActions();
        this.addEventListeners();
    }

    /**
     * Render quick actions bar
     */
    renderQuickActions() {
        const container = document.getElementById('quick-actions-bar');
        if (!container) return;

        container.innerHTML = `
            <div class="quick-actions">
                <h3 style="margin-bottom: 15px; color: #667eea; text-align: center;">Quick Actions</h3>
                <div class="actions-grid">
                    ${this.actions.map(action => this.renderAction(action)).join('')}
                </div>
            </div>
        `;

        this.addQuickActionStyles();
    }

    /**
     * Render individual action button
     */
    renderAction(action) {
        return `
            <button class="quick-action-btn" data-action="${action.id}" style="border-left: 4px solid ${action.color}">
                <div class="action-icon">${action.icon}</div>
                <div class="action-content">
                    <div class="action-label">${action.label}</div>
                    <div class="action-description">${action.description}</div>
                </div>
            </button>
        `;
    }

    /**
     * Add event listeners
     */
    addEventListeners() {
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.quick-action-btn');
            if (actionBtn) {
                const actionId = actionBtn.dataset.action;
                const action = this.actions.find(a => a.id === actionId);
                if (action) {
                    action.action();
                }
            }
        });
    }

    /**
     * Quick action implementations
     */
    addTask() {
        const taskText = prompt('Enter new task:');
        if (taskText && taskText.trim()) {
            const tasks = window.StorageUtils.get('myEnhancedTodos', []);
            const newTask = {
                id: Date.now(),
                text: taskText.trim(),
                completed: false,
                priority: 'medium',
                category: 'general',
                dueDate: '',
                reminder: null,
                notes: '',
                tags: [],
                createdAt: new Date().toISOString(),
                completedAt: null
            };
            
            tasks.push(newTask);
            window.StorageUtils.set('myEnhancedTodos', tasks);
            
            this.showSuccessMessage(`Task "${taskText}" added successfully!`);
            this.refreshDashboard();
        }
    }

    logHabit() {
        const habits = window.StorageUtils.get('lifeos-habits', []);
        const activeHabits = habits.filter(habit => habit.active !== false);
        
        if (activeHabits.length === 0) {
            this.showInfoMessage('No active habits found. Create habits in the Habits module.');
            return;
        }

        const habitNames = activeHabits.map(habit => habit.name);
        const habitName = prompt(`Select habit to log:\n${habitNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}\n\nEnter number:`);
        
        if (habitName && !isNaN(habitName)) {
            const habitIndex = parseInt(habitName) - 1;
            if (habitIndex >= 0 && habitIndex < activeHabits.length) {
                const habit = activeHabits[habitIndex];
                const today = new Date().toDateString();
                
                if (!habit.entries) habit.entries = {};
                
                habit.entries[today] = {
                    completed: true,
                    timestamp: new Date().toISOString(),
                    notes: ''
                };
                
                // Update the original habits array
                const habitId = habit.id;
                const originalIndex = habits.findIndex(h => h.id === habitId);
                if (originalIndex !== -1) {
                    habits[originalIndex] = habit;
                    window.StorageUtils.set('lifeos-habits', habits);
                }
                
                this.showSuccessMessage(`Habit "${habit.name}" logged for today!`);
                this.refreshDashboard();
            }
        }
    }

    addWorkout() {
        const goals = window.StorageUtils.get('fitnessGoals', []);
        
        if (goals.length === 0) {
            this.showInfoMessage('No fitness goals found. Create goals in the Fitness module.');
            return;
        }

        const goalNames = goals.map(goal => goal.name);
        const goalSelection = prompt(`Select fitness goal:\n${goalNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}\n\nEnter number:`);
        
        if (goalSelection && !isNaN(goalSelection)) {
            const goalIndex = parseInt(goalSelection) - 1;
            if (goalIndex >= 0 && goalIndex < goals.length) {
                const goal = goals[goalIndex];
                const amount = prompt(`Enter amount (${goal.unit || 'units'}):`);
                
                if (amount && !isNaN(amount)) {
                    const today = new Date();
                    const entry = {
                        date: today.toISOString().split('T')[0],
                        fullDate: today.toISOString(),
                        amount: parseFloat(amount),
                        notes: ''
                    };
                    
                    if (!goal.history) goal.history = [];
                    goal.history.push(entry);
                    
                    window.StorageUtils.set('fitnessGoals', goals);
                    
                    this.showSuccessMessage(`Workout logged: ${amount} ${goal.unit || 'units'} for ${goal.name}!`);
                    this.refreshDashboard();
                }
            }
        }
    }

    addExpense() {
        const amount = prompt('Enter expense amount ($):');
        if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
            const description = prompt('Enter expense description:') || 'Quick expense';
            const transactions = window.StorageUtils.get('finance_transactions', []);
            
            const newTransaction = {
                id: Date.now(),
                type: 'expense',
                amount: parseFloat(amount),
                category: 'other',
                description: description.trim(),
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            };
            
            transactions.push(newTransaction);
            window.StorageUtils.set('finance_transactions', transactions);
            
            this.showSuccessMessage(`Expense of $${amount} recorded!`);
            this.refreshDashboard();
        }
    }

    addJournalEntry() {
        const entry = prompt('Write a quick journal entry:');
        if (entry && entry.trim()) {
            const entries = window.StorageUtils.get('lifeos-journal', []);
            
            const newEntry = {
                id: Date.now(),
                date: new Date().toISOString(),
                content: entry.trim(),
                mood: null,
                tags: [],
                favorite: false
            };
            
            entries.push(newEntry);
            window.StorageUtils.set('lifeos-journal', entries);
            
            this.showSuccessMessage('Journal entry saved!');
            this.refreshDashboard();
        }
    }

    updateGoalProgress() {
        const goals = window.StorageUtils.get('lifeos-goals', []);
        const activeGoals = goals.filter(goal => goal.status === 'active');
        
        if (activeGoals.length === 0) {
            this.showInfoMessage('No active goals found. Create goals in the Goals module.');
            return;
        }

        const goalNames = activeGoals.map(goal => goal.name);
        const goalSelection = prompt(`Select goal to update:\n${goalNames.map((name, i) => `${i + 1}. ${name} (${activeGoals[i].progress || 0}%)`).join('\n')}\n\nEnter number:`);
        
        if (goalSelection && !isNaN(goalSelection)) {
            const goalIndex = parseInt(goalSelection) - 1;
            if (goalIndex >= 0 && goalIndex < activeGoals.length) {
                const goal = activeGoals[goalIndex];
                const currentProgress = goal.progress || 0;
                const newProgress = prompt(`Current progress: ${currentProgress}%\nEnter new progress (0-100):`);
                
                if (newProgress !== null && !isNaN(newProgress)) {
                    const progressValue = Math.max(0, Math.min(100, parseFloat(newProgress)));
                    
                    // Update the goal in the original array
                    const goalId = goal.id;
                    const originalIndex = goals.findIndex(g => g.id === goalId);
                    if (originalIndex !== -1) {
                        goals[originalIndex].progress = progressValue;
                        
                        // Check if goal is completed
                        if (progressValue >= 100 && goals[originalIndex].status === 'active') {
                            goals[originalIndex].status = 'completed';
                            goals[originalIndex].completedAt = new Date().toISOString();
                            this.showGoalCompletionCelebration(goal.name);
                        } else {
                            this.showSuccessMessage(`Goal "${goal.name}" updated to ${progressValue}%`);
                        }
                        
                        window.StorageUtils.set('lifeos-goals', goals);
                        this.refreshDashboard();
                    }
                }
            }
        }
    }

    viewProgress() {
        // Show/hide progress charts
        const chartsSection = document.getElementById('progress-charts-section');
        if (chartsSection) {
            if (chartsSection.style.display === 'none') {
                chartsSection.style.display = 'block';
                if (window.ProgressCharts) {
                    window.ProgressCharts.init();
                }
                this.showInfoMessage('Progress charts displayed. Click again to hide.');
            } else {
                chartsSection.style.display = 'none';
                this.showInfoMessage('Progress charts hidden.');
            }
        }
    }

    /**
     * Helper methods
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showInfoMessage(message) {
        this.showMessage(message, 'info');
    }

    showMessage(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `quick-action-toast ${type}`;
        toast.textContent = message;
        
        const colors = {
            success: '#52c41a',
            info: '#13c2c2',
            warning: '#faad14',
            error: '#ff4d4f'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    refreshDashboard() {
        // Refresh dashboard widgets if they exist
        if (window.DashboardWidgets) {
            setTimeout(() => {
                window.DashboardWidgets.renderWidgets('module-content');
            }, 100);
        }
        
        // Refresh progress charts if they exist
        if (window.ProgressCharts) {
            setTimeout(() => {
                window.ProgressCharts.refreshCharts();
            }, 100);
        }
    }

    showGoalCompletionCelebration(goalName) {
        // Create celebration overlay
        const celebration = document.createElement('div');
        celebration.className = 'goal-celebration-overlay';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-emoji">🎉</div>
                <h2>Goal Completed!</h2>
                <p>"${goalName}"</p>
                <div class="celebration-message">Congratulations on achieving your goal!</div>
                <button onclick="this.parentElement.parentElement.remove()" class="celebration-close">
                    Awesome! 🚀
                </button>
            </div>
        `;
        
        celebration.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: celebrationFadeIn 0.5s ease;
        `;
        
        // Add celebration styles
        if (!document.querySelector('#celebration-styles')) {
            const style = document.createElement('style');
            style.id = 'celebration-styles';
            style.textContent = `
                @keyframes celebrationFadeIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                
                @keyframes sparkle {
                    0%, 100% { transform: rotate(0deg) scale(1); }
                    25% { transform: rotate(90deg) scale(1.2); }
                    50% { transform: rotate(180deg) scale(1); }
                    75% { transform: rotate(270deg) scale(1.2); }
                }
                
                .celebration-content {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    color: white;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    max-width: 400px;
                    animation: bounce 0.6s ease;
                }
                
                .celebration-emoji {
                    font-size: 60px;
                    margin-bottom: 20px;
                    animation: sparkle 2s ease-in-out infinite;
                }
                
                .celebration-content h2 {
                    margin: 0 0 10px 0;
                    font-size: 28px;
                    font-weight: 700;
                }
                
                .celebration-content p {
                    margin: 0 0 20px 0;
                    font-size: 18px;
                    font-weight: 500;
                    opacity: 0.9;
                }
                
                .celebration-message {
                    margin-bottom: 30px;
                    font-size: 16px;
                    opacity: 0.8;
                }
                
                .celebration-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .celebration-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-2px);
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(celebration);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (celebration.parentNode) {
                celebration.style.animation = 'celebrationFadeIn 0.3s ease reverse';
                setTimeout(() => {
                    if (celebration.parentNode) {
                        celebration.parentNode.removeChild(celebration);
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * Add quick action styles
     */
    addQuickActionStyles() {
        if (document.querySelector('#quick-action-styles')) return;

        const style = document.createElement('style');
        style.id = 'quick-action-styles';
        style.textContent = `
            .quick-actions {
                margin: 20px 0;
                padding: 20px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            
            .actions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 12px;
            }
            
            .quick-action-btn {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                background: white;
                border: none;
                border-radius: 10px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
            }
            
            .quick-action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0,0,0,0.12);
            }
            
            .quick-action-btn:active {
                transform: translateY(0);
            }
            
            .action-icon {
                font-size: 18px;
                margin-right: 12px;
                min-width: 18px;
            }
            
            .action-content {
                flex: 1;
            }
            
            .action-label {
                font-size: 14px;
                font-weight: 600;
                color: #333;
                margin-bottom: 2px;
            }
            
            .action-description {
                font-size: 11px;
                color: #666;
                line-height: 1.2;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            @media (max-width: 768px) {
                .actions-grid {
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 10px;
                }
                
                .quick-action-btn {
                    padding: 10px 12px;
                }
                
                .action-icon {
                    font-size: 16px;
                    margin-right: 10px;
                }
                
                .action-label {
                    font-size: 13px;
                }
                
                .action-description {
                    font-size: 10px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Create global instance
window.QuickActions = new QuickActions();