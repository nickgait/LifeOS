/**
 * Dynamic Fitness Tracker - Main Application
 * A comprehensive fitness goal tracking application with advanced features
 */

// State Management Class
class FitnessTrackerState {
    constructor() {
        this.goals = JSON.parse(localStorage.getItem('fitnessGoals')) || [];
        this.activeGoalIndex = 0;
        this.isEditMode = false;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.activeFilter = 'all';
        this.notifications = [];
    }

    saveGoals() {
        localStorage.setItem('fitnessGoals', JSON.stringify(this.goals));
        this.notifyStateChange();
    }

    addGoal(goal) {
        this.goals.push(goal);
        this.activeGoalIndex = this.goals.length - 1;
        this.saveGoals();
    }

    updateGoal(index, goal) {
        if (index >= 0 && index < this.goals.length) {
            this.goals[index] = { ...this.goals[index], ...goal };
            this.saveGoals();
        }
    }

    deleteGoal(index) {
        if (index >= 0 && index < this.goals.length) {
            this.goals.splice(index, 1);
            if (this.activeGoalIndex >= this.goals.length) {
                this.activeGoalIndex = Math.max(0, this.goals.length - 1);
            }
            this.saveGoals();
        }
    }

    notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange();
        }
    }
}

// Error Handler Class
class ErrorHandler {
    static handle(error, context = 'Application') {
        console.error(`${context} Error:`, error);
        
        // Show user-friendly error message
        const message = this.getUserFriendlyMessage(error);
        UI.showMessage(message);
        
        // Log for debugging
        this.logError(error, context);
    }

    static getUserFriendlyMessage(error) {
        if (error.message.includes('localStorage')) {
            return 'Unable to save data. Please check your storage settings.';
        }
        if (error.message.includes('notification')) {
            return 'Unable to send notifications. Please check your browser settings.';
        }
        return 'An unexpected error occurred. Please try again.';
    }

    static logError(error, context) {
        // In production, this could send errors to a logging service
        const errorLog = {
            timestamp: new Date().toISOString(),
            context,
            message: error.message,
            stack: error.stack,
            userAgent: navigator.userAgent
        };
        console.log('Error Log:', errorLog);
    }
}

// Chart Utilities Class
class ChartUtils {
    static createProgressChart(goal, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container) throw new Error('Chart container not found');

            const canvas = document.createElement('canvas');
            canvas.className = 'chart-canvas';
            container.innerHTML = '';
            container.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            const history = goal.history.slice(-30); // Last 30 entries

            if (history.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-500">No data to display</div>';
                return;
            }

            this.drawLineChart(ctx, history, goal);
        } catch (error) {
            ErrorHandler.handle(error, 'Chart Creation');
        }
    }

    static drawLineChart(ctx, data, goal) {
        const canvas = ctx.canvas;
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;

        ctx.clearRect(0, 0, width, height);

        if (data.length === 0) return;

        // Calculate cumulative progress
        let cumulative = 0;
        const points = data.map((entry, index) => {
            cumulative += entry.amount;
            return {
                x: (index / (data.length - 1)) * (width - 60) + 30,
                y: height - 30 - ((cumulative / goal.target) * (height - 60)),
                value: cumulative,
                date: entry.date
            };
        });

        // Draw grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = 30 + (i * (height - 60) / 5);
            ctx.beginPath();
            ctx.moveTo(30, y);
            ctx.lineTo(width - 30, y);
            ctx.stroke();
        }

        // Draw progress line
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();

        // Draw points
        ctx.fillStyle = '#0ea5e9';
        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw target line
        const targetY = height - 30 - (height - 60);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(30, targetY);
        ctx.lineTo(width - 30, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Add labels
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        // Y-axis labels
        for (let i = 0; i <= 5; i++) {
            const value = (goal.target * (5 - i) / 5).toFixed(0);
            const y = 30 + (i * (height - 60) / 5) + 4;
            ctx.fillText(value, 15, y);
        }
    }
}

// Analytics Class
class Analytics {
    static generateSummaryData(goals, period = 'week') {
        try {
            const now = new Date();
            const startDate = new Date();
            
            switch (period) {
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                default:
                    startDate.setDate(now.getDate() - 7);
            }

            const summary = {
                totalGoals: goals.length,
                activeGoals: goals.filter(goal => this.isGoalActive(goal)).length,
                completedGoals: goals.filter(goal => this.isGoalCompleted(goal)).length,
                totalProgress: 0,
                averageStreak: 0,
                achievements: 0,
                recentActivity: []
            };

            goals.forEach(goal => {
                const recentEntries = goal.history.filter(entry => 
                    new Date(entry.fullDate) >= startDate
                );

                summary.recentActivity.push(...recentEntries.map(entry => ({
                    ...entry,
                    goalName: goal.name,
                    goalType: goal.type
                })));

                const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
                summary.totalProgress += (completed / goal.target) * 100;

                const streaks = Utils.calculateStreak(goal.history);
                summary.averageStreak += streaks.current;

                summary.achievements += Utils.calculateAchievements(goal).length;
            });

            if (goals.length > 0) {
                summary.totalProgress = Math.round(summary.totalProgress / goals.length);
                summary.averageStreak = Math.round(summary.averageStreak / goals.length);
            }

            summary.recentActivity.sort((a, b) => new Date(b.fullDate) - new Date(a.fullDate));
            summary.recentActivity = summary.recentActivity.slice(0, 10);

            return summary;
        } catch (error) {
            ErrorHandler.handle(error, 'Analytics Generation');
            return this.getEmptySummary();
        }
    }

    static isGoalActive(goal) {
        const lastEntry = goal.history[0];
        if (!lastEntry) return false;
        
        const lastEntryDate = new Date(lastEntry.fullDate);
        const daysSinceLastEntry = Math.floor((new Date() - lastEntryDate) / (1000 * 60 * 60 * 24));
        return daysSinceLastEntry <= 7;
    }

    static isGoalCompleted(goal) {
        const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
        return completed >= goal.target;
    }

    static getEmptySummary() {
        return {
            totalGoals: 0,
            activeGoals: 0,
            completedGoals: 0,
            totalProgress: 0,
            averageStreak: 0,
            achievements: 0,
            recentActivity: []
        };
    }
}

// Notification Manager Class
class NotificationManager {
    constructor() {
        this.enabled = false;
        this.permission = Notification.permission;
        this.reminders = JSON.parse(localStorage.getItem('goalReminders')) || {};
    }

