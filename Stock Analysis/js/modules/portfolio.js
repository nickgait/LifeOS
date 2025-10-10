// Portfolio Management and Tracking
export class PortfolioManager {
    
    constructor(firebase) {
        this.firebase = firebase;
        this.portfolios = new Map();
        this.currentPortfolio = null;
        this.benchmarkData = null;
    }

    /**
     * Create a new portfolio
     * @param {string} name - Portfolio name
     * @param {string} description - Portfolio description
     * @param {string} type - Portfolio type (personal, retirement, etc.)
     * @returns {Promise<string>} Portfolio ID
     */
    async createPortfolio(name, description = '', type = 'personal') {
        if (!this.firebase.isAuthenticated()) {
            throw new Error('Authentication required for portfolio management');
        }

        const portfolio = {
            id: this.generateId(),
            name: name,
            description: description,
            type: type,
            createdAt: new Date(),
            lastUpdated: new Date(),
            holdings: new Map(),
            transactions: [],
            cash: 10000, // Starting virtual cash
            totalInvested: 0,
            totalValue: 0,
            totalReturn: 0,
            totalReturnPercent: 0
        };

        try {
            await this.savePortfolio(portfolio);
            this.portfolios.set(portfolio.id, portfolio);
            this.currentPortfolio = portfolio;
            
            console.log(`Created portfolio: ${name}`);
            return portfolio.id;
        } catch (error) {
            console.error('Error creating portfolio:', error);
            throw error;
        }
    }

    /**
     * Add a buy transaction
     * @param {string} ticker - Stock ticker
     * @param {number} shares - Number of shares
     * @param {number} price - Price per share
     * @param {Date} date - Transaction date
     * @param {string} notes - Optional notes
     */
    async buyStock(ticker, shares, price, date = new Date(), notes = '') {
        if (!this.currentPortfolio) {
            throw new Error('No portfolio selected');
        }

        const totalCost = shares * price;
        
        if (this.currentPortfolio.cash < totalCost) {
            throw new Error(`Insufficient cash. Need $${totalCost.toFixed(2)}, have $${this.currentPortfolio.cash.toFixed(2)}`);
        }

        const transaction = {
            id: this.generateId(),
            type: 'buy',
            ticker: ticker.toUpperCase(),
            shares: shares,
            price: price,
            totalAmount: totalCost,
            date: date,
            notes: notes,
            timestamp: new Date()
        };

        // Update cash
        this.currentPortfolio.cash -= totalCost;
        this.currentPortfolio.totalInvested += totalCost;

        // Update holdings
        const holding = this.currentPortfolio.holdings.get(ticker) || {
            ticker: ticker.toUpperCase(),
            totalShares: 0,
            averageCost: 0,
            totalCost: 0,
            currentValue: 0,
            unrealizedGain: 0,
            unrealizedGainPercent: 0,
            lots: []
        };

        // Add to lots for tax calculations
        holding.lots.push({
            shares: shares,
            price: price,
            date: date,
            remaining: shares
        });

        // Update totals
        const newTotalCost = holding.totalCost + totalCost;
        const newTotalShares = holding.totalShares + shares;
        holding.averageCost = newTotalCost / newTotalShares;
        holding.totalCost = newTotalCost;
        holding.totalShares = newTotalShares;

        this.currentPortfolio.holdings.set(ticker, holding);
        this.currentPortfolio.transactions.push(transaction);
        this.currentPortfolio.lastUpdated = new Date();

        await this.savePortfolio(this.currentPortfolio);
        
        console.log(`Bought ${shares} shares of ${ticker} at $${price}`);
        return transaction.id;
    }

