/**
 * LifeOS Module Communication Bridge
 * Enable data sharing and communication between different modules
 */

class ModuleBridge {
    constructor() {
        this.eventBus = new EventTarget();
        this.moduleData = new Map();
        this.crossReferences = new Map();
        this.setupCrossModuleConnections();
        this.initializeDataSync();
    }

    /**
     * Initialize data synchronization between modules
     */
    initializeDataSync() {
        // Listen for storage changes across modules
        window.addEventListener('storage', (e) => {
            this.handleStorageChange(e);
        });

        // Custom storage event for same-window changes
        window.addEventListener('localStorageChange', (e) => {
            this.handleStorageChange(e.detail);
        });

        // Initial data load
        this.loadAllModuleData();
    }

    /**
     * Load data from all modules
     */
    loadAllModuleData() {
        const modules = ['todoList', 'habits', 'goals', 'fitness', 'finance', 'journal', 'poetry'];
        
        modules.forEach(module => {
            const data = StorageUtils.getModuleData(module);
            this.moduleData.set(module, data);
        });

        this.generateCrossReferences();
    }

    /**
     * Setup cross-module connections and data relationships
     */
    setupCrossModuleConnections() {
        // Habit → Goal connections
        this.addConnection('habits', 'goals', {
            type: 'progress_influence',
            description: 'Habit completion affects goal progress',
            handler: this.syncHabitsToGoals.bind(this)
        });

        // Fitness → Goals connections
        this.addConnection('fitness', 'goals', {
            type: 'achievement_tracking',
            description: 'Fitness activities count toward fitness goals',
            handler: this.syncFitnessToGoals.bind(this)
        });

        // Journal → Goals connections
        this.addConnection('journal', 'goals', {
            type: 'reflection_insights',
            description: 'Journal reflections provide goal insights',
            handler: this.syncJournalToGoals.bind(this)
        });

        // Finance → Goals connections
        this.addConnection('finance', 'goals', {
            type: 'financial_progress',
            description: 'Financial tracking supports money-related goals',
            handler: this.syncFinanceToGoals.bind(this)
        });

        // Tasks → Habits connections
        this.addConnection('todoList', 'habits', {
            type: 'task_to_habit',
            description: 'Recurring tasks can become habits',
            handler: this.syncTasksToHabits.bind(this)
        });

        // Habits → Tasks connections
        this.addConnection('habits', 'todoList', {
            type: 'habit_to_task',
            description: 'Daily habits generate daily tasks',
            handler: this.syncHabitsToTasks.bind(this)
        });
    }

    /**
     * Add connection between modules
     */
    addConnection(fromModule, toModule, config) {
        const connectionId = `${fromModule}_to_${toModule}`;
        this.crossReferences.set(connectionId, {
            from: fromModule,
            to: toModule,
            ...config
        });
    }

    /**
     * Handle storage changes and propagate to connected modules
     */
    handleStorageChange(event) {
        if (!event.key || !event.key.includes('_')) return;

        const [moduleName] = event.key.split('_');
        
        // Update local module data
        const newData = StorageUtils.getModuleData(moduleName);
        this.moduleData.set(moduleName, newData);

        // Trigger cross-module updates
        this.propagateChanges(moduleName, newData);

        // Emit module data change event
        this.emit('moduleDataChanged', {
            module: moduleName,
            data: newData,
            key: event.key
        });
    }

    /**
     * Propagate changes to connected modules
     */
    propagateChanges(changedModule, newData) {
        // Find all connections where this module is the source
        this.crossReferences.forEach((connection, connectionId) => {
            if (connection.from === changedModule) {
                try {
                    connection.handler(newData, this.moduleData.get(connection.to));
                } catch (error) {
                    console.error(`Error in cross-module sync ${connectionId}:`, error);
                }
            }
        });
    }

    /**
     * Sync habits to goals
     */
    syncHabitsToGoals(habitData, goalData) {
        if (!habitData.list || !goalData.list) return;

        const habits = habitData.list;
        const goals = goalData.list;

        goals.forEach(goal => {
            if (goal.category === 'health' || goal.category === 'personal') {
                // Find related habits
                const relatedHabits = habits.filter(habit => 
                    this.isRelated(habit.name, goal.title) ||
                    this.isRelated(habit.description, goal.description)
                );

                if (relatedHabits.length > 0) {
                    // Calculate habit completion rate for this month
                    const habitProgress = this.calculateHabitProgress(relatedHabits);
                    
                    // Update goal progress based on habit completion
                    if (habitProgress > 0 && goal.progress < habitProgress) {
                        goal.progress = Math.min(goal.progress + habitProgress / 10, 100);
                        goal.lastUpdated = new Date().toISOString();
                        goal.source = 'habit_sync';
                    }
                }
            }
        });

        // Save updated goals
        StorageUtils.set('goals_list', goals);
    }

