/**
 * LifeOS Journal App
 * Daily journaling and reflection app
 */

class JournalApp {
  constructor() {
    this.entries = StorageManager.get('journal-entries') || [];
    this.selectedEntry = null;
    this.searchQuery = '';
    this.moodEmojis = {
      amazing: '😄',
      good: '🙂',
      okay: '😐',
      bad: '😔',
      terrible: '😢'
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDefaultDate();
    this.renderEntries();
    this.updateDashboard();

    // Listen for data changes
    StorageManager.onChange('journal-*', () => {
      this.refresh();
    });
  }

  setupEventListeners() {
    const entryForm = document.getElementById('entry-form');
    if (entryForm) {
      entryForm.addEventListener('submit', (e) => this.handleEntrySubmit(e));
    }

    // Mood selector
    document.querySelectorAll('.mood-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.getElementById('entry-mood').value = btn.dataset.mood;
      });
    });

    // Search
    const searchInput = document.getElementById('journal-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderEntries();
      });
    }
  }

  setupDefaultDate() {
    const entryDate = document.getElementById('entry-date');
    if (entryDate) {
      entryDate.value = new Date().toISOString().split('T')[0];
    }
  }

  handleEntrySubmit(e) {
    e.preventDefault();

    const entry = {
      id: Date.now(),
      date: document.getElementById('entry-date').value,
      title: document.getElementById('entry-title').value,
      content: document.getElementById('entry-content').value,
      mood: document.getElementById('entry-mood').value || 'okay',
      tags: document.getElementById('entry-tags').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t),
      createdAt: new Date().toISOString()
    };

    this.entries.push(entry);
    StorageManager.set('journal-entries', this.entries);

    e.target.reset();
    this.setupDefaultDate();
    alert('Entry saved successfully!');
    this.renderEntries();
    this.updateDashboard();
  }

  viewEntry(entryId) {
    this.selectedEntry = this.entries.find(e => e.id === entryId);
    this.renderEntryDetail();
  }

  deleteEntry(entryId) {
    if (confirm('Delete this entry? This cannot be undone.')) {
      this.entries = this.entries.filter(e => e.id !== entryId);
      StorageManager.set('journal-entries', this.entries);
      this.selectedEntry = null;
      this.renderEntries();
      this.updateDashboard();
    }
  }

  editEntry(entryId) {
    const entry = this.entries.find(e => e.id === entryId);
    if (entry) {
      document.getElementById('entry-title').value = entry.title;
      document.getElementById('entry-content').value = entry.content;
      document.getElementById('entry-date').value = entry.date;
      document.getElementById('entry-mood').value = entry.mood;
      document.getElementById('entry-tags').value = entry.tags.join(', ');

      // Highlight mood
      document.querySelectorAll('.mood-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.mood === entry.mood);
      });

      // Delete old entry and scroll to form
      this.deleteEntry(entryId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getMoodEmoji(mood) {
    return this.moodEmojis[mood] || '😐';
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getWordCount(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  renderEntries() {
    const entriesList = document.getElementById('entries-list');
    if (!entriesList) return;

    let filtered = this.entries;

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(this.searchQuery) ||
        e.content.toLowerCase().includes(this.searchQuery) ||
        e.tags.some(t => t.toLowerCase().includes(this.searchQuery))
      );
    }

    if (filtered.length === 0) {
      entriesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p>${this.searchQuery ? 'No entries match your search.' : 'No entries yet. Write your first entry!'}</p>
        </div>
      `;
      return;
    }

    entriesList.innerHTML = filtered
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(entry => `
        <div class="entry-item">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1; cursor: pointer;" onclick="journalApp.viewEntry(${entry.id})">
              <div class="entry-date">${this.formatDate(entry.date)}</div>
              ${entry.title ? `<div style="font-weight: 600; color: #333; margin-bottom: 5px;">${entry.title}</div>` : ''}
              <div class="entry-preview">${entry.content}</div>
            </div>
            <div class="entry-mood" title="${entry.mood}">${this.getMoodEmoji(entry.mood)}</div>
          </div>
          <div class="entry-meta">
            ${entry.tags.length > 0 ? `<span>${entry.tags.join(', ')}</span>` : ''}
            ${entry.tags.length > 0 ? ' • ' : ''}
            <span>${this.getWordCount(entry.content)} words</span>
          </div>
          <div class="entry-actions">
            <button class="journal-btn journal-btn-small" onclick="journalApp.editEntry(${entry.id})">Edit</button>
            <button class="journal-btn journal-btn-small journal-btn-danger" onclick="journalApp.deleteEntry(${entry.id})">Delete</button>
          </div>
        </div>
      `).join('');
  }

  renderEntryDetail() {
    const detailDiv = document.getElementById('entry-detail');
    if (!detailDiv) return;

    if (!this.selectedEntry) {
      detailDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📖</div>
          <p>Select an entry to view details</p>
        </div>
      `;
      return;
    }

    const entry = this.selectedEntry;
    detailDiv.innerHTML = `
      <div class="entry-detail">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h3>${entry.title || 'Untitled Entry'}</h3>
            <div class="entry-detail-date">${this.formatDate(entry.date)}</div>
          </div>
          <div class="entry-detail-mood">${this.getMoodEmoji(entry.mood)}</div>
        </div>

        <div class="entry-detail-content">${entry.content}</div>

        ${entry.tags.length > 0 ? `
          <div style="margin-bottom: 15px;">
            ${entry.tags.map(tag => `
              <span style="display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-right: 8px; margin-bottom: 8px;">
                ${tag}
              </span>
            `).join('')}
          </div>
        ` : ''}

        <div style="display: flex; gap: 10px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
          <small style="color: #999;">
            📝 ${this.getWordCount(entry.content)} words •
            📅 ${this.formatDate(entry.date)}
          </small>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button class="journal-btn journal-btn-small" onclick="journalApp.editEntry(${entry.id})">Edit</button>
          <button class="journal-btn journal-btn-small journal-btn-danger" onclick="journalApp.deleteEntry(${entry.id})">Delete</button>
        </div>
      </div>
    `;
  }

  updateDashboard() {
    document.getElementById('total-entries').textContent = this.entries.length;

    const thisMonth = this.entries.filter(e => {
      const entryDate = new Date(e.date);
      const now = new Date();
      return entryDate.getMonth() === now.getMonth() &&
             entryDate.getFullYear() === now.getFullYear();
    }).length;
    document.getElementById('month-entries').textContent = thisMonth;

    const totalWords = this.entries.reduce((sum, e) => sum + this.getWordCount(e.content), 0);
    document.getElementById('total-words').textContent = totalWords.toLocaleString();

    const moodCounts = {};
    this.entries.forEach(e => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    const mostFrequentMood = mostCommonMood ? mostCommonMood[0] : 'okay';
    document.getElementById('frequent-mood').textContent = this.getMoodEmoji(mostFrequentMood);

    this.renderRecentEntries();
    this.renderMoodChart();
  }

  renderRecentEntries() {
    const recentDiv = document.getElementById('recent-entries');
    if (!recentDiv) return;

    const recent = this.entries
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recent.length === 0) {
      recentDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p>No entries yet. Start journaling!</p>
        </div>
      `;
      return;
    }

    recentDiv.innerHTML = recent.map(entry => `
      <div class="entry-item" style="margin-bottom: 10px;" onclick="journalApp.viewEntry(${entry.id})">
        <div style="display: flex; justify-content: space-between;">
          <div>
            <div class="entry-date" style="margin-bottom: 3px;">${this.formatDate(entry.date)}</div>
            ${entry.title ? `<div style="font-weight: 500; color: #333; font-size: 13px;">${entry.title}</div>` : ''}
          </div>
          <div style="font-size: 20px;">${this.getMoodEmoji(entry.mood)}</div>
        </div>
      </div>
    `).join('');
  }

  renderMoodChart() {
    const chartDiv = document.getElementById('mood-chart');
    if (!chartDiv) return;

    const moodCounts = {};
    this.entries.forEach(e => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });

    if (Object.keys(moodCounts).length === 0) {
      chartDiv.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p>Log entries to see your mood patterns</p>
        </div>
      `;
      return;
    }

    const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);

    chartDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${['amazing', 'good', 'okay', 'bad', 'terrible']
          .filter(mood => moodCounts[mood])
          .map(mood => {
            const count = moodCounts[mood];
            const percentage = (count / total * 100).toFixed(1);
            return `
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
                  <span>${this.getMoodEmoji(mood)} ${mood.charAt(0).toUpperCase() + mood.slice(1)}</span>
                  <span style="color: #999;">${count} (${percentage}%)</span>
                </div>
                <div style="height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                  <div style="height: 100%; background: #667eea; width: ${percentage}%;"></div>
                </div>
              </div>
            `;
          }).join('')}
      </div>
    `;
  }

  refresh() {
    this.entries = StorageManager.get('journal-entries') || [];
    this.renderEntries();
    this.updateDashboard();
  }
}

// Tab switching
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));

  const tab = document.getElementById(`${tabName}-tab`);
  if (tab) {
    tab.classList.add('active');
  }

  if (event.target) {
    event.target.classList.add('active');
  }

  if (tabName === 'dashboard') journalApp.updateDashboard();
  if (tabName === 'entries') journalApp.renderEntries();
}

// Initialize app
let journalApp;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    journalApp = new JournalApp();
  });
} else {
  journalApp = new JournalApp();
}
