/**
 * Stock Service - Unified stock lookup and data fetching
 * Consolidates 3 near-identical lookup functions from Investments app into 1 reusable service
 *
 * This replaces:
 * - Investments/script.js: lookupStock()
 * - Investments/script.js: lookupResearchStock()
 * - Investments/script.js: lookupDividendStock()
 */

class StockService {
    // API Configuration - Using Yahoo Finance via CORS proxy (free, no auth required)
    static API_ENDPOINT = 'https://query1.finance.yahoo.com/v8/finance/chart';
    static CORS_PROXY = 'https://api.allorigins.win/raw?url=';
    static RATE_LIMIT_MS = 100; // 1 request per 100ms for rate limiting
    static CACHE_DURATION_MS = 300000; // Cache prices for 5 minutes
    static PRICE_CACHE = {}; // Simple in-memory cache

    /**
     * Lookup stock price and basic info using Yahoo Finance
     * @param {string} symbol - Stock symbol (e.g., 'AAPL')
     * @param {Object} options - Lookup options
     * @returns {Promise<Object>} Stock data { symbol, price, change, changePercent, error }
     */
    static async lookupStock(symbol, options = {}) {
        const { timeout = 5000, useCache = true } = options;

        try {
            // Validate symbol
            if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
                return {
                    error: 'Symbol is required',
                    symbol: symbol,
                    price: 0
                };
            }

            // Sanitize symbol (remove spaces, uppercase)
            const cleanSymbol = symbol.toUpperCase().trim();

            // Check cache
            if (useCache && this.PRICE_CACHE[cleanSymbol]) {
                const cached = this.PRICE_CACHE[cleanSymbol];
                if (Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
                    console.log(`Using cached price for ${cleanSymbol}: $${cached.price}`);
                    return cached.data;
                }
            }

            // Make API call with timeout using CORS proxy
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const yahooUrl = `${this.API_ENDPOINT}/${cleanSymbol}`;
            const proxyUrl = this.CORS_PROXY + encodeURIComponent(yahooUrl);

            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Extract price from Yahoo Finance response
            if (data.chart?.result?.[0]) {
                const result = data.chart.result[0];
                const meta = result.meta;
                const regularMarketPrice = meta.regularMarketPrice;
                const previousClose = meta.previousClose;
                const currency = meta.currency;

                if (regularMarketPrice && regularMarketPrice > 0) {
                    const change = regularMarketPrice - previousClose;
                    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

                    const resultData = {
                        symbol: cleanSymbol,
                        price: regularMarketPrice,
                        previousClose: previousClose,
                        change: change,
                        changePercent: changePercent,
                        currency: currency,
                        timestamp: new Date().toISOString(),
                        error: null
                    };

                    // Cache the result
                    this.PRICE_CACHE[cleanSymbol] = {
                        data: resultData,
                        timestamp: Date.now()
                    };

                    console.log(`Successfully got price for ${cleanSymbol}: $${regularMarketPrice}`);
                    return resultData;
                } else {
                    throw new Error('Price not available - ticker may be invalid');
                }
            } else {
                throw new Error('Ticker not found or invalid');
            }

        } catch (error) {
            console.error(`Stock lookup failed for ${symbol}:`, error);
            return {
                symbol: symbol ? symbol.toUpperCase() : 'UNKNOWN',
                error: error.message,
                price: 0,
                change: 0,
                changePercent: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Batch lookup multiple stocks with rate limiting
     * @param {Array<string>} symbols - Array of stock symbols
     * @returns {Promise<Object>} Results keyed by symbol
     */
    static async lookupMultiple(symbols) {
        if (!Array.isArray(symbols) || symbols.length === 0) {
            return {};
        }

        const results = {};
        let delayTime = 0;

        for (const symbol of symbols) {
            // Add delay to avoid rate limiting
            if (delayTime > 0) {
                await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_MS));
            }

            const result = await this.lookupStock(symbol);
            // Store results by the cleaned/normalized symbol to ensure consistent lookup
            const cleanSymbol = (symbol || '').toUpperCase().trim();
            results[cleanSymbol] = result;
            delayTime += this.RATE_LIMIT_MS;
        }

        return results;
    }