    /**
     * Add a sell transaction
     * @param {string} ticker - Stock ticker
     * @param {number} shares - Number of shares to sell
     * @param {number} price - Price per share
     * @param {Date} date - Transaction date
     * @param {string} method - Tax method (FIFO, LIFO, specific)
     */
    async sellStock(ticker, shares, price, date = new Date(), method = 'FIFO') {
        if (!this.currentPortfolio) {
            throw new Error('No portfolio selected');
        }

        const holding = this.currentPortfolio.holdings.get(ticker);
        if (!holding || holding.totalShares < shares) {
            throw new Error(`Insufficient shares. Have ${holding?.totalShares || 0}, trying to sell ${shares}`);
        }

        const totalProceeds = shares * price;
        const { costBasis, capitalGain } = this.calculateSaleGains(holding, shares, price, method);

        const transaction = {
            id: this.generateId(),
            type: 'sell',
            ticker: ticker.toUpperCase(),
            shares: shares,
            price: price,
            totalAmount: totalProceeds,
            costBasis: costBasis,
            capitalGain: capitalGain,
            date: date,
            method: method,
            timestamp: new Date()
        };

        // Update cash
        this.currentPortfolio.cash += totalProceeds;

        // Update holdings
        holding.totalShares -= shares;
        holding.totalCost -= costBasis;
        
        if (holding.totalShares > 0) {
            holding.averageCost = holding.totalCost / holding.totalShares;
        } else {
            // Sold all shares
            this.currentPortfolio.holdings.delete(ticker);
        }

        this.currentPortfolio.transactions.push(transaction);
        this.currentPortfolio.lastUpdated = new Date();

        await this.savePortfolio(this.currentPortfolio);
        
        console.log(`Sold ${shares} shares of ${ticker} at $${price}, gain: $${capitalGain.toFixed(2)}`);
        return transaction.id;
    }

    /**
     * Calculate capital gains for a sale using specified method
     * @param {Object} holding - Stock holding
     * @param {number} sharesToSell - Shares being sold
     * @param {number} salePrice - Sale price per share
     * @param {string} method - Tax method
     * @returns {Object} Cost basis and capital gain
     */
    calculateSaleGains(holding, sharesToSell, salePrice, method = 'FIFO') {
        let remainingShares = sharesToSell;
        let totalCostBasis = 0;
        const lotsToUpdate = [];

        if (method === 'FIFO') {
            // First In, First Out
            for (const lot of holding.lots) {
                if (remainingShares <= 0) break;
                
                const sharesToTake = Math.min(remainingShares, lot.remaining);
                totalCostBasis += sharesToTake * lot.price;
                
                lotsToUpdate.push({
                    lot: lot,
                    sharesTaken: sharesToTake
                });
                
                remainingShares -= sharesToTake;
            }
        } else if (method === 'LIFO') {
            // Last In, First Out
            for (let i = holding.lots.length - 1; i >= 0; i--) {
                if (remainingShares <= 0) break;
                
                const lot = holding.lots[i];
                const sharesToTake = Math.min(remainingShares, lot.remaining);
                totalCostBasis += sharesToTake * lot.price;
                
                lotsToUpdate.push({
                    lot: lot,
                    sharesTaken: sharesToTake
                });
                
                remainingShares -= sharesToTake;
            }
        }

        // Update lots
        lotsToUpdate.forEach(({ lot, sharesTaken }) => {
            lot.remaining -= sharesTaken;
        });

        // Remove empty lots
        holding.lots = holding.lots.filter(lot => lot.remaining > 0);

        const totalProceeds = sharesToSell * salePrice;
        const capitalGain = totalProceeds - totalCostBasis;

        return {
            costBasis: totalCostBasis,
            capitalGain: capitalGain
        };
    }

    /**
     * Update portfolio values with current market prices
     * @param {Object} currentPrices - Map of ticker -> current price
     */
    async updatePortfolioValues(currentPrices) {
        if (!this.currentPortfolio) return;

        let totalValue = this.currentPortfolio.cash;
        let totalUnrealizedGain = 0;

        for (const [ticker, holding] of this.currentPortfolio.holdings) {
            const currentPrice = currentPrices[ticker];
            if (currentPrice) {
                holding.currentValue = holding.totalShares * currentPrice;
                holding.unrealizedGain = holding.currentValue - holding.totalCost;
                holding.unrealizedGainPercent = (holding.unrealizedGain / holding.totalCost) * 100;
                
                totalValue += holding.currentValue;
                totalUnrealizedGain += holding.unrealizedGain;
            }
        }

        this.currentPortfolio.totalValue = totalValue;
        this.currentPortfolio.totalReturn = totalUnrealizedGain + this.calculateRealizedGains();
        this.currentPortfolio.totalReturnPercent = this.currentPortfolio.totalInvested > 0 
            ? (this.currentPortfolio.totalReturn / this.currentPortfolio.totalInvested) * 100 
            : 0;

        await this.savePortfolio(this.currentPortfolio);
    }

