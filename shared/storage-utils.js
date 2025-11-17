/**
 * LifeOS Shared Storage Utilities
 * Centralized data management for all LifeOS apps
 */

const StorageManager = {
  // Namespace prefix for all LifeOS data
  PREFIX: 'lifeos-',

  /**
   * Get data from localStorage with namespace
   * @param {string} key - Data key
   * @returns {any} Parsed data or null
   */
  get(key) {
    try {
      const data = localStorage.getItem(this.PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  },

  /**
   * Set data in localStorage with namespace
   * @param {string} key - Data key
   * @param {any} value - Data to store
   */
  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      // Dispatch event for cross-app communication
      window.dispatchEvent(
        new CustomEvent('lifeos-data-changed', {
          detail: { key, value }
        })
      );
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
    }
  },

  /**
   * Remove data from localStorage
   * @param {string} key - Data key
   */
  remove(key) {
    try {
      localStorage.removeItem(this.PREFIX + key);
      window.dispatchEvent(
        new CustomEvent('lifeos-data-removed', {
          detail: { key }
        })
      );
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },

  /**
   * Check if key exists
   * @param {string} key - Data key
   * @returns {boolean}
   */
  has(key) {
    return localStorage.getItem(this.PREFIX + key) !== null;
  },

  /**
   * Get all keys matching a pattern
   * @param {string} pattern - Pattern to match (e.g., 'fitness-*')
   * @returns {string[]} Array of matching keys
   */
  getKeys(pattern) {
    const regex = new RegExp(`^${this.PREFIX}${pattern.replace('*', '.*')}$`);
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (regex.test(key)) {
        keys.push(key.replace(this.PREFIX, ''));
      }
    }
    return keys;
  },

  /**
   * Clear all LifeOS data
   */
  clearAll() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent('lifeos-data-cleared'));
  },

  /**
   * Export all LifeOS data
   * @returns {object} All LifeOS data
   */
  exportData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.PREFIX)) {
        const cleanKey = key.replace(this.PREFIX, '');
        data[cleanKey] = this.get(cleanKey);
      }
    }
    return data;
  },

  /**
   * Import LifeOS data
   * @param {object} data - Data to import
   * @param {boolean} merge - If true, merge with existing; if false, replace
   */
  importData(data, merge = true) {
    if (!merge) {
      this.clearAll();
    }
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value);
    });
  },

  /**
   * Listen for data changes across the app
   * @param {string} key - Key to watch (or '*' for all)
   * @param {function} callback - Function to call when data changes
   */
  onChange(key, callback) {
    const handler = (event) => {
      if (key === '*' || event.detail.key === key) {
        callback(event.detail);
      }
    };
    window.addEventListener('lifeos-data-changed', handler);
    return () => window.removeEventListener('lifeos-data-changed', handler);
  }
};

// Make available globally
window.StorageManager = StorageManager;