    /**
     * Sync fitness to goals
     */
    syncFitnessToGoals(fitnessData, goalData) {
        if (!fitnessData.workouts || !goalData.list) return;

        const workouts = fitnessData.workouts;
        const goals = goalData.list;

        goals.forEach(goal => {
            if (goal.category === 'health' || goal.category === 'fitness') {
                // Count recent workouts
                const recentWorkouts = this.getRecentWorkouts(workouts, 30);
                
                if (recentWorkouts.length > 0) {
                    // Update fitness goal progress
                    const targetWorkouts = goal.target || 20; // Default target
                    const progress = Math.min((recentWorkouts.length / targetWorkouts) * 100, 100);
                    
                    if (progress > goal.progress) {
                        goal.progress = progress;
                        goal.lastUpdated = new Date().toISOString();
                        goal.source = 'fitness_sync';
                    }
                }
            }
        });

        // Save updated goals
        StorageUtils.set('goals_list', goals);
    }

    /**
     * Sync journal to goals
     */
    syncJournalToGoals(journalData, goalData) {
        if (!journalData.entries || !goalData.list) return;

        const entries = journalData.entries;
        const goals = goalData.list;

        // Analyze journal entries for goal-related insights
        const recentEntries = this.getRecentEntries(entries, 7);
        
        goals.forEach(goal => {
            const goalMentions = recentEntries.filter(entry =>
                this.isRelated(entry.content, goal.title) ||
                this.isRelated(entry.content, goal.description)
            );

            if (goalMentions.length > 0) {
                // Add insight to goal
                goal.insights = goal.insights || [];
                
                const insight = {
                    date: new Date().toISOString(),
                    source: 'journal',
                    text: `Mentioned in ${goalMentions.length} recent journal entries`,
                    sentiment: this.analyzeSentiment(goalMentions)
                };

                // Avoid duplicate insights
                const existing = goal.insights.find(i => 
                    i.source === 'journal' && 
                    Math.abs(new Date(i.date) - new Date()) < 86400000 // 24 hours
                );

                if (!existing) {
                    goal.insights.push(insight);
                    goal.lastUpdated = new Date().toISOString();
                }
            }
        });

        // Save updated goals
        StorageUtils.set('goals_list', goals);
    }

    /**
     * Sync finance to goals
     */
    syncFinanceToGoals(financeData, goalData) {
        if (!financeData.transactions || !goalData.list) return;

        const transactions = financeData.transactions;
        const goals = goalData.list;

        goals.forEach(goal => {
            if (goal.category === 'financial' || goal.category === 'money') {
                // Calculate savings/spending progress
                const recentTransactions = this.getRecentTransactions(transactions, 30);
                const savings = this.calculateSavings(recentTransactions);
                
                if (goal.type === 'savings' && savings > 0) {
                    const targetAmount = goal.target || 1000;
                    const progress = Math.min((savings / targetAmount) * 100, 100);
                    
                    if (progress > goal.progress) {
                        goal.progress = progress;
                        goal.lastUpdated = new Date().toISOString();
                        goal.source = 'finance_sync';
                    }
                }
            }
        });

        // Save updated goals
        StorageUtils.set('goals_list', goals);
    }

    /**
     * Sync tasks to habits
     */
    syncTasksToHabits(taskData, habitData) {
        if (!taskData.tasks || !habitData.list) return;

        const tasks = taskData.tasks;
        const habits = habitData.list;

        // Find recurring completed tasks that could become habits
        const recurringTasks = tasks.filter(task => 
            task.recurring && 
            task.completed && 
            this.isRecurringPattern(task)
        );

        recurringTasks.forEach(task => {
            // Check if habit already exists
            const existingHabit = habits.find(habit => 
                this.isRelated(habit.name, task.text)
            );

            if (!existingHabit) {
                // Suggest creating a habit
                this.emit('habitSuggestion', {
                    task: task,
                    suggestedHabit: {
                        name: task.text,
                        description: `Converted from recurring task: ${task.text}`,
                        frequency: 'daily',
                        category: task.category || 'general',
                        source: 'task_conversion'
                    }
                });
            }
        });
    }

