// Service Worker for Fitness Tracker
// Provides offline functionality and caching

const CACHE_NAME = 'fitness-tracker-v2';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    'https://cdn.tailwindcss.com'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'no-cache' })));
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                return fetch(event.request).then((response) => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    var responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // This would sync pending data when connection is restored
    console.log('Background sync triggered');
    
    // Get pending sync data from IndexedDB or localStorage
    // and sync with server when available
    return Promise.resolve();
}

// Push notifications for goal reminders
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Time to work on your fitness goals!',
        icon: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="#0ea5e9">
                <circle cx="32" cy="32" r="30" fill="#f3f4f6"/>
                <path d="M32 8c-13.3 0-24 10.7-24 24s10.7 24 24 24 24-10.7 24-24S45.3 8 32 8zm0 44c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z"/>
                <path d="M32 16c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm8 18l-8-5-8 5V24l8-5 8 5v10z"/>
            </svg>
        `),
        badge: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="#0ea5e9">
                <circle cx="16" cy="16" r="14" fill="#0ea5e9"/>
                <path d="M16 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm4 9l-4-2-4 2v-5l4-2 4 2v5z" fill="white"/>
            </svg>
        `),
        vibrate: [200, 100, 200],
        actions: [
            {
                action: 'log-progress',
                title: 'Log Progress',
                icon: 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                    </svg>
                `)
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: 'data:image/svg+xml;base64=' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                `)
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Fitness Tracker', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'log-progress') {
        // Open the app to the log progress page
        event.waitUntil(
            clients.openWindow('./index.html#log-progress')
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('./index.html')
        );
    }
});

// Handle messages from the main application
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('Service Worker loaded successfully');