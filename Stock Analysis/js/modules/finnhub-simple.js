// Simplified Finnhub API for Free Tier
export class FinnhubSimpleAPI {
    
    constructor(config) {
        this.config = config;
        this.cache = new Map();
        this.cacheConfig = config.getCacheConfig();
        this.baseUrl = 'https://finnhub.io/api/v1';
    }

    /**
     * Fetch stock data using only free tier endpoints
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
            console.log(`Fetching data for ${cleanTicker} from Finnhub (free tier)`);
            
            // Only fetch quote data (most reliable free endpoint)
            const quoteData = await this.fetchQuote(cleanTicker);
            
            if (!quoteData || typeof quoteData.c !== 'number') {
                throw new Error(`No quote data available for ${cleanTicker}`);
            }

            // Try to fetch profile (optional)
            let profileData = null;
            try {
                profileData = await this.fetchProfile(cleanTicker);
            } catch (error) {
                console.warn('Profile fetch failed, using defaults:', error.message);
                profileData = { name: cleanTicker };
            }

            // Generate demo historical data for technical analysis
            const historicalData = this.generateDemoHistoricalData(quoteData.c, 100);

            // Process the data
            const processedData = await this.processStockData({
                quote: quoteData,
                profile: profileData,
                historical: historicalData
            }, cleanTicker);

            this.setCachedData(cleanTicker, processedData);
            return processedData;

        } catch (error) {
            console.error(`Failed to fetch data for ${cleanTicker}:`, error);
            throw new Error(`Failed to fetch stock data: ${error.message}`);
        }
    }

    /**
     * Fetch current quote data (free tier endpoint)
     * @param {string} ticker - Stock ticker
     * @returns {Promise<Object>} Quote data
     */
    async fetchQuote(ticker) {
        const url = `${this.baseUrl}/quote?symbol=${ticker}&token=${this.config.getApiKey()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Quote API returned status ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate quote data
        if (!data || typeof data.c !== 'number') {
            throw new Error('Invalid quote data received');
        }
        
        return data;
    }

    /**
     * Fetch company profile (free tier endpoint, but may be limited)
     * @param {string} ticker - Stock ticker
     * @returns {Promise<Object>} Profile data
     */
    async fetchProfile(ticker) {
        try {
            const url = `${this.baseUrl}/stock/profile2?symbol=${ticker}&token=${this.config.getApiKey()}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.name) {
                    return data;
                }
            }
        } catch (error) {
            console.warn(`Profile fetch failed for ${ticker}:`, error.message);
        }
        
        // Return basic profile if fetch fails
        return { name: ticker, ticker: ticker };
    }

    /**
     * Generate demo historical data based on current price
     * @param {number} currentPrice - Current stock price
     * @param {number} days - Number of days to generate
     * @returns {Object} Historical data with prices, dates, volumes
     */
    generateDemoHistoricalData(currentPrice, days = 100) {
        const prices = [];
        const dates = [];
        const volumes = [];
        
        let price = currentPrice * 0.9; // Start 10% below current
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            // Generate date
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
            
            // Generate price with trend toward current price
            const targetPrice = currentPrice;
            const trendStrength = 0.001; // How much to trend toward target
            const volatility = 0.02; // Daily volatility
            
            const trendChange = (targetPrice - price) * trendStrength;
            const randomChange = (Math.random() - 0.5) * volatility * price;
            
            price = Math.max(1, price + trendChange + randomChange);
            prices.push(price);
            
            // Generate volume (random but realistic)
            const baseVolume = Math.floor(Math.random() * 50000000) + 5000000;
            volumes.push(baseVolume);
        }
        
        // Ensure last price is close to current price
        prices[prices.length - 1] = currentPrice;
        
        return { prices, dates, volumes };
    }

    /**
     * Process stock data into application format
     * @param {Object} data - Combined API response data
     * @param {string} ticker - Stock ticker
     * @returns {Promise<Object>} Processed stock data
     */
    async processStockData(data, ticker) {
        try {
            const { quote, profile, historical } = data;
            
            // Import technical analysis
            const { TechnicalAnalysis } = await import('./technical.js');
            
            // Calculate technical indicators from historical data
            const ma50Data = TechnicalAnalysis.calculateSMA(historical.prices, Math.min(50, historical.prices.length - 1));
            const ma200Data = TechnicalAnalysis.calculateSMA(historical.prices, Math.min(200, historical.prices.length - 1));
            const rsiData = TechnicalAnalysis.calculateRSI(historical.prices);
            const macdData = TechnicalAnalysis.calculateMACD(historical.prices);

            return {
                name: profile.name || ticker,
                ticker: ticker,
                currentPrice: quote.c,
                previousClose: quote.pc || quote.c,
                change: quote.d || 0,
                changePercent: quote.dp || 0,
                high: quote.h || quote.c,
                low: quote.l || quote.c,
                open: quote.o || quote.c,
                prices: historical.prices,
                dates: historical.dates,
                volume: historical.volumes[historical.volumes.length - 1],
                ma50: ma50Data[ma50Data.length - 1] || 0,
                ma200: ma200Data[ma200Data.length - 1] || 0,
                rsi: rsiData[rsiData.length - 1] || 50,
                macd: macdData.macd || 0,
                macdSignal: macdData.signal || 0,
                lastUpdated: new Date().toISOString(),
                marketCap: profile.marketCapitalization || null,
                industry: profile.finnhubIndustry || null,
                dataSource: 'Real quote + Generated historical'
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
}