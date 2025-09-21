/**
 * LifeOS Global Error Handler
 * Centralized error handling and user-friendly error reporting
 */

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.setupGlobalHandlers();
    }

    /**
     * Setup global error handlers
     */
    setupGlobalHandlers() {
        // Global JavaScript error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                timestamp: new Date().toISOString()
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                error: event.reason,
                timestamp: new Date().toISOString()
            });
        });

        // Module load error handler
        window.addEventListener('load', () => {
            this.checkModuleHealth();
        });
    }

    /**
     * Handle and log errors
     * @param {Object} errorInfo - Error information
     */
    handleError(errorInfo) {
        // Add to error log
        this.errorLog.push(errorInfo);
        
        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }

        // Log to console for debugging
        console.error('LifeOS Error:', errorInfo);

        // Show user-friendly error notification
        this.showErrorNotification(errorInfo);

        // Store error in localStorage for persistence
        this.saveErrorLog();
    }

    /**
     * Show user-friendly error notification
     * @param {Object} errorInfo - Error information
     */
    showErrorNotification(errorInfo) {
        // Don't spam user with too many notifications
        if (document.querySelector('.error-notification')) {
            return;
        }

        // Skip showing notifications for startup/initialization errors that typically resolve themselves
        if (this.isStartupError(errorInfo)) {
            return;
        }

        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <div class="error-text">
                    <div class="error-title">Something went wrong</div>
                    <div class="error-message">${this.getUserFriendlyMessage(errorInfo)}</div>
                </div>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles
        this.addErrorStyles();

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Check if error is a startup/initialization error that typically resolves itself
     * @param {Object} errorInfo - Error information
     * @returns {boolean} True if it's a startup error to suppress
     */
    isStartupError(errorInfo) {
        const message = errorInfo.message?.toLowerCase() || '';
        
        // Common startup errors that resolve themselves
        const startupPatterns = [
            'storageutils.get is not a function',
            'storageutils.getmoduledata is not a function',
            'storageutils.set is not a function',
            'dashboardwidgets.init is not a function',
            'cannot read properties of undefined',
            'cannot read property of undefined',
            'thememanager is not defined',
            'modulebridge is not defined',
            'globalsearch is not defined'
        ];
        
        return startupPatterns.some(pattern => message.includes(pattern));
    }

    /**
     * Convert technical error to user-friendly message
     * @param {Object} errorInfo - Error information
     * @returns {string} User-friendly message
     */
    getUserFriendlyMessage(errorInfo) {
        const message = errorInfo.message?.toLowerCase() || '';

        if (message.includes('network') || message.includes('fetch')) {
            return 'Connection issue detected. Please check your internet connection.';
        }
        
        if (message.includes('storage') || message.includes('quota')) {
            return 'Storage space is running low. Consider exporting your data.';
        }
        
        if (message.includes('permission')) {
            return 'Permission denied. Please refresh the page and try again.';
        }

        if (errorInfo.type === 'promise') {
            return 'A background operation failed. Your data should still be safe.';
        }

        return 'An unexpected error occurred. Please refresh the page if problems persist.';
    }

    /**
     * Add error notification styles
     */
    addErrorStyles() {
        if (document.querySelector('#error-handler-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'error-handler-styles';
        style.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                color: white;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
            }
            
            .error-content {
                display: flex;
                align-items: flex-start;
                padding: 15px;
                gap: 12px;
            }
            
            .error-icon {
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .error-text {
                flex: 1;
            }
            
            .error-title {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
            }
            
            .error-message {
                font-size: 13px;
                opacity: 0.9;
                line-height: 1.4;
            }
            
            .error-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                flex-shrink: 0;
            }
            
            .error-close:hover {
                background: rgba(255,255,255,0.2);
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @media (max-width: 480px) {
                .error-notification {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Check if all modules are healthy
     */
    checkModuleHealth() {
        // Only run module health check for main LifeOS index, not individual modules
        if (!window.location.pathname.endsWith('/index.html') && 
            !window.location.pathname.endsWith('/') &&
            window.location.pathname.includes('/')) {
            // We're in a sub-module, skip the global health check
            return;
        }

        const requiredScripts = [
            'shared/storage-utils.js',
            'quran-component.js',
            'script.js'
        ];

        requiredScripts.forEach(script => {
            const scriptElement = document.querySelector(`script[src="${script}"]`);
            if (!scriptElement) {
                this.handleError({
                    type: 'module',
                    message: `Required script missing: ${script}`,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Check if core functions are available
        if (typeof window.StorageUtils === 'undefined') {
            this.handleError({
                type: 'module',
                message: 'Storage utilities not loaded',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Save error log to localStorage
     */
    saveErrorLog() {
        try {
            localStorage.setItem('lifeos_error_log', JSON.stringify(this.errorLog));
        } catch (error) {
            console.warn('Could not save error log:', error);
        }
    }

    /**
     * Load error log from localStorage
     */
    loadErrorLog() {
        try {
            const saved = localStorage.getItem('lifeos_error_log');
            if (saved) {
                this.errorLog = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Could not load error log:', error);
            this.errorLog = [];
        }
    }

    /**
     * Get error log for debugging
     * @returns {Array} Error log entries
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        this.saveErrorLog();
    }

    /**
     * Try to execute a function with error handling
     * @param {Function} fn - Function to execute
     * @param {string} context - Context description
     * @returns {*} Function result or null if error
     */
    tryExecute(fn, context = 'unknown') {
        try {
            return fn();
        } catch (error) {
            this.handleError({
                type: 'execution',
                message: `Error in ${context}: ${error.message}`,
                error: error,
                timestamp: new Date().toISOString()
            });
            return null;
        }
    }

    /**
     * Wrap async function with error handling
     * @param {Function} fn - Async function to wrap
     * @param {string} context - Context description
     * @returns {Function} Wrapped function
     */
    wrapAsync(fn, context = 'unknown') {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handleError({
                    type: 'async',
                    message: `Async error in ${context}: ${error.message}`,
                    error: error,
                    timestamp: new Date().toISOString()
                });
                return null;
            }
        };
    }
}

// Create global instance
window.ErrorHandler = new ErrorHandler();

// Load existing error log
window.ErrorHandler.loadErrorLog();

// Helper functions for modules to use
window.tryExecute = (fn, context) => window.ErrorHandler.tryExecute(fn, context);
window.wrapAsync = (fn, context) => window.ErrorHandler.wrapAsync(fn, context);