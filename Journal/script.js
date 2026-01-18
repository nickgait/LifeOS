/**
 * LifeOS Journal App
 * Daily journaling and reflection app
 */

class JournalApp extends BaseApp {
  constructor() {
    super('journal-entries');

    // App-specific properties
    this.entries = this.data; // Alias for clarity
    this.selectedEntry = null;
    this.searchQuery = '';
    this.selectedTags = new Set(); // Track selected tags for filtering
    this.moodEmojis = {
      amazing: '😄',
      good: '🙂',
      okay: '😐',
      bad: '😔',
      terrible: '😢'
    };
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

    // Timeline period selector
    const timelinePeriod = document.getElementById('timeline-period');
    if (timelinePeriod) {
      timelinePeriod.addEventListener('change', (e) => {
        const customRange = document.getElementById('custom-date-range');
        if (customRange) {
          customRange.style.display = e.target.value === 'custom' ? 'flex' : 'none';
        }
      });
    }
  }

  handleEntrySubmit(e) {
    e.preventDefault();

    // Extract and validate journal entry data
    const rawEntryData = {
      date: document.getElementById('entry-date').value,
      title: document.getElementById('entry-title').value,
      content: document.getElementById('entry-content').value,
      mood: document.getElementById('entry-mood').value || 'okay',
      tags: document.getElementById('entry-tags').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t)
    };

    // Validate the entry data using predefined schema
    const validation = Validator.journalSchema.safeParse(rawEntryData);
    if (!validation.success) {
      const errorMessages = validation.errors.map(err => err.message).join('\n');
      alert('Validation Error:\n' + errorMessages);
      return;
    }

    // Create entry with validated data
    const entry = this.createItem(validation.data);

    this.entries.push(entry);
    this.save();

