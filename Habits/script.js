class HabitsTracker {
    constructor() {
        this.habits = this.loadHabits();
        this.currentWeekStart = this.getWeekStart(new Date());
        this.isListView = true;
        this.initializeApp();
    }

    initializeApp() {
        this.updateDateDisplay();
        this.renderHabits();
        this.updateStats();
        this.bindEvents();
        this.bindKeyboardShortcuts();
        this.addTouchSupport();
        this.addPerformanceOptimizations();
    }

    addPerformanceOptimizations() {
        // Debounce function for performance
        this.debounce = function(func, wait) {
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
        
        // Add visibility change handler to save data when tab becomes inactive
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveHabits();
            }
        });
        
        // Add beforeunload handler to save data before page closes
        window.addEventListener('beforeunload', () => {
            this.saveHabits();
        });
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('add-habit-form');
        form.addEventListener('submit', (e) => this.handleAddHabit(e));

        // View toggle
        document.getElementById('list-view-btn').addEventListener('click', () => this.switchView('list'));
        document.getElementById('calendar-view-btn').addEventListener('click', () => this.switchView('calendar'));

        // Calendar navigation
        document.getElementById('prev-week').addEventListener('click', () => this.changeWeek(-1));
        document.getElementById('next-week').addEventListener('click', () => this.changeWeek(1));

        // Export/Import
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-btn').addEventListener('click', () => this.triggerImport());
        document.getElementById('import-file').addEventListener('change', (e) => this.importData(e));
    }

    bindKeyboardShortcuts() {
        let shortcutsVisible = false;
        
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch(e.key.toLowerCase()) {
                case '?':
                    e.preventDefault();
                    shortcutsVisible = !shortcutsVisible;
                    this.toggleShortcuts(shortcutsVisible);
                    break;
                case 'a':
                    e.preventDefault();
                    document.getElementById('habit-name').focus();
                    break;
                case 'v':
                    e.preventDefault();
                    this.switchView(this.isListView ? 'calendar' : 'list');
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    e.preventDefault();
                    const habitIndex = parseInt(e.key) - 1;
                    if (habitIndex < this.habits.length) {
                        this.toggleHabit(this.habits[habitIndex].id);
                    }
                    break;
            }
        });
    }

    toggleShortcuts(show) {
        const shortcuts = document.getElementById('keyboard-shortcuts');
        shortcuts.classList.toggle('visible', show);
    }

    switchView(viewType) {
        this.isListView = viewType === 'list';
        
        // Update button states
        document.getElementById('list-view-btn').classList.toggle('active', this.isListView);
        document.getElementById('calendar-view-btn').classList.toggle('active', !this.isListView);
        
        // Show/hide containers
        document.getElementById('habits-container').style.display = this.isListView ? 'grid' : 'none';
        document.getElementById('calendar-container').style.display = this.isListView ? 'none' : 'block';
        
        if (!this.isListView) {
            this.renderCalendar();
        }
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

    handleAddHabit(e) {
        e.preventDefault();
        const habitInput = document.getElementById('habit-name');
        const habitName = habitInput.value.trim();
        
        // Enhanced validation
        if (!habitName) {
            this.showToast('Please enter a habit name', 'error');
            return;
        }
        
        if (habitName.length < 2) {
            this.showToast('Habit name must be at least 2 characters long', 'error');
            return;
        }
        
        if (habitName.length > 100) {
            this.showToast('Habit name must be less than 100 characters', 'error');
            return;
        }
        
        // Check for duplicate habits
        const isDuplicate = this.habits.some(habit => 
            habit.name.toLowerCase() === habitName.toLowerCase()
        );
        
        if (isDuplicate) {
            this.showToast('This habit already exists', 'error');
            return;
        }
        
        // Check maximum number of habits (prevent performance issues)
        if (this.habits.length >= 50) {
            this.showToast('Maximum of 50 habits allowed', 'error');
            return;
        }
        
        try {
            const newHabit = {
                id: Date.now().toString(),
                name: habitName,
                createdDate: new Date().toISOString().split('T')[0],
                completions: {},
                currentStreak: 0,
                bestStreak: 0
            };
            
            this.habits.push(newHabit);
            this.saveHabits();
            this.renderHabits();
            this.updateStats();
            habitInput.value = '';
            
            this.showToast('Habit added successfully!', 'success');
            
            if (!this.isListView) {
                this.renderCalendar();
            }
        } catch (error) {
            console.error('Error adding habit:', error);
            this.showToast('Failed to add habit. Please try again.', 'error');
        }
    }

    renderHabits() {
        const container = document.getElementById('habits-container');
        const emptyState = document.getElementById('empty-state');
        const habitsCount = document.getElementById('habits-count');
        
        habitsCount.textContent = `${this.habits.length} habit${this.habits.length !== 1 ? 's' : ''}`;
        
        if (this.habits.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const habitsHTML = this.habits.map((habit, index) => this.renderHabit(habit, index)).join('');
        container.innerHTML = habitsHTML;
    }

    renderHabit(habit, index) {
        const today = new Date().toISOString().split('T')[0];
        const isCompletedToday = habit.completions[today] || false;
        
        return `
            <div class="habit-item" data-habit-id="${habit.id}">
                <div class="habit-header">
                    <div class="habit-name">
                        <span class="habit-number">${index + 1}.</span> ${habit.name}
                    </div>
                    <div class="habit-actions">
                        <button class="delete-btn" onclick="habitsApp.deleteHabit('${habit.id}')">×</button>
                    </div>
                </div>
                <div class="habit-stats">
                    <div class="streak-info">
                        <div class="streak-item">
                            <div class="streak-number">${habit.currentStreak}</div>
                            <div class="streak-label">Current Streak</div>
                        </div>
                        <div class="streak-item">
                            <div class="streak-number">${habit.bestStreak}</div>
                            <div class="streak-label">Best Streak</div>
                        </div>
                    </div>
                </div>
                <div class="habit-tracker">
                    <button class="check-btn ${isCompletedToday ? 'completed' : ''}" 
                            onclick="habitsApp.toggleHabit('${habit.id}')">
                        ${isCompletedToday ? '✓' : ''}
                    </button>
                </div>
            </div>
        `;
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        const weekDisplay = document.getElementById('week-display');
        
        // Update week display
        const endDate = new Date(this.currentWeekStart);
        endDate.setDate(endDate.getDate() + 6);
        
        const formatOptions = { month: 'short', day: 'numeric' };
        weekDisplay.textContent = `${this.currentWeekStart.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`;
        
        if (this.habits.length === 0) {
            calendarGrid.innerHTML = '<div class="empty-state"><p>Add some habits to see the calendar view!</p></div>';
            return;
        }

        // Generate calendar HTML
        let calendarHTML = '<div class="calendar-day"></div>'; // Empty cell for habit names
        
        // Day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach((day, index) => {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + index);
            const dateStr = date.getDate();
            calendarHTML += `<div class="calendar-day">${day}<br>${dateStr}</div>`;
        });

        // Habit rows
        this.habits.forEach(habit => {
            calendarHTML += `<div class="habit-row-name">${habit.name}</div>`;
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(this.currentWeekStart);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                const isCompleted = habit.completions[dateStr] || false;
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                
                calendarHTML += `
                    <div class="calendar-cell ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}" 
                         onclick="habitsApp.toggleHabitDate('${habit.id}', '${dateStr}')">
                        ${isCompleted ? '✓' : ''}
                    </div>
                `;
            }
        });

        // Set grid template
        calendarGrid.style.gridTemplateColumns = `200px repeat(7, 1fr)`;
        calendarGrid.innerHTML = calendarHTML;
    }

    changeWeek(direction) {
        const newDate = new Date(this.currentWeekStart);
        newDate.setDate(newDate.getDate() + (direction * 7));
        this.currentWeekStart = newDate;
        this.renderCalendar();
    }

    getWeekStart(date) {
        const result = new Date(date);
        result.setDate(result.getDate() - result.getDay());
        result.setHours(0, 0, 0, 0);
        return result;
    }

    toggleHabit(habitId) {
        const today = new Date().toISOString().split('T')[0];
        this.toggleHabitDate(habitId, today);
    }

    toggleHabitDate(habitId, dateStr) {
        const habit = this.habits.find(h => h.id === habitId);
        
        if (habit) {
            // Add animation class
            const habitElement = document.querySelector(`[data-habit-id="${habitId}"]`);
            if (habitElement) {
                habitElement.classList.add('completing');
                setTimeout(() => habitElement.classList.remove('completing'), 600);
            }

            habit.completions[dateStr] = !habit.completions[dateStr];
            
            // Remove completion if it's now false
            if (!habit.completions[dateStr]) {
                delete habit.completions[dateStr];
            }
            
            this.updateStreaks(habit);
            this.saveHabits();
            this.renderHabits();
            this.updateStats();
            
            if (!this.isListView) {
                this.renderCalendar();
            }
        }
    }

    updateStreaks(habit) {
        const today = new Date();
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        
        // Calculate streaks by going backwards from today
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            
            if (habit.completions[dateStr]) {
                tempStreak++;
                if (i === 0 || currentStreak === 0) currentStreak = tempStreak;
            } else {
                if (i === 0) currentStreak = 0;
                bestStreak = Math.max(bestStreak, tempStreak);
                if (currentStreak === 0) tempStreak = 0;
            }
        }
        
        bestStreak = Math.max(bestStreak, tempStreak);
        
        habit.currentStreak = currentStreak;
        habit.bestStreak = Math.max(habit.bestStreak, bestStreak);
    }

    deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.saveHabits();
            this.renderHabits();
            this.updateStats();
            
            if (!this.isListView) {
                this.renderCalendar();
            }
            
            this.showToast('Habit deleted', 'success');
        }
    }

    exportData() {
        try {
            const data = {
                habits: this.habits,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `habits-backup-${new Date().toISOString().split('T')[0]}.json`;
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
                if (!data.habits || !Array.isArray(data.habits)) {
                    throw new Error('Invalid data format');
                }
                
                // Validate each habit
                data.habits.forEach(habit => {
                    if (!habit.id || !habit.name || typeof habit.completions !== 'object') {
                        throw new Error('Invalid habit data');
                    }
                });
                
                if (confirm('This will replace all your current habits. Are you sure?')) {
                    this.habits = data.habits;
                    this.saveHabits();
                    this.renderHabits();
                    this.updateStats();
                    
                    if (!this.isListView) {
                        this.renderCalendar();
                    }
                    
                    this.showToast('Data imported successfully!', 'success');
                }
            } catch (error) {
                this.showToast('Import failed. Invalid file format.', 'error');
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const totalHabits = this.habits.length;
        const completedToday = this.habits.filter(h => h.completions[today]).length;
        const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
        const longestStreak = Math.max(0, ...this.habits.map(h => h.bestStreak));
        
        document.getElementById('total-habits').textContent = totalHabits;
        document.getElementById('completed-today').textContent = completedToday;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        document.getElementById('longest-streak').textContent = longestStreak;
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    loadHabits() {
        try {
            // Check if localStorage is available
            if (typeof(Storage) === "undefined") {
                console.warn('localStorage not supported');
                this.showToast('Local storage not supported in this browser', 'error');
                return [];
            }
            
            const stored = localStorage.getItem('lifeos-habits');
            if (!stored) return [];
            
            const parsed = JSON.parse(stored);
            
            // Validate loaded data structure
            if (!Array.isArray(parsed)) {
                console.warn('Invalid habits data structure');
                return [];
            }
            
            // Clean up any invalid habits
            const validHabits = parsed.filter(habit => {
                return habit && 
                       typeof habit.id === 'string' && 
                       typeof habit.name === 'string' && 
                       typeof habit.completions === 'object';
            });
            
            return validHabits;
        } catch (error) {
            console.error('Error loading habits:', error);
            this.showToast('Failed to load data. Starting fresh.', 'error');
            return [];
        }
    }

    saveHabits() {
        try {
            // Check if localStorage is available
            if (typeof(Storage) === "undefined") {
                this.showToast('Cannot save: Local storage not supported', 'error');
                return;
            }
            
            // Check available storage space
            const data = JSON.stringify(this.habits);
            if (data.length > 5000000) { // ~5MB limit
                this.showToast('Data too large to save', 'error');
                return;
            }
            
            localStorage.setItem('lifeos-habits', data);
        } catch (error) {
            console.error('Error saving habits:', error);
            
            if (error.name === 'QuotaExceededError') {
                this.showToast('Storage quota exceeded. Consider exporting your data.', 'error');
            } else {
                this.showToast('Failed to save data. Please try again.', 'error');
            }
        }
    }

    // Mobile touch support
    addTouchSupport() {
        // Prevent double-tap zoom on buttons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('touchend', function(e) {
                e.preventDefault();
            });
        });
        
        // Add touch feedback
        document.addEventListener('touchstart', function() {}, {passive: true});
    }
}

// Initialize the app when the DOM is loaded
let habitsApp;
document.addEventListener('DOMContentLoaded', () => {
    habitsApp = new HabitsTracker();
});