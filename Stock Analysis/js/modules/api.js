// Stock Data API Integration with Caching
export class StockAPI {
    
    constructor(config) {
        this.config = config;
        this.cache = new Map();
        this.cacheConfig = config.getCacheConfig();
    }

    /**
     * Fetch stock data with caching and error handling
     * @param {string} ticker - Stock ticker symbol
     * @returns {Promise<Object|null>} Stock data or null if failed
     */
    async fetchStockData(ticker) {
        if (!ticker || typeof ticker !== 'string') {
            throw new Error('Invalid ticker symbol');
        }

        const cleanTicker = ticker.trim().toUpperCase();
        
        // Check cache first
        const cachedData = this.getCachedData(cleanTicker);
        if (cachedData) {
            console.log(`Using cached data for ${cleanTicker}`);
            return cachedData;
        }

        try {
            const url = this.config.getStockApiUrl(cleanTicker);
            console.log(`Fetching data for ${cleanTicker}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Validate API response
            const validatedData = this.validateApiResponse(data, cleanTicker);
            if (!validatedData) {
                return null;
            }

            // Process and cache the data
            const processedData = await this.processStockData(validatedData, cleanTicker);
            this.setCachedData(cleanTicker, processedData);
            
            return processedData;

        } catch (error) {
            console.error(`Failed to fetch data for ${cleanTicker}:`, error);
            
            // Return more specific error information
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Please check your internet connection');
            } else if (error.message.includes('404')) {
                throw new Error(`Stock symbol "${cleanTicker}" not found`);
            } else if (error.message.includes('429')) {
                throw new Error('Rate limit exceeded: Please try again later');
            } else if (error.message.includes('401') || error.message.includes('403')) {
                throw new Error('API authentication failed: Please check API key');
            } else {
                throw new Error(`Failed to fetch stock data: ${error.message}`);
            }
        }
    }

    /**
     * Validate API response structure
     * @param {Object} data - Raw API response
     * @param {string} ticker - Stock ticker
     * @returns {Object|null} Validated data or null
     */
    validateApiResponse(data, ticker) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid API response format');
            return null;
        }

        if (!data.historical || !Array.isArray(data.historical)) {
            console.error('No historical data in API response');
            return null;
        }

        if (data.historical.length === 0) {
            console.error(`No historical data available for ${ticker}`);
            return null;
        }

        // Validate historical data structure
        const firstEntry = data.historical[0];
        const requiredFields = ['date', 'close', 'volume'];
        
        for (const field of requiredFields) {
            if (!(field in firstEntry)) {
                console.error(`Missing required field "${field}" in historical data`);
                return null;
            }
        }

        return data;
    }

    /**
     * Process raw stock data into application format
     * @param {Object} data - Validated API response
     * @param {string} ticker - Stock ticker
     * @returns {Promise<Object>} Processed stock data
     */
    async processStockData(data, ticker) {
        try {
            // Get the most recent data for calculations (last 200 days)
            const history = data.historical.slice(-200).reverse();
            
            // Extract price and date arrays
            const prices = history.map(item => {
                const price = parseFloat(item.close);
                if (isNaN(price) || price <= 0) {
                    throw new Error(`Invalid price data: ${item.close}`);
                }
                return price;
            });

            const dates = history.map(item => item.date);
            const volume = parseInt(history[history.length - 1].volume);

            if (isNaN(volume) || volume < 0) {
                throw new Error('Invalid volume data');
            }

            // Import technical analysis dynamically to avoid circular dependencies
            const { TechnicalAnalysis } = await import('./technical.js');
            
            // Calculate technical indicators
            const ma50Data = TechnicalAnalysis.calculateSMA(prices, 50);
            const ma200Data = TechnicalAnalysis.calculateSMA(prices, 200);
            const rsiData = TechnicalAnalysis.calculateRSI(prices);
            const macdData = TechnicalAnalysis.calculateMACD(prices);

            return {
                name: data.symbol || ticker,
                ticker: ticker,
                currentPrice: prices[prices.length - 1],
                prices: prices,
                dates: dates,
                volume: volume,
                ma50: ma50Data[ma50Data.length - 1] || 0,
                ma200: ma200Data[ma200Data.length - 1] || 0,
                rsi: rsiData[rsiData.length - 1] || 0,
                macd: macdData.macd || 0,
                macdSignal: macdData.signal || 0,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error processing stock data:', error);
            throw new Error(`Failed to process data for ${ticker}: ${error.message}`);
        }
    }

    /**
     * Get cached data if still valid
     * @param {string} ticker - Stock ticker
     * @returns {Object|null} Cached data or null
     */
    getCachedData(ticker) {
        const cacheKey = ticker.toUpperCase();
        const cached = this.cache.get(cacheKey);
        
        if (!cached) {
            return null;
        }

        const now = Date.now();
        const cacheAge = now - cached.timestamp;
        
        if (cacheAge > this.cacheConfig.stockDataTTL) {
            this.cache.delete(cacheKey);
            return null;
        }

        return cached.data;
    }

    /**
     * Cache stock data
     * @param {string} ticker - Stock ticker
     * @param {Object} data - Stock data to cache
     */
    setCachedData(ticker, data) {
        const cacheKey = ticker.toUpperCase();
        
        // Clean up old cache entries if we're at the limit
        if (this.cache.size >= this.cacheConfig.maxCacheSize) {
            this.cleanupCache();
        }

        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Clean up expired cache entries
     */
    cleanupCache() {
        const now = Date.now();
        const expiredKeys = [];

        for (const [key, value] of this.cache.entries()) {
            const age = now - value.timestamp;
            if (age > this.cacheConfig.stockDataTTL) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.cache.delete(key));

        // If we're still at the limit, remove the oldest entries
        if (this.cache.size >= this.cacheConfig.maxCacheSize) {
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toRemove = entries.slice(0, Math.floor(this.cacheConfig.maxCacheSize / 2));
            toRemove.forEach(([key]) => this.cache.delete(key));
        }
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        const entries = Array.from(this.cache.values());
        
        return {
            size: this.cache.size,
            maxSize: this.cacheConfig.maxCacheSize,
            ttl: this.cacheConfig.stockDataTTL,
            oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
            newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null
        };
    }
}