    e.target.reset();
    this.setupDefaultDates();
    alert('Entry saved successfully!');
    this.renderEntries();
    this.updateDashboard();
  }

  viewEntry(entryId) {
    this.selectedEntry = this.findById(entryId);
    this.renderEntryDetail();
  }

  deleteEntry(entryId) {
    if (confirm('Delete this entry? This cannot be undone.')) {
      this.deleteById(entryId);
      this.selectedEntry = null;
      this.renderEntries();
      this.updateDashboard();
    }
  }

  editEntry(entryId) {
    const entry = this.findById(entryId);
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

  getWordCount(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  calculateStreaks() {
    if (this.entries.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Get unique dates sorted
    const dates = [...new Set(this.entries.map(e => e.date))].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if most recent entry is today or yesterday
    const mostRecentDate = new Date(dates[dates.length - 1]);
    mostRecentDate.setHours(0, 0, 0, 0);

    const daysSinceLastEntry = Math.floor((today - mostRecentDate) / (1000 * 60 * 60 * 24));

    // Calculate streaks
    for (let i = dates.length - 1; i > 0; i--) {
      const currentDate = new Date(dates[i]);
      const prevDate = new Date(dates[i - 1]);
      currentDate.setHours(0, 0, 0, 0);
      prevDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak (only if recent entry is today or yesterday)
    if (daysSinceLastEntry <= 1) {
      currentStreak = 1;
      for (let i = dates.length - 1; i > 0; i--) {
        const currentDate = new Date(dates[i]);
        const prevDate = new Date(dates[i - 1]);
        currentDate.setHours(0, 0, 0, 0);
        prevDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { current: currentStreak, longest: longestStreak };
  }

  getAllTags() {
    const tagSet = new Set();
    this.entries.forEach(entry => {
      entry.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  toggleTagFilter(tag) {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
    this.renderEntries();
    this.renderTagFilters();
  }

  clearTagFilters() {
    this.selectedTags.clear();
    this.renderEntries();
    this.renderTagFilters();
  }

  renderEntries() {
    const entriesList = document.getElementById('entries-list');
    if (!entriesList) return;

    let filtered = this.entries;

    // Apply tag filter
    if (this.selectedTags.size > 0) {
      filtered = filtered.filter(e =>
        e.tags.some(tag => this.selectedTags.has(tag))
      );
    }

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
      .map(entry => {
        const safeTitle = Sanitizer.escapeHTML(entry.title);
        const safeContent = Sanitizer.escapeHTML(entry.content);
        const safeTags = entry.tags.map(t => Sanitizer.escapeHTML(t)).join(', ');

        return `
        <div class="entry-item">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1; cursor: pointer;" onclick="journalApp.viewEntry(${entry.id})">
              <div class="entry-date">${this.formatDate(entry.date)}</div>
              ${entry.title ? `<div style="font-weight: 600; color: #333; margin-bottom: 5px;">${safeTitle}</div>` : ''}
              <div class="entry-preview">${safeContent}</div>
            </div>
            <div class="entry-mood" title="${Sanitizer.escapeHTML(entry.mood)}">${this.getMoodEmoji(entry.mood)}</div>
          </div>
          <div class="entry-meta">
            ${entry.tags.length > 0 ? `<span>${safeTags}</span>` : ''}
            ${entry.tags.length > 0 ? ' • ' : ''}
            <span>${this.getWordCount(entry.content)} words</span>
          </div>
          <div class="entry-actions">
            <button class="journal-btn journal-btn-small" onclick="journalApp.editEntry(${entry.id})">Edit</button>
            <button class="journal-btn journal-btn-small journal-btn-danger" onclick="journalApp.deleteEntry(${entry.id})">Delete</button>
          </div>
        </div>
      `;
      }).join('');
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
    const safeTitle = Sanitizer.escapeHTML(entry.title) || 'Untitled Entry';
    const safeContent = Sanitizer.escapeHTML(entry.content);

    detailDiv.innerHTML = `
      <div class="entry-detail">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h3>${safeTitle}</h3>
            <div class="entry-detail-date">${this.formatDate(entry.date)}</div>
          </div>
          <div class="entry-detail-mood">${this.getMoodEmoji(entry.mood)}</div>
        </div>

        <div class="entry-detail-content">${safeContent}</div>

        ${entry.tags.length > 0 ? `
          <div style="margin-bottom: 15px;">
            ${entry.tags.map(tag => `
              <span style="display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-right: 8px; margin-bottom: 8px;">
                ${Sanitizer.escapeHTML(tag)}
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

    // Calculate and display streaks
    const streaks = this.calculateStreaks();
    document.getElementById('current-streak').textContent = `${streaks.current} 🔥`;
    document.getElementById('longest-streak').textContent = `${streaks.longest} 🏆`;

    this.renderRecentEntries();
    this.renderMoodChart();
    this.renderOnThisDay();
    this.renderTimelineChart();
    this.renderTimelineInsights();
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

    recentDiv.innerHTML = recent.map(entry => {
      const safeTitle = Sanitizer.escapeHTML(entry.title);
      return `
      <div class="entry-item" style="margin-bottom: 10px;" onclick="journalApp.viewEntry(${entry.id})">
        <div style="display: flex; justify-content: space-between;">
          <div>
            <div class="entry-date" style="margin-bottom: 3px;">${this.formatDate(entry.date)}</div>
            ${entry.title ? `<div style="font-weight: 500; color: #333; font-size: 13px;">${safeTitle}</div>` : ''}
          </div>
          <div style="font-size: 20px;">${this.getMoodEmoji(entry.mood)}</div>
        </div>
      </div>
    `;
    }).join('');
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

  renderTagFilters() {
    const tagFilterDiv = document.getElementById('tag-filters');
    if (!tagFilterDiv) return;

    const allTags = this.getAllTags();

    if (allTags.length === 0) {
      tagFilterDiv.innerHTML = '';
      return;
    }

    tagFilterDiv.innerHTML = `
      <div class="tag-filter">
        ${allTags.map(tag => {
          const safeTag = Sanitizer.escapeHTML(tag);
          // Use data attribute for the tag value to avoid injection in onclick
          return `
          <button
            class="tag-filter-btn ${this.selectedTags.has(tag) ? 'active' : ''}"
            data-tag="${safeTag}"
            onclick="journalApp.toggleTagFilter(this.dataset.tag)"
          >
            ${safeTag}
          </button>
        `;
        }).join('')}
        ${this.selectedTags.size > 0 ? `
          <button class="tag-filter-btn clear-btn" onclick="journalApp.clearTagFilters()">
            Clear Filters
          </button>
        ` : ''}
      </div>
    `;
  }

  getTimelineEntries() {
    const period = document.getElementById('timeline-period')?.value;
    const now = new Date();
    let startDate;

    if (period === 'custom') {
      const startInput = document.getElementById('timeline-start')?.value;
      const endInput = document.getElementById('timeline-end')?.value;
      if (!startInput || !endInput) return this.entries;

      startDate = new Date(startInput);
      const endDate = new Date(endInput);
      return this.entries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
    } else if (period === 'all') {
      return this.entries;
    } else {
      const days = parseInt(period) || 30;
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);

      return this.entries.filter(e => new Date(e.date) >= startDate);
    }
  }

  updateTimeline() {
    this.renderTimelineChart();
    this.renderTimelineInsights();
  }

  renderTimelineChart() {
    const chartDiv = document.getElementById('timeline-chart');
    if (!chartDiv) return;

    const timelineEntries = this.getTimelineEntries();

    if (timelineEntries.length === 0) {
      chartDiv.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p>No entries in this time period</p>
        </div>
      `;
      return;
    }

    // Group entries by date
    const entriesByDate = {};
    timelineEntries.forEach(entry => {
      const date = entry.date;
      if (!entriesByDate[date]) {
        entriesByDate[date] = { count: 0, moods: [], words: 0 };
      }
      entriesByDate[date].count++;
      entriesByDate[date].moods.push(entry.mood);
      entriesByDate[date].words += this.getWordCount(entry.content);
    });

    // Sort by date
    const sortedDates = Object.keys(entriesByDate).sort();
    const maxCount = Math.max(...Object.values(entriesByDate).map(d => d.count));

    chartDiv.innerHTML = `
      <div style="margin-top: 15px;">
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 15px;">
          ${sortedDates.map(date => {
            const data = entriesByDate[date];
            const intensity = (data.count / maxCount * 100);
            const backgroundColor = intensity > 66 ? '#667eea' : intensity > 33 ? '#9ca3f5' : '#d0d4f7';

            return `
              <div
                title="${this.formatDate(date)}: ${data.count} ${data.count === 1 ? 'entry' : 'entries'}, ${data.words} words"
                style="
                  width: 18px;
                  height: 18px;
                  background: ${backgroundColor};
                  border-radius: 3px;
                  cursor: pointer;
                "
              ></div>
            `;
          }).join('')}
        </div>
        <div style="font-size: 12px; color: #999; display: flex; gap: 15px; align-items: center;">
          <span>Activity Level:</span>
          <div style="display: flex; gap: 5px; align-items: center;">
            <div style="width: 12px; height: 12px; background: #d0d4f7; border-radius: 2px;"></div>
            <span style="font-size: 11px;">Low</span>
          </div>
          <div style="display: flex; gap: 5px; align-items: center;">
            <div style="width: 12px; height: 12px; background: #9ca3f5; border-radius: 2px;"></div>
            <span style="font-size: 11px;">Medium</span>
          </div>
          <div style="display: flex; gap: 5px; align-items: center;">
            <div style="width: 12px; height: 12px; background: #667eea; border-radius: 2px;"></div>
            <span style="font-size: 11px;">High</span>
          </div>
        </div>
      </div>
    `;
  }

  renderTimelineInsights() {
    const insightsDiv = document.getElementById('timeline-insights');
    if (!insightsDiv) return;

    const timelineEntries = this.getTimelineEntries();

    if (timelineEntries.length === 0) {
      insightsDiv.innerHTML = '';
      return;
    }

    const totalWords = timelineEntries.reduce((sum, e) => sum + this.getWordCount(e.content), 0);
    const avgWords = Math.round(totalWords / timelineEntries.length);

    const moodCounts = {};
    timelineEntries.forEach(e => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    // Calculate dates with entries
    const datesWithEntries = new Set(timelineEntries.map(e => e.date));

    insightsDiv.innerHTML = `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
        <h3 style="font-size: 16px; margin-bottom: 15px; color: #333;">Insights</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: bold; color: #667eea;">${timelineEntries.length}</div>
            <div style="font-size: 13px; color: #666;">Total Entries</div>
          </div>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: bold; color: #667eea;">${datesWithEntries.size}</div>
            <div style="font-size: 13px; color: #666;">Active Days</div>
          </div>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: bold; color: #667eea;">${avgWords}</div>
            <div style="font-size: 13px; color: #666;">Avg Words/Entry</div>
          </div>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <div style="font-size: 24px;">${this.getMoodEmoji(dominantMood[0])}</div>
            <div style="font-size: 13px; color: #666;">Dominant Mood</div>
          </div>
        </div>
      </div>
    `;
  }

  renderOnThisDay() {
    const onThisDayDiv = document.getElementById('on-this-day');
    if (!onThisDayDiv) return;

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // Find entries from this day in previous years
    const historicalEntries = this.entries.filter(e => {
      const entryDate = new Date(e.date);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth() + 1;
      const entryDay = entryDate.getDate();

      return (entryMonth === currentMonth && entryDay === currentDay && entryYear < today.getFullYear());
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (historicalEntries.length === 0) {
      onThisDayDiv.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p>No entries from this day in previous years</p>
          <p style="font-size: 12px; color: #999; margin-top: 5px;">Keep journaling to build your history!</p>
        </div>
      `;
      return;
    }

    onThisDayDiv.innerHTML = `
      <div style="margin-bottom: 10px; color: #666; font-size: 14px;">
        Looking back at ${this.formatDate(today.toISOString().split('T')[0])} in previous years
      </div>
      ${historicalEntries.map(entry => {
        const entryYear = new Date(entry.date).getFullYear();
        const yearsAgo = today.getFullYear() - entryYear;
        const safeTitle = Sanitizer.escapeHTML(entry.title);
        const safeContent = Sanitizer.escapeHTML(entry.content);
        const safeTags = entry.tags.map(t => Sanitizer.escapeHTML(t)).join(', ');

        return `
          <div class="entry-item" style="margin-bottom: 15px; cursor: pointer;" onclick="journalApp.viewEntry(${entry.id})">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <div>
                <div style="font-weight: 600; color: #667eea; font-size: 14px;">
                  ${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} ago (${entryYear})
                </div>
                ${entry.title ? `<div style="font-weight: 500; color: #333; margin-top: 3px;">${safeTitle}</div>` : ''}
              </div>
              <div style="font-size: 20px;">${this.getMoodEmoji(entry.mood)}</div>
            </div>
            <div class="entry-preview" style="margin-bottom: 8px;">${safeContent}</div>
            ${entry.tags.length > 0 ? `
              <div style="font-size: 11px; color: #999;">
                ${safeTags}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    `;
  }

  refresh() {
    super.refresh(); // Call BaseApp refresh
    this.entries = this.data; // Update alias
    this.renderEntries();
    this.renderTagFilters();
  }
}

// Tab switching
function switchTab(tabName) {
  UIUtils.switchTab(tabName, journalApp, {
    'dashboard': () => journalApp.updateDashboard(),
    'entries': () => {
      journalApp.renderEntries();
      journalApp.renderTagFilters();
    }
  });
}

// Initialize app
let journalApp = UIUtils.initializeApp(JournalApp, 'journalApp');
