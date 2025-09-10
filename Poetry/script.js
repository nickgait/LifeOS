class PoetryManager {
    constructor() {
        this.poems = [];
        this.currentPoem = null;
        this.currentView = 'collection';
        this.autoSaveTimer = null;
        this.settings = {
            fontSize: 'medium',
            fontFamily: 'sans-serif',
            lineHeight: 'comfortable',
            autoSave: true,
            showWordCount: true,
            fullscreenMode: false
        };
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.applySettings();
        this.updateView();
        this.showToast('Poetry Collection loaded', 'success');
    }

    loadData() {
        const savedPoems = localStorage.getItem('lifeos_poems');
        const savedSettings = localStorage.getItem('lifeos_poetry_settings');
        
        if (savedPoems) {
            this.poems = JSON.parse(savedPoems);
        }
        
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }

    saveData() {
        localStorage.setItem('lifeos_poems', JSON.stringify(this.poems));
        localStorage.setItem('lifeos_poetry_settings', JSON.stringify(this.settings));
    }

    setupEventListeners() {
        // Header buttons
        document.getElementById('newPoemBtn').addEventListener('click', () => this.createNewPoem());
        document.getElementById('searchToggleBtn').addEventListener('click', () => this.toggleSearch());
        document.getElementById('viewToggleBtn').addEventListener('click', () => this.toggleGridView());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('moodFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('clearFiltersBtn').addEventListener('click', () => this.clearFilters());

        // Writing view
        document.getElementById('backToCollectionBtn').addEventListener('click', () => this.showCollectionView());
        document.getElementById('saveDraftBtn').addEventListener('click', () => this.saveDraft());
        document.getElementById('publishPoemBtn').addEventListener('click', () => this.publishPoem());

        // Writing inputs
        document.getElementById('poemTitle').addEventListener('input', () => this.handleContentChange());
        document.getElementById('poemContent').addEventListener('input', () => this.handleContentChange());
        document.getElementById('poemMood').addEventListener('change', () => this.handleContentChange());
        document.getElementById('poemThemes').addEventListener('input', () => this.handleContentChange());
        document.getElementById('poemNotes').addEventListener('input', () => this.handleContentChange());

        // Reading view
        document.getElementById('backFromReadingBtn').addEventListener('click', () => this.showCollectionView());
        document.getElementById('editPoemBtn').addEventListener('click', () => this.editCurrentPoem());
        document.getElementById('favoritePoemBtn').addEventListener('click', () => this.toggleFavorite());
        document.getElementById('duplicatePoemBtn').addEventListener('click', () => this.duplicateCurrentPoem());
        document.getElementById('exportPoemBtn').addEventListener('click', () => this.exportCurrentPoem());
        document.getElementById('deletePoemBtn').addEventListener('click', () => this.deleteCurrentPoem());

        // Settings modal
        document.getElementById('closeSettingsModal').addEventListener('click', () => this.hideSettings());
        document.getElementById('fontSize').addEventListener('change', (e) => this.updateSetting('fontSize', e.target.value));
        document.getElementById('fontFamily').addEventListener('change', (e) => this.updateSetting('fontFamily', e.target.value));
        document.getElementById('lineHeight').addEventListener('change', (e) => this.updateSetting('lineHeight', e.target.value));
        document.getElementById('autoSave').addEventListener('change', (e) => this.updateSetting('autoSave', e.target.checked));
        document.getElementById('showWordCount').addEventListener('change', (e) => this.updateSetting('showWordCount', e.target.checked));
        document.getElementById('fullscreenMode').addEventListener('change', (e) => this.updateSetting('fullscreenMode', e.target.checked));

        // Confirmation modal
        document.getElementById('confirmCancel').addEventListener('click', () => this.hideConfirmation());
        
        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    createNewPoem() {
        this.currentPoem = {
            id: this.generateId(),
            title: '',
            content: '',
            mood: '',
            themes: [],
            isDraft: true,
            isFavorite: false,
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            wordCount: 0,
            notes: ''
        };
        
        this.showWritingView();
        document.getElementById('poemTitle').focus();
    }

    showWritingView(poem = null) {
        if (poem) {
            this.currentPoem = { ...poem };
        }

        this.currentView = 'writing';
        this.updateView();

        // Populate form
        document.getElementById('poemTitle').value = this.currentPoem.title;
        document.getElementById('poemContent').value = this.currentPoem.content;
        document.getElementById('poemMood').value = this.currentPoem.mood;
        document.getElementById('poemThemes').value = this.currentPoem.themes.join(', ');
        document.getElementById('poemNotes').value = this.currentPoem.notes;

        this.updateWritingStats();
    }

    showCollectionView() {
        this.currentView = 'collection';
        this.updateView();
        this.renderPoems();
        this.updateCollectionStats();
    }

    showReadingView(poem) {
        this.currentPoem = { ...poem };
        this.currentView = 'reading';
        this.updateView();

        // Populate reading view
        document.getElementById('readingTitle').textContent = poem.title || 'Untitled';
        document.getElementById('readingMood').textContent = poem.mood || 'No mood set';
        document.getElementById('readingDate').textContent = this.formatDate(poem.dateCreated);
        document.getElementById('readingStatus').textContent = poem.isDraft ? 'Draft' : 'Published';
        document.getElementById('readingContent').innerHTML = this.formatPoemContent(poem.content);
        
        // Update themes
        const themesContainer = document.getElementById('readingThemes');
        if (poem.themes && poem.themes.length > 0) {
            themesContainer.innerHTML = poem.themes.map(theme => `<span class="theme-tag">${theme}</span>`).join('');
            themesContainer.style.display = 'block';
        } else {
            themesContainer.style.display = 'none';
        }

        // Update stats
        document.getElementById('readingStats').innerHTML = `
            <span>${poem.wordCount || 0} words</span>
            <span>${(poem.content || '').split('\n').length} lines</span>
            <span>Created: ${this.formatDate(poem.dateCreated)}</span>
            ${poem.dateModified !== poem.dateCreated ? `<span>Modified: ${this.formatDate(poem.dateModified)}</span>` : ''}
        `;

        // Update notes
        const notesDisplay = document.getElementById('readingNotes');
        if (poem.notes && poem.notes.trim()) {
            notesDisplay.innerHTML = `<h4>Notes</h4><p>${poem.notes}</p>`;
            notesDisplay.style.display = 'block';
        } else {
            notesDisplay.style.display = 'none';
        }

        // Update favorite button
        const favoriteBtn = document.getElementById('favoritePoemBtn');
        favoriteBtn.textContent = poem.isFavorite ? '♥' : '♡';
        favoriteBtn.classList.toggle('favorite', poem.isFavorite);
    }

    updateView() {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(`${this.currentView}View`).classList.add('active');

        if (this.currentView === 'collection') {
            this.renderPoems();
        }
    }

    renderPoems() {
        const container = document.getElementById('poemsGrid');
        const emptyState = document.getElementById('emptyState');
        
        let filteredPoems = this.getFilteredPoems();

        if (filteredPoems.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';

        container.innerHTML = filteredPoems.map(poem => this.createPoemCard(poem)).join('');
    }

    createPoemCard(poem) {
        const preview = poem.content.length > 100 ? poem.content.substring(0, 100) + '...' : poem.content;
        const themes = poem.themes.slice(0, 3).map(theme => `<span class="theme-tag">${theme}</span>`).join('');
        
        return `
            <div class="poem-card" onclick="poetryManager.showReadingView(${JSON.stringify(poem).replace(/"/g, '&quot;')})">
                <div class="poem-header">
                    <h3 class="poem-title">${poem.title || 'Untitled'}</h3>
                    <div class="poem-actions">
                        ${poem.isFavorite ? '<span class="favorite-indicator">♥</span>' : ''}
                        <span class="status-indicator ${poem.isDraft ? 'draft' : 'published'}">
                            ${poem.isDraft ? 'Draft' : 'Published'}
                        </span>
                    </div>
                </div>
                <div class="poem-preview">${preview}</div>
                <div class="poem-metadata">
                    <div class="poem-themes">${themes}</div>
                    <div class="poem-info">
                        <span class="poem-mood">${poem.mood || ''}</span>
                        <span class="poem-date">${this.formatDate(poem.dateCreated)}</span>
                        <span class="poem-stats">${poem.wordCount || 0} words</span>
                    </div>
                </div>
            </div>
        `;
    }

    getFilteredPoems() {
        let filtered = [...this.poems];

        // Search filter
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(poem => 
                (poem.title || '').toLowerCase().includes(searchTerm) ||
                (poem.content || '').toLowerCase().includes(searchTerm) ||
                (poem.themes || []).some(theme => theme.toLowerCase().includes(searchTerm))
            );
        }

        // Mood filter
        const moodFilter = document.getElementById('moodFilter').value;
        if (moodFilter) {
            filtered = filtered.filter(poem => poem.mood === moodFilter);
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter').value;
        if (statusFilter) {
            if (statusFilter === 'published') {
                filtered = filtered.filter(poem => !poem.isDraft);
            } else if (statusFilter === 'draft') {
                filtered = filtered.filter(poem => poem.isDraft);
            } else if (statusFilter === 'favorite') {
                filtered = filtered.filter(poem => poem.isFavorite);
            }
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.dateModified) - new Date(a.dateModified));

        return filtered;
    }

    handleContentChange() {
        if (!this.currentPoem) return;

        const title = document.getElementById('poemTitle').value;
        const content = document.getElementById('poemContent').value;
        const mood = document.getElementById('poemMood').value;
        const themes = document.getElementById('poemThemes').value.split(',').map(t => t.trim()).filter(t => t);
        const notes = document.getElementById('poemNotes').value;

        this.currentPoem.title = title;
        this.currentPoem.content = content;
        this.currentPoem.mood = mood;
        this.currentPoem.themes = themes;
        this.currentPoem.notes = notes;
        this.currentPoem.wordCount = this.countWords(content);
        this.currentPoem.dateModified = new Date().toISOString();

        this.updateWritingStats();

        if (this.settings.autoSave) {
            this.scheduleAutoSave();
        }
    }

    updateWritingStats() {
        if (!this.currentPoem) return;

        const content = this.currentPoem.content || '';
        const wordCount = this.countWords(content);
        const lineCount = content.split('\n').length;

        document.getElementById('wordCount').textContent = `${wordCount} words`;
        document.getElementById('lineCount').textContent = `${lineCount} lines`;
        
        if (this.settings.showWordCount) {
            document.querySelector('.writing-stats').style.display = 'flex';
        } else {
            document.querySelector('.writing-stats').style.display = 'none';
        }
    }

    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        this.autoSaveTimer = setTimeout(() => {
            this.saveDraft(false);
        }, 2000);
    }

    saveDraft(showToast = true) {
        if (!this.currentPoem) return;

        this.currentPoem.isDraft = true;
        this.savePoem();
        
        document.getElementById('lastSaved').textContent = `Saved ${this.formatTime(new Date())}`;
        
        if (showToast) {
            this.showToast('Draft saved', 'success');
        }
    }

    publishPoem() {
        if (!this.currentPoem) return;

        if (!this.currentPoem.title.trim()) {
            this.showToast('Please add a title before publishing', 'error');
            document.getElementById('poemTitle').focus();
            return;
        }

        if (!this.currentPoem.content.trim()) {
            this.showToast('Please add content before publishing', 'error');
            document.getElementById('poemContent').focus();
            return;
        }

        this.currentPoem.isDraft = false;
        this.savePoem();
        
        this.showToast('Poem published', 'success');
        this.showCollectionView();
    }

    savePoem() {
        if (!this.currentPoem) return;

        const existingIndex = this.poems.findIndex(p => p.id === this.currentPoem.id);
        
        if (existingIndex >= 0) {
            this.poems[existingIndex] = { ...this.currentPoem };
        } else {
            this.poems.push({ ...this.currentPoem });
        }

        this.saveData();
    }

    editCurrentPoem() {
        if (this.currentPoem) {
            this.showWritingView(this.currentPoem);
        }
    }

    toggleFavorite() {
        if (!this.currentPoem) return;

        this.currentPoem.isFavorite = !this.currentPoem.isFavorite;
        
        const poemIndex = this.poems.findIndex(p => p.id === this.currentPoem.id);
        if (poemIndex >= 0) {
            this.poems[poemIndex].isFavorite = this.currentPoem.isFavorite;
            this.saveData();
        }

        const favoriteBtn = document.getElementById('favoritePoemBtn');
        favoriteBtn.textContent = this.currentPoem.isFavorite ? '♥' : '♡';
        favoriteBtn.classList.toggle('favorite', this.currentPoem.isFavorite);

        this.showToast(this.currentPoem.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    }

    duplicateCurrentPoem() {
        if (!this.currentPoem) return;

        const duplicatedPoem = {
            ...this.currentPoem,
            id: this.generateId(),
            title: `${this.currentPoem.title} (Copy)`,
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            isDraft: true,
            isFavorite: false
        };

        this.poems.push(duplicatedPoem);
        this.saveData();
        
        this.showToast('Poem duplicated', 'success');
        this.showWritingView(duplicatedPoem);
    }

    exportCurrentPoem() {
        if (!this.currentPoem) return;

        const content = this.formatPoemForExport(this.currentPoem);
        const filename = `${this.currentPoem.title || 'Untitled'}.txt`;
        
        this.downloadFile(content, filename);
        this.showToast('Poem exported', 'success');
    }

    deleteCurrentPoem() {
        if (!this.currentPoem) return;

        this.showConfirmation(
            'Delete Poem',
            'Are you sure you want to delete this poem? This action cannot be undone.',
            () => {
                const poemIndex = this.poems.findIndex(p => p.id === this.currentPoem.id);
                if (poemIndex >= 0) {
                    this.poems.splice(poemIndex, 1);
                    this.saveData();
                    this.showToast('Poem deleted', 'success');
                    this.showCollectionView();
                }
            }
        );
    }

    toggleSearch() {
        const searchContainer = document.getElementById('searchContainer');
        const isVisible = searchContainer.style.display !== 'none';
        
        searchContainer.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            document.getElementById('searchInput').focus();
        }
    }

    toggleGridView() {
        const grid = document.getElementById('poemsGrid');
        const isCompact = grid.classList.contains('compact');
        
        grid.classList.toggle('compact', !isCompact);
        
        const button = document.getElementById('viewToggleBtn');
        button.textContent = isCompact ? '⊞' : '⊟';
    }

    handleSearch(searchTerm) {
        this.renderPoems();
    }

    applyFilters() {
        this.renderPoems();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('moodFilter').value = '';
        document.getElementById('statusFilter').value = '';
        this.renderPoems();
    }

    updateCollectionStats() {
        const stats = document.getElementById('collectionStats');
        const totalPoems = this.poems.length;
        const publishedPoems = this.poems.filter(p => !p.isDraft).length;
        const draftPoems = this.poems.filter(p => p.isDraft).length;
        const favoritePoems = this.poems.filter(p => p.isFavorite).length;
        const totalWords = this.poems.reduce((sum, p) => sum + (p.wordCount || 0), 0);

        stats.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${totalPoems}</span>
                <span class="stat-label">Total Poems</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${publishedPoems}</span>
                <span class="stat-label">Published</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${draftPoems}</span>
                <span class="stat-label">Drafts</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${favoritePoems}</span>
                <span class="stat-label">Favorites</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${totalWords}</span>
                <span class="stat-label">Total Words</span>
            </div>
        `;
    }

    showSettings() {
        document.getElementById('settingsModal').style.display = 'block';
        
        // Update settings form
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('fontFamily').value = this.settings.fontFamily;
        document.getElementById('lineHeight').value = this.settings.lineHeight;
        document.getElementById('autoSave').checked = this.settings.autoSave;
        document.getElementById('showWordCount').checked = this.settings.showWordCount;
        document.getElementById('fullscreenMode').checked = this.settings.fullscreenMode;
    }

    hideSettings() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.applySettings();
        this.saveData();
    }

    applySettings() {
        const root = document.documentElement;
        
        // Font size
        const fontSizes = {
            'small': '14px',
            'medium': '16px',
            'large': '18px',
            'extra-large': '20px'
        };
        root.style.setProperty('--base-font-size', fontSizes[this.settings.fontSize]);

        // Font family
        const fontFamilies = {
            'serif': 'Georgia, "Times New Roman", serif',
            'sans-serif': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'monospace': '"SF Mono", Monaco, "Cascadia Code", monospace'
        };
        root.style.setProperty('--font-family', fontFamilies[this.settings.fontFamily]);

        // Line height
        const lineHeights = {
            'compact': '1.4',
            'comfortable': '1.6',
            'spacious': '1.8'
        };
        root.style.setProperty('--line-height', lineHeights[this.settings.lineHeight]);

        // Fullscreen mode
        document.body.classList.toggle('fullscreen-mode', this.settings.fullscreenMode);
    }

    exportAllPoems() {
        if (this.poems.length === 0) {
            this.showToast('No poems to export', 'error');
            return;
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            totalPoems: this.poems.length,
            poems: this.poems.map(poem => ({
                ...poem,
                exportedContent: this.formatPoemForExport(poem)
            }))
        };

        const content = JSON.stringify(exportData, null, 2);
        const filename = `poetry_collection_${new Date().toISOString().split('T')[0]}.json`;
        
        this.downloadFile(content, filename);
        this.showToast('All poems exported', 'success');
    }

    importPoems(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.poems && Array.isArray(data.poems)) {
                    const importedPoems = data.poems.map(poem => ({
                        ...poem,
                        id: this.generateId(),
                        dateImported: new Date().toISOString()
                    }));
                    
                    this.poems.push(...importedPoems);
                    this.saveData();
                    this.renderPoems();
                    this.updateCollectionStats();
                    
                    this.showToast(`Imported ${importedPoems.length} poems`, 'success');
                } else {
                    this.showToast('Invalid file format', 'error');
                }
            } catch (error) {
                this.showToast('Error reading file', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    }

    clearAllData() {
        this.showConfirmation(
            'Clear All Data',
            'Are you sure you want to delete all poems and settings? This action cannot be undone.',
            () => {
                this.poems = [];
                localStorage.removeItem('lifeos_poems');
                localStorage.removeItem('lifeos_poetry_settings');
                this.renderPoems();
                this.updateCollectionStats();
                this.showToast('All data cleared', 'success');
            }
        );
    }

    showConfirmation(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'block';
        
        const confirmBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');
        
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            this.hideConfirmation();
            onConfirm();
        });
        
        newCancelBtn.addEventListener('click', () => this.hideConfirmation());
    }

    hideConfirmation() {
        document.getElementById('confirmModal').style.display = 'none';
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    this.createNewPoem();
                    break;
                case 's':
                    e.preventDefault();
                    if (this.currentView === 'writing') {
                        this.saveDraft();
                    }
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleSearch();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            if (this.currentView === 'writing' || this.currentView === 'reading') {
                this.showCollectionView();
            }
        }
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    countWords(text) {
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatPoemContent(content) {
        return content.replace(/\n/g, '<br>');
    }

    formatPoemForExport(poem) {
        const themes = poem.themes && poem.themes.length > 0 ? `\nThemes: ${poem.themes.join(', ')}` : '';
        const mood = poem.mood ? `\nMood: ${poem.mood}` : '';
        const notes = poem.notes ? `\n\nNotes:\n${poem.notes}` : '';
        
        return `${poem.title || 'Untitled'}
Created: ${this.formatDate(poem.dateCreated)}${mood}${themes}

${poem.content}${notes}`;
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the poetry manager when the page loads
let poetryManager;

document.addEventListener('DOMContentLoaded', () => {
    // Load daily Quran verse
    loadQuranVerse('daily-verse-container');
    poetryManager = new PoetryManager();
});