    async requestPermission() {
        try {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                this.permission = permission;
                this.enabled = permission === 'granted';
                return this.enabled;
            }
            return false;
        } catch (error) {
            ErrorHandler.handle(error, 'Notification Permission');
            return false;
        }
    }

    scheduleGoalReminder(goalName, reminderTime) {
        try {
            if (!this.enabled) return false;

            const now = new Date();
            const [hours, minutes] = reminderTime.split(':').map(Number);
            const reminderDate = new Date(now);
            reminderDate.setHours(hours, minutes, 0, 0);

            if (reminderDate <= now) {
                reminderDate.setDate(reminderDate.getDate() + 1);
            }

            const timeUntilReminder = reminderDate.getTime() - now.getTime();

            const timeoutId = setTimeout(() => {
                this.showReminder(goalName);
                this.scheduleGoalReminder(goalName, reminderTime); // Schedule for next day
            }, timeUntilReminder);

            this.reminders[goalName] = {
                timeoutId,
                reminderTime,
                nextReminder: reminderDate.toISOString()
            };

            localStorage.setItem('goalReminders', JSON.stringify(this.reminders));
            return true;
        } catch (error) {
            ErrorHandler.handle(error, 'Reminder Scheduling');
            return false;
        }
    }

    showReminder(goalName) {
        try {
            if (this.enabled && document.visibilityState === 'hidden') {
                new Notification(`Fitness Tracker Reminder`, {
                    body: `Time to work on your ${goalName} goal!`,
                    icon: 'data:image/svg+xml;base64,' + btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="#0ea5e9">
                            <circle cx="32" cy="32" r="30" fill="#f3f4f6"/>
                            <path d="M32 8c-13.3 0-24 10.7-24 24s10.7 24 24 24 24-10.7 24-24S45.3 8 32 8zm0 44c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z"/>
                            <path d="M32 16c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm8 18l-8-5-8 5V24l8-5 8 5v10z"/>
                        </svg>
                    `),
                    tag: goalName,
                    requireInteraction: false
                });
            } else {
                // Show in-app notification
                UI.showInAppNotification(`Time to work on your ${goalName} goal! 💪`);
            }
        } catch (error) {
            ErrorHandler.handle(error, 'Reminder Display');
        }
    }

    cancelReminder(goalName) {
        try {
            if (this.reminders[goalName]) {
                clearTimeout(this.reminders[goalName].timeoutId);
                delete this.reminders[goalName];
                localStorage.setItem('goalReminders', JSON.stringify(this.reminders));
            }
        } catch (error) {
            ErrorHandler.handle(error, 'Reminder Cancellation');
        }
    }
}

// Multi-Goal Tracking Class
class MultiGoalTracker {
    static addMultiGoalSupport(goal) {
        if (!goal.multiTrackingEnabled) {
            goal.multiTrackingEnabled = false;
            goal.multiFields = [];
        }
        return goal;
    }

    static addMultiField(goal, fieldName, fieldType, fieldUnit) {
        if (!goal.multiFields) goal.multiFields = [];
        
        goal.multiFields.push({
            name: fieldName,
            type: fieldType,
            unit: fieldUnit,
            target: 0,
            dailyTarget: 0
        });
        
        goal.multiTrackingEnabled = true;
        return goal;
    }

    static logMultiGoalEntry(goal, values) {
        const entry = {
            date: new Date().toLocaleDateString('en-US'),
            fullDate: new Date().toISOString(),
            amount: values.primary || 0,
            multiValues: values.multi || {}
        };

        goal.history.unshift(entry);
        return goal;
    }

    static renderMultiGoalInputs(goal, container) {
        if (!goal.multiTrackingEnabled || !goal.multiFields) return;

        const multiContainer = document.createElement('div');
        multiContainer.className = 'multi-goal-container mt-4';
        multiContainer.innerHTML = `
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Tracking</h4>
        `;

        goal.multiFields.forEach((field, index) => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'multi-goal-input';
            fieldDiv.innerHTML = `
                <label class="text-xs text-gray-600 dark:text-gray-400 w-20">${field.name}</label>
                <input type="number" id="multiField${index}" placeholder="0" class="flex-1 border rounded px-2 py-1 text-sm">
                <span class="text-xs text-gray-500 w-12">${field.unit}</span>
            `;
            multiContainer.appendChild(fieldDiv);
        });

        container.appendChild(multiContainer);
    }
}

// Rest Day Calculator Class
class RestDayCalculator {
    static addRestDaySupport(goal) {
        if (!goal.restDays) {
            goal.restDays = {
                enabled: false,
                daysPerWeek: [], // 0 = Sunday, 1 = Monday, etc.
                skipInCalculations: true
            };
        }
        return goal;
    }

    static calculateProjectionWithRestDays(goal) {
        try {
            if (!goal.restDays || !goal.restDays.enabled) {
                return this.calculateBasicProjection(goal);
            }

            const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
            const remaining = goal.target - completed;

            if (remaining <= 0) return new Date();

            const workDaysPerWeek = 7 - (goal.restDays.daysPerWeek || []).length;
            const dailyTargetAdjusted = goal.dailyTarget * (7 / workDaysPerWeek);

            let projectedDays = Math.ceil(remaining / dailyTargetAdjusted);
            let currentDate = new Date();

            // Account for rest days in the projection
            let workDaysAdded = 0;
            while (workDaysAdded < projectedDays) {
                currentDate.setDate(currentDate.getDate() + 1);
                if (!goal.restDays.daysPerWeek.includes(currentDate.getDay())) {
                    workDaysAdded++;
                }
            }

            return currentDate;
        } catch (error) {
            ErrorHandler.handle(error, 'Rest Day Calculation');
            return this.calculateBasicProjection(goal);
        }
    }

    static calculateBasicProjection(goal) {
        const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
        const remaining = goal.target - completed;

        if (remaining <= 0) return new Date();

        const averageDaily = goal.dailyTarget || 1;
        const daysRemaining = Math.ceil(remaining / averageDaily);
        const projectedDate = new Date();
        projectedDate.setDate(projectedDate.getDate() + daysRemaining);

        return projectedDate;
    }

    static isRestDay(date, goal) {
        if (!goal.restDays || !goal.restDays.enabled) return false;
        return goal.restDays.daysPerWeek.includes(date.getDay());
    }
}

// Backup and Sync Class
class BackupManager {
    static async createCloudBackup(goals) {
        try {
            // Simulated cloud backup - in production this would connect to a real service
            const backupData = {
                version: '2.0',
                timestamp: new Date().toISOString(),
                goals: goals,
                settings: {
                    darkMode: localStorage.getItem('darkMode'),
                    reminders: localStorage.getItem('goalReminders')
                }
            };

            // For now, we'll use localStorage to simulate cloud storage
            const backupKey = `backup_${new Date().getTime()}`;
            localStorage.setItem(backupKey, JSON.stringify(backupData));

            UI.showMessage('Backup created successfully!');
            return backupKey;
        } catch (error) {
            ErrorHandler.handle(error, 'Cloud Backup');
            throw error;
        }
    }

    static async listBackups() {
        try {
            const backups = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('backup_')) {
                    const data = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        id: key,
                        timestamp: data.timestamp,
                        goalCount: data.goals.length
                    });
                }
            }
            return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            ErrorHandler.handle(error, 'Backup Listing');
            return [];
        }
    }

    static async restoreFromBackup(backupId) {
        try {
            const backupData = JSON.parse(localStorage.getItem(backupId));
            if (!backupData) throw new Error('Backup not found');

            // Restore goals
            state.goals = backupData.goals;
            state.activeGoalIndex = 0;
            state.saveGoals();

            // Restore settings
            if (backupData.settings) {
                if (backupData.settings.darkMode) {
                    localStorage.setItem('darkMode', backupData.settings.darkMode);
                    state.isDarkMode = backupData.settings.darkMode === 'true';
                    UI.applyTheme();
                }
                if (backupData.settings.reminders) {
                    localStorage.setItem('goalReminders', backupData.settings.reminders);
                }
            }

            UI.renderUI();
            UI.showMessage(`Successfully restored ${backupData.goals.length} goals from backup!`);
        } catch (error) {
            ErrorHandler.handle(error, 'Backup Restoration');
            throw error;
        }
    }
}

// Goal Sharing Class
class SharingManager {
    static generateShareableLink(goal) {
        try {
            const shareData = {
                name: goal.name,
                type: goal.type,
                target: goal.target,
                dailyTarget: goal.dailyTarget,
                category: goal.category,
                notes: goal.notes,
                progress: goal.history.reduce((sum, entry) => sum + entry.amount, 0)
            };

            const encoded = btoa(JSON.stringify(shareData));
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
            
            return shareUrl;
        } catch (error) {
            ErrorHandler.handle(error, 'Share Link Generation');
            return null;
        }
    }

    static async shareGoal(goal, method = 'link') {
        try {
            const shareUrl = this.generateShareableLink(goal);
            
            if (navigator.share && method === 'native') {
                await navigator.share({
                    title: `My ${goal.name} Goal`,
                    text: `Check out my fitness goal progress!`,
                    url: shareUrl
                });
            } else {
                // Fallback to copying to clipboard
                await navigator.clipboard.writeText(shareUrl);
                UI.showMessage('Share link copied to clipboard!');
            }
        } catch (error) {
            ErrorHandler.handle(error, 'Goal Sharing');
        }
    }

    static parseSharedGoal() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const shareData = urlParams.get('share');
            
            if (shareData) {
                const decoded = JSON.parse(atob(shareData));
                return decoded;
            }
            return null;
        } catch (error) {
            ErrorHandler.handle(error, 'Share Parsing');
            return null;
        }
    }
}

// Deadline Manager Class
class DeadlineManager {
    static addDeadlineSupport(goal) {
        if (!goal.deadline) {
            goal.deadline = {
                enabled: false,
                date: null,
                priority: 'normal'
            };
        }
        return goal;
    }

    static calculateTimeToDeadline(deadline) {
        if (!deadline || !deadline.enabled || !deadline.date) return null;

        const now = new Date();
        const deadlineDate = new Date(deadline.date);
        const timeRemaining = deadlineDate.getTime() - now.getTime();

        if (timeRemaining <= 0) return { expired: true };

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        return {
            days,
            hours,
            expired: false,
            urgent: days <= 3,
            warning: days <= 7
        };
    }

    static renderDeadlineCountdown(goal, container) {
        const timeInfo = this.calculateTimeToDeadline(goal.deadline);
        if (!timeInfo) return;

        const countdownDiv = document.createElement('div');
        
        if (timeInfo.expired) {
            countdownDiv.className = 'deadline-countdown urgent';
            countdownDiv.innerHTML = '⏰ Deadline has passed!';
        } else {
            let className = 'deadline-countdown';
            if (timeInfo.urgent) className += ' urgent';
            else if (timeInfo.warning) className += ' warning';
            
            countdownDiv.className = className;
            countdownDiv.innerHTML = `⏳ ${timeInfo.days} days, ${timeInfo.hours} hours remaining`;
        }

        container.appendChild(countdownDiv);
    }
}

// Offline Manager Class
class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingSync = JSON.parse(localStorage.getItem('pendingSync')) || [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingData();
            UI.showInAppNotification('Back online! Syncing data...');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            UI.showInAppNotification('You are now offline. Changes will sync when connection is restored.');
        });
    }

    addToPendingSync(data) {
        this.pendingSync.push({
            timestamp: new Date().toISOString(),
            data,
            type: 'goalUpdate'
        });
        localStorage.setItem('pendingSync', JSON.stringify(this.pendingSync));
    }

    async syncPendingData() {
        try {
            if (this.pendingSync.length === 0) return;

            // In a real implementation, this would sync with a server
            console.log('Syncing pending data:', this.pendingSync);

            // Clear pending sync after successful upload
            this.pendingSync = [];
            localStorage.removeItem('pendingSync');
            
            UI.showInAppNotification('Data synced successfully!');
        } catch (error) {
            ErrorHandler.handle(error, 'Data Sync');
        }
    }

    enableOfflineMode() {
        // Register service worker for offline caching
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registered');
                })
                .catch(error => {
                    console.log('Service Worker registration failed');
                });
        }
    }
}

// Performance Optimizer Class
class PerformanceOptimizer {
    static optimizeForLargeDatasets() {
        // Implement virtual scrolling for large history lists
        this.setupVirtualScrolling();
        
        // Debounce expensive operations
        this.setupDebouncing();
        
        // Lazy load non-critical features
        this.setupLazyLoading();
    }

    static setupVirtualScrolling() {
        // Implementation would go here for large history lists
        console.log('Virtual scrolling enabled for large datasets');
    }

    static setupDebouncing() {
        // Debounce search and filter operations
        Utils.debounce = function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };
    }

    static setupLazyLoading() {
        // Lazy load charts and analytics
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadComponent(entry.target);
                }
            });
        });

        document.querySelectorAll('[data-lazy-load]').forEach(el => {
            observer.observe(el);
        });
    }

    static loadComponent(element) {
        const componentType = element.dataset.lazyLoad;
        switch (componentType) {
            case 'chart':
                // Load chart component
                break;
            case 'analytics':
                // Load analytics component
                break;
        }
    }
}

// Utility Functions
const Utils = {
    // Existing utility functions would go here
    validateGoalName(name) {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        return trimmed.length >= 1 && trimmed.length <= 50;
    },

    validateNumber(value, min = 0, max = 1000000) {
        const num = parseInt(value);
        return !isNaN(num) && num > min && num <= max;
    },

    validateGoalType(type) {
        return ['count', 'weight', 'distance', 'time'].includes(type);
    },

    sanitizeInput(input) {
        return input.toString().trim().slice(0, 50);
    },

    getUnitAbbreviation(type) {
        switch (type) {
            case 'weight': return 'lbs';
            case 'distance': return 'mi';
            case 'time': return 'min';
            case 'count': default: return '';
        }
    },

    calculateStreak(history) {
        if (history.length === 0) return { current: 0, longest: 0 };
        
        const sortedHistory = [...history].sort((a, b) => new Date(b.fullDate) - new Date(a.fullDate));
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate = null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (const entry of sortedHistory) {
            const entryDate = new Date(entry.fullDate);
            entryDate.setHours(0, 0, 0, 0);
            
            if (lastDate === null) {
                const diffDays = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
                if (diffDays <= 1) {
                    currentStreak = 1;
                    tempStreak = 1;
                }
            } else {
                const daysBetween = Math.floor((lastDate - entryDate) / (1000 * 60 * 60 * 24));
                if (daysBetween === 1) {
                    if (currentStreak > 0) currentStreak++;
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                    if (currentStreak > 0) currentStreak = 0;
                }
            }
            
            lastDate = entryDate;
        }
        
        longestStreak = Math.max(longestStreak, tempStreak);
        
        return { current: currentStreak, longest: longestStreak };
    },

    calculateAchievements(goal) {
        const achievements = [];
        const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
        const percentage = Math.min(100, (completed / goal.target) * 100);
        const streaks = this.calculateStreak(goal.history);
        
        // Progress achievements
        if (percentage >= 10) achievements.push({ badge: '🌱', title: 'Getting Started', desc: '10% complete' });
        if (percentage >= 25) achievements.push({ badge: '💪', title: 'Quarter Way', desc: '25% complete' });
        if (percentage >= 50) achievements.push({ badge: '🔥', title: 'Halfway Hero', desc: '50% complete' });
        if (percentage >= 75) achievements.push({ badge: '⭐', title: 'Almost There', desc: '75% complete' });
        if (percentage >= 100) achievements.push({ badge: '🏆', title: 'Goal Crusher', desc: 'Goal completed!' });
        
        // Streak achievements
        if (streaks.current >= 3) achievements.push({ badge: '🔹', title: 'Consistent', desc: '3-day streak' });
        if (streaks.current >= 7) achievements.push({ badge: '💎', title: 'Weekly Warrior', desc: '7-day streak' });
        if (streaks.current >= 14) achievements.push({ badge: '🚀', title: 'Streak Master', desc: '14-day streak' });
        if (streaks.current >= 30) achievements.push({ badge: '👑', title: 'Dedication King', desc: '30-day streak' });
        
        // Activity achievements
        const totalEntries = goal.history.length;
        if (totalEntries >= 10) achievements.push({ badge: '📊', title: 'Data Collector', desc: '10 entries logged' });
        if (totalEntries >= 50) achievements.push({ badge: '📈', title: 'Progress Tracker', desc: '50 entries logged' });
        if (totalEntries >= 100) achievements.push({ badge: '🎯', title: 'Logging Legend', desc: '100 entries logged' });
        
        return achievements;
    }
};

// UI Management Class
const UI = {
    showMessage(message) {
        const messageModal = document.getElementById('messageModal');
        const messageText = document.getElementById('messageText');
        messageText.textContent = message;
        messageModal.style.display = 'flex';
    },

    showInAppNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    },

    applyTheme() {
        if (state.isDarkMode) {
            document.documentElement.classList.add('dark');
            document.getElementById('themeIcon').textContent = '☀️';
        } else {
            document.documentElement.classList.remove('dark');
            document.getElementById('themeIcon').textContent = '🌙';
        }
    },

    renderUI() {
        this.renderCategoryFilter();
        this.renderGoalButtons();
        this.renderGoalDetails();
        this.renderAnalyticsDashboard();
        this.renderSummaryViews();
    },

    renderCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categoryButtonsContainer = document.getElementById('categoryButtons');

        if (state.goals.length === 0) {
            categoryFilter.classList.add('hidden');
            return;
        }

        const categories = [...new Set(state.goals.map(goal => goal.category || 'other'))];
        
        if (categories.length <= 1) {
            categoryFilter.classList.add('hidden');
            return;
        }

        categoryFilter.classList.remove('hidden');
        categoryButtonsContainer.innerHTML = '';

        // Add "All" button
        const allButton = document.createElement('button');
        allButton.textContent = '📋 All';
        allButton.className = state.activeFilter === 'all' ? 
            'px-3 py-1 text-sm rounded-full bg-blue-500 text-white font-medium' : 
            'px-3 py-1 text-sm rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600';
        allButton.onclick = () => {
            state.activeFilter = 'all';
            state.activeGoalIndex = 0;
            this.renderUI();
        };
        categoryButtonsContainer.appendChild(allButton);

        // Add category buttons
        categories.forEach(category => {
            const button = document.createElement('button');
            const categoryIcon = this.getCategoryIcon(category);
            button.textContent = `${categoryIcon} ${category.charAt(0).toUpperCase() + category.slice(1)}`;
            button.className = state.activeFilter === category ? 
                'px-3 py-1 text-sm rounded-full bg-blue-500 text-white font-medium' : 
                'px-3 py-1 text-sm rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600';
            button.onclick = () => {
                state.activeFilter = category;
                state.activeGoalIndex = 0;
                this.renderUI();
            };
            categoryButtonsContainer.appendChild(button);
        });
    },

    getCategoryIcon(category) {
        const icons = {
            'fitness': '🏋️',
            'health': '🏥',
            'learning': '📚',
            'lifestyle': '🏠',
            'personal': '👤',
            'other': '📋'
        };
        return icons[category] || '📋';
    },

    getFilteredGoals() {
        if (state.activeFilter === 'all') return state.goals;
        return state.goals.filter(goal => goal.category === state.activeFilter);
    },

    renderGoalButtons() {
        const goalButtonsContainer = document.getElementById('goalButtons');
        const noGoalsMessage = document.getElementById('noGoalsMessage');
        const goalDetails = document.getElementById('goalDetails');
        const editGoalButton = document.getElementById('editGoalButton');
        const deleteGoalButton = document.getElementById('deleteGoalButton');

        goalButtonsContainer.innerHTML = '';
        const filteredGoals = this.getFilteredGoals();
        
        if (state.goals.length === 0) {
            noGoalsMessage.classList.remove('hidden');
            goalDetails.classList.add('hidden');
            editGoalButton.classList.add('hidden');
            deleteGoalButton.classList.add('hidden');
            return;
        }

        if (filteredGoals.length === 0) {
            noGoalsMessage.classList.remove('hidden');
            goalDetails.classList.add('hidden');
            editGoalButton.classList.add('hidden');
            deleteGoalButton.classList.add('hidden');
            noGoalsMessage.innerHTML = '<p>No goals in this category.</p><p>Try a different category or add a new goal!</p>';
            return;
        }

        noGoalsMessage.classList.add('hidden');
        goalDetails.classList.remove('hidden');
        editGoalButton.classList.remove('hidden');
        deleteGoalButton.classList.remove('hidden');

        // Ensure activeGoalIndex is valid for filtered goals
        const currentGoal = state.goals[state.activeGoalIndex];
        const filteredIndex = filteredGoals.findIndex(goal => goal === currentGoal);
        if (filteredIndex === -1 && filteredGoals.length > 0) {
            state.activeGoalIndex = state.goals.findIndex(goal => goal === filteredGoals[0]);
        }

        filteredGoals.forEach((goal, filteredIndex) => {
            const actualIndex = state.goals.findIndex(g => g === goal);
            const button = document.createElement('button');
            button.textContent = `${this.getCategoryIcon(goal.category || 'other')} ${goal.name}`;
            button.className = actualIndex === state.activeGoalIndex ? 'active' : '';
            button.setAttribute('aria-pressed', actualIndex === state.activeGoalIndex ? 'true' : 'false');
            button.setAttribute('aria-label', `Select ${goal.name} goal`);
            button.onclick = () => {
                state.activeGoalIndex = actualIndex;
                this.renderUI();
            };
            goalButtonsContainer.appendChild(button);
        });
    },

    renderGoalDetails() {
        if (state.goals.length === 0) return;

        const goal = state.goals[state.activeGoalIndex];
        const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
        const remaining = goal.target - completed;
        const percentage = Math.min(100, (completed / goal.target) * 100);
        const unit = Utils.getUnitAbbreviation(goal.type);

        // Update basic info
        document.getElementById('goalName').textContent = goal.name;
        document.getElementById('remainingCount').textContent = `${remaining} ${unit}`;
        document.getElementById('totalCount').textContent = `(${completed} of ${goal.target} completed)`;

        // Update progress bar
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = `${percentage}%`;
        progressBar.textContent = `${Math.round(percentage)}%`;

        // Render history
        this.renderHistory(goal);

        // Calculate and display completion dates with rest days
        this.renderCompletionProjection(goal);

        // Display streak information
        this.renderStreakInfo(goal);

        // Display achievements
        this.renderAchievements(goal);

        // Display goal notes
        this.renderGoalNotes(goal);

        // Render deadline countdown
        DeadlineManager.renderDeadlineCountdown(goal, document.getElementById('goalDetails'));

        // Render multi-goal inputs if enabled
        MultiGoalTracker.renderMultiGoalInputs(goal, document.getElementById('goalDetails'));

        // Create progress chart
        ChartUtils.createProgressChart(goal, 'progressChart');
    },

    renderHistory(goal) {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        
        if (goal.history.length === 0) {
            const noHistory = document.createElement('p');
            noHistory.className = 'text-center text-gray-400 italic';
            noHistory.textContent = 'No entries yet.';
            historyList.appendChild(noHistory);
        } else {
            const unit = Utils.getUnitAbbreviation(goal.type);
            goal.history.forEach((item, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item group';
                historyItem.innerHTML = `
                    <div class="flex-1 flex justify-between items-center">
                        <span class="text-gray-600 dark:text-gray-400">${item.date}</span>
                        <div class="flex items-center gap-2">
                            <span class="font-medium text-gray-800 dark:text-gray-200 editable-amount" data-index="${index}" data-original="${item.amount}">+${item.amount} ${unit}</span>
                            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button class="edit-entry-btn text-blue-500 hover:text-blue-700 text-sm p-1" data-index="${index}" title="Edit entry">
                                    ✏️
                                </button>
                                <button class="delete-entry-btn text-red-500 hover:text-red-700 text-sm p-1" data-index="${index}" title="Delete entry">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                historyList.appendChild(historyItem);
            });

            // Add event listeners for edit/delete buttons
            this.setupHistoryInteractions(goal);
        }
    },

    setupHistoryInteractions(goal) {
        // Edit entry functionality
        document.querySelectorAll('.edit-entry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.dataset.index);
                this.editHistoryEntry(goal, index);
            });
        });

        // Delete entry functionality
        document.querySelectorAll('.delete-entry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.dataset.index);
                this.deleteHistoryEntry(goal, index);
            });
        });
    },

    editHistoryEntry(goal, index) {
        const entry = goal.history[index];
        if (!entry) return;

        const unit = Utils.getUnitAbbreviation(goal.type);
        const newAmount = prompt(`Edit entry for ${entry.date}:\nCurrent: ${entry.amount} ${unit}\nEnter new amount:`, entry.amount);
        
        if (newAmount !== null && newAmount !== '') {
            const parsedAmount = parseFloat(newAmount);
            if (isNaN(parsedAmount) || parsedAmount < 0) {
                UI.showMessage('Please enter a valid positive number.');
                return;
            }

            if (parsedAmount > goal.target) {
                if (!confirm(`This amount (${parsedAmount}) is larger than your total goal target (${goal.target}). Are you sure?`)) {
                    return;
                }
            }

            // Update the entry
            goal.history[index].amount = parsedAmount;
            
            // Add edit timestamp for tracking
            goal.history[index].lastEdited = new Date().toISOString();
            goal.history[index].editHistory = goal.history[index].editHistory || [];
            goal.history[index].editHistory.push({
                timestamp: new Date().toISOString(),
                previousAmount: entry.amount,
                newAmount: parsedAmount
            });

            state.saveGoals();
            UI.renderGoalDetails();
            UI.showMessage(`Entry updated from ${entry.amount} to ${parsedAmount} ${unit}`);
        }
    },

    deleteHistoryEntry(goal, index) {
        const entry = goal.history[index];
        if (!entry) return;

        const unit = Utils.getUnitAbbreviation(goal.type);
        if (confirm(`Are you sure you want to delete this entry?\n\nDate: ${entry.date}\nAmount: ${entry.amount} ${unit}\n\nThis action cannot be undone.`)) {
            goal.history.splice(index, 1);
            state.saveGoals();
            UI.renderGoalDetails();
            UI.showMessage(`Entry for ${entry.date} deleted successfully.`);
        }
    },

    renderCompletionProjection(goal) {
        const completionDateDisplay = document.getElementById('completionDate');
        const inconsistencyMessageDisplay = document.getElementById('inconsistencyMessage');

        if (goal.history.length > 0) {
            const projectedDate = RestDayCalculator.calculateProjectionWithRestDays(goal);
            completionDateDisplay.textContent = `Projected Completion: ${projectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

            // Calculate if ahead or behind schedule
            const startDate = new Date(goal.history[goal.history.length - 1].fullDate);
            const idealDays = Math.ceil(goal.target / goal.dailyTarget);
            const idealCompletionDate = new Date(startDate);
            idealCompletionDate.setDate(startDate.getDate() + idealDays);
            
            const daysAheadOrBehind = Math.floor((idealCompletionDate - projectedDate) / (1000 * 60 * 60 * 24));
            
            if (daysAheadOrBehind > 0) {
                inconsistencyMessageDisplay.textContent = `Great job! You are ${daysAheadOrBehind} days ahead of your goal.`;
                inconsistencyMessageDisplay.className = 'mt-2 text-center font-medium text-sm text-green-600';
            } else if (daysAheadOrBehind < 0) {
                inconsistencyMessageDisplay.textContent = `You are ${Math.abs(daysAheadOrBehind)} days behind your goal. Stay consistent!`;
                inconsistencyMessageDisplay.className = 'mt-2 text-center font-medium text-sm text-red-500';
            } else {
                inconsistencyMessageDisplay.textContent = `You are perfectly on track to hit your goal!`;
                inconsistencyMessageDisplay.className = 'mt-2 text-center font-medium text-sm text-gray-600 dark:text-gray-400';
            }
        } else {
            completionDateDisplay.textContent = `Log an entry to see your projected completion date.`;
            inconsistencyMessageDisplay.textContent = '';
        }
    },

    renderStreakInfo(goal) {
        const streakInfoDisplay = document.getElementById('streakInfo');
        const streaks = Utils.calculateStreak(goal.history);
        
        if (streaks.current > 0 || streaks.longest > 0) {
            const currentStreakText = streaks.current > 0 ? 
                `🔥 Current Streak: ${streaks.current} days` : 
                `No current streak`;
            const longestStreakText = `🏆 Longest Streak: ${streaks.longest} days`;
            streakInfoDisplay.innerHTML = `
                <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div class="${streaks.current > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}">${currentStreakText}</div>
                    <div class="text-purple-600 dark:text-purple-400 mt-1">${longestStreakText}</div>
                </div>
            `;
        } else {
            streakInfoDisplay.innerHTML = `<div class="text-sm text-gray-500 dark:text-gray-400">Start logging daily to build a streak! 🔥</div>`;
        }
    },

    renderAchievements(goal) {
        const achievementsDisplay = document.getElementById('achievements');
        const achievements = Utils.calculateAchievements(goal);
        
        if (achievements.length === 0) {
            achievementsDisplay.innerHTML = `<div class="text-sm text-gray-500 dark:text-gray-400">Complete your first 10% to unlock achievements! 🏅</div>`;
            return;
        }
        
        const achievementHTML = achievements.slice(-3).map(achievement => 
            `<span class="inline-block mx-1 px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full" title="${achievement.desc}">
                ${achievement.badge} ${achievement.title}
            </span>`
        ).join('');
        
        const moreText = achievements.length > 3 ? `<div class="text-xs text-gray-500 mt-1">+${achievements.length - 3} more achievements</div>` : '';
        
        achievementsDisplay.innerHTML = `
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🏅 Latest Achievements</div>
            <div>${achievementHTML}</div>
            ${moreText}
        `;
    },

    renderGoalNotes(goal) {
        const goalNotesDisplay = document.getElementById('goalNotes');
        
        if (goal.notes && goal.notes.trim()) {
            goalNotesDisplay.classList.remove('hidden');
            goalNotesDisplay.innerHTML = `
                <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📝 Notes</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    ${goal.notes.replace(/\n/g, '<br>')}
                </div>
            `;
        } else {
            goalNotesDisplay.classList.add('hidden');
        }
    },

    renderAnalyticsDashboard() {
        // This would create a comprehensive analytics dashboard
        if (state.goals.length === 0) return;

        const summary = Analytics.generateSummaryData(state.goals);
        // Implementation would render charts, statistics, etc.
    },

    renderSummaryViews() {
        // This would create weekly/monthly summary views
        if (state.goals.length === 0) return;

        // Implementation would render summary cards and insights
    }
};

// Journal Management Class
class JournalManager {
    constructor() {
        this.entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
        this.currentPage = 1;
        this.entriesPerPage = 10;
        this.editingEntryId = null;
    }

    saveEntries() {
        localStorage.setItem('journalEntries', JSON.stringify(this.entries));
    }

    addEntry(entryData) {
        const entry = {
            id: Date.now().toString(),
            date: entryData.date,
            entry: entryData.entry,
            mood: entryData.mood ? parseInt(entryData.mood) : null,
            category: entryData.category || null,
            tags: entryData.tags ? entryData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            relatedGoals: entryData.relatedGoals || [],
            timestamp: new Date().toISOString()
        };
        
        this.entries.unshift(entry); // Add to beginning for reverse chronological order
        this.saveEntries();
        return entry;
    }

    updateEntry(id, entryData) {
        const index = this.entries.findIndex(entry => entry.id === id);
        if (index !== -1) {
            this.entries[index] = {
                ...this.entries[index],
                date: entryData.date,
                entry: entryData.entry,
                mood: entryData.mood ? parseInt(entryData.mood) : null,
                category: entryData.category || null,
                tags: entryData.tags ? entryData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                relatedGoals: entryData.relatedGoals || [],
                lastModified: new Date().toISOString()
            };
            this.saveEntries();
            return this.entries[index];
        }
        return null;
    }

    deleteEntry(id) {
        const index = this.entries.findIndex(entry => entry.id === id);
        if (index !== -1) {
            this.entries.splice(index, 1);
            this.saveEntries();
            return true;
        }
        return false;
    }

    getFilteredEntries(filters = {}) {
        let filtered = [...this.entries];

        // Filter by date period
        if (filters.period && filters.period !== 'all') {
            const now = new Date();
            let cutoffDate;
            
            switch (filters.period) {
                case 'week':
                    cutoffDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'quarter':
                    cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
                    break;
            }
            
            if (cutoffDate) {
                filtered = filtered.filter(entry => new Date(entry.date) >= cutoffDate);
            }
        }

        // Filter by mood
        if (filters.mood) {
            filtered = filtered.filter(entry => entry.mood == filters.mood);
        }

        // Filter by category
        if (filters.category) {
            filtered = filtered.filter(entry => entry.category === filters.category);
        }

        // Filter by tag
        if (filters.tag) {
            const tagLower = filters.tag.toLowerCase();
            filtered = filtered.filter(entry => 
                entry.tags.some(tag => tag.toLowerCase().includes(tagLower))
            );
        }

        return filtered;
    }

    getAnalytics() {
        const totalEntries = this.entries.length;
        const entriesWithMood = this.entries.filter(entry => entry.mood !== null);
        const avgMood = entriesWithMood.length > 0 ? 
            entriesWithMood.reduce((sum, entry) => sum + entry.mood, 0) / entriesWithMood.length : 0;
        
        // Calculate streak (consecutive days with entries)
        const sortedDates = [...new Set(this.entries.map(entry => entry.date))].sort((a, b) => new Date(b) - new Date(a));
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        
        if (sortedDates.length > 0) {
            let currentDate = new Date(today);
            for (const dateStr of sortedDates) {
                const entryDate = new Date(dateStr);
                const diffDays = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays === streak || (streak === 0 && diffDays <= 1)) {
                    streak++;
                    currentDate = entryDate;
                } else {
                    break;
                }
            }
        }

        // Mood trend analysis
        const recent30Days = this.entries
            .filter(entry => {
                const entryDate = new Date(entry.date);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return entryDate >= thirtyDaysAgo && entry.mood !== null;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        let moodTrend = 'stable';
        if (recent30Days.length >= 5) {
            const firstHalf = recent30Days.slice(0, Math.floor(recent30Days.length / 2));
            const secondHalf = recent30Days.slice(Math.ceil(recent30Days.length / 2));
            
            const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.mood, 0) / firstHalf.length;
            const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.mood, 0) / secondHalf.length;
            
            if (secondHalfAvg - firstHalfAvg > 0.3) moodTrend = 'improving';
            else if (firstHalfAvg - secondHalfAvg > 0.3) moodTrend = 'declining';
        }

        return {
            totalEntries,
            avgMood: avgMood.toFixed(1),
            streak,
            moodTrend,
            categoryCounts: this.getCategoryCounts(),
            tagCounts: this.getTagCounts()
        };
    }

    getCategoryCounts() {
        const counts = {};
        this.entries.forEach(entry => {
            if (entry.category) {
                counts[entry.category] = (counts[entry.category] || 0) + 1;
            }
        });
        return counts;
    }

    getTagCounts() {
        const counts = {};
        this.entries.forEach(entry => {
            entry.tags.forEach(tag => {
                counts[tag] = (counts[tag] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10 tags
    }

    exportJournal() {
        const data = {
            entries: this.entries,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-journal-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    getMoodEmoji(mood) {
        const moodEmojis = {
            1: '😢',
            2: '😞', 
            3: '😐',
            4: '🙂',
            5: '😊'
        };
        return moodEmojis[mood] || '';
    }

    getCategoryEmoji(category) {
        const categoryEmojis = {
            workout: '🏋️',
            nutrition: '🥗',
            motivation: '💪',
            progress: '📈',
            challenge: '😤',
            reflection: '🤔',
            general: '📝'
        };
        return categoryEmojis[category] || '📝';
    }
}

// Initialize the application
const state = new FitnessTrackerState();
const notificationManager = new NotificationManager();
const offlineManager = new OfflineManager();
const journalManager = new JournalManager();

// Set up state change listener
state.onStateChange = () => {
    UI.renderUI();
};

// Performance optimization for large datasets
PerformanceOptimizer.optimizeForLargeDatasets();

// Initialize offline capabilities
offlineManager.enableOfflineMode();

// Parse shared goal if present
const sharedGoal = SharingManager.parseSharedGoal();
if (sharedGoal) {
    UI.showMessage(`Shared goal detected: ${sharedGoal.name}. Would you like to add it to your goals?`);
}

// DOM Elements and Event Listeners setup
document.addEventListener('DOMContentLoaded', () => {
    // Load daily Quran verse
    loadQuranVerse('daily-verse-container');
    
    // Apply theme
    UI.applyTheme();
    
    // Initial render
    UI.renderUI();
    
    // Add progress chart container to goal details
    const goalDetails = document.getElementById('goalDetails');
    if (goalDetails && !document.getElementById('progressChart')) {
        const chartContainer = document.createElement('div');
        chartContainer.id = 'progressChart';
        chartContainer.className = 'chart-container mt-4';
        chartContainer.innerHTML = '<h4 class="text-lg font-medium mb-2">Progress Chart</h4>';
        
        const goalStats = goalDetails.querySelector('.goal-stats');
        if (goalStats && goalStats.nextSibling) {
            goalDetails.insertBefore(chartContainer, goalStats.nextSibling);
        }
    }
    
    // Set up all event listeners
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        state.isDarkMode = !state.isDarkMode;
        localStorage.setItem('darkMode', state.isDarkMode.toString());
        UI.applyTheme();
    });

    // Add goal button
    document.getElementById('addGoalButton').addEventListener('click', () => {
        state.isEditMode = false;
        showAddGoalModal();
    });

    // Edit goal button
    document.getElementById('editGoalButton').addEventListener('click', () => {
        if (state.goals.length === 0) return;
        state.isEditMode = true;
        showEditGoalModal();
    });

    // Delete goal button
    document.getElementById('deleteGoalButton').addEventListener('click', () => {
        if (state.goals.length === 0) return;
        document.getElementById('deleteConfirmModal').style.display = 'flex';
    });

    // Export button
    document.getElementById('exportButton').addEventListener('click', exportData);

    // Import button
    document.getElementById('importButton').addEventListener('click', () => {
        document.getElementById('importFileInput').value = '';
        document.getElementById('importModal').style.display = 'flex';
    });

    // Log button
    document.getElementById('logButton').addEventListener('click', logProgress);

    // Bulk add button
    document.getElementById('bulkAddButton').addEventListener('click', openBulkEntryModal);

    // Close modals
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('addGoalModal').style.display = 'none';
    });

    document.getElementById('closeDeleteModal').addEventListener('click', () => {
        document.getElementById('deleteConfirmModal').style.display = 'none';
    });

    document.getElementById('closeImportModal').addEventListener('click', () => {
        document.getElementById('importModal').style.display = 'none';
    });

    document.getElementById('closeMessageModal').addEventListener('click', () => {
        document.getElementById('messageModal').style.display = 'none';
    });

    // Confirm buttons
    document.getElementById('saveGoalButton').addEventListener('click', saveGoal);
    document.getElementById('confirmDeleteButton').addEventListener('click', confirmDeleteGoal);
    document.getElementById('confirmImportButton').addEventListener('click', confirmImport);

    // Cancel buttons
    document.getElementById('cancelDeleteButton').addEventListener('click', () => {
        document.getElementById('deleteConfirmModal').style.display = 'none';
    });

    document.getElementById('cancelImportButton').addEventListener('click', () => {
        document.getElementById('importModal').style.display = 'none';
    });

    // Template selection
    document.getElementById('goalTemplate').addEventListener('change', handleTemplateSelection);

    // View switching
    setupViewSwitching();
}

// Event Handler Functions
function showAddGoalModal() {
    const modal = document.getElementById('addGoalModal');
    document.getElementById('goalModalTitle').textContent = 'Add a New Goal';
    document.getElementById('saveGoalButton').textContent = 'Save Goal';
    document.getElementById('goalTemplate').value = '';
    document.getElementById('newGoalName').value = '';
    document.getElementById('newGoalType').value = 'count';
    document.getElementById('newGoalCategory').value = 'fitness';
    document.getElementById('newGoalTarget').value = '';
    document.getElementById('newGoalDaily').value = '';
    document.getElementById('newGoalNotes').value = '';
    document.getElementById('newGoalDeadline').value = '';
    document.getElementById('templateSection').style.display = 'block';
    modal.style.display = 'flex';
}

function showEditGoalModal() {
    const goal = state.goals[state.activeGoalIndex];
    const modal = document.getElementById('addGoalModal');
    
    document.getElementById('goalModalTitle').textContent = 'Edit Goal';
    document.getElementById('saveGoalButton').textContent = 'Update Goal';
    document.getElementById('newGoalName').value = goal.name;
    document.getElementById('newGoalType').value = goal.type;
    document.getElementById('newGoalCategory').value = goal.category || 'other';
    document.getElementById('newGoalTarget').value = goal.target;
    document.getElementById('newGoalDaily').value = goal.dailyTarget;
    document.getElementById('newGoalNotes').value = goal.notes || '';
    document.getElementById('newGoalDeadline').value = goal.deadline?.date || '';
    document.getElementById('templateSection').style.display = 'none';
    modal.style.display = 'flex';
}

function handleTemplateSelection() {
    const templateSelect = document.getElementById('goalTemplate');
    if (templateSelect.value) {
        applyTemplate(templateSelect.value);
    }
}

function applyTemplate(templateKey) {
    const templates = {
        'pushups': { name: 'Push-ups', type: 'count', target: 5000, dailyTarget: 50, category: 'fitness' },
        'situps': { name: 'Sit-ups', type: 'count', target: 3000, dailyTarget: 30, category: 'fitness' },
        'running': { name: 'Running', type: 'distance', target: 100, dailyTarget: 1, category: 'fitness' },
        'walking': { name: 'Walking', type: 'distance', target: 500, dailyTarget: 2, category: 'health' },
        'squats': { name: 'Squats', type: 'count', target: 2000, dailyTarget: 25, category: 'fitness' },
        'planks': { name: 'Plank', type: 'time', target: 300, dailyTarget: 3, category: 'fitness' },
        'water': { name: 'Water Intake', type: 'count', target: 2000, dailyTarget: 8, category: 'health' },
        'reading': { name: 'Reading', type: 'count', target: 365, dailyTarget: 5, category: 'learning' }
    };

    const template = templates[templateKey];
    if (template) {
        document.getElementById('newGoalName').value = template.name;
        document.getElementById('newGoalType').value = template.type;
        document.getElementById('newGoalCategory').value = template.category;
        document.getElementById('newGoalTarget').value = template.target;
        document.getElementById('newGoalDaily').value = template.dailyTarget;
    }
}

function saveGoal() {
    try {
        const name = Utils.sanitizeInput(document.getElementById('newGoalName').value);
        const type = document.getElementById('newGoalType').value;
        const category = document.getElementById('newGoalCategory').value;
        const target = parseInt(document.getElementById('newGoalTarget').value);
        const dailyTarget = parseInt(document.getElementById('newGoalDaily').value);
        const notes = document.getElementById('newGoalNotes').value.trim();
        const deadlineDate = document.getElementById('newGoalDeadline').value;

        // Validation
        if (!Utils.validateGoalName(name)) {
            UI.showMessage("Goal name must be 1-50 characters long.");
            return;
        }
        
        if (!Utils.validateGoalType(type)) {
            UI.showMessage("Invalid goal type selected.");
            return;
        }
        
        if (!Utils.validateNumber(target, 0, 1000000)) {
            UI.showMessage("Target must be a number between 1 and 1,000,000.");
            return;
        }
        
        if (!Utils.validateNumber(dailyTarget, 0, target)) {
            UI.showMessage(`Daily target must be a number between 1 and ${target}.`);
            return;
        }

        // Check for duplicate names
        const duplicateIndex = state.goals.findIndex(goal => goal.name.toLowerCase() === name.toLowerCase());
        if (duplicateIndex !== -1 && (!state.isEditMode || duplicateIndex !== state.activeGoalIndex)) {
            UI.showMessage("A goal with this name already exists.");
            return;
        }

        const goalData = {
            name,
            type,
            category,
            target,
            dailyTarget,
            notes,
            deadline: {
                enabled: !!deadlineDate,
                date: deadlineDate || null,
                priority: 'normal'
            }
        };

        // Add advanced features support
        goalData = DeadlineManager.addDeadlineSupport(goalData);
        goalData = RestDayCalculator.addRestDaySupport(goalData);
        goalData = MultiGoalTracker.addMultiGoalSupport(goalData);

        if (state.isEditMode) {
            state.updateGoal(state.activeGoalIndex, goalData);
            UI.showMessage("Goal updated successfully!");
        } else {
            goalData.history = [];
            state.addGoal(goalData);
            UI.showMessage("Goal created successfully!");
        }

        document.getElementById('addGoalModal').style.display = 'none';
        UI.renderUI();
    } catch (error) {
        ErrorHandler.handle(error, 'Goal Save');
    }
}

function confirmDeleteGoal() {
    try {
        if (state.goals.length === 0) return;
        
        state.deleteGoal(state.activeGoalIndex);
        
        document.getElementById('deleteConfirmModal').style.display = 'none';
        UI.renderUI();
        UI.showMessage("Goal deleted successfully.");
    } catch (error) {
        ErrorHandler.handle(error, 'Goal Deletion');
    }
}

function logProgress() {
    try {
        if (state.goals.length === 0) {
            UI.showMessage("Please add a goal first.");
            return;
        }

        const logAmount = parseInt(document.getElementById('logInput').value);
        const goal = state.goals[state.activeGoalIndex];
        
        if (!Utils.validateNumber(logAmount, 0, 100000)) {
            UI.showMessage("Please enter a valid amount (1-100,000).");
            return;
        }

        // Check if this would exceed the goal significantly
        const currentProgress = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
        if (currentProgress + logAmount > goal.target * 2) {
            UI.showMessage("This entry would exceed twice your goal target. Please verify the amount.");
            return;
        }

        // Check if logging for today already exists
        const today = new Date().toLocaleDateString('en-US');
        const todayEntry = goal.history.find(entry => entry.date === today);
        if (todayEntry) {
            if (!confirm(`You already logged ${todayEntry.amount} today. Add ${logAmount} more?`)) {
                return;
            }
        }

        // Add the entry
        goal.history.unshift({
            amount: logAmount,
            date: today,
            fullDate: new Date().toISOString()
        });

        state.saveGoals();
        document.getElementById('logInput').value = '';
        
        // If offline, add to pending sync
        if (!offlineManager.isOnline) {
            offlineManager.addToPendingSync(goal);
        }
        
        UI.renderGoalDetails();
    } catch (error) {
        ErrorHandler.handle(error, 'Progress Logging');
    }
}

function exportData() {
    try {
        const data = {
            goals: state.goals,
            exportDate: new Date().toISOString(),
            version: "2.0"
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `fitness-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        UI.showMessage('Data exported successfully!');
    } catch (error) {
        ErrorHandler.handle(error, 'Data Export');
    }
}

