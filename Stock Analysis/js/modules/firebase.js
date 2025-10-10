// Firebase Integration and Authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class FirebaseService {
    
    constructor(config) {
        this.config = config;
        this.app = null;
        this.auth = null;
        this.db = null;
        this.userId = null;
        this.watchlistUnsubscribe = null;
    }

    /**
     * Initialize Firebase services
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            // Set Firebase logging level
            setLogLevel('debug');
            
            // Initialize Firebase app
            this.app = initializeApp(this.config.firebaseConfig);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);

            // Authenticate user
            await this.authenticateUser();
            
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            throw new Error(`Firebase initialization failed: ${error.message}`);
        }
    }

    /**
     * Authenticate user with custom token or anonymous auth
     * @returns {Promise<void>}
     */
    async authenticateUser() {
        try {
            const initialAuthToken = this.config.initialAuthToken;
            
            if (initialAuthToken) {
                console.log('Signing in with custom token');
                await signInWithCustomToken(this.auth, initialAuthToken);
            } else {
                console.log('Signing in anonymously');
                await signInAnonymously(this.auth);
            }
        } catch (error) {
            console.error('Authentication failed:', error);
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    /**
     * Set up authentication state listener
     * @param {Function} onUserChanged - Callback for user state changes
     */
    setupAuthListener(onUserChanged) {
        onAuthStateChanged(this.auth, (user) => {
            if (user) {
                this.userId = user.uid;
                console.log('User authenticated:', this.userId);
                if (onUserChanged) {
                    onUserChanged(this.userId);
                }
            } else {
                console.error('User not authenticated');
                this.userId = null;
                if (onUserChanged) {
                    onUserChanged(null);
                }
            }
        });
    }

    /**
     * Get Firestore collection path for user's watchlist
     * @returns {string} Firestore path
     */
    getWatchlistPath() {
        if (!this.userId) {
            throw new Error('User not authenticated');
        }
        return `artifacts/${this.config.appId}/users/${this.userId}/watchlist`;
    }

    /**
     * Set up real-time watchlist listener
     * @param {Function} onWatchlistChanged - Callback for watchlist changes
     */
    setupWatchlistListener(onWatchlistChanged) {
        try {
            if (this.watchlistUnsubscribe) {
                this.watchlistUnsubscribe();
            }

            if (!this.userId) {
                console.warn('Cannot setup watchlist listener: user not authenticated');
                return;
            }

            const watchlistCollection = collection(this.db, this.getWatchlistPath());
            
            this.watchlistUnsubscribe = onSnapshot(watchlistCollection, (snapshot) => {
                const stocks = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    stocks.push({ 
                        id: doc.id, 
                        ticker: data.ticker,
                        addedAt: data.addedAt
                    });
                });
                
                // Sort by date added (newest first)
                stocks.sort((a, b) => {
                    if (a.addedAt && b.addedAt) {
                        return b.addedAt.toDate() - a.addedAt.toDate();
                    }
                    return 0;
                });

                console.log('Watchlist updated:', stocks);
                if (onWatchlistChanged) {
                    onWatchlistChanged(stocks);
                }
            }, (error) => {
                console.error('Watchlist listener error:', error);
                if (onWatchlistChanged) {
                    onWatchlistChanged([]);
                }
            });

        } catch (error) {
            console.error('Failed to setup watchlist listener:', error);
        }
    }

    /**
     * Add stock to watchlist
     * @param {string} ticker - Stock ticker symbol
     * @returns {Promise<void>}
     */
    async addToWatchlist(ticker) {
        if (!this.userId) {
            throw new Error('User not authenticated');
        }

        if (!ticker || typeof ticker !== 'string') {
            throw new Error('Invalid ticker symbol');
        }

        const cleanTicker = ticker.trim().toUpperCase();

        try {
            const watchlistCollection = collection(this.db, this.getWatchlistPath());
            await addDoc(watchlistCollection, {
                ticker: cleanTicker,
                addedAt: new Date(),
            });
            
            console.log(`Added ${cleanTicker} to watchlist`);
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            throw new Error(`Failed to add ${cleanTicker} to watchlist: ${error.message}`);
        }
    }

    /**
     * Remove stock from watchlist
     * @param {string} docId - Firestore document ID
     * @returns {Promise<void>}
     */
    async removeFromWatchlist(docId) {
        if (!this.userId) {
            throw new Error('User not authenticated');
        }

        if (!docId) {
            throw new Error('Invalid document ID');
        }

        try {
            const docRef = doc(this.db, this.getWatchlistPath(), docId);
            await deleteDoc(docRef);
            
            console.log(`Removed document ${docId} from watchlist`);
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            throw new Error(`Failed to remove stock from watchlist: ${error.message}`);
        }
    }

    /**
     * Check if ticker is already in watchlist
     * @param {Array} watchlist - Current watchlist
     * @param {string} ticker - Ticker to check
     * @returns {boolean} True if ticker exists in watchlist
     */
    isTickerInWatchlist(watchlist, ticker) {
        if (!Array.isArray(watchlist) || !ticker) {
            return false;
        }

        const cleanTicker = ticker.trim().toUpperCase();
        return watchlist.some(stock => 
            stock.ticker && stock.ticker.toUpperCase() === cleanTicker
        );
    }

    /**
     * Get current user ID
     * @returns {string|null} User ID or null if not authenticated
     */
    getCurrentUserId() {
        return this.userId;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        return !!this.userId;
    }

    /**
     * Clean up listeners and connections
     */
    cleanup() {
        if (this.watchlistUnsubscribe) {
            this.watchlistUnsubscribe();
            this.watchlistUnsubscribe = null;
        }
    }

    /**
     * Get Firebase service status
     * @returns {Object} Service status information
     */
    getStatus() {
        return {
            initialized: !!this.app,
            authenticated: !!this.userId,
            userId: this.userId,
            appId: this.config.appId,
            hasWatchlistListener: !!this.watchlistUnsubscribe
        };
    }
}