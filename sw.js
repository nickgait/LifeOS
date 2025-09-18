/**
 * LifeOS Service Worker
 * Provides offline functionality, caching, and background sync
 */

const CACHE_NAME = 'lifeos-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const CACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    '/quran-component.js',
    '/shared/error-handler.js',
    '/shared/storage-utils.js',
    '/shared/dashboard-widgets.js',
    '/shared/theme-manager.js',
    '/shared/data-manager.js',
    
    // Module pages
    '/ToDoList/index.html',
    '/ToDoList/styles.css',
    '/ToDoList/script.js',
    '/Fitness/index.html',
    '/Fitness/styles.css',
    '/Fitness/script.js',
    '/Finance/index.html',
    '/Finance/styles.css',
    '/Finance/script.js',
    '/Habits/index.html',
    '/Habits/styles.css',
    '/Habits/script.js',
    '/Goals/index.html',
    '/Goals/styles.css',
    '/Goals/script.js',
    '/Journal/index.html',
    '/Journal/styles.css',
    '/Journal/script.js',
    '/Poetry/index.html',
    '/Poetry/styles.css',
    '/Poetry/script.js',
    
    // Offline page
    OFFLINE_URL
];

// Network-first resources (try network, fallback to cache)
const NETWORK_FIRST = [
    '/index.html',
    '/ToDoList/',
    '/Fitness/',
    '/Finance/',
    '/Habits/',
    '/Goals/',
    '/Journal/',
    '/Poetry/'
];

// Cache-first resources (static assets)
const CACHE_FIRST = [
    '/styles.css',
    '/script.js',
    '/shared/',
    '.css',
    '.js'
];

/**
 * Install event - cache essential resources
 */
self.addEventListener('install', event => {
    console.log('LifeOS Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching essential resources...');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('LifeOS Service Worker installed successfully');
                // Force the waiting service worker to become the active service worker
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker install failed:', error);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
    console.log('LifeOS Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('LifeOS Service Worker activated');
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - handle network requests with caching strategies
 */
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip external URLs
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    const url = new URL(event.request.url);
    const pathname = url.pathname;
    
    // Determine caching strategy
    if (shouldUseNetworkFirst(pathname)) {
        event.respondWith(networkFirstStrategy(event.request));
    } else if (shouldUseCacheFirst(pathname)) {
        event.respondWith(cacheFirstStrategy(event.request));
    } else {
        event.respondWith(staleWhileRevalidateStrategy(event.request));
    }
});

/**
 * Network-first strategy: Try network, fallback to cache
 */
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // If network succeeds, cache the response and return it
        if (networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        // If network fails (not 200), try cache
        return await getCachedResponse(request);
        
    } catch (error) {
        // Network failed, try cache
        return await getCachedResponse(request);
    }
}

/**
 * Cache-first strategy: Try cache, fallback to network
 */
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        return getOfflineFallback(request);
    }
}

/**
 * Stale-while-revalidate strategy: Return cache immediately, update in background
 */
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    // Fetch from network in background to update cache
    const networkResponsePromise = fetch(request)
        .then(response => {
            if (response.status === 200) {
                const cache = caches.open(CACHE_NAME);
                cache.then(c => c.put(request, response.clone()));
            }
            return response;
        })
        .catch(() => null);
    
    // Return cached version immediately, or wait for network
    return cachedResponse || networkResponsePromise || getOfflineFallback(request);
}

/**
 * Get cached response or fallback
 */
async function getCachedResponse(request) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || getOfflineFallback(request);
}

/**
 * Get offline fallback response
 */
async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    // For HTML pages, return offline page
    if (request.headers.get('accept')?.includes('text/html')) {
        const offlineResponse = await caches.match(OFFLINE_URL);
        if (offlineResponse) {
            return offlineResponse;
        }
    }
    
    // For other resources, return a basic offline response
    return new Response('Offline - Resource not available', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
            'Content-Type': 'text/plain'
        }
    });
}

/**
 * Determine if URL should use network-first strategy
 */
function shouldUseNetworkFirst(pathname) {
    return NETWORK_FIRST.some(pattern => 
        pathname.includes(pattern) || pathname.endsWith('index.html')
    );
}

/**
 * Determine if URL should use cache-first strategy
 */
function shouldUseCacheFirst(pathname) {
    return CACHE_FIRST.some(pattern => 
        pathname.includes(pattern) || 
        pathname.endsWith('.css') || 
        pathname.endsWith('.js')
    );
}

/**
 * Background sync for data when online
 */
self.addEventListener('sync', event => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-data-sync') {
        event.waitUntil(syncDataInBackground());
    }
});

/**
 * Sync data in background when connection restored
 */
async function syncDataInBackground() {
    try {
        console.log('Syncing data in background...');
        
        // Check if we have any pending data to sync
        const pendingSync = await getStorageItem('lifeos_pending_sync');
        
        if (pendingSync && pendingSync.length > 0) {
            // Process pending sync items
            for (const item of pendingSync) {
                await processSyncItem(item);
            }
            
            // Clear pending sync
            await setStorageItem('lifeos_pending_sync', []);
            
            // Notify all clients that sync is complete
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_COMPLETE',
                    data: { synced: pendingSync.length }
                });
            });
        }
        
        console.log('Background sync completed');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

/**
 * Process individual sync item
 */
async function processSyncItem(item) {
    // This would typically sync with a backend API
    // For now, we'll just log the sync
    console.log('Syncing item:', item);
    
    // Simulate API call
    return new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Handle push notifications (for future enhancement)
 */
self.addEventListener('push', event => {
    console.log('Push notification received:', event);
    
    if (event.data) {
        const data = event.data.json();
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'LifeOS', {
                body: data.body || 'You have a new notification',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                data: data.data || {}
            })
        );
    }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    event.waitUntil(
        self.clients.matchAll().then(clients => {
            // If app is already open, focus it
            const client = clients.find(c => c.url.includes(self.location.origin));
            if (client) {
                return client.focus();
            }
            
            // Otherwise open new window
            return self.clients.openWindow('/');
        })
    );
});

/**
 * Handle messages from main thread
 */
self.addEventListener('message', event => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'CACHE_UPDATE':
                updateCache(event.data.urls);
                break;
                
            case 'CLEAR_CACHE':
                clearCache();
                break;
                
            case 'GET_CACHE_STATUS':
                getCacheStatus().then(status => {
                    event.ports[0].postMessage(status);
                });
                break;
        }
    }
});

/**
 * Update cache with new URLs
 */
async function updateCache(urls) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urls);
        console.log('Cache updated with new URLs:', urls);
    } catch (error) {
        console.error('Failed to update cache:', error);
    }
}

/**
 * Clear all caches
 */
async function clearCache() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('All caches cleared');
    } catch (error) {
        console.error('Failed to clear cache:', error);
    }
}

/**
 * Get cache status information
 */
async function getCacheStatus() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        
        return {
            cacheName: CACHE_NAME,
            cachedUrls: keys.length,
            urls: keys.map(request => request.url)
        };
    } catch (error) {
        console.error('Failed to get cache status:', error);
        return { error: error.message };
    }
}

/**
 * Storage helpers for service worker
 */
async function getStorageItem(key) {
    try {
        // In service worker, we can't access localStorage directly
        // We'll use a message to the main thread if needed
        return null;
    } catch (error) {
        console.error('Storage get failed:', error);
        return null;
    }
}

async function setStorageItem(key, value) {
    try {
        // In service worker, we can't access localStorage directly
        // We'll use a message to the main thread if needed
        return true;
    } catch (error) {
        console.error('Storage set failed:', error);
        return false;
    }
}