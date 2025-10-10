// Configuration management
export class Config {
    constructor() {
        this.apiKey = this.getApiKey();
        this.firebaseConfig = this.getFirebaseConfig();
        this.appId = this.getAppId();
        this.initialAuthToken = this.getInitialAuthToken();
    }

    getApiKey() {
        // Try to get from environment variable first, fallback to Finnhub key
        return import.meta.env?.VITE_API_KEY || 
               window.STOCK_API_KEY || 
               'd379vepr01qskrefa3u0d379vepr01qskrefa3ug';
    }

    getFirebaseConfig() {
        // Try to get from environment variable first, fallback to global
        const envConfig = import.meta.env?.VITE_FIREBASE_CONFIG;
        if (envConfig) {
            try {
                return JSON.parse(envConfig);
            } catch (e) {
                console.warn('Failed to parse VITE_FIREBASE_CONFIG');
            }
        }
        
        return typeof __firebase_config !== 'undefined' 
            ? JSON.parse(__firebase_config) 
            : {};
    }

    getAppId() {
        return import.meta.env?.VITE_APP_ID || 
               typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    }

    getInitialAuthToken() {
        return import.meta.env?.VITE_INITIAL_AUTH_TOKEN || 
               typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    }

    // API endpoints
    getStockApiUrl(ticker) {
        return `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?apikey=${this.apiKey}`;
    }

    // Cache settings
    getCacheConfig() {
        return {
            stockDataTTL: 5 * 60 * 1000, // 5 minutes
            maxCacheSize: 50 // Maximum number of cached stocks
        };
    }
}