/**
 * LifeOS Base App Class
 * Common functionality shared across all LifeOS apps
 */

class BaseApp {
  /**
   * Constructor - sets up storage keys and initializes app
   * @param {string} storageKey - Main storage key for the app (without 'lifeos-' prefix)
   */
  constructor(storageKey) {
    this.storageKey = storageKey;
    this.data = StorageManager.get(storageKey) || this.getDefaultData();

    // Allow subclasses to run initialization before init()
    if (this.beforeInit) {
      this.beforeInit();
    }

    this.init();
  }

  /**
   * Default data structure - override in subclass if needed
   */
  getDefaultData() {
    return [];
  }

  /**
   * Initialize app - sets up listeners and UI
   */
  init() {
    this.setupEventListeners();
    this.setupDefaultDates();
    this.updateDashboard();

    // Listen for data changes
    StorageManager.onChange(`${this.storageKey}*`, () => {
      this.refresh();
    });
  }

  /**
   * Setup event listeners - override in subclass
   */
  setupEventListeners() {
    // To be implemented by subclass
  }

  /**
   * Setup default dates for form fields
   * Sets today's date for date inputs by default
   */
  setupDefaultDates() {
    const today = new Date().toISOString().split('T')[0];

    // Find all date inputs and set to today if they have a data-default attribute
    document.querySelectorAll('input[type="date"][data-default="today"]').forEach(input => {
      input.value = today;
    });

    // Set future dates if specified
    document.querySelectorAll('input[type="date"][data-default-days]').forEach(input => {
      const days = parseInt(input.dataset.defaultDays);
      const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      input.value = futureDate.toISOString().split('T')[0];
    });
  }

  /**
   * Update dashboard/stats - to be implemented by subclass
   */
  updateDashboard() {
    // To be implemented by subclass
  }

  /**
   * Refresh app data from storage
   */
  refresh() {
    this.data = StorageManager.get(this.storageKey) || this.getDefaultData();
    this.updateDashboard();
  }

  /**
   * Save data to storage
   */
  save() {
    StorageManager.set(this.storageKey, this.data);
  }

  /**
   * Create a new item with standard ID
   * @param {object} item - Item to create
   * @returns {object} Item with ID added
   */
  createItem(item) {
    return {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...item
    };
  }

  /**
   * Find item by ID
   * @param {number} id - Item ID
   * @returns {object|null} Found item or null
   */
  findById(id) {
    if (Array.isArray(this.data)) {
      return this.data.find(item => item.id === id);
    }
    return null;
  }

  /**
   * Delete item by ID
   * @param {number} id - Item ID
   * @returns {boolean} True if deleted
   */
  deleteById(id) {
    if (Array.isArray(this.data)) {
      const initialLength = this.data.length;
      this.data = this.data.filter(item => item.id !== id);

      if (this.data.length < initialLength) {
        this.save();
        this.updateDashboard();
        return true;
      }
    }
    return false;
  }

  /**
   * Format date for display
   * @param {string} dateStr - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  /**
   * Format currency
   * @param {number} amount - Dollar amount
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Calculate days between dates
   * @param {string} date1 - First date
   * @param {string} date2 - Second date
   * @returns {number} Number of days
   */
  daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if date is in the past
   * @param {string} dateStr - Date string
   * @returns {boolean} True if past
   */
  isPast(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  /**
   * Check if date is today
   * @param {string} dateStr - Date string
   * @returns {boolean} True if today
   */
  isToday(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
}

// Make available globally
window.BaseApp = BaseApp;