    /**
     * Sync habits to tasks
     */
    syncHabitsToTasks(habitData, taskData) {
        if (!habitData.list || !taskData.tasks) return;

        const habits = habitData.list;
        const tasks = taskData.tasks;
        const today = new Date().toDateString();

        habits.forEach(habit => {
            if (habit.active !== false && habit.frequency === 'daily') {
                // Check if today's task already exists
                const existingTask = tasks.find(task =>
                    this.isRelated(task.text, habit.name) &&
                    task.date === today
                );

                if (!existingTask && !this.isHabitCompletedToday(habit)) {
                    // Create daily task for habit
                    const habitTask = {
                        id: `habit_${habit.id}_${Date.now()}`,
                        text: `✅ ${habit.name}`,
                        description: `Daily habit: ${habit.description || habit.name}`,
                        completed: false,
                        date: today,
                        category: 'habits',
                        priority: 'medium',
                        source: 'habit_sync',
                        habitId: habit.id
                    };

                    tasks.push(habitTask);
                }
            }
        });

        // Save updated tasks
        StorageUtils.set('todoList_tasks', tasks);
    }

    /**
     * Generate cross-references between modules
     */
    generateCrossReferences() {
        const references = {
            habits: this.findHabitReferences(),
            goals: this.findGoalReferences(),
            fitness: this.findFitnessReferences(),
            finance: this.findFinanceReferences()
        };

        this.emit('crossReferencesGenerated', references);
        return references;
    }

    /**
     * Find habit references in other modules
     */
    findHabitReferences() {
        const habits = this.moduleData.get('habits')?.list || [];
        const references = [];

        habits.forEach(habit => {
            // Find related goals
            const goals = this.moduleData.get('goals')?.list || [];
            const relatedGoals = goals.filter(goal =>
                this.isRelated(habit.name, goal.title) ||
                this.isRelated(habit.description, goal.description)
            );

            // Find related tasks
            const tasks = this.moduleData.get('todoList')?.tasks || [];
            const relatedTasks = tasks.filter(task =>
                this.isRelated(habit.name, task.text) ||
                task.habitId === habit.id
            );

            if (relatedGoals.length || relatedTasks.length) {
                references.push({
                    habit: habit,
                    relatedGoals: relatedGoals,
                    relatedTasks: relatedTasks
                });
            }
        });

        return references;
    }

    /**
     * Find goal references in other modules
     */
    findGoalReferences() {
        const goals = this.moduleData.get('goals')?.list || [];
        const references = [];

        goals.forEach(goal => {
            const relatedData = {
                goal: goal,
                relatedHabits: [],
                relatedTasks: [],
                relatedWorkouts: [],
                relatedTransactions: [],
                relatedEntries: []
            };

            // Find related data in each module
            const habits = this.moduleData.get('habits')?.list || [];
            relatedData.relatedHabits = habits.filter(habit =>
                this.isRelated(habit.name, goal.title) ||
                this.isRelated(habit.description, goal.description)
            );

            const tasks = this.moduleData.get('todoList')?.tasks || [];
            relatedData.relatedTasks = tasks.filter(task =>
                this.isRelated(task.text, goal.title) ||
                this.isRelated(task.description, goal.description)
            );

            // Add more relations as needed
            if (Object.values(relatedData).some(arr => Array.isArray(arr) && arr.length > 0)) {
                references.push(relatedData);
            }
        });

        return references;
    }

    /**
     * Find fitness references
     */
    findFitnessReferences() {
        // Implementation for fitness cross-references
        return [];
    }

    /**
     * Find finance references
     */
    findFinanceReferences() {
        // Implementation for finance cross-references
        return [];
    }

    /**
     * Utility functions
     */

    /**
     * Check if two strings are related
     */
    isRelated(str1, str2) {
        if (!str1 || !str2) return false;
        
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();
        
        // Simple keyword matching
        const keywords1 = s1.split(' ').filter(w => w.length > 3);
        const keywords2 = s2.split(' ').filter(w => w.length > 3);
        
        return keywords1.some(k1 => keywords2.some(k2 => 
            k1.includes(k2) || k2.includes(k1) || 
            this.calculateSimilarity(k1, k2) > 0.7
        ));
    }

    /**
     * Calculate string similarity
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Calculate habit progress
     */
    calculateHabitProgress(habits) {
        const today = new Date();
        const thirtyDaysAgo = new Date(today - 30 * 86400000);
        
        let totalCompletion = 0;
        let totalDays = 0;
        
        habits.forEach(habit => {
            if (habit.entries) {
                for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toDateString();
                    totalDays++;
                    if (habit.entries[dateStr]?.completed) {
                        totalCompletion++;
                    }
                }
            }
        });
        
