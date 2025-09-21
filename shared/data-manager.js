/**
 * LifeOS Data Manager
 * Handle data export, import, backup, and restore functionality
 */

class DataManager {
    constructor() {
        this.exportFormats = ['json', 'csv', 'txt'];
        this.modules = [
            'todoList',
            'fitness', 
            'finance',
            'habits',
            'goals',
            'journal',
            'poetry'
        ];
    }

    /**
     * Export all data in specified format
     * @param {string} format - Export format (json, csv, txt)
     * @param {Array} selectedModules - Modules to export (optional)
     */
    async exportAllData(format = 'json', selectedModules = null) {
        try {
            const modulesToExport = selectedModules || this.modules;
            const exportData = this.gatherExportData(modulesToExport);
            
            switch (format.toLowerCase()) {
                case 'json':
                    return this.exportAsJSON(exportData);
                case 'csv':
                    return this.exportAsCSV(exportData);
                case 'txt':
                    return this.exportAsText(exportData);
                default:
                    throw new Error('Unsupported export format');
            }
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }

    /**
     * Gather data from all modules
     * @param {Array} modules - Modules to gather data from
     */
    gatherExportData(modules) {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                platform: 'LifeOS',
                modules: modules
            },
            data: {}
        };

        modules.forEach(module => {
            exportData.data[module] = this.getModuleData(module);
        });