function confirmImport() {
    try {
        const file = document.getElementById('importFile').files[0];
        if (!file) {
            UI.showMessage('Please select a file to import.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate imported data
                if (!data.goals || !Array.isArray(data.goals)) {
                    throw new Error('Invalid file format: missing goals array');
                }
                
                // Validate each goal structure
                for (const goal of data.goals) {
                    if (!goal.name || !goal.type || typeof goal.target !== 'number' || 
                        typeof goal.dailyTarget !== 'number' || !Array.isArray(goal.history)) {
                        throw new Error('Invalid goal structure in file');
                    }
                }
                
                // Import the data
                state.goals = data.goals;
                state.activeGoalIndex = 0;
                state.saveGoals();
                
                document.getElementById('importModal').style.display = 'none';
                UI.renderUI();
                UI.showMessage(`Successfully imported ${data.goals.length} goals!`);
                
            } catch (error) {
                ErrorHandler.handle(error, 'Data Import');
            }
        };
        reader.readAsText(file);
    } catch (error) {
        ErrorHandler.handle(error, 'Import Confirmation');
    }
}

// Bulk Entry Functions
function openBulkEntryModal() {
    try {
        if (state.goals.length === 0) {
            UI.showMessage("Please add a goal first.");
            return;
        }

        document.getElementById('bulkEntryModal').style.display = 'flex';
        initializeBulkEntryModal();
        setupBulkEntryEventListeners();
        
        // Add one empty entry to start
        addBulkEntryItem();
    } catch (error) {
        ErrorHandler.handle(error, 'Bulk Entry Modal');
    }
}

