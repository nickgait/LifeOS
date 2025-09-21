/**
 * LifeOS Data Management UI
 * User interface for viewing, managing, and clearing localStorage data
 */

class DataManagerUI {
    constructor() {
        this.isOpen = false;
        this.currentView = 'overview';
        this.selectedModule = null;
    }

    /**
     * Open the data management interface
     */
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.createInterface();
        this.loadData();
    }

    /**
     * Close the data management interface
     */
    close() {
        const modal = document.getElementById('data-manager-modal');
        if (modal) {
            modal.remove();
        }
        this.isOpen = false;
    }

    /**
     * Create the main interface
     */
    createInterface() {
        const modal = document.createElement('div');
        modal.id = 'data-manager-modal';
        modal.innerHTML = `
            <div class="data-manager-overlay">
                <div class="data-manager-container">
                    <div class="data-manager-header">
                        <h2>Data Management</h2>
                        <button class="close-btn" onclick="window.DataManagerUI.close()">×</button>
                    </div>
                    
                    <div class="data-manager-nav">
                        <button class="nav-btn active" data-view="overview">Overview</button>
                        <button class="nav-btn" data-view="modules">Modules</button>
                        <button class="nav-btn" data-view="cleanup">Cleanup</button>
                        <button class="nav-btn" data-view="backup">Backup</button>
                    </div>
                    
                    <div class="data-manager-content">
                        <div id="data-content"></div>
                    </div>
                    
                    <div class="data-manager-footer">
                        <button class="btn-secondary" onclick="window.DataManagerUI.close()">Close</button>
                        <button class="btn-danger" onclick="window.DataManagerUI.confirmClearAll()">Clear All Data</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.addStyles();
        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.loadData();
            });
        });

        // Close on overlay click
        document.querySelector('.data-manager-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('data-manager-overlay')) {
                this.close();
            }
        });
    }

    /**
     * Load and display data based on current view
     */
    loadData() {
        const content = document.getElementById('data-content');
        
        switch(this.currentView) {
            case 'overview':
                content.innerHTML = this.renderOverview();
                break;
            case 'modules':
                content.innerHTML = this.renderModules();
                break;
            case 'cleanup':
                content.innerHTML = this.renderCleanup();
                break;
            case 'backup':
                content.innerHTML = this.renderBackup();
                break;
        }
    }

    /**
     * Render overview tab
     */
    renderOverview() {
        const storageInfo = window.StorageUtils.getStorageInfo();
        
        return `
            <div class="overview-section">
                <h3>Storage Overview</h3>
                <div class="storage-stats">
                    <div class="stat-card">
                        <div class="stat-number">${storageInfo.formattedSize}</div>
                        <div class="stat-label">Total Size</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${storageInfo.itemCount}</div>
                        <div class="stat-label">Total Items</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${Object.keys(storageInfo.modules).length}</div>
                        <div class="stat-label">Active Modules</div>
                    </div>
                </div>
                
                <h4>Module Breakdown</h4>
                <div class="module-breakdown">
                    ${Object.entries(storageInfo.modules).map(([module, data]) => `
                        <div class="module-stat">
                            <span class="module-name">${module}</span>
                            <span class="module-count">${data.count} items</span>
                            <span class="module-size">${this.formatBytes(data.size)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render modules tab
     */
    renderModules() {
        const modules = ['todoList', 'habits', 'goals', 'fitness', 'finance', 'journal', 'poetry'];
        
        return `
            <div class="modules-section">
                <h3>Module Data</h3>
                <div class="modules-grid">
                    ${modules.map(module => {
                        const data = window.StorageUtils.getModuleData(module);
                        const itemCount = Object.values(data).reduce((sum, val) => 
                            Array.isArray(val) ? sum + val.length : sum + 1, 0
                        );
                        
                        return `
                            <div class="module-card">
                                <div class="module-header">
                                    <h4>${this.getModuleName(module)}</h4>
                                    <span class="item-count">${itemCount} items</span>
                                </div>
                                <div class="module-actions">
                                    <button class="btn-small" onclick="window.DataManagerUI.viewModuleData('${module}')">View</button>
                                    <button class="btn-small btn-warning" onclick="window.DataManagerUI.exportModule('${module}')">Export</button>
                                    <button class="btn-small btn-danger" onclick="window.DataManagerUI.clearModule('${module}')">Clear</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render cleanup tab
     */
    renderCleanup() {
        return `
            <div class="cleanup-section">
                <h3>Data Cleanup</h3>
                
                <div class="cleanup-options">
                    <div class="cleanup-card">
                        <h4>Clear Completed Tasks</h4>
                        <p>Remove all completed tasks from your todo list while keeping active ones.</p>
                        <button class="btn-warning" onclick="window.DataManagerUI.clearCompletedTasks()">Clear Completed</button>
                    </div>
                    
                    <div class="cleanup-card">
                        <h4>Clear Old Journal Entries</h4>
                        <p>Remove journal entries older than 90 days.</p>
                        <button class="btn-warning" onclick="window.DataManagerUI.clearOldEntries('journal', 90)">Clear Old Entries</button>
                    </div>
                    
                    <div class="cleanup-card">
                        <h4>Clear Error Logs</h4>
                        <p>Remove stored error logs and debugging data.</p>
                        <button class="btn-warning" onclick="window.DataManagerUI.clearErrorLogs()">Clear Logs</button>
                    </div>
                    
                    <div class="cleanup-card">
                        <h4>Reset Module</h4>
                        <p>Select a module to completely reset to defaults.</p>
                        <select id="reset-module-select">
                            <option value="">Select module...</option>
                            <option value="todoList">Todo List</option>
                            <option value="habits">Habits</option>
                            <option value="goals">Goals</option>
                            <option value="fitness">Fitness</option>
                            <option value="finance">Finance</option>
                            <option value="journal">Journal</option>
                            <option value="poetry">Poetry</option>
                        </select>
                        <button class="btn-danger" onclick="window.DataManagerUI.resetModule()">Reset Module</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render backup tab
     */
    renderBackup() {
        return `
            <div class="backup-section">
                <h3>Backup & Restore</h3>
                
                <div class="backup-options">
                    <div class="backup-card">
                        <h4>Export All Data</h4>
                        <p>Download a complete backup of all your LifeOS data.</p>
                        <button class="btn-primary" onclick="window.DataManagerUI.exportAllData()">Export All</button>
                    </div>
                    
                    <div class="backup-card">
                        <h4>Import Data</h4>
                        <p>Restore data from a previous backup file.</p>
                        <input type="file" id="import-file" accept=".json" style="display: none;" onchange="window.DataManagerUI.importData(this)">
                        <button class="btn-primary" onclick="document.getElementById('import-file').click()">Import Data</button>
                    </div>
                    
                    <div class="backup-card">
                        <h4>Auto-Backup</h4>
                        <p>Automatically create backups of your data.</p>
                        <button class="btn-primary" onclick="window.DataManagerUI.createAutoBackup()">Create Backup</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Clear completed tasks
     */
    clearCompletedTasks() {
        if (confirm('Remove all completed tasks? This cannot be undone.')) {
            const tasks = window.StorageUtils.get('todoList_tasks', []);
            const activeTasks = tasks.filter(task => !task.completed);
            window.StorageUtils.set('todoList_tasks', activeTasks);
            this.showMessage('Completed tasks cleared successfully!');
            this.loadData();
        }
    }

    /**
     * Clear a specific module
     */
    clearModule(moduleName) {
        if (confirm(`Clear all data for ${this.getModuleName(moduleName)}? This cannot be undone.`)) {
            const keys = window.StorageUtils.getKeysWithPrefix(moduleName);
            keys.forEach(key => window.StorageUtils.remove(key));
            this.showMessage(`${this.getModuleName(moduleName)} data cleared successfully!`);
            this.loadData();
        }
    }

    /**
     * Clear all data
     */
    confirmClearAll() {
        if (confirm('Clear ALL LifeOS data? This will delete everything and cannot be undone!')) {
            if (confirm('Are you absolutely sure? This action is permanent!')) {
                localStorage.clear();
                this.showMessage('All data cleared successfully!');
                setTimeout(() => location.reload(), 1500);
            }
        }
    }

    /**
     * Export all data
     */
    exportAllData() {
        const exportData = window.StorageUtils.exportAllData();
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('Data exported successfully!');
    }

    /**
     * Export specific module
     */
    exportModule(moduleName) {
        const moduleData = window.StorageUtils.getModuleData(moduleName);
        const exportData = {
            module: moduleName,
            timestamp: new Date().toISOString(),
            data: moduleData
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifeos-${moduleName}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage(`${this.getModuleName(moduleName)} exported successfully!`);
    }

    /**
     * Import data from file
     */
    importData(input) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('Import this data? This will overwrite existing data.')) {
                    if (data.modules) {
                        // Full backup import
                        window.StorageUtils.importData(data, true);
                    } else if (data.module && data.data) {
                        // Single module import
                        Object.keys(data.data).forEach(key => {
                            const fullKey = `${data.module}_${key}`;
                            window.StorageUtils.set(fullKey, data.data[key]);
                        });
                    }
                    
                    this.showMessage('Data imported successfully!');
                    setTimeout(() => location.reload(), 1500);
                }
            } catch (error) {
                this.showMessage('Error importing data: Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Reset a module to defaults
     */
    resetModule() {
        const select = document.getElementById('reset-module-select');
        const moduleName = select.value;
        
        if (!moduleName) {
            this.showMessage('Please select a module to reset', 'warning');
            return;
        }
        
        this.clearModule(moduleName);
    }

    /**
     * Clear error logs
     */
    clearErrorLogs() {
        if (confirm('Clear all error logs?')) {
            window.StorageUtils.remove('lifeos_error_log');
            if (window.ErrorHandler) {
                window.ErrorHandler.clearErrorLog();
            }
            this.showMessage('Error logs cleared successfully!');
        }
    }

    /**
     * Show a message to the user
     */
    showMessage(message, type = 'success') {
        const messageEl = document.createElement('div');
        messageEl.className = `data-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#ff4757' : type === 'warning' ? '#ffa502' : '#2ed573'};
            color: white;
            border-radius: 8px;
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        setTimeout(() => messageEl.remove(), 3000);
    }

    /**
     * Get friendly module name
     */
    getModuleName(moduleName) {
        const names = {
            'todoList': 'Todo List',
            'habits': 'Habits',
            'goals': 'Goals',
            'fitness': 'Fitness',
            'finance': 'Finance',
            'journal': 'Journal',
            'poetry': 'Poetry'
        };
        return names[moduleName] || moduleName;
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Add styles for the interface
     */
    addStyles() {
        if (document.querySelector('#data-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'data-manager-styles';
        style.textContent = `
            .data-manager-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            
            .data-manager-container {
                background: white;
                border-radius: 15px;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }
            
            .data-manager-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid #eee;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 15px 15px 0 0;
            }
            
            .data-manager-header h2 {
                margin: 0;
                font-size: 24px;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .data-manager-nav {
                display: flex;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
            }
            
            .nav-btn {
                flex: 1;
                padding: 15px;
                border: none;
                background: none;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .nav-btn:hover {
                background: rgba(102, 126, 234, 0.1);
            }
            
            .nav-btn.active {
                background: #667eea;
                color: white;
            }
            
            .data-manager-content {
                flex: 1;
                padding: 25px;
                overflow-y: auto;
            }
            
            .data-manager-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-top: 1px solid #eee;
                background: #f8f9fa;
                border-radius: 0 0 15px 15px;
            }
            
            .storage-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 25px;
            }
            
            .stat-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
            }
            
            .stat-number {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 5px;
            }
            
            .stat-label {
                font-size: 12px;
                opacity: 0.9;
            }
            
            .module-breakdown {
                space-y: 10px;
            }
            
            .module-stat {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: #f8f9fa;
                border-radius: 8px;
                margin-bottom: 8px;
            }
            
            .module-name {
                font-weight: 600;
                color: #333;
            }
            
            .modules-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .module-card {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                border: 1px solid #e9ecef;
            }
            
            .module-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .module-header h4 {
                margin: 0;
                color: #333;
            }
            
            .item-count {
                background: #667eea;
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
            }
            
            .module-actions {
                display: flex;
                gap: 8px;
            }
            
            .cleanup-options, .backup-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }
            
            .cleanup-card, .backup-card {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                border: 1px solid #e9ecef;
            }
            
            .cleanup-card h4, .backup-card h4 {
                margin: 0 0 10px 0;
                color: #333;
            }
            
            .cleanup-card p, .backup-card p {
                margin: 0 0 15px 0;
                color: #666;
                font-size: 14px;
            }
            
            .btn-small {
                padding: 6px 12px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .btn-primary {
                background: #667eea;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
            }
            
            .btn-secondary {
                background: #6c757d;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
            }
            
            .btn-warning {
                background: #ffc107;
                color: #212529;
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
            }
            
            .btn-danger {
                background: #dc3545;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
            }
            
            .btn-small {
                background: #667eea;
                color: white;
            }
            
            .btn-small.btn-warning {
                background: #ffc107;
                color: #212529;
            }
            
            .btn-small.btn-danger {
                background: #dc3545;
                color: white;
            }
            
            button:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
            
            select {
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                margin-right: 10px;
                font-size: 14px;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            
            @media (max-width: 768px) {
                .data-manager-container {
                    width: 95%;
                    margin: 20px;
                }
                
                .storage-stats {
                    grid-template-columns: 1fr;
                }
                
                .modules-grid {
                    grid-template-columns: 1fr;
                }
                
                .cleanup-options, .backup-options {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Create global instance
window.DataManagerUI = new DataManagerUI();