    /**
     * Get sector for stock (lookup table)
     * Maps common stock symbols to their sectors
     * @param {string} symbol - Stock symbol
     * @returns {string} Sector name or 'Other'
     */
    static guessSector(symbol) {
        const sectorMap = {
            // Technology
            'AAPL': 'Technology',
            'MSFT': 'Technology',
            'GOOGL': 'Technology',
            'GOOG': 'Technology',
            'META': 'Technology',
            'AMZN': 'Technology',
            'NVDA': 'Technology',
            'TSLA': 'Technology',
            'INTC': 'Technology',
            'AMD': 'Technology',
            'CRM': 'Technology',
            'ADBE': 'Technology',
            'NFLX': 'Technology',
            'ORACLE': 'Technology',

            // Healthcare
            'JNJ': 'Healthcare',
            'PFE': 'Healthcare',
            'ABBV': 'Healthcare',
            'MRK': 'Healthcare',
            'AMGN': 'Healthcare',
            'UNH': 'Healthcare',
            'TMO': 'Healthcare',
            'GILD': 'Healthcare',
            'BIIB': 'Healthcare',

            // Financials
            'JPM': 'Financials',
            'BAC': 'Financials',
            'WFC': 'Financials',
            'GS': 'Financials',
            'BLK': 'Financials',
            'AXP': 'Financials',
            'MS': 'Financials',

            // Energy
            'XOM': 'Energy',
            'CVX': 'Energy',
            'COP': 'Energy',
            'SLB': 'Energy',
            'MPC': 'Energy',
            'OXY': 'Energy',

            // Consumer Discretionary
            'AMZN': 'Consumer Discretionary',
            'MCD': 'Consumer Discretionary',
            'NKE': 'Consumer Discretionary',
            'HD': 'Consumer Discretionary',
            'LOW': 'Consumer Discretionary',
            'TSLA': 'Consumer Discretionary',
            'SBUX': 'Consumer Discretionary',

            // Consumer Staples
            'KO': 'Consumer Staples',
            'PEP': 'Consumer Staples',
            'PG': 'Consumer Staples',
            'WMT': 'Consumer Staples',
            'COST': 'Consumer Staples',
            'MO': 'Consumer Staples',

            // Industrials
            'BA': 'Industrials',
            'CAT': 'Industrials',
            'GE': 'Industrials',
            'HON': 'Industrials',
            'MMM': 'Industrials',
            'LMT': 'Industrials',

            // Utilities
            'DUK': 'Utilities',
            'NEE': 'Utilities',
            'SO': 'Utilities',
            'ED': 'Utilities',
            'AEP': 'Utilities',

            // Real Estate
            'REALTY': 'Real Estate',
            'AVB': 'Real Estate',
            'PLD': 'Real Estate',

            // Materials
            'NEM': 'Materials',
            'FCX': 'Materials',
            'PPL': 'Materials',
            'APD': 'Materials',

            // Communication Services
            'VZ': 'Communication Services',
            'T': 'Communication Services',
            'TMUS': 'Communication Services',
            'DIS': 'Communication Services',
            'CHTR': 'Communication Services',
        };

        return sectorMap[symbol.toUpperCase()] || 'Other';
    }

    /**
     * Format price for display
     * @param {number} price - Price value
     * @param {number} decimals - Number of decimal places (default 2)
     * @returns {string} Formatted price string
     */
    static formatPrice(price, decimals = 2) {
        if (typeof price !== 'number' || isNaN(price)) {
            return '$0.00';
        }
        return '$' + price.toFixed(decimals);
    }

    /**
     * Format percentage for display
     * @param {number} percent - Percentage value
     * @returns {string} Formatted percentage string
     */
    static formatPercent(percent) {
        if (typeof percent !== 'number' || isNaN(percent)) {
            return '0.00%';
        }
        const sign = percent >= 0 ? '+' : '';
        return sign + percent.toFixed(2) + '%';
    }

    /**
     * Get price change color (for UI styling)
     * @param {number} change - Price change amount
     * @returns {string} Color code or CSS class name
     */
    static getPriceChangeColor(change) {
        if (typeof change !== 'number') return 'gray';
        if (change > 0) return 'green';
        if (change < 0) return 'red';
        return 'gray';
    }

    /**
     * Calculate gain/loss for holding
     * @param {Object} holding - Holding object with purchasePrice, quantity, currentPrice
     * @returns {Object} { gain, gainPercent, gainAmount }
     */
    static calculateGainLoss(holding) {
        if (!holding || !holding.purchasePrice || !holding.quantity || !holding.currentPrice) {
            return { gain: 0, gainPercent: 0, gainAmount: 0 };
        }

        const costBasis = holding.purchasePrice * holding.quantity;
        const currentValue = holding.currentPrice * holding.quantity;
        const gainAmount = currentValue - costBasis;
        const gainPercent = costBasis > 0 ? (gainAmount / costBasis) * 100 : 0;

        return {
            gain: gainAmount,
            gainPercent: gainPercent,
            gainAmount: gainAmount,
            currentValue: currentValue,
            costBasis: costBasis
        };
    }

    /**
     * Validate stock symbol format
     * @param {string} symbol - Symbol to validate
     * @returns {boolean} True if valid
     */
    static isValidSymbol(symbol) {
        if (!symbol || typeof symbol !== 'string') return false;
        // Allow 1-5 alphanumeric characters, some symbols like BRK.B
        const regex = /^[A-Z0-9.\-]{1,10}$/i;
        return regex.test(symbol.trim());
    }

    /**
     * Cache mechanism to avoid duplicate lookups
     * @private
     */
    static #cache = {};
    static #cacheTimeout = 300000; // 5 minutes

    /**
     * Get cached price if available and not expired
     * @param {string} symbol - Stock symbol
     * @returns {Object|null} Cached data or null if expired/not found
     */
    static getCached(symbol) {
        const cleanSymbol = symbol.toUpperCase().trim();
        const cached = this.#cache[cleanSymbol];

        if (!cached) return null;

        // Check if cache expired
        const age = Date.now() - cached.timestamp;
        if (age > this.#cacheTimeout) {
            delete this.#cache[cleanSymbol];
            return null;
        }

        return cached.data;
    }

    /**
     * Set cache for symbol
     * @param {string} symbol - Stock symbol
     * @param {Object} data - Data to cache
     */
    static setCache(symbol, data) {
        const cleanSymbol = symbol.toUpperCase().trim();
        this.#cache[cleanSymbol] = {
            data: data,
            timestamp: Date.now()
        };
    }

    /**
     * Clear all cache
     */
    static clearCache() {
        this.#cache = {};
    }

    /**
     * Lookup with cache support
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Object>} Stock data
     */
    static async lookupStockCached(symbol) {
        // Check cache first
        const cached = this.getCached(symbol);
        if (cached) {
            console.log(`Using cached price for ${symbol}`);
            return cached;
        }

        // If not cached, fetch and cache
        const data = await this.lookupStock(symbol);
        if (!data.error) {
            this.setCache(symbol, data);
        }

        return data;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StockService;
}