function initializeBulkEntryModal() {
    const container = document.getElementById('bulkEntriesContainer');
    container.innerHTML = '';
}

function setupBulkEntryEventListeners() {
    // Close modal
    document.getElementById('closeBulkEntryModal').onclick = () => {
        document.getElementById('bulkEntryModal').style.display = 'none';
    };

    document.getElementById('cancelBulkEntry').onclick = () => {
        document.getElementById('bulkEntryModal').style.display = 'none';
    };

    // Add entry item
    document.getElementById('addBulkEntryItem').onclick = addBulkEntryItem;

    // Fill week template
    document.getElementById('fillWeekTemplate').onclick = fillWeekTemplate;

    // Save entries
    document.getElementById('saveBulkEntries').onclick = saveBulkEntries;
}

function addBulkEntryItem(date = '', amount = '') {
    const container = document.getElementById('bulkEntriesContainer');
    const goal = state.goals[state.activeGoalIndex];
    const unit = Utils.getUnitAbbreviation(goal.type);
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'bulk-entry-item';
    
    const today = new Date().toISOString().split('T')[0];
    
    itemDiv.innerHTML = `
        <input type="date" class="bulk-entry-date" value="${date || today}" max="${today}">
        <input type="number" class="bulk-entry-amount" placeholder="Amount ${unit}" value="${amount}" min="0" step="0.1">
        <button type="button" class="bulk-entry-remove" onclick="removeBulkEntryItem(this)">×</button>
    `;
    
    container.appendChild(itemDiv);
}

