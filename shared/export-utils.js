/**
 * LifeOS Export Utilities
 * Universal data export functionality for all LifeOS apps
 * Supports CSV and JSON formats with app-specific transformers
 */

const ExportUtils = {
  /**
   * Transform fitness activities data for CSV export
   */
  transformFitnessActivitiesData(activities) {
    return activities.map(activity => ({
      'ID': activity.id,
      'Date': activity.date,
      'Type': activity.type,
      'Amount': activity.amount,
      'Unit': this.getActivityUnit(activity.type),
      'Notes': activity.notes || '',
      'Created At': activity.createdAt
    }));
  },

  /**
   * Transform fitness goals data for CSV export
   */
  transformFitnessGoalsData(goals) {
    return goals.map(goal => ({
      'ID': goal.id,
      'Name': goal.name,
      'Activity': goal.activity,
      'Target': goal.target,
      'Current': goal.current || 0,
      'Target Date': goal.targetDate,
      'Created Date': goal.createdDate,
      'Status': goal.status,
      'Completed Date': goal.completedDate || ''
    }));
  },

  /**
   * Transform goals data for CSV export
   */
  transformGoalsData(goals) {
    return goals.map(goal => ({
      'ID': goal.id,
      'Name': goal.name,
      'Description': goal.description || '',
      'Category': goal.category,
      'Target Date': goal.targetDate,
      'Status': goal.status,
      'Created At': goal.createdDate || goal.createdAt,
      'Completed At': goal.completedDate || goal.completedAt || ''
    }));
  },

  /**
   * Transform journal data for CSV export
   */
  transformJournalData(journal) {
    return journal.map(entry => ({
      'ID': entry.id,
      'Date': entry.date,
      'Title': entry.title || '',
      'Content': entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : ''),
      'Mood': entry.mood,
      'Tags': entry.tags ? entry.tags.join(', ') : '',
      'Created At': entry.createdAt
    }));
  },

  /**
   * Transform finance data for CSV export
   */
  transformFinanceData(expenses) {
    return expenses.map(expense => ({
      'ID': expense.id,
      'Date': expense.date,
      'Description': expense.description,
      'Amount': expense.amount,
      'Category': expense.category,
      'Created At': expense.createdAt
    }));
  },

  /**
   * Transform todo list data for CSV export
   */
  transformTodoListData(todos) {
    return todos.map(todo => ({
      'ID': todo.id,
      'Title': todo.title,
      'Description': todo.description || '',
      'Priority': todo.priority,
      'Due Date': todo.dueDate || '',
      'Completed': todo.completed ? 'Yes' : 'No',
      'Recurring': todo.recurring || 'None',
      'Created At': todo.createdAt,
      'Completed At': todo.completedAt || ''
    }));
  },

  /**
   * Transform scripture data for CSV export
   */
  transformScriptureData(scripture) {
    return scripture.map(entry => ({
      'ID': entry.id,
      'Date': entry.date,
      'Book': entry.book,
      'Chapter': entry.chapter,
      'Verses': entry.verses,
      'Notes': entry.notes || '',
      'Completed': entry.completed ? 'Yes' : 'No',
      'Created At': entry.createdAt
    }));
  },

  /**
   * Escape CSV values (handle quotes, commas, newlines)
   */
  escapeCSV(value) {
    if (value === null || value === undefined) return '';

    const str = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }

    return str;
  },

  /**
   * Convert data array to CSV string
   */
  arrayToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create header row
    const headerRow = headers.map(h => this.escapeCSV(h)).join(',');

    // Create data rows
    const dataRows = data.map(row =>
      headers.map(header => this.escapeCSV(row[header])).join(',')
    );

    return [headerRow, ...dataRows].join('\n');
  },

  /**
   * Export data to JSON format
   */
  exportToJSON(appName, data, filename = null) {
    const finalFilename = filename || `${appName}-export-${this.getCurrentDate()}.json`;

    const exportData = {
      app: appName,
      exportDate: new Date().toISOString(),
      exportTime: new Date().toLocaleString(),
      recordCount: Array.isArray(data) ? data.length : 1,
      data: data
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    this.downloadFile(jsonString, finalFilename, 'application/json');
  },

  /**
   * Export data to CSV format
   */
  exportToCSV(appName, data, filename = null) {
    const finalFilename = filename || `${appName}-export-${this.getCurrentDate()}.csv`;

    // Get transformer function name
    const transformerName = this.getTransformerName(appName);

    // Transform data if transformer exists
    let transformedData = data;
    if (this[transformerName]) {
      transformedData = this[transformerName](Array.isArray(data) ? data : [data]);
    }

    // Add CSV header with metadata
    const header = [
      `# ${appName} Data Export`,
      `# Generated: ${new Date().toLocaleString()}`,
      `# Records: ${Array.isArray(transformedData) ? transformedData.length : 1}`,
      ''
    ].join('\n');

    const csvContent = this.arrayToCSV(transformedData);
    const fullCSV = header + csvContent;

    this.downloadFile(fullCSV, finalFilename, 'text/csv');
  },

  /**
   * Get transformer function name for app
   */
  getTransformerName(appName) {
    const transformers = {
      'Fitness Activities': 'transformFitnessActivitiesData',
      'Fitness Goals': 'transformFitnessGoalsData',
      'Goals': 'transformGoalsData',
      'Journal': 'transformJournalData',
      'Finance': 'transformFinanceData',
      'TodoList': 'transformTodoListData',
      'Scripture': 'transformScriptureData'
    };

    return transformers[appName] || null;
  },

  /**
   * Export all apps to JSON (combined)
   */
  exportAllAppsToJSON(filename = null) {
    const finalFilename = filename || `lifeos-all-apps-${this.getCurrentDate()}.json`;

    // Gather data from all available apps
    const allData = {
      app: 'LifeOS All Apps',
      exportDate: new Date().toISOString(),
      exportTime: new Date().toLocaleString(),
      apps: {}
    };

    // Try to get data from each app
    const appKeys = [
      { key: 'goals-all', name: 'Goals' },
      { key: 'journal-entries', name: 'Journal' },
      { key: 'todo-list', name: 'TodoList' },
      { key: 'fitness-activities', name: 'Fitness Activities' },
      { key: 'fitness-goals', name: 'Fitness Goals' },
      { key: 'finance-expenses', name: 'Finance' },
      { key: 'scripture-readings', name: 'Scripture' }
    ];

    appKeys.forEach(({ key, name }) => {
      const data = StorageManager.get(key) || [];
      if (Array.isArray(data) && data.length > 0) {
        allData.apps[name] = {
          recordCount: data.length,
          data: data
        };
      }
    });

    const jsonString = JSON.stringify(allData, null, 2);
    this.downloadFile(jsonString, finalFilename, 'application/json');
  },

  /**
   * Export all apps to individual CSV files (sequential)
   */
  exportAllAppsToCSV() {
    const apps = [
      { key: 'goals-all', name: 'Goals', transformer: 'transformGoalsData' },
      { key: 'journal-entries', name: 'Journal', transformer: 'transformJournalData' },
      { key: 'todo-list', name: 'TodoList', transformer: 'transformTodoListData' },
      { key: 'fitness-activities', name: 'Fitness Activities', transformer: 'transformFitnessActivitiesData' },
      { key: 'fitness-goals', name: 'Fitness Goals', transformer: 'transformFitnessGoalsData' },
      { key: 'finance-expenses', name: 'Finance', transformer: 'transformFinanceData' },
      { key: 'scripture-readings', name: 'Scripture', transformer: 'transformScriptureData' }
    ];

    const exports = [];
    apps.forEach(({ key, name, transformer }) => {
      const data = StorageManager.get(key) || [];
      if (Array.isArray(data) && data.length > 0) {
        let transformedData = data;
        if (this[transformer]) {
          transformedData = this[transformer](data);
        }

        const header = [
          `# ${name} Data Export`,
          `# Generated: ${new Date().toLocaleString()}`,
          `# Records: ${transformedData.length}`,
          ''
        ].join('\n');

        const csvContent = this.arrayToCSV(transformedData);
        exports.push({
          name: name,
          filename: `${name.toLowerCase().replace(/\s+/g, '-')}-${this.getCurrentDate()}.csv`,
          content: header + csvContent
        });
      }
    });

    // Download all files with slight delay between each
    exports.forEach((file, index) => {
      setTimeout(() => {
        this.downloadFile(file.content, file.filename, 'text/csv');
      }, index * 500);
    });
  },

  /**
   * Download file to user's computer
   */
  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Get current date in YYYY-MM-DD format
   */
  getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Show export dialog/modal for an app
   */
  showExportDialog(appName, data, options = {}) {
    const dialog = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
          <h2 style="margin-top: 0; color: #333;">Export ${Sanitizer.escapeHTML(appName)} Data</h2>
          <p style="color: #666; margin-bottom: 20px;">Choose export format:</p>
          <div style="display: flex; gap: 10px; flex-direction: column;">
            <button id="export-json-btn" style="padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
              Export as JSON
            </button>
            <button id="export-csv-btn" style="padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
              Export as CSV
            </button>
            <button id="export-cancel-btn" style="padding: 12px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;

    const dialogDiv = document.createElement('div');
    dialogDiv.innerHTML = dialog;
    document.body.appendChild(dialogDiv);

    const closeDialog = () => {
      document.body.removeChild(dialogDiv);
    };

    document.getElementById('export-json-btn').addEventListener('click', () => {
      this.exportToJSON(appName, data, options.jsonFilename);
      closeDialog();
    });

    document.getElementById('export-csv-btn').addEventListener('click', () => {
      this.exportToCSV(appName, data, options.csvFilename);
      closeDialog();
    });

    document.getElementById('export-cancel-btn').addEventListener('click', closeDialog);
  }
};

// Make available globally
window.ExportUtils = ExportUtils;
