/**
 * LifeOS UI Utilities
 * Shared UI functions used across all apps
 */

class UIUtils {
  /**
   * Switch between tabs in an app
   * @param {string} tabName - The tab identifier
   * @param {Object} appContext - The app instance (this) to call render methods
   * @param {Object} callbacks - Optional callbacks for tab-specific actions
   */
  static switchTab(tabName, appContext = null, callbacks = {}) {
    // Hide all tabs and deactivate all buttons
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));

    // Show the selected tab
    const tab = document.getElementById(`${tabName}-tab`);
    if (tab) {
      tab.classList.add('active');
    }

    // Activate the clicked button
    if (event && event.target) {
      event.target.classList.add('active');
    }

    // Execute app-specific callback if provided
    if (callbacks[tabName]) {
      callbacks[tabName]();
    } else if (appContext) {
      // Auto-call common render methods if they exist
      const methodName = `render${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
      if (typeof appContext[methodName] === 'function') {
        appContext[methodName]();
      }

      const updateMethodName = `update${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
      if (typeof appContext[updateMethodName] === 'function') {
        appContext[updateMethodName]();
      }
    }
  }

  /**
   * Initialize an app with DOMContentLoaded handling
   * @param {Class} AppClass - The app class to instantiate
   * @param {string} globalVarName - Name of global variable to store instance
   * @returns {Object} The app instance
   */
  static initializeApp(AppClass, globalVarName = 'app') {
    const createInstance = () => {
      const instance = new AppClass();
      window[globalVarName] = instance;
      return instance;
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createInstance);
      return null; // Will be set after DOM loads
    } else {
      return createInstance();
    }
  }

  /**
   * Render an empty state UI
   * @param {HTMLElement} container - The container to render into
   * @param {string} icon - Emoji or icon to display
   * @param {string} message - Message to display
   * @param {string} actionText - Optional action button text
   * @param {Function} actionCallback - Optional action button callback
   */
  static renderEmptyState(container, icon = '📋', message = 'No data yet', actionText = null, actionCallback = null) {
    if (!container) return;

    let html = `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <p>${message}</p>
    `;

    if (actionText && actionCallback) {
      html += `<button class="btn btn-primary" id="empty-state-action">${actionText}</button>`;
    }

    html += '</div>';

    container.innerHTML = html;

    if (actionText && actionCallback) {
      document.getElementById('empty-state-action').addEventListener('click', actionCallback);
    }
  }

  /**
   * Render a progress bar
   * @param {HTMLElement} container - The container to render into
   * @param {number} current - Current value
   * @param {number} total - Total value
   * @param {string} label - Optional label
   * @param {string} color - Optional color (CSS color)
   */
  static renderProgressBar(container, current, total, label = '', color = '#667eea') {
    if (!container) return;

    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    container.innerHTML = `
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${percentage}%; background-color: ${color};">
          ${percentage}%
        </div>
      </div>
      <div style="font-size: 13px; color: #666; margin-top: 8px;">
        ${label ? `<span>${label}</span> • ` : ''}${current} of ${total} completed
      </div>
    `;
  }

  /**
   * Create a status badge
   * @param {string} text - Badge text
   * @param {string} type - Badge type: 'active', 'completed', 'pending', 'danger', 'warning'
   * @returns {string} HTML string
   */
  static createBadge(text, type = 'active') {
    const className = `status-${type}`;
    return `<span class="status-badge ${className}">${text}</span>`;
  }

  /**
   * Create a category badge
   * @param {string} text - Badge text
   * @param {string} categoryId - Category identifier for styling
   * @returns {string} HTML string
   */
  static createCategoryBadge(text, categoryId) {
    return `<span class="category-badge category-${categoryId}">${text}</span>`;
  }

  /**
   * Show a toast/alert notification
   * @param {string} message - Message to display
   * @param {string} type - Type: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in ms (0 for permanent)
   */
  static showNotification(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      `;
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      background-color: ${this.getColorForType(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `;

    toastContainer.appendChild(toast);

    // Remove after duration
    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  }

  /**
   * Get color for notification type
   * @private
   */
  static getColorForType(type) {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return colors[type] || colors.info;
  }

  /**
   * Confirm action with user
   * @param {string} message - Confirmation message
   * @returns {Promise<boolean>} User's choice
   */
  static async confirmAction(message) {
    return new Promise((resolve) => {
      const result = confirm(message);
      resolve(result);
    });
  }
}

// Add CSS animations if not already present
if (!document.getElementById('ui-utils-styles')) {
  const style = document.createElement('style');
  style.id = 'ui-utils-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state p {
      margin: 0;
      font-size: 16px;
    }

    .toast {
      word-break: break-word;
    }

    .progress-bar-container {
      width: 100%;
      height: 24px;
      background-color: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
      transition: width 0.3s ease;
    }
  `;
  document.head.appendChild(style);
}