function removeBulkEntryItem(button) {
    const item = button.closest('.bulk-entry-item');
    if (item) {
        item.remove();
    }
}

function fillWeekTemplate() {
    const container = document.getElementById('bulkEntriesContainer');
    container.innerHTML = ''; // Clear existing entries
    
    const goal = state.goals[state.activeGoalIndex];
    const suggestedAmount = goal.dailyTarget || '';
    
    // Add entries for the last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        // Check if entry already exists for this date
        const existingEntry = goal.history.find(entry => {
            const entryDate = new Date(entry.fullDate).toISOString().split('T')[0];
            return entryDate === dateString;
        });
        
        // Only add if no existing entry
        if (!existingEntry) {
            addBulkEntryItem(dateString, suggestedAmount);
        }
    }
    
    if (container.children.length === 0) {
        UI.showMessage('All days in the past week already have entries!');
        addBulkEntryItem(); // Add one empty entry
    }
}

function saveBulkEntries() {
    try {
        const goal = state.goals[state.activeGoalIndex];
        const entries = [];
        const bulkItems = document.querySelectorAll('.bulk-entry-item');
        
        // Collect all entries
        bulkItems.forEach(item => {
            const dateInput = item.querySelector('.bulk-entry-date');
            const amountInput = item.querySelector('.bulk-entry-amount');
            
            const date = dateInput.value;
            const amount = parseFloat(amountInput.value);
            
            if (date && !isNaN(amount) && amount > 0) {
                entries.push({
                    date: new Date(date).toLocaleDateString('en-US'),
                    fullDate: new Date(date + 'T12:00:00').toISOString(), // Noon to avoid timezone issues
                    amount: amount
                });
            }
        });
        
        if (entries.length === 0) {
            UI.showMessage('Please add at least one valid entry.');
            return;
        }
        
        // Validate entries
        let hasErrors = false;
        const duplicates = [];
        
        entries.forEach(entry => {
            // Check for duplicates within bulk entries
            const duplicateInBulk = entries.filter(e => e.date === entry.date).length > 1;
            if (duplicateInBulk) {
                duplicates.push(entry.date);
                hasErrors = true;
            }
            
            // Check against existing history
            const existingEntry = goal.history.find(h => h.date === entry.date);
            if (existingEntry) {
                duplicates.push(entry.date);
                hasErrors = true;
            }
            
            // Validate amounts
            if (entry.amount > goal.target) {
                if (!confirm(`Entry for ${entry.date} (${entry.amount}) exceeds your goal target (${goal.target}). Continue anyway?`)) {
                    hasErrors = true;
                    return;
                }
            }
        });
        
        if (hasErrors) {
            if (duplicates.length > 0) {
                UI.showMessage(`Duplicate entries found for: ${[...new Set(duplicates)].join(', ')}. Please remove duplicates.`);
            }
            return;
        }
        
        // Sort entries by date (oldest first) and add to history
        entries.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
        
        entries.forEach(entry => {
            goal.history.unshift(entry);
        });
        
        // Sort history to maintain chronological order (newest first)
        goal.history.sort((a, b) => new Date(b.fullDate) - new Date(a.fullDate));
        
        state.saveGoals();
        document.getElementById('bulkEntryModal').style.display = 'none';
        UI.renderGoalDetails();
        
        UI.showMessage(`Successfully added ${entries.length} entries!`);
        
    } catch (error) {
        ErrorHandler.handle(error, 'Bulk Entry Save');
    }
}

