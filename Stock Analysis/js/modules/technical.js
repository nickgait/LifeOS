// Technical Analysis Calculations
export class TechnicalAnalysis {
    
    /**
     * Calculate Simple Moving Average
     * @param {number[]} data - Array of price data
     * @param {number} window - Period for moving average
     * @returns {number[]} Array of SMA values
     */
    static calculateSMA(data, window) {
        if (!Array.isArray(data) || data.length < window || window <= 0) {
            throw new Error('Invalid data or window size for SMA calculation');
        }

        const sma = [];
        for (let i = window - 1; i < data.length; i++) {
            const sum = data.slice(i - window + 1, i + 1).reduce((acc, val) => {
                if (typeof val !== 'number' || isNaN(val)) {
                    throw new Error('Invalid numeric data in SMA calculation');
                }
                return acc + val;
            }, 0);
            sma.push(sum / window);
        }
        return sma;
    }

    /**
     * Calculate Relative Strength Index
     * @param {number[]} data - Array of price data
     * @param {number} window - Period for RSI calculation (default: 14)
     * @returns {number[]} Array of RSI values
     */
    static calculateRSI(data, window = 14) {
        if (!Array.isArray(data) || data.length < window + 1 || window <= 0) {
            throw new Error('Invalid data or window size for RSI calculation');
        }

        const gains = [];
        const losses = [];
        
        for (let i = 1; i < data.length; i++) {
            const diff = data[i] - data[i - 1];
            gains.push(diff > 0 ? diff : 0);
            losses.push(diff < 0 ? -diff : 0);
        }

        if (gains.length < window) {
            throw new Error('Insufficient data for RSI calculation');
        }

        let avgGain = this.calculateSMA(gains.slice(0, window), window)[0];
        let avgLoss = this.calculateSMA(losses.slice(0, window), window)[0];

        const rsi = [];
        if (avgLoss === 0) {
            rsi.push(100);
        } else {
            rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
        }

        for (let i = window; i < gains.length; i++) {
            avgGain = ((avgGain * (window - 1)) + gains[i]) / window;
            avgLoss = ((avgLoss * (window - 1)) + losses[i]) / window;
            
            if (avgLoss === 0) {
                rsi.push(100);
            } else {
                rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
            }
        }

        return rsi;
    }

    /**
     * Calculate MACD (Moving Average Convergence Divergence)
     * @param {number[]} data - Array of price data
     * @param {number} fastPeriod - Fast EMA period (default: 12)
     * @param {number} slowPeriod - Slow EMA period (default: 26)
     * @param {number} signalPeriod - Signal line period (default: 9)
     * @returns {Object} Object containing MACD line and signal line values
     */
    static calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Invalid data for MACD calculation');
        }
        
        if (fastPeriod <= 0 || slowPeriod <= 0 || signalPeriod <= 0 || fastPeriod >= slowPeriod) {
            throw new Error('Invalid periods for MACD calculation');
        }
        
        // For small datasets, use smaller periods
        if (data.length < slowPeriod) {
            const adjustedSlow = Math.min(slowPeriod, Math.floor(data.length * 0.8));
            const adjustedFast = Math.min(fastPeriod, Math.floor(adjustedSlow * 0.5));
            const adjustedSignal = Math.min(signalPeriod, Math.floor(adjustedSlow * 0.3));
            
            if (adjustedSlow < 2 || adjustedFast < 1) {
                // Return simple values for very small datasets
                return {
                    macd: 0,
                    signal: 0
                };
            }
            
            return this.calculateMACD(data, adjustedFast, adjustedSlow, adjustedSignal);
        }

        try {
            const fastEMA = this.calculateEMA(data, fastPeriod);
            const slowEMA = this.calculateEMA(data, slowPeriod);
            
            if (fastEMA.length !== slowEMA.length) {
                throw new Error('EMA arrays length mismatch in MACD calculation');
            }

            const macdLine = fastEMA.map((val, i) => val - slowEMA[i]);
            const signalLine = this.calculateEMA(macdLine, signalPeriod);
            
            return {
                macd: macdLine[macdLine.length - 1] || 0,
                signal: signalLine[signalLine.length - 1] || 0
            };
        } catch (error) {
            console.error('MACD calculation error:', error);
            console.error('Data length:', data.length, 'Fast:', fastPeriod, 'Slow:', slowPeriod, 'Signal:', signalPeriod);
            throw error;
        }
    }

    /**
     * Calculate Exponential Moving Average
     * @param {number[]} data - Array of price data
     * @param {number} period - EMA period
     * @returns {number[]} Array of EMA values
     */
    static calculateEMA(data, period) {
        if (!Array.isArray(data) || data.length < period || period <= 0) {
            throw new Error('Invalid data or period for EMA calculation');
        }

        const k = 2 / (period + 1);
        const emaValues = [];
        emaValues[0] = data[0];
        
        for (let i = 1; i < data.length; i++) {
            if (typeof data[i] !== 'number' || isNaN(data[i])) {
                throw new Error('Invalid numeric data in EMA calculation');
            }
            emaValues[i] = (data[i] * k) + (emaValues[i - 1] * (1 - k));
        }
        
        return emaValues;
    }

    /**
     * Validate and clean price data
     * @param {Array} data - Raw price data
     * @returns {number[]} Cleaned numeric array
     */
    static validatePriceData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Price data must be an array');
        }

        const cleanData = data
            .map(price => {
                const num = parseFloat(price);
                return isNaN(num) ? null : num;
            })
            .filter(price => price !== null && price > 0);

        if (cleanData.length === 0) {
            throw new Error('No valid price data found');
        }

        return cleanData;
    }
}