    /**
     * Calculate realized gains from all sell transactions
     * @returns {number} Total realized gains
     */
    calculateRealizedGains() {
        return this.currentPortfolio.transactions
            .filter(t => t.type === 'sell')
            .reduce((total, t) => total + (t.capitalGain || 0), 0);
    }

    /**
     * Get portfolio performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        if (!this.currentPortfolio) return null;

        const daysSinceCreation = (new Date() - this.currentPortfolio.createdAt) / (1000 * 60 * 60 * 24);
        const annualizedReturn = daysSinceCreation > 0 
            ? Math.pow((this.currentPortfolio.totalValue / this.currentPortfolio.totalInvested), (365 / daysSinceCreation)) - 1
            : 0;

        // Calculate volatility (simplified)
        const dailyReturns = this.calculateDailyReturns();
        const volatility = this.calculateVolatility(dailyReturns);

        return {
            totalValue: this.currentPortfolio.totalValue,
            totalInvested: this.currentPortfolio.totalInvested,
            totalReturn: this.currentPortfolio.totalReturn,
            totalReturnPercent: this.currentPortfolio.totalReturnPercent,
            annualizedReturn: annualizedReturn * 100,
            volatility: volatility * 100,
            sharpeRatio: volatility > 0 ? (annualizedReturn - 0.02) / volatility : 0, // Assuming 2% risk-free rate
            cash: this.currentPortfolio.cash,
            daysSinceCreation: Math.floor(daysSinceCreation)
        };
    }

    /**
     * Get sector allocation
     * @returns {Object} Sector allocation percentages
     */
    getSectorAllocation() {
        // This would need sector data from API or a mapping
        // For now, return simplified allocation
        const sectors = {};
        let totalValue = 0;

        for (const [ticker, holding] of this.currentPortfolio.holdings) {
            // Simplified sector mapping - in real app, get from API
            const sector = this.getSectorForTicker(ticker);
            sectors[sector] = (sectors[sector] || 0) + holding.currentValue;
            totalValue += holding.currentValue;
        }

        // Convert to percentages
        const allocation = {};
        for (const [sector, value] of Object.entries(sectors)) {
            allocation[sector] = totalValue > 0 ? (value / totalValue) * 100 : 0;
        }

        return allocation;
    }

    /**
     * Simple sector mapping (in real app, get from API)
     * @param {string} ticker - Stock ticker
     * @returns {string} Sector name
     */
    getSectorForTicker(ticker) {
        const sectorMap = {
            'AAPL': 'Technology',
            'MSFT': 'Technology',
            'GOOGL': 'Technology',
            'AMZN': 'Consumer Discretionary',
            'TSLA': 'Consumer Discretionary',
            'NVDA': 'Technology',
            'META': 'Technology',
            'JNJ': 'Healthcare',
            'JPM': 'Financials',
            'V': 'Financials'
        };
        
        return sectorMap[ticker] || 'Other';
    }

    /**
     * Calculate daily returns (simplified)
     * @returns {number[]} Array of daily returns
     */
    calculateDailyReturns() {
        // This would need historical portfolio values
        // For now, return empty array
        return [];
    }

    /**
     * Calculate volatility from daily returns
     * @param {number[]} returns - Daily returns
     * @returns {number} Annualized volatility
     */
    calculateVolatility(returns) {
        if (returns.length < 2) return 0;
        
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
        
        return Math.sqrt(variance * 252); // Annualized (252 trading days)
    }

    /**
     * Save portfolio to Firebase
     * @param {Object} portfolio - Portfolio to save
     */
    async savePortfolio(portfolio) {
        if (!this.firebase.isAuthenticated()) {
            throw new Error('Authentication required');
        }

        // Convert Maps to Objects for Firebase storage
        const portfolioData = {
            ...portfolio,
            holdings: Object.fromEntries(portfolio.holdings),
            lastUpdated: new Date()
        };

        // Remove computed fields
        delete portfolioData.totalValue;
        delete portfolioData.totalReturn;
        delete portfolioData.totalReturnPercent;

        // Save to Firebase (implementation depends on your Firebase structure)
        // For now, store in local storage as backup
        localStorage.setItem(`portfolio_${portfolio.id}`, JSON.stringify(portfolioData));
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return 'port_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}