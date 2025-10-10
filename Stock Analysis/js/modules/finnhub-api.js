// Finnhub API Integration
export class FinnhubAPI {
    
    constructor(config) {
        this.config = config;
        this.cache = new Map();
        this.cacheConfig = config.getCacheConfig();
        this.baseUrl = 'https://finnhub.io/api/v1';
    }

    /**
     * Fetch stock data from Finnhub API
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
            console.log(`Fetching data for ${cleanTicker} from Finnhub`);
            
            // Fetch multiple endpoints in parallel for comprehensive data
            const [quoteData, candleData, profileData] = await Promise.all([
                this.fetchQuote(cleanTicker),
                this.fetchCandles(cleanTicker),
                this.fetchProfile(cleanTicker)
            ]);

            if (!candleData || !candleData.c || candleData.c.length === 0) {
                throw new Error(`No historical data available for ${cleanTicker}`);
            }

            // Process and combine the data
            const processedData = await this.processStockData({
                quote: quoteData,
                candles: candleData,
                profile: profileData
            }, cleanTicker);

            this.setCachedData(cleanTicker, processedData);
            return processedData;

        } catch (error) {
            console.error(`Failed to fetch data for ${cleanTicker}:`, error);
            throw new Error(`Failed to fetch stock data: ${error.message}`);
        }
    }

    /**
     * Fetch current quote data
     * @param {string} ticker - Stock ticker
     * @returns {Promise<Object>} Quote data
     */
    async fetchQuote(ticker) {
        const url = `${this.baseUrl}/quote?symbol=${ticker}&token=${this.config.getApiKey()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Quote API returned status ${response.status}`);
        }
        
        return await response.json();
    }

    /**
     * Fetch historical candle data (1 year of daily data)
     * @param {string} ticker - Stock ticker
     * @returns {Promise<Object>} Candle data
     */
    async fetchCandles(ticker) {
        const to = Math.floor(Date.now() / 1000); // Current timestamp
        const from = to - (365 * 24 * 60 * 60); // 1 year ago
        
        const url = `${this.baseUrl}/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${this.config.getApiKey()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Candle API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.s === 'no_data') {
            throw new Error('No historical data available');
        }
        
        return data;
    }

    /**
     * Fetch company profile data
     * @param {string} ticker - Stock ticker
     * @returns {Promise<Object>} Profile data
     */
    async fetchProfile(ticker) {
        try {
            const url = `${this.baseUrl}/stock/profile2?symbol=${ticker}&token=${this.config.getApiKey()}`;
            const response = await fetch(url);
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn(`Could not fetch profile for ${ticker}:`, error.message);
        }
        
        // Return basic profile if fetch fails
        return { name: ticker, ticker: ticker };
    }

    /**
     * Process raw Finnhub data into application format
     * @param {Object} data - Combined API response data
     * @param {string} ticker - Stock ticker
     * @returns {Promise<Object>} Processed stock data
     */
    async processStockData(data, ticker) {
        try {
            const { quote, candles, profile } = data;
            
            // Extract historical prices and dates
            const prices = candles.c; // Close prices
            const timestamps = candles.t; // Timestamps
            const volumes = candles.v; // Volumes
            
            // Convert timestamps to dates
            const dates = timestamps.map(ts => new Date(ts * 1000).toISOString().split('T')[0]);
            
            // Get current data
            const currentPrice = quote.c || prices[prices.length - 1];
            const currentVolume = volumes[volumes.length - 1];
            
            // Import technical analysis
            const { TechnicalAnalysis } = await import('./technical.js');
            
            // Calculate technical indicators
            const ma50Data = TechnicalAnalysis.calculateSMA(prices, Math.min(50, prices.length - 1));
            const ma200Data = TechnicalAnalysis.calculateSMA(prices, Math.min(200, prices.length - 1));
            const rsiData = TechnicalAnalysis.calculateRSI(prices);
            const macdData = TechnicalAnalysis.calculateMACD(prices);

            return {
                name: profile.name || ticker,
                ticker: ticker,
                currentPrice: currentPrice,
                previousClose: quote.pc || prices[prices.length - 2],
                change: quote.d || 0,
                changePercent: quote.dp || 0,
                high: quote.h || Math.max(...prices.slice(-1)),
                low: quote.l || Math.min(...prices.slice(-1)),
                open: quote.o || prices[prices.length - 1],
                prices: prices,
                dates: dates,
                volume: currentVolume,
                ma50: ma50Data[ma50Data.length - 1] || 0,
                ma200: ma200Data[ma200Data.length - 1] || 0,
                rsi: rsiData[rsiData.length - 1] || 50,
                macd: macdData.macd || 0,
                macdSignal: macdData.signal || 0,
                lastUpdated: new Date().toISOString(),
                marketCap: profile.marketCapitalization || null,
                industry: profile.finnhubIndustry || null
            };

        } catch (error) {
            console.error('Error processing Finnhub data:', error);
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