        return totalDays > 0 ? (totalCompletion / totalDays) * 100 : 0;
    }

    /**
     * Get recent workouts
     */
    getRecentWorkouts(workouts, days) {
        const cutoff = new Date(Date.now() - days * 86400000);
        return workouts.filter(workout => 
            new Date(workout.date) >= cutoff
        );
    }

    /**
     * Get recent entries
     */
    getRecentEntries(entries, days) {
        const cutoff = new Date(Date.now() - days * 86400000);
        return entries.filter(entry => 
            new Date(entry.date) >= cutoff
        );
    }

    /**
     * Get recent transactions
     */
    getRecentTransactions(transactions, days) {
        const cutoff = new Date(Date.now() - days * 86400000);
        return transactions.filter(transaction => 
            new Date(transaction.date) >= cutoff
        );
    }

    /**
     * Calculate savings from transactions
     */
    calculateSavings(transactions) {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        return income - expenses;
    }

    /**
     * Check if task has recurring pattern
     */
    isRecurringPattern(task) {
        // Simple heuristic - could be improved
        return task.recurring || 
               (task.text && task.text.toLowerCase().includes('daily')) ||
               (task.description && task.description.toLowerCase().includes('daily'));
    }

    /**
     * Check if habit is completed today
     */
    isHabitCompletedToday(habit) {
        const today = new Date().toDateString();
        return habit.entries?.[today]?.completed || false;
    }

    /**
     * Analyze sentiment of journal entries
     */
    analyzeSentiment(entries) {
        // Simple sentiment analysis
        const positiveWords = ['good', 'great', 'excellent', 'happy', 'progress', 'success', 'achieved'];
        const negativeWords = ['bad', 'terrible', 'failed', 'difficult', 'struggle', 'disappointed'];
        
        let positiveScore = 0;
        let negativeScore = 0;
        
        entries.forEach(entry => {
            const content = entry.content?.toLowerCase() || '';
            positiveWords.forEach(word => {
                if (content.includes(word)) positiveScore++;
            });
            negativeWords.forEach(word => {
                if (content.includes(word)) negativeScore++;
            });
        });
        
        if (positiveScore > negativeScore) return 'positive';
        if (negativeScore > positiveScore) return 'negative';
        return 'neutral';
    }

    /**
     * Event handling
     */
    on(event, callback) {
        this.eventBus.addEventListener(event, callback);
    }

    emit(event, data) {
        this.eventBus.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    /**
     * Get module insights
     */
    getModuleInsights() {
        return {
            crossReferences: this.generateCrossReferences(),
            suggestions: this.generateSuggestions(),
            statistics: this.generateStatistics()
        };
    }

    /**
     * Generate suggestions based on cross-module data
     */
    generateSuggestions() {
        const suggestions = [];
        
        // Suggest habits based on recurring tasks
        const tasks = this.moduleData.get('todoList')?.tasks || [];
        const recurringTasks = tasks.filter(t => t.recurring && t.completed);
        
        if (recurringTasks.length > 0) {
            suggestions.push({
                type: 'habit_creation',
                title: 'Convert recurring tasks to habits',
                description: `You have ${recurringTasks.length} recurring tasks that could become habits`,
                action: 'create_habits_from_tasks'
            });
        }
        
        // Suggest goals based on habits
        const habits = this.moduleData.get('habits')?.list || [];
        const activeHabits = habits.filter(h => h.active !== false);
        
        if (activeHabits.length > 3) {
            suggestions.push({
                type: 'goal_creation',
                title: 'Set goals for your habits',
                description: `Turn your ${activeHabits.length} active habits into measurable goals`,
                action: 'create_goals_from_habits'
            });
        }
        
        return suggestions;
    }

    /**
     * Generate cross-module statistics
     */
    generateStatistics() {
        return {
            totalConnections: this.crossReferences.size,
            activeModules: this.moduleData.size,
            lastSync: new Date().toISOString(),
            dataHealth: this.calculateDataHealth()
        };
    }

    /**
     * Calculate overall data health
     */
    calculateDataHealth() {
        let totalItems = 0;
        let recentItems = 0;
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        
        this.moduleData.forEach((data, module) => {
            Object.values(data).forEach(value => {
                if (Array.isArray(value)) {
                    totalItems += value.length;
                    recentItems += value.filter(item => 
                        item.date && new Date(item.date) > weekAgo
                    ).length;
                }
            });
        });
        
        return {
            totalItems,
            recentItems,
            activity: totalItems > 0 ? (recentItems / totalItems) * 100 : 0
        };
    }
}

// Create global instance
window.ModuleBridge = new ModuleBridge();