        return exportData;
    }

    /**
     * Get data for a specific module
     * @param {string} moduleName - Name of the module
     */
    getModuleData(moduleName) {
        const moduleData = {
            moduleName,
            exportDate: new Date().toISOString(),
            data: {}
        };

        // Get all keys for this module
        const keys = window.StorageUtils.getKeysWithPrefix(moduleName);
        
        keys.forEach(key => {
            const cleanKey = key.replace(`${moduleName}_`, '');
            const value = window.StorageUtils.get(key);
            if (value !== null) {
                moduleData.data[cleanKey] = value;
            }
        });

        // Add metadata
        moduleData.statistics = this.generateModuleStatistics(moduleName, moduleData.data);

        return moduleData;
    }

    /**
     * Generate statistics for a module
     * @param {string} moduleName - Module name
     * @param {Object} data - Module data
     */
    generateModuleStatistics(moduleName, data) {
        const stats = {
            totalItems: 0,
            lastUpdated: null,
            dataSize: JSON.stringify(data).length
        };

        switch (moduleName) {
            case 'todoList':
                if (data.tasks) {
                    stats.totalItems = data.tasks.length;
                    stats.completedTasks = data.tasks.filter(t => t.completed).length;
                    stats.pendingTasks = data.tasks.filter(t => !t.completed).length;
                }
                break;
            
            case 'habits':
                if (data.list) {
                    stats.totalItems = data.list.length;
                    stats.activeHabits = data.list.filter(h => h.active !== false).length;
                }
                break;
            
            case 'goals':
                if (data.list) {
                    stats.totalItems = data.list.length;
                    stats.activeGoals = data.list.filter(g => g.status === 'active').length;
                    stats.completedGoals = data.list.filter(g => g.status === 'completed').length;
                }
                break;
            
            case 'fitness':
                if (data.workouts) stats.totalWorkouts = data.workouts.length;
                if (data.goals) stats.totalGoals = data.goals.length;
                break;
            
            case 'finance':
                if (data.transactions) {
                    stats.totalItems = data.transactions.length;
                    stats.totalIncome = data.transactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + (t.amount || 0), 0);
                    stats.totalExpenses = data.transactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + (t.amount || 0), 0);
                }
                break;
            
            case 'journal':
                if (data.entries) {
                    stats.totalItems = data.entries.length;
                    stats.totalWords = data.entries.reduce((sum, entry) => {
                        return sum + (entry.content ? entry.content.split(' ').length : 0);
                    }, 0);
                }
                break;
            
            case 'poetry':
                if (data.collection) {
                    stats.totalItems = data.collection.length;
                    stats.totalLines = data.collection.reduce((sum, poem) => {
                        return sum + (poem.content ? poem.content.split('\n').length : 0);
                    }, 0);
                }
                break;
        }

        return stats;
    }

    /**
     * Export data as JSON
     * @param {Object} exportData - Data to export
     */
    exportAsJSON(exportData) {
        const jsonString = JSON.stringify(exportData, null, 2);
        this.downloadFile(
            jsonString,
            `lifeos-backup-${this.formatDate()}.json`,
            'application/json'
        );
        return jsonString;
    }

    /**
     * Export data as CSV
     * @param {Object} exportData - Data to export
     */
    exportAsCSV(exportData) {
        let csvContent = '';
        
        Object.keys(exportData.data).forEach(moduleName => {
            const moduleData = exportData.data[moduleName];
            csvContent += this.moduleToCSV(moduleName, moduleData.data);
            csvContent += '\n\n';
        });

        this.downloadFile(
            csvContent,
            `lifeos-backup-${this.formatDate()}.csv`,
            'text/csv'
        );
        return csvContent;
    }

    /**
     * Convert module data to CSV format
     * @param {string} moduleName - Module name
     * @param {Object} data - Module data
     */
    moduleToCSV(moduleName, data) {
        let csv = `# ${moduleName.toUpperCase()} MODULE\n`;
        
        Object.keys(data).forEach(key => {
            const value = data[key];
            
            if (Array.isArray(value)) {
                csv += `# ${key}\n`;
                if (value.length > 0 && typeof value[0] === 'object') {
                    // Array of objects - create table
                    const headers = Object.keys(value[0]);
                    csv += headers.join(',') + '\n';
                    
                    value.forEach(item => {
                        const row = headers.map(header => {
                            const val = item[header];
                            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
                        });
                        csv += row.join(',') + '\n';
                    });
                } else {
                    // Simple array
                    value.forEach(item => {
                        csv += `"${item}"\n`;
                    });
                }
            } else if (typeof value === 'object') {
                csv += `# ${key}\n`;
                Object.keys(value).forEach(subKey => {
                    csv += `${subKey},"${value[subKey]}"\n`;
                });
            } else {
                csv += `${key},"${value}"\n`;
            }
            csv += '\n';
        });
        
        return csv;
    }

    /**
     * Export data as text
     * @param {Object} exportData - Data to export
     */
    exportAsText(exportData) {
        let textContent = `LIFEOS DATA BACKUP\n`;
        textContent += `Generated: ${new Date().toLocaleString()}\n`;
        textContent += `Modules: ${exportData.metadata.modules.join(', ')}\n`;
        textContent += `${'='.repeat(50)}\n\n`;

        Object.keys(exportData.data).forEach(moduleName => {
            const moduleData = exportData.data[moduleName];
            textContent += this.moduleToText(moduleName, moduleData.data, moduleData.statistics);
            textContent += '\n\n';
        });

        this.downloadFile(
            textContent,
            `lifeos-backup-${this.formatDate()}.txt`,
            'text/plain'
        );
        return textContent;
    }

    /**
     * Convert module data to text format
     * @param {string} moduleName - Module name
     * @param {Object} data - Module data
     * @param {Object} stats - Module statistics
     */
    moduleToText(moduleName, data, stats) {
        let text = `${moduleName.toUpperCase()} MODULE\n`;
        text += `${'-'.repeat(20)}\n`;
        
        // Add statistics
        if (stats) {
            text += `Statistics:\n`;
            Object.keys(stats).forEach(key => {
                text += `  ${key}: ${stats[key]}\n`;
            });
            text += '\n';
        }

        // Add data
        Object.keys(data).forEach(key => {
            const value = data[key];
            text += `${key}:\n`;
            
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (typeof item === 'object') {
                        text += `  ${index + 1}. ${JSON.stringify(item, null, 4)}\n`;
                    } else {
                        text += `  - ${item}\n`;
                    }
                });
            } else if (typeof value === 'object') {
                text += JSON.stringify(value, null, 2) + '\n';
            } else {
                text += `  ${value}\n`;
            }
            text += '\n';
        });
        
        return text;
    }

    /**
     * Import data from file
     * @param {File} file - File to import
     * @param {boolean} overwrite - Whether to overwrite existing data
     */
    async importData(file, overwrite = false) {
        try {
            const text = await file.text();
            let importData;

            // Determine file type and parse
            if (file.name.endsWith('.json')) {
                importData = JSON.parse(text);
            } else {
                throw new Error('Only JSON imports are currently supported');
            }

            // Validate import data
            if (!this.validateImportData(importData)) {
                throw new Error('Invalid import data format');
            }

            // Import data
            const result = await this.processImportData(importData, overwrite);
            
            // Refresh UI
            this.refreshUI();
            
            return result;
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }

    /**
     * Validate import data structure
     * @param {Object} data - Import data
     */
    validateImportData(data) {
        return data && 
               data.metadata && 
               data.data && 
               Array.isArray(data.metadata.modules);
    }

    /**
     * Process import data
     * @param {Object} importData - Data to import
     * @param {boolean} overwrite - Whether to overwrite existing data
     */
    async processImportData(importData, overwrite) {
        const results = {
            success: [],
            errors: [],
            skipped: []
        };

        for (const moduleName of importData.metadata.modules) {
            try {
                const moduleData = importData.data[moduleName];
                if (!moduleData || !moduleData.data) {
                    results.skipped.push(moduleName);
                    continue;
                }

                // Import module data
                Object.keys(moduleData.data).forEach(key => {
                    const fullKey = `${moduleName}_${key}`;
                    const existingData = window.StorageUtils.get(fullKey);
                    
                    if (existingData && !overwrite) {
                        results.skipped.push(`${moduleName}.${key}`);
                    } else {
                        window.StorageUtils.set(fullKey, moduleData.data[key]);
                        results.success.push(`${moduleName}.${key}`);
                    }
                });

            } catch (error) {
                results.errors.push(`${moduleName}: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Create backup automatically
     */
    createAutoBackup() {
        const backup = this.gatherExportData(this.modules);
        
        // Store in localStorage with timestamp
        const backupKey = `lifeos_backup_${Date.now()}`;
        window.StorageUtils.set(backupKey, backup);
        
        // Keep only last 5 backups
        this.cleanupOldBackups();
        
        return backup;
    }

    /**
     * Clean up old backups
     */
    cleanupOldBackups() {
        const backupKeys = window.StorageUtils.getKeysWithPrefix('lifeos_backup_');
        
        if (backupKeys.length > 5) {
            // Sort by timestamp and remove oldest
            backupKeys.sort().slice(0, -5).forEach(key => {
                StorageUtils.remove(key);
            });
        }
    }

    /**
     * Get available backups
     */
    getAvailableBackups() {
        const backupKeys = window.StorageUtils.getKeysWithPrefix('lifeos_backup_');
        
        return backupKeys.map(key => {
            const timestamp = key.replace('lifeos_backup_', '');
            const date = new Date(parseInt(timestamp));
            
            return {
                key,
                timestamp: parseInt(timestamp),
                date: date.toLocaleString(),
                size: JSON.stringify(window.StorageUtils.get(key)).length
            };
        }).sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Restore from backup
     * @param {string} backupKey - Backup key to restore
     */
    restoreFromBackup(backupKey) {
        const backup = window.StorageUtils.get(backupKey);
        if (!backup) {
            throw new Error('Backup not found');
        }

        return this.processImportData(backup, true);
    }

    /**
     * Download file helper
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Format date for filenames
     */
    formatDate() {
        const now = new Date();
        return now.toISOString().split('T')[0].replace(/-/g, '');
    }

    /**
     * Show data manager UI
     */
    showDataManager() {
        if (!document.getElementById('data-manager')) {
            this.createDataManagerUI();
        }
        document.getElementById('data-manager').style.display = 'block';
    }

    /**
     * Create data manager UI
     */
    createDataManagerUI() {
        const ui = document.createElement('div');
        ui.id = 'data-manager';
        ui.innerHTML = `
            <div class="data-manager-overlay">
                <div class="data-manager-panel">
                    <div class="data-manager-header">
                        <h3>📊 Data Management</h3>
                        <button class="close-data-manager" onclick="document.getElementById('data-manager').style.display='none'">×</button>
                    </div>
                    
                    <div class="data-manager-tabs">
                        <button class="tab-btn active" data-tab="export">Export</button>
                        <button class="tab-btn" data-tab="import">Import</button>
                        <button class="tab-btn" data-tab="backup">Backup</button>
                    </div>
                    
                    <div class="tab-content" id="export-tab">
                        <h4>Export Your Data</h4>
                        <div class="export-options">
                            <div class="format-selection">
                                <label>Format:</label>
                                <select id="export-format">
                                    <option value="json">JSON (Complete)</option>
                                    <option value="csv">CSV (Tables)</option>
                                    <option value="txt">Text (Readable)</option>
                                </select>
                            </div>
                            
                            <div class="module-selection">
                                <label>Modules to export:</label>
                                <div class="module-checkboxes">
                                    ${this.modules.map(module => `
                                        <label class="checkbox-label">
                                            <input type="checkbox" value="${module}" checked>
                                            ${this.getModuleDisplayName(module)}
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <button class="export-btn">📥 Export Data</button>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="import-tab" style="display: none;">
                        <h4>Import Data</h4>
                        <div class="import-options">
                            <div class="file-upload">
                                <input type="file" id="import-file" accept=".json">
                                <label for="import-file" class="file-label">Choose File</label>
                            </div>
                            
                            <label class="checkbox-label">
                                <input type="checkbox" id="overwrite-data">
                                Overwrite existing data
                            </label>
                            
                            <button class="import-btn" disabled>📤 Import Data</button>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="backup-tab" style="display: none;">
                        <h4>Automatic Backups</h4>
                        <div class="backup-options">
                            <button class="create-backup-btn">💾 Create Backup Now</button>
                            
                            <div class="backup-list">
                                <h5>Available Backups:</h5>
                                <div id="backup-list-container">
                                    <!-- Backup list will be populated here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addDataManagerStyles();
        document.body.appendChild(ui);
        this.attachDataManagerEvents();
        this.updateBackupList();
    }

    /**
     * Get display name for module
     */
    getModuleDisplayName(module) {
        const displayNames = {
            'todoList': 'To-Do List',
            'fitness': 'Fitness',
            'finance': 'Finance',
            'habits': 'Habits',
            'goals': 'Goals',
            'journal': 'Journal',
            'poetry': 'Poetry'
        };
        return displayNames[module] || module;
    }

    /**
     * Add data manager styles
     */
    addDataManagerStyles() {
        if (document.querySelector('#data-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'data-manager-styles';
        style.textContent = `
            #data-manager {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 10001;
                display: none;
            }
            
            .data-manager-overlay {
                background: rgba(0, 0, 0, 0.7);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .data-manager-panel {
                background: white;
                border-radius: 15px;
                width: 100%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            }
            
            .data-manager-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 30px;
                border-bottom: 1px solid #eee;
            }
            
            .data-manager-header h3 {
                margin: 0;
                color: #333;
            }
            
            .close-data-manager {
                background: none;
                border: none;
                font-size: 24px;
                color: #666;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .data-manager-tabs {
                display: flex;
                border-bottom: 1px solid #eee;
            }
            
            .tab-btn {
                flex: 1;
                padding: 15px;
                background: none;
                border: none;
                cursor: pointer;
                font-weight: 500;
                color: #666;
                transition: all 0.2s ease;
            }
            
            .tab-btn.active {
                color: #667eea;
                border-bottom: 2px solid #667eea;
                background: rgba(102, 126, 234, 0.05);
            }
            
            .tab-content {
                padding: 30px;
            }
            
            .tab-content h4 {
                margin: 0 0 20px 0;
                color: #333;
            }
            
            .format-selection,
            .module-selection {
                margin-bottom: 20px;
            }
            
            .format-selection label,
            .module-selection label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #666;
            }
            
            .format-selection select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
            }
            
            .module-checkboxes {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }
            
            .checkbox-label {
                display: flex !important;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: #666;
                cursor: pointer;
            }
            
            .checkbox-label input[type="checkbox"] {
                margin: 0;
            }
            
            .export-btn,
            .import-btn,
            .create-backup-btn {
                width: 100%;
                padding: 12px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease;
                margin-top: 10px;
            }
            
            .export-btn:hover,
            .import-btn:hover,
            .create-backup-btn:hover {
                background: #5a6fd8;
            }
            
            .import-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            
            .file-upload {
                margin-bottom: 15px;
            }
            
            .file-upload input[type="file"] {
                display: none;
            }
            
            .file-label {
                display: inline-block;
                padding: 10px 15px;
                background: #f8f9fa;
                border: 2px dashed #dee2e6;
                border-radius: 6px;
                cursor: pointer;
                text-align: center;
                width: 100%;
                box-sizing: border-box;
                transition: all 0.2s ease;
            }
            
            .file-label:hover {
                border-color: #667eea;
                background: rgba(102, 126, 234, 0.05);
            }
            
            .backup-list {
                margin-top: 20px;
            }
            
            .backup-list h5 {
                margin: 0 0 10px 0;
                color: #666;
            }
            
            .backup-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 6px;
                margin-bottom: 8px;
            }
            
            .backup-info {
                flex: 1;
            }
            
            .backup-date {
                font-weight: 500;
                color: #333;
            }
            
            .backup-size {
                font-size: 12px;
                color: #666;
            }
            
            .backup-actions {
                display: flex;
                gap: 8px;
            }
            
            .backup-restore,
            .backup-download {
                padding: 4px 8px;
                font-size: 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .backup-restore {
                background: #52c41a;
                color: white;
            }
            
            .backup-download {
                background: #1890ff;
                color: white;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Attach data manager event listeners
     */
    attachDataManagerEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Update active tab
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                document.getElementById(`${tabId}-tab`).style.display = 'block';
            });
        });

        // Export button
        document.querySelector('.export-btn').addEventListener('click', async () => {
            const format = document.getElementById('export-format').value;
            const selectedModules = Array.from(document.querySelectorAll('.module-checkboxes input:checked'))
                .map(cb => cb.value);
            
            try {
                await this.exportAllData(format, selectedModules);
                alert('Export completed successfully!');
            } catch (error) {
                alert('Export failed: ' + error.message);
            }
        });

        // Import file selection
        document.getElementById('import-file').addEventListener('change', (e) => {
            const importBtn = document.querySelector('.import-btn');
            importBtn.disabled = !e.target.files[0];
        });

        // Import button
        document.querySelector('.import-btn').addEventListener('click', async () => {
            const file = document.getElementById('import-file').files[0];
            const overwrite = document.getElementById('overwrite-data').checked;
            
            if (!file) return;
            
            try {
                const result = await this.importData(file, overwrite);
                alert(`Import completed!\nSuccess: ${result.success.length}\nSkipped: ${result.skipped.length}\nErrors: ${result.errors.length}`);
                this.updateBackupList();
            } catch (error) {
                alert('Import failed: ' + error.message);
            }
        });

        // Create backup button
        document.querySelector('.create-backup-btn').addEventListener('click', () => {
            this.createAutoBackup();
            this.updateBackupList();
            alert('Backup created successfully!');
        });
    }

    /**
     * Update backup list display
     */
    updateBackupList() {
        const container = document.getElementById('backup-list-container');
        if (!container) return;

        const backups = this.getAvailableBackups();
        
        if (backups.length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">No backups available</p>';
            return;
        }

        container.innerHTML = backups.map(backup => `
            <div class="backup-item">
                <div class="backup-info">
                    <div class="backup-date">${backup.date}</div>
                    <div class="backup-size">${StorageUtils.formatBytes(backup.size)}</div>
                </div>
                <div class="backup-actions">
                    <button class="backup-restore" onclick="DataManager.restoreBackup('${backup.key}')">Restore</button>
                    <button class="backup-download" onclick="DataManager.downloadBackup('${backup.key}')">Download</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Restore from backup (called from UI)
     */
    restoreBackup(backupKey) {
        if (confirm('This will overwrite all current data. Are you sure?')) {
            try {
                this.restoreFromBackup(backupKey);
                alert('Data restored successfully!');
                this.refreshUI();
            } catch (error) {
                alert('Restore failed: ' + error.message);
            }
        }
    }

    /**
     * Download backup as file
     */
    downloadBackup(backupKey) {
        const backup = window.StorageUtils.get(backupKey);
        if (backup) {
            const jsonString = JSON.stringify(backup, null, 2);
            this.downloadFile(
                jsonString,
                `lifeos-backup-${backup.metadata.exportDate.split('T')[0]}.json`,
                'application/json'
            );
        }
    }

    /**
     * Refresh UI after data changes
     */
    refreshUI() {
        // Refresh dashboard widgets if present
        if (window.DashboardWidgets) {
            const container = document.querySelector('.dashboard-widgets');
            if (container) {
                DashboardWidgets.renderWidgets('dashboard-container');
            }
        }
        
        // Emit data refresh event
        window.dispatchEvent(new CustomEvent('dataRefresh'));
    }
}

// Create global instance
window.DataManager = new DataManager();