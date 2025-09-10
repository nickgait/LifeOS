class JournalApp {
    constructor() {
        this.entries = this.loadEntries();
        this.currentEntry = null;
        this.autoSaveTimer = null;
        this.currentView = 'main'; // main, entries, calendar
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.selectedMood = null;
        this.tags = [];
        this.initializeApp();
    }

    initializeApp() {
        this.updateDateDisplay();
        this.loadTodaysEntry();
        this.updateStats();
        this.bindEvents();
        this.bindKeyboardShortcuts();
        this.addPerformanceOptimizations();
    }

    bindEvents() {
        // Mood selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMood(e.target.dataset.mood));
        });

        // Rich text formatting
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.formatText(e.target.dataset.format);
            });
        });

        // Entry editor events
        const editor = document.getElementById('entry-editor');
        editor.addEventListener('input', () => {
            this.updateWordCount();
            this.scheduleAutoSave();
        });

        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });

        // Title input
        document.getElementById('entry-title').addEventListener('input', () => {
            this.scheduleAutoSave();
        });

        // Tags input
        document.getElementById('tags-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag(e.target.value.trim());
                e.target.value = '';
            }
        });

        // Save button
        document.getElementById('save-entry-btn').addEventListener('click', () => {
            this.saveEntry();
        });

        // Navigation buttons
        document.getElementById('view-entries-btn').addEventListener('click', () => {
            this.showEntriesView();
        });

        document.getElementById('calendar-btn').addEventListener('click', () => {
            this.showCalendarView();
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            this.showEntriesView();
            document.getElementById('search-input').focus();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportEntries();
        });

        // Close view buttons
        document.getElementById('close-entries-btn').addEventListener('click', () => {
            this.showMainView();
        });

        document.getElementById('close-calendar-btn').addEventListener('click', () => {
            this.showMainView();
        });

        // Search and filter
        document.getElementById('search-input').addEventListener('input', () => {
            this.filterEntries();
        });

        document.getElementById('mood-filter').addEventListener('change', () => {
            this.filterEntries();
        });

        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.changeMonth(1);
        });

        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('entry-modal')) {
                this.closeEntryModal();
            }
        });

        // Import functionality
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importEntries(e);
        });
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts when typing
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' || 
                e.target.isContentEditable) {
                // Allow formatting shortcuts in editor
                if (e.target.isContentEditable) {
                    if (e.ctrlKey || e.metaKey) {
                        switch(e.key.toLowerCase()) {
                            case 'b':
                                e.preventDefault();
                                this.formatText('bold');
                                break;
                            case 'i':
                                e.preventDefault();
                                this.formatText('italic');
                                break;
                        }
                    }
                }
                return;
            }

            switch(e.key.toLowerCase()) {
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.saveEntry();
                    }
                    break;
                case 'n':
                    e.preventDefault();
                    this.showMainView();
                    document.getElementById('entry-title').focus();
                    break;
                case 'e':
                    e.preventDefault();
                    this.showEntriesView();
                    break;
                case 'c':
                    e.preventDefault();
                    this.showCalendarView();
                    break;
                case 'f':
                    e.preventDefault();
                    this.showEntriesView();
                    document.getElementById('search-input').focus();
                    break;
                case 'escape':
                    e.preventDefault();
                    if (this.currentView !== 'main') {
                        this.showMainView();
                    } else if (document.getElementById('entry-modal').classList.contains('active')) {
                        this.closeEntryModal();
                    }
                    break;
            }
        });
    }

    addPerformanceOptimizations() {
        // Auto-save when tab becomes inactive
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.hasUnsavedChanges()) {
                this.saveEntry(true);
            }
        });

        // Auto-save before page unload
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                this.saveEntry(true);
                e.preventDefault();
                e.returnValue = '';
            }
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

    // Mood Management
    selectMood(mood) {
        // Remove previous selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Add selection to clicked mood
        document.querySelector(`[data-mood="${mood}"]`).classList.add('selected');
        this.selectedMood = mood;
        this.scheduleAutoSave();
    }

    getMoodEmoji(mood) {
        const moodMap = {
            'terrible': '😞',
            'bad': '😕',
            'okay': '😐',
            'good': '🙂',
            'great': '😄'
        };
        return moodMap[mood] || '😐';
    }

    // Rich Text Editing
    formatText(command) {
        document.execCommand(command, false, null);
        this.updateFormatButtons();
        this.updateWordCount();
        this.scheduleAutoSave();
    }

    updateFormatButtons() {
        document.querySelectorAll('.format-btn').forEach(btn => {
            const command = btn.dataset.format;
            if (document.queryCommandState(command)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateWordCount() {
        const editor = document.getElementById('entry-editor');
        const text = editor.textContent || editor.innerText || '';
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        
        document.getElementById('word-count').textContent = `${wordCount} words`;
        return wordCount;
    }

    // Tag Management
    addTag(tagText) {
        if (!tagText || this.tags.includes(tagText.toLowerCase())) return;

        const tag = tagText.toLowerCase().trim();
        if (tag.length > 20) {
            this.showToast('Tag must be 20 characters or less', 'error');
            return;
        }

        this.tags.push(tag);
        this.renderTags();
        this.scheduleAutoSave();
    }

    removeTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
        this.renderTags();
        this.scheduleAutoSave();
    }

    renderTags() {
        const container = document.getElementById('current-tags');
        container.innerHTML = this.tags.map(tag => `
            <span class="tag">
                ${tag}
                <button type="button" class="tag-remove" onclick="journalApp.removeTag('${tag}')">×</button>
            </span>
        `).join('');
    }

    // Entry Management
    loadTodaysEntry() {
        const today = new Date().toISOString().split('T')[0];
        const todaysEntry = this.entries.find(entry => entry.date === today);

        if (todaysEntry) {
            this.currentEntry = todaysEntry;
            this.populateEditor(todaysEntry);
        } else {
            this.currentEntry = this.createNewEntry();
        }
    }

    createNewEntry(date = null) {
        const entryDate = date || new Date().toISOString().split('T')[0];
        return {
            id: Date.now().toString(),
            date: entryDate,
            title: '',
            content: '',
            mood: null,
            tags: [],
            wordCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    populateEditor(entry) {
        document.getElementById('entry-title').value = entry.title || '';
        document.getElementById('entry-editor').innerHTML = entry.content || '';
        
        // Set mood
        if (entry.mood) {
            this.selectMood(entry.mood);
        }

        // Set tags
        this.tags = [...(entry.tags || [])];
        this.renderTags();

        this.updateWordCount();
    }

    hasUnsavedChanges() {
        if (!this.currentEntry) return false;

        const title = document.getElementById('entry-title').value.trim();
        const content = document.getElementById('entry-editor').innerHTML;
        
        return (
            title !== (this.currentEntry.title || '') ||
            content !== (this.currentEntry.content || '') ||
            this.selectedMood !== this.currentEntry.mood ||
            JSON.stringify(this.tags) !== JSON.stringify(this.currentEntry.tags || [])
        );
    }

    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        const indicator = document.getElementById('auto-save-indicator');
        indicator.textContent = 'Unsaved changes...';
        indicator.className = 'auto-save-indicator saving';

        this.autoSaveTimer = setTimeout(() => {
            this.saveEntry(true);
        }, 2000);
    }

    saveEntry(isAutoSave = false) {
        if (!this.currentEntry) return;

        const title = document.getElementById('entry-title').value.trim();
        const content = document.getElementById('entry-editor').innerHTML.trim();
        const wordCount = this.updateWordCount();

        // Don't save empty entries
        if (!title && !content && !this.selectedMood && this.tags.length === 0) {
            if (!isAutoSave) {
                this.showToast('Cannot save empty entry', 'error');
            }
            return;
        }

        // Update current entry
        this.currentEntry.title = title;
        this.currentEntry.content = content;
        this.currentEntry.mood = this.selectedMood;
        this.currentEntry.tags = [...this.tags];
        this.currentEntry.wordCount = wordCount;
        this.currentEntry.updatedAt = new Date().toISOString();

        // Add to entries if it's new
        const existingIndex = this.entries.findIndex(e => e.id === this.currentEntry.id);
        if (existingIndex === -1) {
            this.entries.push(this.currentEntry);
        } else {
            this.entries[existingIndex] = this.currentEntry;
        }

        this.saveEntries();
        this.updateStats();

        // Update UI
        const indicator = document.getElementById('auto-save-indicator');
        indicator.textContent = isAutoSave ? 'Auto-saved' : 'Saved';
        indicator.className = 'auto-save-indicator saved';

        setTimeout(() => {
            indicator.className = 'auto-save-indicator';
        }, 2000);

        if (!isAutoSave) {
            this.showToast('Entry saved successfully!', 'success');
        }

        // Clear auto-save timer
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    editEntry(entryId = null) {
        const id = entryId || (this.currentEntry && this.currentEntry.id);
        if (!id) return;

        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;

        this.currentEntry = entry;
        this.populateEditor(entry);
        this.showMainView();
        this.closeEntryModal();
        
        document.getElementById('entry-title').focus();
    }

    deleteEntry(entryId = null) {
        const id = entryId || (this.currentEntry && this.currentEntry.id);
        if (!id) return;

        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;

        if (confirm(`Are you sure you want to delete the entry "${entry.title || 'Untitled'}" from ${this.formatDate(entry.date)}?`)) {
            this.entries = this.entries.filter(e => e.id !== id);
            this.saveEntries();
            this.updateStats();
            this.closeEntryModal();
            
            if (this.currentView === 'entries') {
                this.renderEntries();
            } else if (this.currentView === 'calendar') {
                this.renderCalendar();
            }

            // If we deleted today's entry, create a new one
            const today = new Date().toISOString().split('T')[0];
            if (entry.date === today) {
                this.currentEntry = this.createNewEntry();
                this.populateEditor(this.currentEntry);
            }

            this.showToast('Entry deleted', 'success');
        }
    }

    // View Management
    showMainView() {
        document.getElementById('entries-section').style.display = 'none';
        document.getElementById('calendar-section').style.display = 'none';
        this.currentView = 'main';
        this.loadTodaysEntry();
    }

    showEntriesView() {
        document.getElementById('entries-section').style.display = 'block';
        document.getElementById('calendar-section').style.display = 'none';
        this.currentView = 'entries';
        this.renderEntries();
    }

    showCalendarView() {
        document.getElementById('entries-section').style.display = 'none';
        document.getElementById('calendar-section').style.display = 'block';
        this.currentView = 'calendar';
        this.renderCalendar();
    }

    // Entries List
    renderEntries() {
        const container = document.getElementById('entries-container');
        const emptyState = document.getElementById('empty-entries-state');
        
        const filteredEntries = this.getFilteredEntries();
        
        if (filteredEntries.length === 0) {
            container.innerHTML = '';
            container.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        const entriesHTML = filteredEntries
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(entry => this.renderEntryCard(entry))
            .join('');
            
        container.innerHTML = entriesHTML;
    }

    renderEntryCard(entry) {
        const preview = this.stripHtml(entry.content).substring(0, 150);
        const previewText = preview.length < entry.content.length ? preview + '...' : preview;
        
        return `
            <div class="entry-card" onclick="journalApp.showEntryDetail('${entry.id}')">
                <div class="entry-card-header">
                    <div>
                        <div class="entry-card-title">${entry.title || 'Untitled'}</div>
                        <div class="entry-card-date">${this.formatDate(entry.date)}</div>
                    </div>
                    <div class="entry-card-mood">${entry.mood ? this.getMoodEmoji(entry.mood) : ''}</div>
                </div>
                
                ${previewText ? `<div class="entry-card-preview">${previewText}</div>` : ''}
                
                <div class="entry-card-meta">
                    <div class="entry-tags">
                        ${entry.tags?.slice(0, 3).map(tag => `<span class="entry-tag">${tag}</span>`).join('') || ''}
                        ${entry.tags?.length > 3 ? `<span class="entry-tag">+${entry.tags.length - 3} more</span>` : ''}
                    </div>
                    <span>${entry.wordCount || 0} words</span>
                </div>
            </div>
        `;
    }

    getFilteredEntries() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
        const moodFilter = document.getElementById('mood-filter').value;
        
        return this.entries.filter(entry => {
            const searchMatch = !searchTerm || 
                (entry.title && entry.title.toLowerCase().includes(searchTerm)) ||
                (entry.content && this.stripHtml(entry.content).toLowerCase().includes(searchTerm)) ||
                (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
            
            const moodMatch = moodFilter === 'all' || entry.mood === moodFilter;
            
            return searchMatch && moodMatch;
        });
    }

    filterEntries() {
        if (this.currentView === 'entries') {
            this.renderEntries();
        }
    }

    // Calendar View
    renderCalendar() {
        const container = document.getElementById('calendar-grid');
        const monthYear = document.getElementById('current-month-year');
        
        const date = new Date(this.currentYear, this.currentMonth);
        monthYear.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let calendarHTML = '';
        
        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            calendarHTML += `<div class="calendar-day-header">${day}</div>`;
        });
        
        // Calendar days
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dateStr = currentDate.toISOString().split('T')[0];
            const entry = this.entries.find(e => e.date === dateStr);
            const isCurrentMonth = currentDate.getMonth() === this.currentMonth;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            let classes = 'calendar-day';
            if (!isCurrentMonth) classes += ' other-month';
            if (entry) classes += ' has-entry';
            if (isToday) classes += ' today';
            
            calendarHTML += `
                <div class="${classes}" onclick="journalApp.handleCalendarDayClick('${dateStr}')">
                    <div class="calendar-day-number">${currentDate.getDate()}</div>
                    ${entry ? `<div class="calendar-day-mood">${entry.mood ? this.getMoodEmoji(entry.mood) : '📝'}</div>` : ''}
                </div>
            `;
        }
        
        container.innerHTML = calendarHTML;
    }

    changeMonth(direction) {
        this.currentMonth += direction;
        
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        
        this.renderCalendar();
    }

    handleCalendarDayClick(dateStr) {
        const entry = this.entries.find(e => e.date === dateStr);
        
        if (entry) {
            this.showEntryDetail(entry.id);
        } else {
            // Create new entry for this date
            this.currentEntry = this.createNewEntry(dateStr);
            this.populateEditor(this.currentEntry);
            this.showMainView();
            document.getElementById('entry-title').focus();
        }
    }

    // Entry Detail Modal
    showEntryDetail(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;

        this.currentEntry = entry;

        // Populate modal
        document.getElementById('modal-entry-date').textContent = this.formatDate(entry.date);
        document.getElementById('modal-entry-title').textContent = entry.title || 'Untitled';
        document.getElementById('modal-mood').textContent = entry.mood ? this.getMoodEmoji(entry.mood) : '';
        document.getElementById('modal-word-count').textContent = `${entry.wordCount || 0} words`;
        document.getElementById('modal-entry-content').innerHTML = entry.content || '<em>No content</em>';
        
        // Render tags
        const tagsContainer = document.getElementById('modal-entry-tags');
        if (entry.tags && entry.tags.length > 0) {
            tagsContainer.innerHTML = entry.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        } else {
            tagsContainer.innerHTML = '';
        }

        document.getElementById('entry-modal').classList.add('active');
    }

    closeEntryModal() {
        document.getElementById('entry-modal').classList.remove('active');
        this.currentEntry = null;
    }

    // Statistics
    updateStats() {
        const totalEntries = this.entries.length;
        const totalWords = this.entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
        const writingStreak = this.calculateWritingStreak();
        const avgMood = this.calculateAverageMood();

        document.getElementById('total-entries').textContent = totalEntries;
        document.getElementById('total-words').textContent = totalWords.toLocaleString();
        document.getElementById('writing-streak').textContent = writingStreak;
        document.getElementById('avg-mood').textContent = avgMood;
    }

    calculateWritingStreak() {
        if (this.entries.length === 0) return 0;

        const today = new Date();
        let streak = 0;
        
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            
            if (this.entries.some(entry => entry.date === dateStr)) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    calculateAverageMood() {
        const entriesWithMood = this.entries.filter(entry => entry.mood);
        if (entriesWithMood.length === 0) return '😐';

        const moodValues = {
            'terrible': 1,
            'bad': 2,
            'okay': 3,
            'good': 4,
            'great': 5
        };

        const average = entriesWithMood.reduce((sum, entry) => {
            return sum + moodValues[entry.mood];
        }, 0) / entriesWithMood.length;

        const moodKeys = Object.keys(moodValues);
        const closestMood = moodKeys[Math.round(average) - 1];
        return this.getMoodEmoji(closestMood);
    }

    // Export/Import
    exportEntries() {
        try {
            const data = {
                entries: this.entries,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `journal-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Journal exported successfully!', 'success');
        } catch (error) {
            this.showToast('Export failed. Please try again.', 'error');
            console.error('Export error:', error);
        }
    }

    importEntries(event) {
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
                
                if (!data.entries || !Array.isArray(data.entries)) {
                    throw new Error('Invalid data format');
                }
                
                if (confirm('This will replace all your current entries. Are you sure?')) {
                    this.entries = data.entries;
                    this.saveEntries();
                    this.loadTodaysEntry();
                    this.updateStats();
                    
                    if (this.currentView === 'entries') {
                        this.renderEntries();
                    } else if (this.currentView === 'calendar') {
                        this.renderCalendar();
                    }
                    
                    this.showToast('Journal imported successfully!', 'success');
                }
            } catch (error) {
                this.showToast('Import failed. Invalid file format.', 'error');
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    }

    // Utility Functions
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    showToast(message, type = 'info') {
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
    loadEntries() {
        try {
            if (typeof(Storage) === "undefined") {
                console.warn('localStorage not supported');
                return [];
            }
            
            const stored = localStorage.getItem('lifeos-journal');
            if (!stored) return [];
            
            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return [];
            
            return parsed.filter(entry => {
                return entry && 
                       typeof entry.id === 'string' && 
                       typeof entry.date === 'string';
            });
        } catch (error) {
            console.error('Error loading entries:', error);
            return [];
        }
    }

    saveEntries() {
        try {
            if (typeof(Storage) === "undefined") {
                this.showToast('Cannot save: Local storage not supported', 'error');
                return;
            }
            
            const data = JSON.stringify(this.entries);
            if (data.length > 10000000) { // ~10MB limit for journal entries
                this.showToast('Too much data to save. Consider exporting old entries.', 'error');
                return;
            }
            
            localStorage.setItem('lifeos-journal', data);
        } catch (error) {
            console.error('Error saving entries:', error);
            
            if (error.name === 'QuotaExceededError') {
                this.showToast('Storage quota exceeded. Please export your data.', 'error');
            } else {
                this.showToast('Failed to save data. Please try again.', 'error');
            }
        }
    }
}

// Initialize the app
let journalApp;
document.addEventListener('DOMContentLoaded', () => {
    journalApp = new JournalApp();
});