/**
 * LifeOS Service Worker Manager
 * Handle service worker registration, updates, and offline functionality
 */

class ServiceWorkerManager {
    constructor() {
        this.swRegistration = null;
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
    }

    /**
     * Initialize service worker
     */
    async init() {
        if ('serviceWorker' in navigator) {
            try {
                await this.registerServiceWorker();
                this.showInstallPrompt();
                this.setupOfflineDetection();
            } catch (error) {
                console.error('Service worker initialization failed:', error);
            }
        } else {
            console.warn('Service workers not supported');
        }
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        try {
            this.swRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', this.swRegistration);

            // Handle updates
            this.swRegistration.addEventListener('updatefound', () => {
                this.handleServiceWorkerUpdate();
            });

            // Check for existing update
            if (this.swRegistration.waiting) {
                this.showUpdateNotification();
            }

        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    }

    /**
     * Handle service worker updates
     */
    handleServiceWorkerUpdate() {
        const newWorker = this.swRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.showUpdateNotification();
            }
        });
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'sw-update-notification';
        notification.innerHTML = `
            <div class="sw-notification-content">
                <div class="sw-notification-icon">🚀</div>
                <div class="sw-notification-text">
                    <div class="sw-notification-title">New Version Available!</div>
                    <div class="sw-notification-message">Update LifeOS to get the latest features</div>
                </div>
                <div class="sw-notification-actions">
                    <button class="sw-update-btn" onclick="ServiceWorkerManager.updateApp()">Update</button>
                    <button class="sw-dismiss-btn" onclick="this.closest('.sw-update-notification').remove()">Later</button>
                </div>
            </div>
        `;

        this.addUpdateNotificationStyles();
        document.body.appendChild(notification);

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 30000);
    }

    /**
     * Update the app
     */
    static updateApp() {
        const notification = document.querySelector('.sw-update-notification');
        if (notification) {
            notification.remove();
        }

        if (window.ServiceWorkerManager.swRegistration?.waiting) {
            window.ServiceWorkerManager.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }

    /**
     * Setup offline detection
     */
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showConnectivityNotification('online');
            this.syncDataWhenOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showConnectivityNotification('offline');
        });
    }

    /**
     * Show connectivity notification
     */
    showConnectivityNotification(status) {
        // Remove existing notifications
        const existing = document.querySelector('.sw-connectivity-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `sw-connectivity-notification ${status}`;
        
        if (status === 'online') {
            notification.innerHTML = `
                <div class="sw-notification-content">
                    <div class="sw-notification-icon">✅</div>
                    <div class="sw-notification-text">Back online! Data will sync automatically.</div>
                </div>
            `;
        } else {
            notification.innerHTML = `
                <div class="sw-notification-content">
                    <div class="sw-notification-icon">📡</div>
                    <div class="sw-notification-text">You're offline. Changes are saved locally.</div>
                </div>
            `;
        }

        this.addConnectivityNotificationStyles();
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Sync data when back online
     */
    async syncDataWhenOnline() {
        if ('serviceWorker' in navigator && this.swRegistration) {
            try {
                await this.swRegistration.sync.register('background-data-sync');
                console.log('Background sync registered');
            } catch (error) {
                console.log('Background sync not supported:', error);
            }
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for messages from service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                this.handleServiceWorkerMessage(event.data);
            });
        }

        // Listen for storage quota warnings
        window.addEventListener('storage-quota-exceeded', () => {
            this.showStorageWarning();
        });
    }

    /**
     * Handle messages from service worker
     */
    handleServiceWorkerMessage(message) {
        switch (message.type) {
            case 'SYNC_COMPLETE':
                this.showSyncCompleteNotification(message.data);
                break;
            case 'CACHE_UPDATED':
                console.log('Cache updated:', message.data);
                break;
            default:
                console.log('Unknown service worker message:', message);
        }
    }

    /**
     * Show sync complete notification
     */
    showSyncCompleteNotification(data) {
        const notification = document.createElement('div');
        notification.className = 'sw-sync-notification';
        notification.innerHTML = `
            <div class="sw-notification-content">
                <div class="sw-notification-icon">🔄</div>
                <div class="sw-notification-text">
                    Synced ${data.synced} items successfully!
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    /**
     * Show storage warning
     */
    showStorageWarning() {
        const notification = document.createElement('div');
        notification.className = 'sw-storage-warning';
        notification.innerHTML = `
            <div class="sw-notification-content">
                <div class="sw-notification-icon">⚠️</div>
                <div class="sw-notification-text">
                    <div class="sw-notification-title">Storage Almost Full</div>
                    <div class="sw-notification-message">Consider exporting and cleaning old data</div>
                </div>
                <div class="sw-notification-actions">
                    <button class="sw-manage-btn" onclick="DataManager.showDataManager()">Manage Data</button>
                    <button class="sw-dismiss-btn" onclick="this.closest('.sw-storage-warning').remove()">Dismiss</button>
                </div>
            </div>
        `;

        this.addStorageWarningStyles();
        document.body.appendChild(notification);
    }

    /**
     * Check cache status
     */
    async getCacheStatus() {
        if (this.swRegistration) {
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data);
                };
                
                this.swRegistration.active.postMessage(
                    { type: 'GET_CACHE_STATUS' },
                    [messageChannel.port2]
                );
            });
        }
        return null;
    }

    /**
     * Clear cache
     */
    async clearCache() {
        if (this.swRegistration) {
            this.swRegistration.active.postMessage({ type: 'CLEAR_CACHE' });
        }
    }

    /**
     * Show install prompt for PWA
     */
    showInstallPrompt() {
        let deferredPrompt = null;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallButton(deferredPrompt);
        });

        // Handle install completion
        window.addEventListener('appinstalled', () => {
            console.log('LifeOS was installed successfully');
            this.hideInstallButton();
            this.showInstallSuccessNotification();
        });
    }

    /**
     * Show install button
     */
    showInstallButton(deferredPrompt) {
        // Don't show if already installed
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        const installButton = document.createElement('button');
        installButton.id = 'pwa-install-btn';
        installButton.className = 'pwa-install-btn';
        installButton.innerHTML = '📱 Install App';
        installButton.title = 'Install LifeOS on your device';

        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('Install prompt outcome:', outcome);
                deferredPrompt = null;
                this.hideInstallButton();
            }
        });

        this.addInstallButtonStyles();

        // Add to container
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(installButton);
        }
    }

    /**
     * Hide install button
     */
    hideInstallButton() {
        const button = document.getElementById('pwa-install-btn');
        if (button) {
            button.remove();
        }
    }

    /**
     * Show install success notification
     */
    showInstallSuccessNotification() {
        const notification = document.createElement('div');
        notification.className = 'sw-install-success';
        notification.innerHTML = `
            <div class="sw-notification-content">
                <div class="sw-notification-icon">🎉</div>
                <div class="sw-notification-text">
                    LifeOS installed successfully! You can now use it offline.
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Add notification styles
     */
    addUpdateNotificationStyles() {
        if (document.querySelector('#sw-update-styles')) return;

        const style = document.createElement('style');
        style.id = 'sw-update-styles';
        style.textContent = `
            .sw-update-notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10002;
                background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
                color: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                max-width: 400px;
                animation: slideInDown 0.3s ease-out;
            }
            
            .sw-notification-content {
                display: flex;
                align-items: center;
                padding: 20px;
                gap: 15px;
            }
            
            .sw-notification-icon {
                font-size: 24px;
                flex-shrink: 0;
            }
            
            .sw-notification-text {
                flex: 1;
            }
            
            .sw-notification-title {
                font-weight: 600;
                font-size: 16px;
                margin-bottom: 4px;
            }
            
            .sw-notification-message {
                font-size: 14px;
                opacity: 0.9;
            }
            
            .sw-notification-actions {
                display: flex;
                gap: 8px;
                flex-direction: column;
            }
            
            .sw-update-btn,
            .sw-dismiss-btn,
            .sw-manage-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .sw-update-btn,
            .sw-manage-btn {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .sw-update-btn:hover,
            .sw-manage-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .sw-dismiss-btn {
                background: transparent;
                color: rgba(255, 255, 255, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .sw-dismiss-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            @keyframes slideInDown {
                from {
                    transform: translate(-50%, -100%);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, 0);
                    opacity: 1;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Add connectivity notification styles
     */
    addConnectivityNotificationStyles() {
        if (document.querySelector('#sw-connectivity-styles')) return;

        const style = document.createElement('style');
        style.id = 'sw-connectivity-styles';
        style.textContent = `
            .sw-connectivity-notification {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 10002;
                border-radius: 12px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                animation: slideInUp 0.3s ease-out;
            }
            
            .sw-connectivity-notification.online {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }
            
            .sw-connectivity-notification.offline {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
            }
            
            .sw-connectivity-notification .sw-notification-content {
                padding: 15px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .sw-connectivity-notification .sw-notification-text {
                font-size: 14px;
                font-weight: 500;
            }
            
            @keyframes slideInUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @media (max-width: 768px) {
                .sw-connectivity-notification {
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Add storage warning styles
     */
    addStorageWarningStyles() {
        if (document.querySelector('#sw-storage-styles')) return;

        const style = document.createElement('style');
        style.id = 'sw-storage-styles';
        style.textContent = `
            .sw-storage-warning {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10002;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
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
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Add install button styles
     */
    addInstallButtonStyles() {
        if (document.querySelector('#pwa-install-styles')) return;

        const style = document.createElement('style');
        style.id = 'pwa-install-styles';
        style.textContent = `
            .pwa-install-btn {
                position: fixed;
                top: 140px;
                right: 20px;
                width: 50px;
                height: 50px;
                border: none;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s ease;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .pwa-install-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Create global instance
window.ServiceWorkerManager = new ServiceWorkerManager();