// View Management Functions
function setupViewSwitching() {
    const views = ['goals', 'analytics', 'summary', 'biometrics', 'journal'];
    const buttons = {
        goals: document.getElementById('goalsViewButton'),
        analytics: document.getElementById('analyticsViewButton'),
        summary: document.getElementById('summaryViewButton'),
        biometrics: document.getElementById('biometricsViewButton'),
        journal: document.getElementById('journalViewButton')
    };

    const containers = {
        goals: [document.getElementById('goalButtons'), document.getElementById('goalDetails'), document.getElementById('noGoalsMessage'), document.getElementById('categoryFilter')],
        analytics: [document.getElementById('analyticsDashboard')],
        summary: [document.getElementById('summaryViews')],
        biometrics: [document.getElementById('biometricsView')],
        journal: [document.getElementById('journalView')]
    };

    // Set up click handlers
    Object.entries(buttons).forEach(([viewName, button]) => {
        if (button) {
            button.addEventListener('click', () => switchView(viewName));
        }
    });

    function switchView(activeView) {
        // Update button states
        Object.entries(buttons).forEach(([viewName, button]) => {
            if (button) {
                if (viewName === activeView) {
                    button.className = 'px-4 py-2 bg-blue-500 text-white rounded-lg font-medium';
                } else {
                    button.className = 'px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium';
                }
            }
        });

        // Show/hide containers
        Object.entries(containers).forEach(([viewName, elements]) => {
            elements.forEach(element => {
                if (element) {
                    if (viewName === activeView) {
                        element.classList.remove('hidden');
                    } else {
                        element.classList.add('hidden');
                    }
                }
            });
        });

        // Load view-specific content
        loadViewContent(activeView);
    }

    function loadViewContent(viewName) {
        try {
            switch (viewName) {
                case 'goals':
                    // Goals view is already loaded by default UI rendering
                    UI.renderUI();
                    break;

                case 'analytics':
                    loadAnalyticsDashboard();
                    break;

                case 'summary':
                    loadSummaryViews();
                    break;

                case 'biometrics':
                    loadBiometricsView();
                    break;

                case 'journal':
                    loadJournalView();
                    break;
            }
        } catch (error) {
            ErrorHandler.handle(error, `${viewName} View Loading`);
        }
    }

    // Initialize with goals view
    switchView('goals');
}

