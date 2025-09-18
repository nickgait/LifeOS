/**
 * LifeOS Shared Storage Utilities
 * Centralized localStorage operations with error handling and validation
 */

class StorageUtils {
    constructor() {
        this.isAvailable = this.checkStorageAvailability();
    }

    /**
     * Check if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage is not available:', e.message);
            return false;
        }
    }

    /**
     * Get data from localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed data or default value
     */
    get(key, defaultValue = null) {
        if (!this.isAvailable) {
            console.warn('Storage not available, returning default value');
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error(`Error reading from localStorage key "${key}":`, error);
            return defaultValue;
        }
    }

    /**
     * Set data in localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        if (!this.isAvailable) {
            console.warn('Storage not available, cannot save data');
            return false;
        }

        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error);
            // Handle quota exceeded
            if (error.name === 'QuotaExceededError') {
                this.handleQuotaExceeded();
            }
            return false;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        if (!this.isAvailable) {
            return false;
        }

        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage key "${key}":`, error);
            return false;
        }
    }

    /**
     * Clear all localStorage data
     * @returns {boolean} Success status
     */
    clear() {
        if (!this.isAvailable) {
            return false;
        }

        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    /**
     * Get all keys with a specific prefix
     * @param {string} prefix - Key prefix to filter by
     * @returns {string[]} Array of matching keys
     */
    getKeysWithPrefix(prefix) {
        if (!this.isAvailable) {
            return [];
        }

        const keys = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keys.push(key);
                }
            }
        } catch (error) {
            console.error('Error getting keys with prefix:', error);
        }
        return keys;
    }

    /**
     * Get all data for a specific module
     * @param {string} moduleName - Name of the module
     * @returns {Object} Object with all module data
     */
    getModuleData(moduleName) {
        const keys = this.getKeysWithPrefix(moduleName);
        const data = {};
        
        keys.forEach(key => {
            const value = this.get(key);
            if (value !== null) {
                // Remove module prefix from key for cleaner object
                const cleanKey = key.replace(`${moduleName}_`, '');
                data[cleanKey] = value;
            }
        });
        
        return data;
    }

    /**
     * Export all LifeOS data
     * @returns {Object} Complete data export
     */
    exportAllData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            modules: {}
        };

        const modules = ['todoList', 'fitness', 'finance', 'habits', 'goals', 'journal', 'poetry'];
        
        modules.forEach(module => {
            exportData.modules[module] = this.getModuleData(module);
        });

        return exportData;
    }

    /**
     * Import data from export
     * @param {Object} importData - Data to import
     * @param {boolean} overwrite - Whether to overwrite existing data
     * @returns {boolean} Success status
     */
    importData(importData, overwrite = false) {
        if (!importData || !importData.modules) {
            console.error('Invalid import data format');
            return false;
        }

        try {
            Object.keys(importData.modules).forEach(moduleName => {
                const moduleData = importData.modules[moduleName];
                
                Object.keys(moduleData).forEach(key => {
                    const fullKey = `${moduleName}_${key}`;
                    
                    if (overwrite || this.get(fullKey) === null) {
                        this.set(fullKey, moduleData[key]);
                    }
                });
            });
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Handle storage quota exceeded
     */
    handleQuotaExceeded() {
        console.warn('Storage quota exceeded. Consider cleaning old data.');
        
        // Emit custom event for UI to handle
        window.dispatchEvent(new CustomEvent('storage-quota-exceeded', {
            detail: { message: 'Storage space is full. Please export and clean old data.' }
        }));
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage stats
     */
    getStorageInfo() {
        if (!this.isAvailable) {
            return { available: false };
        }

        let totalSize = 0;
        let itemCount = 0;
        const modules = {};

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                
                if (key && value) {
                    const size = new Blob([value]).size;
                    totalSize += size;
                    itemCount++;

                    // Group by module
                    const moduleName = key.split('_')[0];
                    if (!modules[moduleName]) {
                        modules[moduleName] = { count: 0, size: 0 };
                    }
                    modules[moduleName].count++;
                    modules[moduleName].size += size;
                }
            }
        } catch (error) {
            console.error('Error calculating storage info:', error);
        }

        return {
            available: true,
            totalSize,
            itemCount,
            modules,
            formattedSize: this.formatBytes(totalSize)
        };
    }

    /**
     * Format bytes to human readable string
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Create global instance
window.StorageUtils = new StorageUtils();

// Legacy support - export individual functions for backward compatibility
window.getStoredData = (key, defaultValue) => window.StorageUtils.get(key, defaultValue);
window.saveStoredData = (key, value) => window.StorageUtils.set(key, value);
window.removeStoredData = (key) => window.StorageUtils.remove(key);