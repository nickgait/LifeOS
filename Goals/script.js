class GoalsTracker {
    constructor() {
        this.goals = this.loadGoals();
        this.currentGoal = null;
        this.milestoneCounter = 0;
        this.initializeApp();
    }

    initializeApp() {
        this.updateDateDisplay();
        this.renderGoals();
        this.updateStats();
        this.bindEvents();
        this.addPerformanceOptimizations();
    }

    bindEvents() {
        // Form events
        document.getElementById('goal-form').addEventListener('submit', (e) => this.handleSaveGoal(e));
        document.getElementById('add-goal-btn').addEventListener('click', () => this.showAddForm());
        document.getElementById('add-milestone-btn').addEventListener('click', () => this.addMilestoneField());

        // Filter and search events
        document.getElementById('search-input').addEventListener('input', () => this.filterGoals());
        document.getElementById('status-filter').addEventListener('change', () => this.filterGoals());
        document.getElementById('category-filter').addEventListener('change', () => this.filterGoals());

        // Export/Import events
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-btn').addEventListener('click', () => this.triggerImport());
        document.getElementById('import-file').addEventListener('change', (e) => this.importData(e));

        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('goal-detail-modal')) {
                this.closeDetailModal();
            }
        });

        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('goal-target-date').setAttribute('min', today);

        // Keyboard shortcuts
        this.bindKeyboardShortcuts();
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            switch(e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    this.showAddForm();
                    break;
                case 'f':
                    e.preventDefault();
                    document.getElementById('search-input').focus();
                    break;
                case 'escape':
                    e.preventDefault();
                    if (document.getElementById('goal-detail-modal').classList.contains('active')) {
                        this.closeDetailModal();
                    } else if (document.getElementById('goal-form-section').classList.contains('active')) {
                        this.cancelForm();
                    }
                    break;
                case 'e':
                    if (this.currentGoal && document.getElementById('goal-detail-modal').classList.contains('active')) {
                        e.preventDefault();
                        this.editGoal();
                    }
                    break;
            }
        });
    }

    addPerformanceOptimizations() {
        // Save data when tab becomes inactive
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveGoals();
            }
        });

        // Save data before page closes
        window.addEventListener('beforeunload', () => {
            this.saveGoals();
        });
    }

    updateDateDisplay() {
        const dateElement = document.getElementById('current-date');
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = today.toLocaleDateString('en-US', options);
    }

    // Goal Form Management
    showAddForm() {
        this.currentGoal = null;
        this.resetForm();
        document.getElementById('form-title').textContent = 'Add New Goal';
        document.getElementById('goal-form-section').classList.add('active');
        document.getElementById('goal-title').focus();
    }

    showEditForm(goalId) {
        this.currentGoal = this.goals.find(g => g.id === goalId);
        if (!this.currentGoal) return;

        this.populateForm(this.currentGoal);
        document.getElementById('form-title').textContent = 'Edit Goal';
        document.getElementById('goal-form-section').classList.add('active');
        this.closeDetailModal();
    }

    populateForm(goal) {
        document.getElementById('goal-title').value = goal.title;
        document.getElementById('goal-description').value = goal.description || '';
        document.getElementById('goal-category').value = goal.category;
        document.getElementById('goal-target-date').value = goal.targetDate;

        // Clear existing milestones and add goal's milestones
        document.getElementById('milestones-container').innerHTML = '';
        this.milestoneCounter = 0;
        
        goal.milestones.forEach(milestone => {
            this.addMilestoneField(milestone.title);
        });
    }

    resetForm() {
        document.getElementById('goal-form').reset();
        document.getElementById('milestones-container').innerHTML = '';
        this.milestoneCounter = 0;
    }

    cancelForm() {
        document.getElementById('goal-form-section').classList.remove('active');
        this.resetForm();
    }

    addMilestoneField(value = '') {
        const container = document.getElementById('milestones-container');
        const milestoneId = `milestone-${this.milestoneCounter++}`;
        
        const milestoneItem = document.createElement('div');
        milestoneItem.className = 'milestone-item';
        milestoneItem.innerHTML = `
            <input type="text" placeholder="Enter milestone..." value="${value}" data-milestone-id="${milestoneId}">
            <button type="button" class="remove-milestone-btn" onclick="goalsApp.removeMilestoneField(this)">×</button>
        `;
        
        container.appendChild(milestoneItem);
    }

    removeMilestoneField(button) {
        button.parentElement.remove();
    }

    handleSaveGoal(e) {
        e.preventDefault();
        
        const title = document.getElementById('goal-title').value.trim();
        const description = document.getElementById('goal-description').value.trim();
        const category = document.getElementById('goal-category').value;
        const targetDate = document.getElementById('goal-target-date').value;

        // Validation
        if (!title) {
            this.showToast('Please enter a goal title', 'error');
            return;
        }

        if (title.length > 100) {
            this.showToast('Goal title must be less than 100 characters', 'error');
            return;
        }

        if (!targetDate) {
            this.showToast('Please select a target date', 'error');
            return;
        }

        // Check if target date is in the future
        const today = new Date().toISOString().split('T')[0];
        if (targetDate < today) {
            this.showToast('Target date must be in the future', 'error');
            return;
        }

        // Collect milestones
        const milestoneInputs = document.querySelectorAll('#milestones-container input[type="text"]');
        const milestones = Array.from(milestoneInputs)
            .map(input => input.value.trim())
            .filter(title => title.length > 0)
            .map(title => ({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title,
                completed: false,
                completedDate: null
            }));

        try {
            if (this.currentGoal) {
                // Update existing goal
                this.currentGoal.title = title;
                this.currentGoal.description = description;
                this.currentGoal.category = category;
                this.currentGoal.targetDate = targetDate;
                
                // Keep existing milestones that are completed, add new ones
                const existingCompleted = this.currentGoal.milestones.filter(m => m.completed);
                this.currentGoal.milestones = [...existingCompleted, ...milestones];
                
                this.showToast('Goal updated successfully!', 'success');
            } else {
                // Create new goal
                const newGoal = {
                    id: Date.now().toString(),
                    title,
                    description,
                    category,
                    startDate: new Date().toISOString().split('T')[0],
                    targetDate,
                    status: 'not-started',
                    progress: 0,
                    milestones,
                    createdDate: new Date().toISOString().split('T')[0],
                    completedDate: null,
                    progressHistory: [
                        {
                            date: new Date().toISOString().split('T')[0],
                            progress: 0,
                            action: 'created'
                        }
                    ]
                };

                this.goals.push(newGoal);
                this.showToast('Goal added successfully!', 'success');
            }

            this.saveGoals();
            this.renderGoals();
            this.updateStats();
            this.cancelForm();
        } catch (error) {
            console.error('Error saving goal:', error);
            this.showToast('Failed to save goal. Please try again.', 'error');
        }
    }

    // Goal Management
    deleteGoal(goalId = null) {
        const id = goalId || (this.currentGoal && this.currentGoal.id);
        if (!id) return;

        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;

        if (confirm(`Are you sure you want to delete "${goal.title}"? This action cannot be undone.`)) {
            this.goals = this.goals.filter(g => g.id !== id);
            this.saveGoals();
            this.renderGoals();
            this.updateStats();
            this.closeDetailModal();
            this.showToast('Goal deleted', 'success');
        }
    }

    editGoal(goalId = null) {
        const id = goalId || (this.currentGoal && this.currentGoal.id);
        if (!id) return;
        
        this.showEditForm(id);
    }

    // Goal Detail Modal
    showGoalDetail(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        this.currentGoal = goal;

        // Populate modal
        document.getElementById('detail-goal-title').textContent = goal.title;
        document.getElementById('detail-category').textContent = goal.category;
        document.getElementById('detail-category').className = `category-badge ${goal.category}`;
        
        document.getElementById('detail-target-date').textContent = this.formatDate(goal.targetDate);
        document.getElementById('detail-status').textContent = goal.status.replace('-', ' ');
        document.getElementById('detail-status').className = `status-badge ${goal.status}`;

        document.getElementById('detail-description').textContent = goal.description || 'No description provided.';

        // Update progress
        this.updateModalProgress(goal);

        // Update milestones
        this.updateModalMilestones(goal);

        // Update progress history
        document.getElementById('detail-history').innerHTML = this.renderProgressHistory(goal);

        // Set status dropdown
        document.getElementById('status-update').value = goal.status;

        document.getElementById('goal-detail-modal').classList.add('active');
    }

    updateModalProgress(goal) {
        const progressFill = document.getElementById('detail-progress-fill');
        const progressText = document.getElementById('detail-progress-text');
        
        progressFill.style.width = `${goal.progress}%`;
        progressText.textContent = `${goal.progress}%`;
    }

    updateModalMilestones(goal) {
        const container = document.getElementById('detail-milestones');
        
        if (goal.milestones.length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">No milestones set for this goal.</p>';
            return;
        }

        const milestonesHTML = goal.milestones.map(milestone => `
            <div class="milestone-item-view">
                <input type="checkbox" class="milestone-checkbox" 
                       ${milestone.completed ? 'checked' : ''} 
                       onchange="goalsApp.toggleMilestone('${milestone.id}')">
                <span class="milestone-title ${milestone.completed ? 'completed' : ''}">${milestone.title}</span>
            </div>
        `).join('');

        container.innerHTML = milestonesHTML;
    }

    toggleMilestone(milestoneId) {
        if (!this.currentGoal) return;

        const milestone = this.currentGoal.milestones.find(m => m.id === milestoneId);
        if (!milestone) return;

        milestone.completed = !milestone.completed;
        milestone.completedDate = milestone.completed ? new Date().toISOString().split('T')[0] : null;

        // Auto-calculate progress based on milestones
        if (this.currentGoal.milestones.length > 0) {
            const completedCount = this.currentGoal.milestones.filter(m => m.completed).length;
            const newProgress = Math.round((completedCount / this.currentGoal.milestones.length) * 100);
            this.currentGoal.progress = newProgress;

            // Record milestone progress
            this.addProgressHistory(this.currentGoal, newProgress, 'milestone');

            // Auto-update status
            if (newProgress === 100 && this.currentGoal.status !== 'completed') {
                this.currentGoal.status = 'completed';
                this.currentGoal.completedDate = new Date().toISOString().split('T')[0];
                this.addProgressHistory(this.currentGoal, newProgress, 'completed');
                this.showAchievement(`🎉 Goal Completed: ${this.currentGoal.title}!`);
            } else if (newProgress > 0 && this.currentGoal.status === 'not-started') {
                this.currentGoal.status = 'in-progress';
                this.addProgressHistory(this.currentGoal, newProgress, 'started');
            }
        }

        this.saveGoals();
        this.updateModalProgress(this.currentGoal);
        this.updateModalMilestones(this.currentGoal);
        this.renderGoals();
        this.updateStats();

        if (milestone.completed) {
            this.showAchievement(`✅ Milestone completed: ${milestone.title}`);
        }
    }

    updateProgress(change) {
        if (!this.currentGoal) return;

        const oldProgress = this.currentGoal.progress;
        const newProgress = Math.max(0, Math.min(100, this.currentGoal.progress + change));
        this.currentGoal.progress = newProgress;

        // Record progress history
        this.addProgressHistory(this.currentGoal, newProgress, 'manual_update');

        // Auto-update status based on progress
        if (newProgress === 100 && this.currentGoal.status !== 'completed') {
            this.currentGoal.status = 'completed';
            this.currentGoal.completedDate = new Date().toISOString().split('T')[0];
            this.addProgressHistory(this.currentGoal, newProgress, 'completed');
            this.showAchievement(`🎉 Goal Completed: ${this.currentGoal.title}!`);
        } else if (newProgress > 0 && this.currentGoal.status === 'not-started') {
            this.currentGoal.status = 'in-progress';
            this.addProgressHistory(this.currentGoal, newProgress, 'started');
        } else if (newProgress === 0 && this.currentGoal.status === 'in-progress') {
            this.currentGoal.status = 'not-started';
        }

        this.saveGoals();
        this.updateModalProgress(this.currentGoal);
        this.renderGoals();
        this.updateStats();
    }

    updateStatus() {
        if (!this.currentGoal) return;

        const newStatus = document.getElementById('status-update').value;
        const oldStatus = this.currentGoal.status;

        this.currentGoal.status = newStatus;

        if (newStatus === 'completed' && oldStatus !== 'completed') {
            this.currentGoal.completedDate = new Date().toISOString().split('T')[0];
            this.currentGoal.progress = 100;
            this.showAchievement(`🎉 Goal Completed: ${this.currentGoal.title}!`);
        } else if (newStatus !== 'completed') {
            this.currentGoal.completedDate = null;
        }

        this.saveGoals();
        document.getElementById('detail-status').textContent = newStatus.replace('-', ' ');
        document.getElementById('detail-status').className = `status-badge ${newStatus}`;
        this.updateModalProgress(this.currentGoal);
        this.renderGoals();
        this.updateStats();
        this.showToast('Status updated', 'success');
    }

    closeDetailModal() {
        document.getElementById('goal-detail-modal').classList.remove('active');
        this.currentGoal = null;
    }

    // Goal Rendering
    renderGoals() {
        const container = document.getElementById('goals-container');
        const emptyState = document.getElementById('empty-state');
        
        const filteredGoals = this.getFilteredGoals();
        
        if (filteredGoals.length === 0) {
            container.innerHTML = '';
            container.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const goalsHTML = filteredGoals.map(goal => this.renderGoalCard(goal)).join('');
        container.innerHTML = goalsHTML;
    }

    renderGoalCard(goal) {
        const daysRemaining = this.calculateDaysRemaining(goal.targetDate);
        const daysRemainingText = daysRemaining < 0 ? 
            `${Math.abs(daysRemaining)} days overdue` : 
            daysRemaining === 0 ? 'Due today' : `${daysRemaining} days left`;
        
        const daysRemainingClass = daysRemaining < 0 ? 'overdue' : '';

        const completedMilestones = goal.milestones.filter(m => m.completed).length;
        const totalMilestones = goal.milestones.length;

        return `
            <div class="goal-card" onclick="goalsApp.showGoalDetail('${goal.id}')">
                <div class="goal-header">
                    <div>
                        <div class="goal-title">${goal.title}</div>
                        <div class="category-badge">${goal.category}</div>
                    </div>
                    <div class="goal-actions" onclick="event.stopPropagation()">
                        <button class="action-btn" onclick="goalsApp.showEditForm('${goal.id}')">Edit</button>
                        <button class="action-btn" onclick="goalsApp.deleteGoal('${goal.id}')">Delete</button>
                    </div>
                </div>
                
                <div class="goal-meta">
                    <span class="status-badge ${goal.status}">${goal.status.replace('-', ' ')}</span>
                    <span class="days-remaining ${daysRemainingClass}">${daysRemainingText}</span>
                </div>
                
                ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}
                
                <div class="progress-section">
                    <div class="progress-header">
                        <span class="progress-label">Progress</span>
                        <span class="progress-percentage">${goal.progress}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${goal.progress}%"></div>
                        </div>
                    </div>
                </div>
                
                ${totalMilestones > 0 ? `
                    <div class="milestones-preview">
                        <span class="milestone-count">${completedMilestones}/${totalMilestones} milestones</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Filtering and Searching
    getFilteredGoals() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
        const statusFilter = document.getElementById('status-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        
        return this.goals.filter(goal => {
            const searchMatch = !searchTerm || 
                goal.title.toLowerCase().includes(searchTerm) ||
                (goal.description && goal.description.toLowerCase().includes(searchTerm)) ||
                goal.category.toLowerCase().includes(searchTerm);
            
            const statusMatch = statusFilter === 'all' || goal.status === statusFilter;
            const categoryMatch = categoryFilter === 'all' || goal.category === categoryFilter;
            
            return searchMatch && statusMatch && categoryMatch;
        });
    }

    filterGoals() {
        this.renderGoals();
    }

    // Statistics
    updateStats() {
        const totalGoals = this.goals.length;
        const activeGoals = this.goals.filter(g => g.status === 'in-progress').length;
        const completedGoals = this.goals.filter(g => g.status === 'completed').length;
        const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
        
        document.getElementById('total-goals').textContent = totalGoals;
        document.getElementById('active-goals').textContent = activeGoals;
        document.getElementById('completed-goals').textContent = completedGoals;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
    }

    // Progress History Management
    addProgressHistory(goal, progress, action) {
        if (!goal.progressHistory) goal.progressHistory = [];
        
        const today = new Date().toISOString().split('T')[0];
        const lastEntry = goal.progressHistory[goal.progressHistory.length - 1];
        
        // Don't add duplicate entries for the same day with same progress
        if (lastEntry && lastEntry.date === today && lastEntry.progress === progress) {
            return;
        }
        
        goal.progressHistory.push({
            date: today,
            progress,
            action
        });
        
        // Keep only last 30 entries to prevent excessive data
        if (goal.progressHistory.length > 30) {
            goal.progressHistory = goal.progressHistory.slice(-30);
        }
    }

    renderProgressHistory(goal) {
        if (!goal.progressHistory || goal.progressHistory.length === 0) {
            return '<p style="color: #666; font-style: italic;">No progress history available.</p>';
        }
        
        const recentHistory = goal.progressHistory.slice(-7); // Last 7 entries
        
        return recentHistory.map(entry => {
            const actionText = {
                'created': 'Goal created',
                'started': 'Goal started',
                'manual_update': 'Progress updated',
                'milestone': 'Milestone completed',
                'completed': 'Goal completed'
            };
            
            return `
                <div class="history-item">
                    <div class="history-date">${this.formatDate(entry.date)}</div>
                    <div class="history-action">${actionText[entry.action] || 'Updated'}</div>
                    <div class="history-progress">${entry.progress}%</div>
                </div>
            `;
        }).join('');
    }

    // Utility Functions
    calculateDaysRemaining(targetDate) {
        const today = new Date();
        const target = new Date(targetDate);
        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    // Achievement System
    showAchievement(message) {
        const celebration = document.getElementById('achievement-celebration');
        const messageElement = document.getElementById('achievement-message');
        
        messageElement.textContent = message;
        celebration.classList.add('show');
        
        setTimeout(() => {
            celebration.classList.remove('show');
        }, 3000);
    }

    // Export/Import Functionality
    exportData() {
        try {
            const data = {
                goals: this.goals,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `goals-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Data exported successfully!', 'success');
        } catch (error) {
            this.showToast('Export failed. Please try again.', 'error');
            console.error('Export error:', error);
        }
    }

    triggerImport() {
        document.getElementById('import-file').click();
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            this.showToast('Please select a valid JSON file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!data.goals || !Array.isArray(data.goals)) {
                    throw new Error('Invalid data format');
                }
                
                // Validate each goal
                data.goals.forEach(goal => {
                    if (!goal.id || !goal.title || !goal.category || !goal.targetDate) {
                        throw new Error('Invalid goal data');
                    }
                });
                
                if (confirm('This will replace all your current goals. Are you sure?')) {
                    this.goals = data.goals;
                    this.saveGoals();
                    this.renderGoals();
                    this.updateStats();
                    this.showToast('Data imported successfully!', 'success');
                }
            } catch (error) {
                this.showToast('Import failed. Invalid file format.', 'error');
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Data Persistence
    loadGoals() {
        try {
            // Check if localStorage is available
            if (typeof(Storage) === "undefined") {
                console.warn('localStorage not supported');
                this.showToast('Local storage not supported in this browser', 'error');
                return [];
            }
            
            const stored = localStorage.getItem('lifeos-goals');
            if (!stored) return [];
            
            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return [];
            
            // Validate and clean up data, add missing properties
            return parsed.map(goal => {
                // Ensure all goals have progress history
                if (!goal.progressHistory) {
                    goal.progressHistory = [{
                        date: goal.createdDate || new Date().toISOString().split('T')[0],
                        progress: goal.progress || 0,
                        action: 'created'
                    }];
                }
                
                // Ensure milestones exist
                if (!goal.milestones) goal.milestones = [];
                
                return goal;
            }).filter(goal => {
                return goal && 
                       typeof goal.id === 'string' && 
                       typeof goal.title === 'string' && 
                       typeof goal.category === 'string' &&
                       typeof goal.targetDate === 'string';
            });
        } catch (error) {
            console.error('Error loading goals:', error);
            this.showToast('Failed to load data. Starting fresh.', 'error');
            return [];
        }
    }

    saveGoals() {
        try {
            // Check if localStorage is available
            if (typeof(Storage) === "undefined") {
                this.showToast('Cannot save: Local storage not supported', 'error');
                return;
            }
            
            // Check available storage space
            const data = JSON.stringify(this.goals);
            if (data.length > 5000000) { // ~5MB limit
                this.showToast('Data too large to save', 'error');
                return;
            }
            
            localStorage.setItem('lifeos-goals', data);
        } catch (error) {
            console.error('Error saving goals:', error);
            
            if (error.name === 'QuotaExceededError') {
                this.showToast('Storage quota exceeded. Consider exporting your data.', 'error');
            } else {
                this.showToast('Failed to save data. Please try again.', 'error');
            }
        }
    }
}

// Initialize the app
let goalsApp;
document.addEventListener('DOMContentLoaded', () => {
    // Load daily Quran verse
    loadQuranVerse('daily-verse-container');
    goalsApp = new GoalsTracker();
});