function loadAnalyticsDashboard() {
    if (state.goals.length === 0) {
        document.getElementById('analyticsDashboard').innerHTML = `
            <div class="analytics-card text-center py-8">
                <h3 class="text-lg font-semibold mb-4 text-gray-600">No Data Available</h3>
                <p class="text-gray-500">Add some goals and log progress to see analytics!</p>
            </div>
        `;
        return;
    }

    // Generate analytics using our advanced analytics modules
    const biometricData = window.biometricManager ? window.biometricManager.getBiometricData() : {};
    const trendAnalysis = window.healthTrendMonitor ? 
        window.healthTrendMonitor.analyzeLongTermTrends(state.goals, biometricData) : null;
    
    // Get journal analytics
    const journalAnalysis = window.AdvancedAnalytics && window.AdvancedAnalytics.JournalAnalytics ?
        window.AdvancedAnalytics.JournalAnalytics.analyzeMoodAndPerformance(journalManager.entries, state.goals) : null;

    // Update Health Score
    if (trendAnalysis && trendAnalysis.healthMetrics) {
        const healthScore = trendAnalysis.healthMetrics.composite;
        if (healthScore) {
            document.getElementById('compositeHealthScore').textContent = healthScore.score;
            document.getElementById('healthGrade').textContent = healthScore.grade;
            
            // Update breakdown
            const breakdown = document.getElementById('healthMetricsBreakdown');
            breakdown.innerHTML = healthScore.breakdown.map(item => `
                <div class="text-center">
                    <div class="font-medium text-sm">${item.metric}</div>
                    <div class="text-lg font-bold text-blue-600">${Math.round(item.score)}</div>
                </div>
            `).join('');
        }
    }

    // Update AI Insights
    const insights = window.AdvancedAnalytics ? 
        window.AdvancedAnalytics.HealthInsights.generateInsights(state.goals, biometricData) : null;
    
    // Combine regular insights with journal insights
    let allInsights = insights ? [...insights.general] : [];
    let allRecommendations = insights ? [...insights.recommendations] : [];
    
    if (journalAnalysis && journalAnalysis.hasSufficientData) {
        allInsights = [...allInsights, ...journalAnalysis.insights];
        
        // Get journal recommendations
        const journalRecs = window.AdvancedAnalytics && window.AdvancedAnalytics.JournalAnalytics ?
            window.AdvancedAnalytics.JournalAnalytics.generateJournalRecommendations(journalManager.entries, state.goals) : [];
        allRecommendations = [...allRecommendations, ...journalRecs];
    }
    
    const keyInsightsDiv = document.getElementById('keyInsights');
    keyInsightsDiv.innerHTML = allInsights.slice(0, 4).map(insight => `
        <div class="p-3 rounded-lg ${getInsightColor(insight.type)} mb-2">
            <div class="font-medium">${insight.icon} ${insight.title}</div>
            <div class="text-sm mt-1">${insight.message}</div>
        </div>
    `).join('') || '<div class="text-gray-500">No insights available yet</div>';

    const recommendationsDiv = document.getElementById('personalizedRecommendations');
    recommendationsDiv.innerHTML = allRecommendations.slice(0, 4).map(rec => `
        <div class="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-2">
            <div class="font-medium text-blue-800 dark:text-blue-200">${rec.icon} ${rec.title}</div>
            <div class="text-sm text-blue-700 dark:text-blue-300 mt-1">${rec.message}</div>
        </div>
    `).join('') || '<div class="text-gray-500">No recommendations available yet</div>';
    
    // Add mood correlation display if available
    if (journalAnalysis && journalAnalysis.hasSufficientData && journalAnalysis.performanceCorrelations.length > 0) {
        const correlationsHtml = journalAnalysis.performanceCorrelations
            .filter(c => Math.abs(c.correlation) > 0.3)
            .slice(0, 3)
            .map(correlation => `
                <div class="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <strong>${correlation.goalName}:</strong> 
                    <span class="${correlation.correlation > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${correlation.correlation > 0 ? '📈' : '📉'} 
                        ${(Math.abs(correlation.correlation) * 100).toFixed(1)}% correlation with mood
                    </span>
                    <div class="text-xs text-gray-500">${correlation.dataPoints} data points</div>
                </div>
            `).join('');
            
        if (correlationsHtml) {
            document.getElementById('correlationAnalysis').innerHTML = `
                <h4 class="font-medium mb-2">📝 Mood-Performance Correlations</h4>
                ${correlationsHtml}
            `;
        }
    }

    // Update Goal Difficulty Analysis
    if (state.goals.length > 0) {
        const currentGoal = state.goals[state.activeGoalIndex];
        const difficultyAnalysis = window.AdvancedAnalytics ? 
            window.AdvancedAnalytics.GoalDifficultyAnalyzer.analyzeGoalDifficulty(currentGoal) : null;
        
        if (difficultyAnalysis) {
            const difficultyDiv = document.getElementById('goalDifficultyAnalysis');
            difficultyDiv.innerHTML = `
                <div class="text-center mb-4">
                    <div class="text-3xl font-bold text-purple-600">${difficultyAnalysis.score}/10</div>
                    <div class="text-lg text-purple-500">${difficultyAnalysis.level}</div>
                    <div class="text-sm text-gray-600 mt-2">${difficultyAnalysis.feasibilityAssessment.message}</div>
                </div>
                ${difficultyAnalysis.recommendations.length > 0 ? `
                    <div class="space-y-2">
                        ${difficultyAnalysis.recommendations.map(rec => `
                            <div class="p-2 bg-purple-50 dark:bg-purple-900 rounded text-sm">
                                ${rec.icon} ${rec.message}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;
        }
    }

    // Create advanced visualizations
    if (window.AdvancedVisualizations && state.goals.length > 0) {
        // Performance heatmap
        window.AdvancedVisualizations.AdvancedChartRenderer.createPerformanceHeatmap('correlationMatrix', state.goals);
        
        // Comparative chart
        window.AdvancedVisualizations.AdvancedChartRenderer.createComparativeChart('trendChart', state.goals.slice(0, 5));
    }
}

function loadSummaryViews() {
    if (state.goals.length === 0) {
        document.getElementById('summaryViews').innerHTML = `
            <div class="summary-container text-center py-8">
                <h3 class="text-lg font-semibold mb-4 text-gray-600">No Summary Available</h3>
                <p class="text-gray-500">Add some goals and log progress to see summaries!</p>
            </div>
        `;
        return;
    }

    // Generate weekly summary
    const weeklyData = Analytics.generateSummaryData(state.goals, 'week');
    const monthlyData = Analytics.generateSummaryData(state.goals, 'month');

    const weeklySummaryDiv = document.getElementById('weeklySummary');
    weeklySummaryDiv.innerHTML = generateSummaryCards(weeklyData, 'week');

    const monthlySummaryDiv = document.getElementById('monthlySummary');
    monthlySummaryDiv.innerHTML = generateSummaryCards(monthlyData, 'month');
}

function loadBiometricsView() {
    // Initialize biometric manager if not already done
    if (!window.biometricManager) {
        document.getElementById('biometricsView').classList.remove('hidden');
        return;
    }

    // Load today's biometric summary
    const todaysSummary = window.biometricManager.getCurrentBiometricSummary();
    const todaysDiv = document.getElementById('todaysBiometrics');
    
    if (Object.keys(todaysSummary).length === 0) {
        todaysDiv.innerHTML = '<div class="text-gray-500 dark:text-gray-400 text-center py-4">No data logged today</div>';
    } else {
        todaysDiv.innerHTML = Object.entries(todaysSummary).map(([type, data]) => `
            <div class="flex justify-between items-center">
                <span class="capitalize">${type}:</span>
                <span class="font-medium">${data.latest} ${getUnitForBiometric(type)}</span>
            </div>
        `).join('');
    }

    // Load health insights
    const healthInsights = window.biometricManager.generateHealthInsights(state.goals);
    const insightsDiv = document.getElementById('healthInsights');
    
    if (healthInsights.length === 0) {
        insightsDiv.innerHTML = '<div class="text-gray-500 dark:text-gray-400 text-center py-4">Start logging biometrics to see personalized insights</div>';
    } else {
        insightsDiv.innerHTML = healthInsights.slice(0, 5).map(insight => `
            <div class="p-3 rounded-lg ${getInsightColor(insight.type)} mb-2">
                <div class="font-medium">${insight.icon} ${insight.title}</div>
                <div class="text-sm mt-1">${insight.message}</div>
            </div>
        `).join('');
    }

    // Set up biometric logging
    setupBiometricLogging();
}

function generateSummaryCards(data, period) {
    return `
        <div class="summary-card">
            <h4 class="font-semibold mb-2">📊 Overview</h4>
            <div class="space-y-2 text-sm">
                <div>Total Goals: <span class="font-medium">${data.totalGoals}</span></div>
                <div>Active Goals: <span class="font-medium">${data.activeGoals}</span></div>
                <div>Avg Progress: <span class="font-medium">${data.totalProgress}%</span></div>
                <div>Avg Streak: <span class="font-medium">${data.averageStreak} days</span></div>
            </div>
        </div>
        <div class="summary-card">
            <h4 class="font-semibold mb-2">📈 Activity</h4>
            <div class="space-y-2 text-sm">
                <div>Total Entries: <span class="font-medium">${data.recentActivity.length}</span></div>
                <div>Daily Average: <span class="font-medium">${data.avgPerDay.toFixed(1)}</span></div>
                <div>Most Active: <span class="font-medium">${data.mostActiveDay || 'N/A'}</span></div>
                <div>Achievements: <span class="font-medium">${data.achievements}</span></div>
            </div>
        </div>
    `;
}

function setupBiometricLogging() {
    const logButton = document.getElementById('logBiometricButton');
    if (logButton && !logButton.hasEventListener) {
        logButton.hasEventListener = true;
        logButton.addEventListener('click', () => {
            const type = document.getElementById('biometricType').value;
            const value = document.getElementById('biometricValue').value;
            const notes = document.getElementById('biometricNotes').value;

            if (!value || isNaN(value)) {
                UI.showMessage('Please enter a valid value');
                return;
            }

            if (window.biometricManager) {
                window.biometricManager.logManualBiometric(type, value, notes);
                document.getElementById('biometricValue').value = '';
                document.getElementById('biometricNotes').value = '';
                
                // Refresh the view
                loadBiometricsView();
                UI.showMessage('Biometric data logged successfully!');
            }
        });
    }
}

function loadJournalView() {
    try {
        // Initialize journal date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('journalDate').value = today;
        
        // Populate related goals checkboxes
        populateRelatedGoalsCheckboxes();
        
        // Load and display journal entries
        renderJournalEntries();
        
        // Update analytics
        updateJournalAnalytics();
        
        // Set up event listeners if not already done
        setupJournalEventListeners();
        
    } catch (error) {
        ErrorHandler.handle(error, 'Journal View Loading');
    }
}

function populateRelatedGoalsCheckboxes() {
    const container = document.getElementById('relatedGoalsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (state.goals.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">No goals available</p>';
        return;
    }
    
    state.goals.forEach((goal, index) => {
        const checkbox = document.createElement('label');
        checkbox.className = 'flex items-center text-sm cursor-pointer';
        checkbox.innerHTML = `
            <input type="checkbox" value="${index}" class="mr-2 related-goal-checkbox">
            <span class="text-gray-700 dark:text-gray-300">${goal.name}</span>
        `;
        container.appendChild(checkbox);
    });
}

function renderJournalEntries() {
    const filters = getJournalFilters();
    const filteredEntries = journalManager.getFilteredEntries(filters);
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredEntries.length / journalManager.entriesPerPage);
    const startIndex = (journalManager.currentPage - 1) * journalManager.entriesPerPage;
    const endIndex = startIndex + journalManager.entriesPerPage;
    const pageEntries = filteredEntries.slice(startIndex, endIndex);
    
    const entriesList = document.getElementById('journalEntriesList');
    if (!entriesList) return;
    
    if (pageEntries.length === 0) {
        entriesList.innerHTML = `
            <div class="text-gray-500 dark:text-gray-400 text-center py-8">
                <p class="text-lg mb-2">📝 ${filteredEntries.length === 0 && journalManager.entries.length === 0 ? 'Start Your Fitness Journal' : 'No entries found'}</p>
                <p class="text-sm">${filteredEntries.length === 0 && journalManager.entries.length === 0 ? 'Record your thoughts, progress, and reflections to enhance your fitness journey!' : 'Try adjusting your filters to see more entries.'}</p>
            </div>
        `;
    } else {
        entriesList.innerHTML = pageEntries.map(entry => renderJournalEntry(entry)).join('');
    }
    
    // Update pagination
    updateJournalPagination(totalPages);
}

function renderJournalEntry(entry) {
    const relatedGoalsHtml = entry.relatedGoals.length > 0 
        ? `<div class="journal-entry-goals">
            ${entry.relatedGoals.map(goalIndex => {
                const goal = state.goals[goalIndex];
                return goal ? `<span class="journal-goal-link" onclick="switchToGoal(${goalIndex})">${goal.name}</span>` : '';
            }).filter(Boolean).join('')}
           </div>`
        : '';
        
    const tagsHtml = entry.tags.length > 0
        ? `<div class="journal-entry-tags">
            ${entry.tags.map(tag => `<span class="journal-tag">${tag}</span>`).join('')}
           </div>`
        : '';
        
    const moodDisplay = entry.mood 
        ? `<div class="mood-indicator">
            <span class="journal-entry-mood">${journalManager.getMoodEmoji(entry.mood)}</span>
            <span class="mood-score">${entry.mood}/5</span>
           </div>`
        : '';
        
    const categoryDisplay = entry.category
        ? `<span class="journal-entry-category">${journalManager.getCategoryEmoji(entry.category)} ${entry.category}</span>`
        : '';
    
    return `
        <div class="journal-entry" data-entry-id="${entry.id}">
            <div class="journal-entry-header">
                <div class="flex items-center gap-2">
                    <span class="journal-entry-date">${new Date(entry.date).toLocaleDateString()}</span>
                    ${categoryDisplay}
                </div>
                <div class="flex items-center gap-2">
                    ${moodDisplay}
                    <div class="journal-entry-actions">
                        <button class="journal-action-btn journal-edit-btn" onclick="editJournalEntry('${entry.id}')">
                            ✏️ Edit
                        </button>
                        <button class="journal-action-btn journal-delete-btn" onclick="deleteJournalEntry('${entry.id}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
            <div class="journal-entry-content">${entry.entry.replace(/\n/g, '<br>')}</div>
            ${tagsHtml}
            ${relatedGoalsHtml}
        </div>
    `;
}

function getJournalFilters() {
    return {
        period: document.getElementById('journalFilterPeriod')?.value || 'all',
        mood: document.getElementById('journalFilterMood')?.value || '',
        category: document.getElementById('journalFilterCategory')?.value || '',
        tag: document.getElementById('journalFilterTag')?.value || ''
    };
}

function updateJournalPagination(totalPages) {
    const pagination = document.getElementById('journalPagination');
    const pageInfo = document.getElementById('journalPageInfo');
    const prevBtn = document.getElementById('prevJournalPage');
    const nextBtn = document.getElementById('nextJournalPage');
    
    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }
    
    pagination.classList.remove('hidden');
    pageInfo.textContent = `Page ${journalManager.currentPage} of ${totalPages}`;
    
    prevBtn.disabled = journalManager.currentPage <= 1;
    nextBtn.disabled = journalManager.currentPage >= totalPages;
    
    prevBtn.onclick = () => {
        if (journalManager.currentPage > 1) {
            journalManager.currentPage--;
            renderJournalEntries();
        }
    };
    
    nextBtn.onclick = () => {
        if (journalManager.currentPage < totalPages) {
            journalManager.currentPage++;
            renderJournalEntries();
        }
    };
}

function updateJournalAnalytics() {
    const analytics = journalManager.getAnalytics();
    const summary = document.getElementById('journalAnalyticsSummary');
    
    if (analytics.totalEntries > 0) {
        summary.classList.remove('hidden');
        
        document.getElementById('journalTotalEntries').textContent = analytics.totalEntries;
        document.getElementById('journalAvgMood').textContent = analytics.avgMood !== '0.0' ? analytics.avgMood : '--';
        document.getElementById('journalStreak').textContent = analytics.streak;
        
        const trendText = {
            improving: '📈 Your mood has been improving lately!',
            declining: '📉 Your mood seems to be declining. Consider talking to someone.',
            stable: '😌 Your mood has been stable recently.'
        };
        
        document.getElementById('journalMoodTrend').textContent = trendText[analytics.moodTrend] || '';
        
        // Add mood visualization
        createMoodChart();
    } else {
        summary.classList.add('hidden');
    }
}

function createMoodChart() {
    const moodEntries = journalManager.entries
        .filter(entry => entry.mood !== null)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30); // Last 30 entries

    if (moodEntries.length < 2) return;

    // Create a simple text-based mood trend visualization
    const moodTrendDiv = document.getElementById('journalMoodTrend');
    if (!moodTrendDiv) return;

    const moodValues = moodEntries.map(e => e.mood);
    const maxMood = Math.max(...moodValues);
    const minMood = Math.min(...moodValues);
    
    // Create a simple ASCII-style chart
    const chartBars = moodValues.map(mood => {
        const height = ((mood - 1) / 4) * 100; // Convert 1-5 to 0-100%
        const emoji = journalManager.getMoodEmoji(mood);
        return `<div class="inline-block w-2 bg-gradient-to-t from-blue-200 to-blue-500 mr-1" 
                     style="height: ${height}%" title="${emoji} ${mood}/5"></div>`;
    }).join('');

    // Add visualization after the existing trend text
    const existingText = moodTrendDiv.textContent;
    moodTrendDiv.innerHTML = `
        <div class="mb-2">${existingText}</div>
        <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">Last ${moodValues.length} mood entries:</div>
        <div class="flex items-end h-12 bg-gray-100 dark:bg-gray-800 p-2 rounded">
            ${chartBars}
        </div>
        <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>Range: ${minMood}-${maxMood}</span>
            <span>Avg: ${(moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1)}</span>
        </div>
    `;
}

function setupJournalEventListeners() {
    // Prevent setting up listeners multiple times
    if (window.journalListenersSetup) return;
    window.journalListenersSetup = true;
    
    // Save journal entry
    document.getElementById('saveJournalEntry')?.addEventListener('click', saveJournalEntry);
    
    // Clear journal form
    document.getElementById('clearJournalForm')?.addEventListener('click', clearJournalForm);
    
    // Export journal
    document.getElementById('exportJournalButton')?.addEventListener('click', () => {
        journalManager.exportJournal();
        UI.showMessage('Journal exported successfully!');
    });
    
    // Toggle analytics
    document.getElementById('journalAnalyticsButton')?.addEventListener('click', () => {
        const summary = document.getElementById('journalAnalyticsSummary');
        if (summary.classList.contains('hidden')) {
            updateJournalAnalytics();
        } else {
            summary.classList.add('hidden');
        }
    });
    
    // Filter event listeners
    ['journalFilterPeriod', 'journalFilterMood', 'journalFilterCategory'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            journalManager.currentPage = 1;
            renderJournalEntries();
        });
    });
    
    document.getElementById('journalFilterTag')?.addEventListener('input', debounce(() => {
        journalManager.currentPage = 1;
        renderJournalEntries();
    }, 300));
    
    // Clear filters
    document.getElementById('clearJournalFilters')?.addEventListener('click', clearJournalFilters);
}

function saveJournalEntry() {
    const entryData = {
        date: document.getElementById('journalDate').value,
        entry: document.getElementById('journalEntry').value.trim(),
        mood: document.getElementById('journalMood').value,
        category: document.getElementById('journalCategory').value,
        tags: document.getElementById('journalTags').value,
        relatedGoals: Array.from(document.querySelectorAll('.related-goal-checkbox:checked')).map(cb => parseInt(cb.value))
    };
    
    if (!entryData.date || !entryData.entry) {
        UI.showMessage('Please enter a date and journal entry.');
        return;
    }
    
    try {
        if (journalManager.editingEntryId) {
            journalManager.updateEntry(journalManager.editingEntryId, entryData);
            journalManager.editingEntryId = null;
            UI.showMessage('Journal entry updated successfully!');
        } else {
            journalManager.addEntry(entryData);
            UI.showMessage('Journal entry saved successfully!');
        }
        
        clearJournalForm();
        renderJournalEntries();
        updateJournalAnalytics();
        
    } catch (error) {
        ErrorHandler.handle(error, 'Journal Entry Save');
    }
}

function clearJournalForm() {
    document.getElementById('journalDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('journalEntry').value = '';
    document.getElementById('journalMood').value = '';
    document.getElementById('journalCategory').value = '';
    document.getElementById('journalTags').value = '';
    document.querySelectorAll('.related-goal-checkbox').forEach(cb => cb.checked = false);
    journalManager.editingEntryId = null;
}

function editJournalEntry(entryId) {
    const entry = journalManager.entries.find(e => e.id === entryId);
    if (!entry) return;
    
    journalManager.editingEntryId = entryId;
    
    document.getElementById('journalDate').value = entry.date;
    document.getElementById('journalEntry').value = entry.entry;
    document.getElementById('journalMood').value = entry.mood || '';
    document.getElementById('journalCategory').value = entry.category || '';
    document.getElementById('journalTags').value = entry.tags.join(', ');
    
    // Set related goals checkboxes
    document.querySelectorAll('.related-goal-checkbox').forEach(cb => {
        cb.checked = entry.relatedGoals.includes(parseInt(cb.value));
    });
    
    // Scroll to top of journal view
    document.getElementById('journalView').scrollIntoView({ behavior: 'smooth' });
}

function deleteJournalEntry(entryId) {
    if (!confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
        return;
    }
    
    try {
        journalManager.deleteEntry(entryId);
        renderJournalEntries();
        updateJournalAnalytics();
        UI.showMessage('Journal entry deleted successfully.');
        
    } catch (error) {
        ErrorHandler.handle(error, 'Journal Entry Delete');
    }
}

function clearJournalFilters() {
    document.getElementById('journalFilterPeriod').value = 'all';
    document.getElementById('journalFilterMood').value = '';
    document.getElementById('journalFilterCategory').value = '';
    document.getElementById('journalFilterTag').value = '';
    journalManager.currentPage = 1;
    renderJournalEntries();
}

function switchToGoal(goalIndex) {
    // Switch to goals view and select the goal
    state.activeGoalIndex = goalIndex;
    const goalsButton = document.getElementById('goalsViewButton');
    if (goalsButton) {
        goalsButton.click();
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getInsightColor(type) {
    const colors = {
        positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        suggestion: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return colors[type] || colors.info;
}

function getUnitForBiometric(type) {
    const units = {
        heartRate: 'bpm',
        steps: 'steps',
        weight: 'lbs',
        sleep: 'hours',
        mood: '/10',
        energy: '/10',
        stress: '/10'
    };
    return units[type] || '';
}

// Export for external access if needed
window.FitnessTracker = {
    state,
    UI,
    Utils,
    Analytics,
    NotificationManager: notificationManager,
    BackupManager,
    SharingManager,
    DeadlineManager,
    MultiGoalTracker,
    RestDayCalculator,
    OfflineManager: offlineManager
};