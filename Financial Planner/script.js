// Financial Planner Module - Main JavaScript
// Comprehensive retirement planning with optional Sharia-compliance mode

/**
 * Monte Carlo simulation engine
 */
class MonteCarloEngine {
    constructor(profile) {
        this.profile = profile;
        this.iterations = 1000;
        this.results = [];
    }

    /**
     * Generate random normal distribution using Box-Muller transform
     */
    generateNormalRandom(mean, stdDev) {
        if (this.spare !== undefined) {
            const temp = this.spare;
            this.spare = undefined;
            return temp * stdDev + mean;
        }

        const u1 = Math.random();
        const u2 = Math.random();
        
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        this.spare = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
        
        return z0 * stdDev + mean;
    }

    /**
     * Run Monte Carlo simulation
     */
    runSimulation(iterations = 1000) {
        this.iterations = iterations;
        this.results = [];

        const expectedReturn = this.profile.expectedReturn || 0.075;
        const volatility = this.profile.marketVolatility || 0.15;
        const inflationRate = this.profile.inflationRate || 0.03;

        for (let i = 0; i < iterations; i++) {
            const result = this.runSingleSimulation(expectedReturn, volatility, inflationRate);
            this.results.push(result);
        }

        return this.analyzeResults();
    }

    /**
     * Run single simulation iteration
     */
    runSingleSimulation(expectedReturn, volatility, inflationRate) {
        const years = this.profile.yearsToRetirement;
        let portfolioBalance = this.profile.brokerageBalance + this.profile.retirementBalance;
        let employeeContrib = this.profile.employeeContribution;
        let employerContrib = this.profile.employerMatch;
        
        // Spouse 401(k) if applicable
        let spouseBalance = this.profile.includeSpouse ? (this.profile.spouse401kBalance || 0) : 0;
        let spouseEmployeeContrib = this.profile.includeSpouse ? (this.profile.spouseEmployeeContribution || 0) : 0;
        let spouseEmployerContrib = this.profile.includeSpouse ? (this.profile.spouseEmployerMatch || 0) : 0;
        const spouseYears = this.profile.includeSpouse ? 
            (this.profile.spouseRetirementAge - this.profile.spouseAge) : 0;

        const yearlyData = [];

        // Accumulation phase
        for (let year = 1; year <= years; year++) {
            // Generate random return for this year
            const annualReturn = this.generateNormalRandom(expectedReturn, volatility);
            
            // Main portfolio growth
            const annualContribution = employeeContrib + employerContrib;
            portfolioBalance = (portfolioBalance + annualContribution) * (1 + annualReturn);
            
            // Spouse portfolio growth (if still accumulating)
            if (year <= spouseYears) {
                const spouseAnnualContrib = spouseEmployeeContrib + spouseEmployerContrib;
                spouseBalance = (spouseBalance + spouseAnnualContrib) * (1 + annualReturn);
                
                // Increase spouse contributions
                spouseEmployeeContrib *= (1 + (this.profile.spouseContributionIncrease || 0.02));
                spouseEmployerContrib *= (1 + (this.profile.spouseContributionIncrease || 0.02));
            }

            yearlyData.push({
                year,
                age: this.profile.currentAge + year,
                return: annualReturn,
                portfolioBalance,
                spouseBalance
            });

            // Increase contributions for next year
            employeeContrib *= (1 + this.profile.employeeIncrease);
            employerContrib *= (1 + this.profile.employerIncrease);
        }

        const totalPortfolioAtRetirement = portfolioBalance + spouseBalance;
        
        // Withdrawal phase simulation (simplified - just check if portfolio survives to age 100)
        const survivalResult = this.simulateWithdrawalPhase(
            totalPortfolioAtRetirement, 
            expectedReturn, 
            volatility, 
            inflationRate
        );

        return {
            finalPortfolio: totalPortfolioAtRetirement,
            survives: survivalResult.survives,
            depletion_age: survivalResult.depletionAge,
            yearlyData
        };
    }

    /**
     * Simulate withdrawal phase using selected strategy
     */
    simulateWithdrawalPhase(startingPortfolio, expectedReturn, volatility, inflationRate) {
        const strategy = this.profile.withdrawalStrategy || 'fixed';
        
        switch (strategy) {
            case 'guardrails':
                return this.simulateGuardrailsStrategy(startingPortfolio, expectedReturn, volatility, inflationRate);
            case 'dynamic':
                return this.simulateDynamicStrategy(startingPortfolio, expectedReturn, volatility, inflationRate);
            case 'bucket':
                return this.simulateBucketStrategy(startingPortfolio, expectedReturn, volatility, inflationRate);
            default:
                return this.simulateFixedStrategy(startingPortfolio, expectedReturn, volatility, inflationRate);
        }
    }

    /**
     * Fixed 4% rule strategy
     */
    simulateFixedStrategy(startingPortfolio, expectedReturn, volatility, inflationRate) {
        let portfolio = startingPortfolio;
        const retirementAge = this.profile.retirementAge;
        const endAge = 100;
        let currentSpending = this.profile.annualSpending || (this.profile.monthlySpending * 12);
        
        const ssIncome = this.profile.totalSocialSecurity || this.profile.socialSecurity || 0;
        const pensionIncome = this.profile.totalPensionIncome || 0;
        const guaranteedIncome = ssIncome + pensionIncome;

        for (let age = retirementAge; age <= endAge; age++) {
            const annualReturn = this.generateNormalRandom(expectedReturn, volatility);
            const yearsInRetirement = age - retirementAge;
            const inflatedSpending = currentSpending * Math.pow(1 + inflationRate, yearsInRetirement);
            const withdrawalNeeded = Math.max(0, inflatedSpending - guaranteedIncome);
            const withdrawalRate = portfolio > 0 ? withdrawalNeeded / portfolio : 0;
            
            if (withdrawalRate > 0.10) {
                return { survives: false, depletionAge: age };
            }

            portfolio = (portfolio - withdrawalNeeded) * (1 + annualReturn);
            
            if (portfolio <= 0) {
                return { survives: false, depletionAge: age };
            }
        }

        return { survives: true, depletionAge: null };
    }

    /**
     * Guardrails strategy (Guyton-Klinger rules)
     */
    simulateGuardrailsStrategy(startingPortfolio, expectedReturn, volatility, inflationRate) {
        let portfolio = startingPortfolio;
        const retirementAge = this.profile.retirementAge;
        const endAge = 100;
        let baseSpending = this.profile.annualSpending || (this.profile.monthlySpending * 12);
        let currentSpending = baseSpending;
        
        const ssIncome = this.profile.totalSocialSecurity || this.profile.socialSecurity || 0;
        const pensionIncome = this.profile.totalPensionIncome || 0;
        const guaranteedIncome = ssIncome + pensionIncome;
        
        const initialWithdrawalRate = 0.04;

        for (let age = retirementAge; age <= endAge; age++) {
            const annualReturn = this.generateNormalRandom(expectedReturn, volatility);
            const yearsInRetirement = age - retirementAge;
            
            // Inflate base spending
            const inflatedBaseSpending = baseSpending * Math.pow(1 + inflationRate, yearsInRetirement);
            
            // Calculate current withdrawal rate
            const currentWithdrawalRate = portfolio > 0 ? (currentSpending - guaranteedIncome) / portfolio : 0;
            
            // Apply guardrails rules
            const upperGuardrail = initialWithdrawalRate * 1.2; // 20% above initial rate
            const lowerGuardrail = initialWithdrawalRate * 0.8; // 20% below initial rate
            
            if (currentWithdrawalRate > upperGuardrail && yearsInRetirement > 0) {
                // Cut spending by 10%
                currentSpending = Math.max(currentSpending * 0.9, inflatedBaseSpending * 0.7);
            } else if (currentWithdrawalRate < lowerGuardrail && yearsInRetirement > 0) {
                // Increase spending by 10%
                currentSpending = Math.min(currentSpending * 1.1, inflatedBaseSpending * 1.3);
            } else {
                // Normal inflation adjustment
                currentSpending = inflatedBaseSpending;
            }
            
            const withdrawalNeeded = Math.max(0, currentSpending - guaranteedIncome);
            
            if (currentWithdrawalRate > 0.15) { // Emergency threshold higher for guardrails
                return { survives: false, depletionAge: age };
            }

            portfolio = (portfolio - withdrawalNeeded) * (1 + annualReturn);
            
            if (portfolio <= 0) {
                return { survives: false, depletionAge: age };
            }
        }

        return { survives: true, depletionAge: null };
    }

    /**
     * Dynamic spending strategy (performance-based adjustments)
     */
    simulateDynamicStrategy(startingPortfolio, expectedReturn, volatility, inflationRate) {
        let portfolio = startingPortfolio;
        const retirementAge = this.profile.retirementAge;
        const endAge = 100;
        let baseSpending = this.profile.annualSpending || (this.profile.monthlySpending * 12);
        
        const ssIncome = this.profile.totalSocialSecurity || this.profile.socialSecurity || 0;
        const pensionIncome = this.profile.totalPensionIncome || 0;
        const guaranteedIncome = ssIncome + pensionIncome;

        for (let age = retirementAge; age <= endAge; age++) {
            const annualReturn = this.generateNormalRandom(expectedReturn, volatility);
            const yearsInRetirement = age - retirementAge;
            
            // Dynamic spending based on portfolio performance
            let currentSpending;
            if (yearsInRetirement === 0) {
                currentSpending = baseSpending;
            } else {
                // Adjust spending based on portfolio performance vs expected
                const expectedPortfolio = startingPortfolio * Math.pow(1.06, yearsInRetirement);
                const performanceRatio = portfolio / expectedPortfolio;
                
                // Adjust spending between 70% and 130% of base
                const adjustmentFactor = Math.min(1.3, Math.max(0.7, performanceRatio));
                currentSpending = baseSpending * adjustmentFactor * Math.pow(1 + inflationRate, yearsInRetirement);
            }
            
            const withdrawalNeeded = Math.max(0, currentSpending - guaranteedIncome);
            
            portfolio = (portfolio - withdrawalNeeded) * (1 + annualReturn);
            
            if (portfolio <= 0) {
                return { survives: false, depletionAge: age };
            }
        }

        return { survives: true, depletionAge: null };
    }

    /**
     * Bucket strategy (simplified - cash/bonds/stocks allocation)
     */
    simulateBucketStrategy(startingPortfolio, expectedReturn, volatility, inflationRate) {
        // Simplified bucket allocation: 20% cash, 30% bonds, 50% stocks
        let cashBucket = startingPortfolio * 0.2;
        let bondsBucket = startingPortfolio * 0.3;
        let stocksBucket = startingPortfolio * 0.5;
        
        const retirementAge = this.profile.retirementAge;
        const endAge = 100;
        let baseSpending = this.profile.annualSpending || (this.profile.monthlySpending * 12);
        
        const ssIncome = this.profile.totalSocialSecurity || this.profile.socialSecurity || 0;
        const pensionIncome = this.profile.totalPensionIncome || 0;
        const guaranteedIncome = ssIncome + pensionIncome;

        for (let age = retirementAge; age <= endAge; age++) {
            const yearsInRetirement = age - retirementAge;
            const inflatedSpending = baseSpending * Math.pow(1 + inflationRate, yearsInRetirement);
            const withdrawalNeeded = Math.max(0, inflatedSpending - guaranteedIncome);
            
            // Withdraw from cash first, then bonds, then stocks
            let remaining = withdrawalNeeded;
            
            // From cash (no growth)
            const fromCash = Math.min(remaining, cashBucket);
            cashBucket -= fromCash;
            remaining -= fromCash;
            
            // From bonds (moderate growth)
            if (remaining > 0) {
                const bondsReturn = this.generateNormalRandom(0.04, 0.05); // Lower return, lower volatility
                bondsBucket *= (1 + bondsReturn);
                const fromBonds = Math.min(remaining, bondsBucket);
                bondsBucket -= fromBonds;
                remaining -= fromBonds;
            } else {
                const bondsReturn = this.generateNormalRandom(0.04, 0.05);
                bondsBucket *= (1 + bondsReturn);
            }
            
            // From stocks (higher growth)
            if (remaining > 0) {
                const stocksReturn = this.generateNormalRandom(expectedReturn, volatility);
                stocksBucket *= (1 + stocksReturn);
                const fromStocks = Math.min(remaining, stocksBucket);
                stocksBucket -= fromStocks;
                remaining -= fromStocks;
            } else {
                const stocksReturn = this.generateNormalRandom(expectedReturn, volatility);
                stocksBucket *= (1 + stocksReturn);
            }
            
            // If we couldn't meet withdrawal needs, portfolio failed
            if (remaining > 0) {
                return { survives: false, depletionAge: age };
            }
            
            // Simple rebalancing every 5 years
            if (yearsInRetirement % 5 === 0 && yearsInRetirement > 0) {
                const totalPortfolio = cashBucket + bondsBucket + stocksBucket;
                if (totalPortfolio > 0) {
                    cashBucket = totalPortfolio * 0.2;
                    bondsBucket = totalPortfolio * 0.3;
                    stocksBucket = totalPortfolio * 0.5;
                }
            }
        }

        return { survives: true, depletionAge: null };
    }

    /**
     * Analyze simulation results
     */
    analyzeResults() {
        if (this.results.length === 0) return null;

        // Sort results by final portfolio value
        const sortedPortfolios = this.results
            .map(r => r.finalPortfolio)
            .sort((a, b) => a - b);

        // Calculate success rate
        const successfulRuns = this.results.filter(r => r.survives).length;
        const successRate = successfulRuns / this.results.length;

        // Calculate percentiles
        const getPercentile = (arr, percentile) => {
            const index = Math.floor((percentile / 100) * arr.length);
            return arr[Math.min(index, arr.length - 1)];
        };

        // Calculate failure statistics
        const failedRuns = this.results.filter(r => !r.survives);
        const averageFailureAge = failedRuns.length > 0 
            ? failedRuns.reduce((sum, r) => sum + r.depletion_age, 0) / failedRuns.length 
            : null;

        return {
            successRate,
            iterations: this.iterations,
            percentiles: {
                p10: getPercentile(sortedPortfolios, 10),
                p25: getPercentile(sortedPortfolios, 25),
                p50: getPercentile(sortedPortfolios, 50),
                p75: getPercentile(sortedPortfolios, 75),
                p90: getPercentile(sortedPortfolios, 90)
            },
            statistics: {
                mean: sortedPortfolios.reduce((a, b) => a + b, 0) / sortedPortfolios.length,
                min: sortedPortfolios[0],
                max: sortedPortfolios[sortedPortfolios.length - 1]
            },
            failureStats: {
                failureRate: 1 - successRate,
                averageFailureAge,
                totalFailures: failedRuns.length
            },
            rawResults: this.results,
            portfolioValues: sortedPortfolios
        };
    }
}

class FinancialPlanner {
    constructor() {
        this.shariaMode = false;
        this.profile = null;
        this.holdings = {
            brokerage: [],
            retirement: []
        };
        this.cashHoldings = {
            brokerage: 0,
            retirement: 0
        };
        this.projectionScenario = 'conservative';
        this.charts = {};

        // New data stores
        this.transactions = [];
        this.performanceSnapshots = [];
        this.dividends = [];
        this.expenses = [];
        this.budgets = [];
        this.research = [];
        this.watchlist = [];

        // Filter state
        this.transactionFilter = 'all';
        this.watchlistFilter = 'all';

        // No default holdings - app starts blank
        this.defaultBrokerageHoldings = [];
        this.defaultRetirementHoldings = [];

        // Sharia-compliant fund data
        this.shariaFunds = {
            equity: [
                { ticker: 'SPUS', name: 'SP Funds S&P 500 Sharia ETF', expense: '0.49%', type: 'Large Cap US' },
                { ticker: 'HLAL', name: 'Wahed FTSE USA Shariah ETF', expense: '0.50%', type: 'Large Cap US' },
                { ticker: 'SPRE', name: 'SP Funds S&P Global REIT Sharia ETF', expense: '0.55%', type: 'Real Estate' },
                { ticker: 'SPTE', name: 'SP Funds S&P Technology Sharia ETF', expense: '0.55%', type: 'Technology' }
            ],
            fixedIncome: [
                { ticker: 'SPSK', name: 'SP Funds DJ Global Sukuk ETF', expense: '0.55%', yield: '4.0-5.0%', type: 'Global Sukuk' }
            ]
        };

        this.init();
    }

    async init() {
        await this.loadData();
        this.attachEventListeners();
        this.initializeHoldings();
        this.updateShariaVisibility();
        this.loadDisplayMode();
        this.renderTransactions();
        this.renderCostBasisCards();
        this.renderPerformanceStats();
        this.renderDividends();
        this.renderDividendYields();
        this.renderDividendCalendar();
        this.renderWatchlist();
        this.checkPriceAlerts();
        this.populateTransactionTickerDropdown();
    }

    async loadData() {
        // One-time migration: Clear old hardcoded default data
        const migrationKey = 'financial-planner-migrated-v3';
        if (!StorageManager.get(migrationKey)) {
            StorageManager.remove('financial-planner-holdings');
            StorageManager.remove('financial-planner-profile');
            StorageManager.set(migrationKey, true);
        }

        // Load non-sensitive data normally
        const savedShariaMode = StorageManager.get('financial-planner-sharia-mode');
        if (savedShariaMode !== null) {
            this.shariaMode = savedShariaMode;
            document.getElementById('sharia-mode').checked = this.shariaMode;
        }

        // Load scenarios and market preset
        this.scenarios = StorageManager.get('financial-planner-scenarios') || [];
        this.marketPreset = StorageManager.get('financial-planner-market-preset') || 'moderate';

        // Try to load encrypted data first, fallback to regular storage
        let savedProfile, savedHoldings, savedCashHoldings;

        if (EncryptedStorage.isInitialized()) {
            savedProfile = await EncryptedStorage.get('financial-profile');
            savedHoldings = await EncryptedStorage.get('financial-holdings');
            savedCashHoldings = await EncryptedStorage.get('financial-cash');
        }

        // Fallback to regular storage if encrypted data not available
        if (!savedProfile) {
            savedProfile = StorageManager.get('financial-planner-profile');
        }
        if (!savedHoldings) {
            savedHoldings = StorageManager.get('financial-planner-holdings');
        }
        if (!savedCashHoldings) {
            savedCashHoldings = StorageManager.get('financial-planner-cash');
        }

        if (savedProfile) {
            this.profile = savedProfile;
            this.populateProfileForm();
        }

        if (savedHoldings) {
            // Migrate old value-based holdings to new shares-based format
            const migrationKeyV4 = 'financial-planner-migrated-v4';
            if (!StorageManager.get(migrationKeyV4)) {
                this.migrateHoldingsToSharesBased(savedHoldings);
                StorageManager.set(migrationKeyV4, true);
            }
            this.holdings = savedHoldings;
        } else {
            // Start with empty holdings
            this.holdings.brokerage = [];
            this.holdings.retirement = [];
        }

        if (savedCashHoldings) {
            this.cashHoldings = savedCashHoldings;
            this.updateCashDisplay();
        }

        // V5 migration: enhanced storage for transactions, snapshots, dividends, watchlist
        const migrationKeyV5 = 'financial-planner-migrated-v5';
        if (!StorageManager.get(migrationKeyV5)) {
            // Migrate existing dividends to enhanced format if needed
            const oldDividends = StorageManager.get('financial-planner-dividends');
            if (oldDividends && Array.isArray(oldDividends)) {
                this.dividends = oldDividends.map(d => ({
                    ...d,
                    accountType: d.accountType || 'brokerage',
                    sharesOwned: d.sharesOwned || 0,
                    taxWithheld: d.taxWithheld || 0,
                    notes: d.notes || ''
                }));
            }
            StorageManager.set(migrationKeyV5, true);
        }

        // Load new feature data from encrypted storage (sensitive)
        if (EncryptedStorage.isInitialized()) {
            const savedTransactions = await EncryptedStorage.get('financial-transactions');
            const savedSnapshots = await EncryptedStorage.get('financial-performance-snapshots');
            const savedDividends = await EncryptedStorage.get('financial-dividends');
            const savedExpenses = await EncryptedStorage.get('financial-expenses');
            const savedBudgets = await EncryptedStorage.get('financial-budgets');
            const savedResearch = await EncryptedStorage.get('financial-research');

            if (savedTransactions) this.transactions = savedTransactions;
            if (savedSnapshots) this.performanceSnapshots = savedSnapshots;
            if (savedDividends) this.dividends = savedDividends;
            if (savedExpenses) this.expenses = savedExpenses;
            if (savedBudgets) this.budgets = savedBudgets;
            if (savedResearch) this.research = savedResearch;
        } else {
            // Fallback to regular storage
            this.transactions = StorageManager.get('financial-planner-transactions') || [];
            this.performanceSnapshots = StorageManager.get('financial-planner-snapshots') || [];
            this.dividends = StorageManager.get('financial-planner-dividends') || this.dividends || [];
            this.expenses = StorageManager.get('financial-planner-expenses') || [];
            this.budgets = StorageManager.get('financial-planner-budgets') || [];
            this.research = StorageManager.get('financial-planner-research') || [];
        }

        // Load watchlist from regular (non-encrypted) storage
        this.watchlist = StorageManager.get('financial-watchlist') || [];
    }

    loadDisplayMode() {
        // Load display mode preference from localStorage
        const savedMode = localStorage.getItem('planner-display-mode') || 'simple';
        this.displayMode = savedMode;
        this.setDisplayMode(savedMode);
    }

    migrateHoldingsToSharesBased(holdings) {
        // Convert old holdings with 'value' field to new format with 'shares' and 'price'
        ['brokerage', 'retirement'].forEach(type => {
            if (holdings[type]) {
                holdings[type].forEach(holding => {
                    // If holding has old 'value' field but not new 'shares' field
                    if (holding.value !== undefined && holding.shares === undefined) {
                        // Set shares to 0 and price to 0 - user will need to enter shares and refresh
                        holding.shares = 0;
                        holding.price = 0;
                        holding.lastUpdated = null;
                        // Remove old value field
                        delete holding.value;
                    }
                });
            }
        });
        this.saveData();
    }

    async saveData() {
        // Save non-sensitive data normally
        StorageManager.set('financial-planner-sharia-mode', this.shariaMode);
        StorageManager.set('financial-planner-scenarios', this.scenarios || []);
        StorageManager.set('financial-planner-market-preset', this.marketPreset || 'moderate');

        // Save watchlist in regular storage (non-sensitive research data)
        StorageManager.set('financial-watchlist', this.watchlist || []);

        // Save sensitive financial data with encryption if available
        if (EncryptedStorage.isInitialized()) {
            await EncryptedStorage.set('financial-profile', this.profile);
            await EncryptedStorage.set('financial-holdings', this.holdings);
            await EncryptedStorage.set('financial-cash', this.cashHoldings);
            await EncryptedStorage.set('financial-transactions', this.transactions || []);
            await EncryptedStorage.set('financial-performance-snapshots', this.performanceSnapshots || []);
            await EncryptedStorage.set('financial-dividends', this.dividends || []);
            await EncryptedStorage.set('financial-expenses', this.expenses || []);
            await EncryptedStorage.set('financial-budgets', this.budgets || []);
            await EncryptedStorage.set('financial-research', this.research || []);
        } else {
            // Fallback to regular storage if encryption not set up
            StorageManager.set('financial-planner-profile', this.profile);
            StorageManager.set('financial-planner-holdings', this.holdings);
            StorageManager.set('financial-planner-cash', this.cashHoldings);
            StorageManager.set('financial-planner-transactions', this.transactions || []);
            StorageManager.set('financial-planner-snapshots', this.performanceSnapshots || []);
            StorageManager.set('financial-planner-dividends', this.dividends || []);
            StorageManager.set('financial-planner-expenses', this.expenses || []);
            StorageManager.set('financial-planner-budgets', this.budgets || []);
            StorageManager.set('financial-planner-research', this.research || []);
        }
    }

    attachEventListeners() {
        // Profile form is handled by inline onsubmit
    }

    initializeHoldings() {
        this.renderHoldings('brokerage');
        this.renderHoldings('retirement');
    }

    // ==================== SHARIA MODE ====================

    toggleShariaMode() {
        this.shariaMode = document.getElementById('sharia-mode').checked;
        this.updateShariaVisibility();
        this.saveData();

        // Update labels
        if (this.shariaMode) {
            document.getElementById('fixed-income-title').textContent = 'Islamic Finance & Sukuk Options';
            document.getElementById('savings-title').textContent = 'Sharia-Compliant Savings Options';
            document.getElementById('fixed-income-label').textContent = 'Sukuk/Islamic Bonds';
        } else {
            document.getElementById('fixed-income-title').textContent = 'Fixed Income & Savings Options';
            document.getElementById('savings-title').textContent = 'Savings Account Options';
            document.getElementById('fixed-income-label').textContent = 'Fixed Income';
        }

        // Refresh analysis if profile exists
        if (this.profile) {
            this.runFullAnalysis();
        }
    }

    updateShariaVisibility() {
        const shariaElements = document.querySelectorAll('.sharia-only');
        const conventionalElements = document.querySelectorAll('.conventional-only');

        shariaElements.forEach(el => {
            el.style.display = this.shariaMode ? 'block' : 'none';
        });

        conventionalElements.forEach(el => {
            el.style.display = this.shariaMode ? 'none' : 'block';
        });
    }

    // ==================== MARKET ASSUMPTIONS ====================

    setMarketPreset(preset) {
        const presets = {
            conservative: {
                expectedReturn: 5.0,
                volatility: 10.0,
                inflation: 2.5
            },
            moderate: {
                expectedReturn: 7.5,
                volatility: 15.0,
                inflation: 3.0
            },
            aggressive: {
                expectedReturn: 9.0,
                volatility: 20.0,
                inflation: 3.5
            }
        };

        const config = presets[preset];
        if (!config) return;

        // Update form values
        document.getElementById('expected-return').value = config.expectedReturn;
        document.getElementById('market-volatility').value = config.volatility;
        document.getElementById('inflation-rate').value = config.inflation;

        // Update button states
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="setMarketPreset('${preset}')"]`).classList.add('active');

        // Save preference
        this.marketPreset = preset;
        this.saveData();

        UIUtils.showNotification(`${preset.charAt(0).toUpperCase() + preset.slice(1)} preset applied`, 'success', 2000);
    }

    getMarketAssumptions() {
        // Get values from form, with fallbacks
        const expectedReturn = parseFloat(document.getElementById('expected-return')?.value) || 7.5;
        const volatility = parseFloat(document.getElementById('market-volatility')?.value) || 15.0;
        const inflation = parseFloat(document.getElementById('inflation-rate')?.value) || 3.0;

        return {
            expectedReturn: expectedReturn / 100, // Convert to decimal
            volatility: volatility / 100,
            inflation: inflation / 100
        };
    }

    // ==================== PROFILE MANAGEMENT ====================

    handleProfileSubmit(event) {
        event.preventDefault();

        const form = document.getElementById('profile-form');
        const formData = new FormData(form);
        
        // Create validation schema for financial profile
        const profileSchema = Validator.schema({
            currentAge: Validator.number({ min: 18, max: 100, integer: true }),
            retirementAge: Validator.number({ min: 50, max: 100, integer: true }),
            state: Validator.string({ min: 2, max: 50 }),
            taxBracket: Validator.number({ min: 0, max: 0.5 }),
            riskTolerance: Validator.enum(['low', 'medium', 'high']),
            brokerageBalance: Validator.number({ min: 0, max: 100000000 }),
            retirementBalance: Validator.number({ min: 0, max: 100000000 }),
            cashReserves: Validator.number({ min: 0, max: 100000000 }),
            monthlySavings: Validator.number({ min: 0, max: 50000 }),
            employeeContribution: Validator.number({ min: 0, max: 100000 }),
            employerMatch: Validator.number({ min: 0, max: 100000 }),
            socialSecurity: Validator.number({ min: 0, max: 50000 }),
            monthlySpending: Validator.number({ min: 100, max: 50000 })
        });

        // Extract and validate core profile data
        const rawProfileData = {
            currentAge: parseInt(formData.get('current-age')),
            retirementAge: parseInt(formData.get('retirement-age')),
            state: formData.get('state'),
            taxBracket: parseFloat(formData.get('tax-bracket')) / 100,
            riskTolerance: formData.get('risk-tolerance'),
            brokerageBalance: parseFloat(formData.get('brokerage-balance')),
            retirementBalance: parseFloat(formData.get('retirement-balance')),
            cashReserves: parseFloat(formData.get('cash-reserves')),
            monthlySavings: parseFloat(formData.get('monthly-savings')),
            employeeContribution: parseFloat(formData.get('employee-contribution')),
            employerMatch: parseFloat(formData.get('employer-match')),
            socialSecurity: parseFloat(formData.get('social-security')),
            monthlySpending: parseFloat(formData.get('monthly-spending'))
        };

        // Validate the data
        const validation = profileSchema.safeParse(rawProfileData);
        if (!validation.success) {
            const errorMessages = validation.errors.map(err => err.message).join('\n');
            alert('Validation Error:\n' + errorMessages);
            return;
        }

        // Use validated data
        const validatedData = validation.data;

        this.profile = {
            // Use validated data for core fields
            ...validatedData,
            
            // Add additional fields with validation
            employeeIncrease: parseFloat(formData.get('employee-increase')) / 100,
            employerIncrease: parseFloat(formData.get('employer-increase')) / 100,

            // Primary Pension
            hasPension: formData.get('has-pension') === 'on',
            pensionAmount: parseFloat(formData.get('pension-amount')) || 0,
            pensionStartAge: parseInt(formData.get('pension-start-age')) || 65,
            pensionCola: parseFloat(formData.get('pension-cola')) / 100 || 0,
            pensionSurvivor: parseFloat(formData.get('pension-survivor')) / 100 || 0.5,

            // Spouse
            includeSpouse: formData.get('include-spouse') === 'on',
            spouseAge: parseInt(formData.get('spouse-age')) || 0,
            spouseRetirementAge: parseInt(formData.get('spouse-retirement-age')) || 65,
            spouse401kBalance: parseFloat(formData.get('spouse-401k-balance')) || 0,
            spouseEmployeeContribution: parseFloat(formData.get('spouse-employee-contribution')) || 0,
            spouseEmployerMatch: parseFloat(formData.get('spouse-employer-match')) || 0,
            spouseContributionIncrease: parseFloat(formData.get('spouse-contribution-increase')) / 100 || 0.02,

            // Spouse Pension
            spouseHasPension: formData.get('spouse-has-pension') === 'on',
            spousePensionAmount: parseFloat(formData.get('spouse-pension-amount')) || 0,
            spousePensionStartAge: parseInt(formData.get('spouse-pension-start-age')) || 65,
            spousePensionCola: parseFloat(formData.get('spouse-pension-cola')) / 100 || 0,
            spousePensionSurvivor: parseFloat(formData.get('spouse-pension-survivor')) / 100 || 0.5,

            // Spouse Social Security
            spouseSocialSecurity: parseFloat(formData.get('spouse-social-security')) || 0,
            spouseSsStartAge: parseInt(formData.get('spouse-ss-start-age')) || 65,

            // Market Assumptions
            expectedReturn: parseFloat(formData.get('expected-return')) / 100 || 0.075,
            marketVolatility: parseFloat(formData.get('market-volatility')) / 100 || 0.15,
            inflationRate: parseFloat(formData.get('inflation-rate')) / 100 || 0.03,
            withdrawalStrategy: formData.get('withdrawal-strategy') || 'fixed'
        };

        this.profile.yearsToRetirement = this.profile.retirementAge - this.profile.currentAge;

        // Total assets includes spouse 401(k) if applicable
        this.profile.totalAssets = this.profile.brokerageBalance + this.profile.retirementBalance + this.profile.cashReserves;
        if (this.profile.includeSpouse) {
            this.profile.totalAssets += this.profile.spouse401kBalance;
            this.profile.spouseYearsToRetirement = this.profile.spouseRetirementAge - this.profile.spouseAge;
        }

        this.profile.annualContribution = this.profile.employeeContribution + this.profile.employerMatch;
        this.profile.annualSpending = this.profile.monthlySpending * 12;

        // Calculate total pension income at retirement
        this.profile.totalPensionIncome = 0;
        if (this.profile.hasPension) {
            this.profile.totalPensionIncome += this.profile.pensionAmount;
        }
        if (this.profile.includeSpouse && this.profile.spouseHasPension) {
            this.profile.totalPensionIncome += this.profile.spousePensionAmount;
        }

        // Combined Social Security
        this.profile.totalSocialSecurity = this.profile.socialSecurity;
        if (this.profile.includeSpouse) {
            this.profile.totalSocialSecurity += this.profile.spouseSocialSecurity;
        }

        this.saveData();
        this.runFullAnalysis();
    }

    populateProfileForm() {
        if (!this.profile) return;

        document.getElementById('current-age').value = this.profile.currentAge;
        document.getElementById('retirement-age').value = this.profile.retirementAge;
        document.getElementById('state').value = this.profile.state;
        document.getElementById('tax-bracket').value = this.profile.taxBracket;
        document.getElementById('risk-tolerance').value = this.profile.riskTolerance;
        document.getElementById('brokerage-balance').value = this.profile.brokerageBalance;
        document.getElementById('retirement-balance').value = this.profile.retirementBalance;
        document.getElementById('cash-reserves').value = this.profile.cashReserves;
        document.getElementById('monthly-savings').value = this.profile.monthlySavings || 0;
        document.getElementById('employee-contribution').value = this.profile.employeeContribution;
        document.getElementById('employer-match').value = this.profile.employerMatch;
        document.getElementById('employee-increase').value = this.profile.employeeIncrease * 100;
        document.getElementById('employer-increase').value = this.profile.employerIncrease * 100;
        document.getElementById('social-security').value = this.profile.socialSecurity;
        document.getElementById('monthly-spending').value = this.profile.monthlySpending;

        // Market assumptions
        if (this.profile.expectedReturn !== undefined) {
            document.getElementById('expected-return').value = this.profile.expectedReturn * 100;
            document.getElementById('market-volatility').value = this.profile.marketVolatility * 100;
            document.getElementById('inflation-rate').value = this.profile.inflationRate * 100;
        }
    }

    runFullAnalysis() {
        this.updateSummaryDashboard();
        this.calculateProjections();
        this.calculateRetirementReadiness();
        this.runStressTests();
        this.generateRebalancingPlan();
        this.runSensitivityAnalysis();
        
        // Run Monte Carlo simulation (in background to avoid blocking UI)
        setTimeout(() => {
            this.runMonteCarloSimulation(1000);
        }, 100);
    }

    // ==================== SUMMARY DASHBOARD ====================

    updateSummaryDashboard() {
        if (!this.profile) return;

        document.getElementById('summary-dashboard').style.display = 'block';

        // Update stats
        document.getElementById('total-assets').textContent = this.formatCurrency(this.profile.totalAssets);
        document.getElementById('years-to-retire').textContent = this.profile.yearsToRetirement;

        // Calculate projection using profile's expected return
        const expectedReturn = this.profile.expectedReturn || 0.075;
        const projection = this.calculateFutureValue(expectedReturn);

        // Calculate spouse projection if applicable
        let spouseProjection = 0;
        if (this.profile.includeSpouse && this.profile.spouse401kBalance > 0) {
            spouseProjection = this.calculateSpouseFutureValue(expectedReturn);
        }

        // Include cash reserves in total projected assets
        const totalProjected = projection.finalValue + spouseProjection + projection.finalCashBalance;
        document.getElementById('projected-total').textContent = this.formatCurrency(totalProjected);

        // Calculate retirement income (4% withdrawal + SS + Pension)
        // Only apply 4% rule to investment portfolio, not cash reserves
        const withdrawalAmount = (projection.finalValue + spouseProjection) * 0.04;
        const totalIncome = withdrawalAmount + this.profile.totalSocialSecurity + this.profile.totalPensionIncome;
        document.getElementById('retirement-income').textContent = this.formatCurrency(totalIncome);

        // Show/hide pension stat card
        const pensionCard = document.getElementById('pension-stat-card');
        if (this.profile.totalPensionIncome > 0) {
            pensionCard.style.display = 'block';
            document.getElementById('total-pension').textContent = this.formatCurrency(this.profile.totalPensionIncome);
        } else {
            pensionCard.style.display = 'none';
        }

        // Show/hide spouse stat card
        const spouseCard = document.getElementById('spouse-stat-card');
        if (this.profile.includeSpouse && this.profile.spouse401kBalance > 0) {
            spouseCard.style.display = 'block';
            document.getElementById('spouse-projected').textContent = this.formatCurrency(spouseProjection);
        } else {
            spouseCard.style.display = 'none';
        }

        // Display projected cash reserves
        document.getElementById('projected-cash').textContent = this.formatCurrency(projection.finalCashBalance);

        this.drawAllocationChart();
        this.drawSummaryGrowthChart();
    }

    calculateSpouseFutureValue(annualReturn) {
        if (!this.profile.includeSpouse) return 0;

        const years = this.profile.spouseYearsToRetirement;
        let balance = this.profile.spouse401kBalance;
        let employeeContrib = this.profile.spouseEmployeeContribution;
        let employerContrib = this.profile.spouseEmployerMatch;

        for (let year = 1; year <= years; year++) {
            const annualContribution = employeeContrib + employerContrib;
            balance = (balance + annualContribution) * (1 + annualReturn);

            // Increase contributions for next year
            employeeContrib *= (1 + this.profile.spouseContributionIncrease);
            employerContrib *= (1 + this.profile.spouseContributionIncrease);
        }

        return balance;
    }

    // ==================== HOLDINGS MANAGEMENT ====================

    renderHoldings(type) {
        const container = document.getElementById(`${type}-holdings-container`);
        const holdings = this.holdings[type];

        container.innerHTML = holdings.map((holding, index) => {
            const shares = holding.shares !== undefined ? holding.shares : 0;
            const price = holding.price || 0;
            const value = shares * price;
            const lastUpdated = holding.lastUpdated ? new Date(holding.lastUpdated).toLocaleString() : 'Never';
            const safeTicker = Sanitizer.escapeHTML(holding.ticker);
            const safeName = Sanitizer.escapeHTML(holding.name);

            return `
            <div class="holding-row" data-index="${index}">
                <input type="text" class="holding-ticker" value="${safeTicker}"
                       placeholder="Ticker" onchange="planner.updateHolding('${type}', ${index}, 'ticker', this.value)">
                <input type="text" class="holding-name" value="${safeName}"
                       placeholder="Name" onchange="planner.updateHolding('${type}', ${index}, 'name', this.value)">
                <input type="number" class="holding-shares" value="${shares}" step="0.0001"
                       placeholder="Shares" onchange="planner.updateHolding('${type}', ${index}, 'shares', parseFloat(this.value) || 0); planner.renderHoldings('${type}');">
                <div class="holding-price-info">
                    <span class="price-value">$${price.toFixed(2)}</span>
                    <button type="button" class="btn-refresh-price" onclick="planner.refreshHoldingPrice('${type}', ${index})" title="Refresh price">↻</button>
                </div>
                <div class="holding-value-display">$${value.toFixed(2)}</div>
                <div class="holding-updated">${lastUpdated}</div>
                <select class="holding-sector" onchange="planner.updateHolding('${type}', ${index}, 'sector', this.value)">
                    <option value="Technology" ${holding.sector === 'Technology' ? 'selected' : ''}>Technology</option>
                    <option value="Healthcare" ${holding.sector === 'Healthcare' ? 'selected' : ''}>Healthcare</option>
                    <option value="Financial" ${holding.sector === 'Financial' ? 'selected' : ''}>Financial</option>
                    <option value="Consumer Staples" ${holding.sector === 'Consumer Staples' ? 'selected' : ''}>Consumer Staples</option>
                    <option value="Consumer Discretionary" ${holding.sector === 'Consumer Discretionary' ? 'selected' : ''}>Consumer Discretionary</option>
                    <option value="Energy" ${holding.sector === 'Energy' ? 'selected' : ''}>Energy</option>
                    <option value="Industrial" ${holding.sector === 'Industrial' ? 'selected' : ''}>Industrial</option>
                    <option value="Materials" ${holding.sector === 'Materials' ? 'selected' : ''}>Materials</option>
                    <option value="Utilities" ${holding.sector === 'Utilities' ? 'selected' : ''}>Utilities</option>
                    <option value="Real Estate" ${holding.sector === 'Real Estate' ? 'selected' : ''}>Real Estate</option>
                    <option value="Communication" ${holding.sector === 'Communication' ? 'selected' : ''}>Communication</option>
                    <option value="International" ${holding.sector === 'International' ? 'selected' : ''}>International</option>
                    <option value="Fixed Income" ${holding.sector === 'Fixed Income' ? 'selected' : ''}>Fixed Income</option>
                    <option value="Diversified" ${holding.sector === 'Diversified' ? 'selected' : ''}>Diversified</option>
                </select>
                <label class="holding-compliant sharia-only">
                    <input type="checkbox" ${holding.compliant ? 'checked' : ''}
                           onchange="planner.updateHolding('${type}', ${index}, 'compliant', this.checked)">
                    <span>Compliant</span>
                </label>
                <button type="button" class="btn-remove" onclick="planner.removeHolding('${type}', ${index})">X</button>
            </div>
        `;
        }).join('');

        this.updateShariaVisibility();
    }

    addHolding(type) {
        this.holdings[type].push({
            ticker: '',
            name: '',
            shares: 0,
            price: 0,
            lastUpdated: null,
            sector: 'Diversified',
            compliant: true
        });
        this.renderHoldings(type);
        this.saveData();
    }

    removeHolding(type, index) {
        this.holdings[type].splice(index, 1);
        this.renderHoldings(type);
        this.saveData();
    }

    updateHolding(type, index, field, value) {
        this.holdings[type][index][field] = value;
        this.saveData();
    }

    // ==================== CASH HOLDINGS ====================

    updateCashHolding(type, value) {
        this.cashHoldings[type] = value;
        this.updateCashDisplay();
        this.saveData();
    }

    updateCashDisplay() {
        const brokerageCash = this.cashHoldings.brokerage || 0;
        const retirementCash = this.cashHoldings.retirement || 0;
        const totalCash = brokerageCash + retirementCash;

        // Update input fields
        const brokerageInput = document.getElementById('brokerage-cash');
        const retirementInput = document.getElementById('retirement-cash');
        if (brokerageInput) brokerageInput.value = brokerageCash;
        if (retirementInput) retirementInput.value = retirementCash;

        // Update total display
        const totalDisplay = document.getElementById('total-cash-display');
        if (totalDisplay) {
            totalDisplay.textContent = this.formatCurrency(totalCash);
        }
    }

    // ==================== STOCK PRICE LOOKUP ====================

    async lookupStockPrice(ticker) {
        try {
            console.log(`Looking up price for ${ticker}...`);

            // Use chart API which doesn't require authentication crumb
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
            const fullUrl = proxyUrl + encodeURIComponent(url);

            const response = await fetch(fullUrl);

            if (!response.ok) {
                console.error(`API response not OK: ${response.status} ${response.statusText}`);
                return {
                    success: false,
                    error: `API error: ${response.status}`
                };
            }

            const data = await response.json();
            console.log(`API response for ${ticker}:`, data);

            if (data.chart?.result?.[0]) {
                const result = data.chart.result[0];
                const meta = result.meta;
                const price = meta.regularMarketPrice;
                const name = meta.longName || meta.shortName || ticker;

                // Get sector from lookup table (Yahoo's sector API requires auth)
                let sector = this.guessSectorFromTicker(ticker);

                if (price && price > 0) {
                    console.log(`Successfully got price for ${ticker}: $${price}, name: ${name}, sector: ${sector}`);
                    return {
                        price: price,
                        name: name,
                        sector: sector,
                        success: true
                    };
                } else {
                    return {
                        success: false,
                        error: 'Price not available - ticker may be invalid'
                    };
                }
            } else {
                console.warn(`No valid price data for ${ticker}:`, data);
                return {
                    success: false,
                    error: 'Ticker not found or invalid'
                };
            }
        } catch (error) {
            console.error(`Error fetching stock price for ${ticker}:`, error);
            return {
                success: false,
                error: `Network error: ${error.message}`
            };
        }
    }

    guessSectorFromTicker(ticker) {
        // Common stock sector mappings
        const sectorLookup = {
            // Technology
            'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'GOOG': 'Technology',
            'NVDA': 'Technology', 'META': 'Technology', 'TSLA': 'Technology', 'AMD': 'Technology',
            'CRM': 'Technology', 'ORCL': 'Technology', 'INTC': 'Technology', 'ADBE': 'Technology',
            'CSCO': 'Technology', 'AVGO': 'Technology', 'QCOM': 'Technology', 'IBM': 'Technology',
            'FTNT': 'Technology', 'PAYC': 'Technology', 'NOW': 'Technology',

            // Healthcare
            'JNJ': 'Healthcare', 'UNH': 'Healthcare', 'PFE': 'Healthcare', 'ABBV': 'Healthcare',
            'LLY': 'Healthcare', 'TMO': 'Healthcare', 'ABT': 'Healthcare', 'DHR': 'Healthcare',
            'MRK': 'Healthcare', 'BMY': 'Healthcare',

            // Financial
            'JPM': 'Financial', 'BAC': 'Financial', 'WFC': 'Financial', 'GS': 'Financial',
            'MS': 'Financial', 'C': 'Financial', 'BLK': 'Financial', 'AXP': 'Financial',
            'SCHW': 'Financial', 'V': 'Financial', 'MA': 'Financial', 'PYPL': 'Financial',

            // Consumer Staples
            'PG': 'Consumer Staples', 'KO': 'Consumer Staples', 'PEP': 'Consumer Staples',
            'WMT': 'Consumer Staples', 'COST': 'Consumer Staples', 'PM': 'Consumer Staples',
            'MDLZ': 'Consumer Staples', 'CL': 'Consumer Staples', 'KHC': 'Consumer Staples',

            // Consumer Discretionary
            'AMZN': 'Consumer Discretionary', 'TSLA': 'Consumer Discretionary',
            'HD': 'Consumer Discretionary', 'MCD': 'Consumer Discretionary',
            'NKE': 'Consumer Discretionary', 'SBUX': 'Consumer Discretionary',
            'TGT': 'Consumer Discretionary', 'LOW': 'Consumer Discretionary',

            // Energy
            'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'SLB': 'Energy',

            // Communication
            'NFLX': 'Communication', 'DIS': 'Communication', 'CMCSA': 'Communication',
            'T': 'Communication', 'VZ': 'Communication', 'TMUS': 'Communication',

            // Islamic/Sharia ETFs
            'SPUS': 'Diversified',      // SP 500 Sharia (Large Growth - US broad market)
            'HLAL': 'Diversified',      // Wahed FTSE USA Shariah (Large Blend - US broad market)
            'SPWO': 'International',    // SP Developed ex-US Sharia (Foreign Large Growth)
            'SPSK': 'Fixed Income',     // DJ Global Sukuk (Islamic bonds)
            'SPRE': 'Real Estate',      // SP Global REIT Sharia
            'SPTE': 'Technology',       // SP Technology Sharia

            // Other common ETFs
            'SPY': 'Diversified', 'VOO': 'Diversified', 'QQQ': 'Technology',
            'VTI': 'Diversified', 'IWM': 'Diversified', 'DIA': 'Diversified'
        };

        return sectorLookup[ticker.toUpperCase()] || 'Diversified';
    }

    mapYahooSectorToOurs(yahooSector) {
        const sectorMap = {
            'Technology': 'Technology',
            'Healthcare': 'Healthcare',
            'Financial Services': 'Financial',
            'Financial': 'Financial',
            'Consumer Cyclical': 'Consumer Discretionary',
            'Consumer Defensive': 'Consumer Staples',
            'Energy': 'Energy',
            'Industrials': 'Industrial',
            'Basic Materials': 'Materials',
            'Utilities': 'Utilities',
            'Real Estate': 'Real Estate',
            'Communication Services': 'Communication',
            'Communications': 'Communication'
        };

        return sectorMap[yahooSector] || 'Diversified';
    }

    async refreshHoldingPrice(type, index) {
        const holding = this.holdings[type][index];
        console.log('refreshHoldingPrice called:', { type, index, holding });

        if (!holding.ticker) {
            console.warn('No ticker provided, skipping price refresh');
            alert('Please enter a ticker symbol first');
            return;
        }

        const result = await this.lookupStockPrice(holding.ticker);
        console.log('Lookup result:', result);

        if (result.success) {
            holding.price = result.price;
            holding.name = result.name;
            holding.sector = result.sector;
            holding.lastUpdated = new Date().toISOString();
            this.saveData();
            this.renderHoldings(type);
            console.log('Price, name, and sector updated successfully');
        } else {
            console.error('Price lookup failed:', result.error);
            alert(`Failed to fetch data for ${holding.ticker}: ${result.error}`);
        }
    }

    async refreshAllPrices(type) {
        console.log(`refreshAllPrices called for ${type}`);
        const holdings = this.holdings[type];
        console.log(`Holdings to refresh:`, holdings);
        const statusElement = document.getElementById(`${type}-refresh-status`);

        if (statusElement) {
            statusElement.textContent = 'Refreshing prices...';
            statusElement.style.display = 'block';
        }

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < holdings.length; i++) {
            const holding = holdings[i];
            if (holding.ticker) {
                console.log(`Fetching data for ${holding.ticker}...`);
                const result = await this.lookupStockPrice(holding.ticker);
                if (result.success) {
                    holding.price = result.price;
                    holding.name = result.name;
                    holding.sector = result.sector;
                    holding.lastUpdated = new Date().toISOString();
                    successCount++;
                    console.log(`Success: ${holding.ticker} = $${result.price}, ${result.name}, ${result.sector}`);
                } else {
                    failCount++;
                    console.error(`Failed: ${holding.ticker} - ${result.error}`);
                }
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 250));
            } else {
                console.log(`Skipping holding ${i} - no ticker`);
            }
        }

        console.log(`Refresh complete: ${successCount} success, ${failCount} failed`);
        this.saveData();
        this.renderHoldings(type);

        // *** NEW: Update Overview totals with actual portfolio values ***
        this.updateTotalAssetsFromPortfolio();

        // Auto-create performance snapshot after price refresh
        this.autoCreatePerformanceSnapshot();

        if (statusElement) {
            statusElement.textContent = `Updated ${successCount} stock(s)${failCount > 0 ? `, ${failCount} failed` : ''}`;
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Update Overview totals based on actual portfolio prices
     * Called after price refresh to make totals dynamic
     */
    updateTotalAssetsFromPortfolio() {
        if (!this.profile) return;

        // Calculate actual holdings values from current prices
        const brokerageHoldingsValue = this.holdings.brokerage.reduce((sum, h) => {
            return sum + ((h.shares || 0) * (h.price || 0));
        }, 0);

        const retirementHoldingsValue = this.holdings.retirement.reduce((sum, h) => {
            return sum + ((h.shares || 0) * (h.price || 0));
        }, 0);

        // Get cash holdings
        const brokerageCash = this.cashHoldings.brokerage || 0;
        const retirementCash = this.cashHoldings.retirement || 0;
        const totalCash = brokerageCash + retirementCash;

        // Calculate new total assets (user-entered values + actual portfolio prices)
        const newTotalAssets = brokerageHoldingsValue + retirementHoldingsValue + totalCash;

        // Update profile with new total
        const oldTotal = this.profile.totalAssets || 0;
        this.profile.totalAssets = newTotalAssets;

        // Update the Overview display
        const totalAssetsElement = document.getElementById('total-assets');
        if (totalAssetsElement) {
            totalAssetsElement.textContent = this.formatCurrency(newTotalAssets);
        }

        console.log(`Portfolio values updated: Brokerage=$${brokerageHoldingsValue.toFixed(2)}, Retirement=$${retirementHoldingsValue.toFixed(2)}, Cash=$${totalCash.toFixed(2)}, Total=$${newTotalAssets.toFixed(2)}`);

        // If prices have changed significantly, re-run analysis
        if (oldTotal > 0 && Math.abs(newTotalAssets - oldTotal) > (oldTotal * 0.01)) {
            // More than 1% change - update projections
            console.log(`Significant change detected (${((newTotalAssets / oldTotal - 1) * 100).toFixed(1)}%). Updating projections...`);
            this.runFullAnalysis();
            this.saveData();
        }
    }

    // ==================== PORTFOLIO ANALYSIS ====================

    analyzePortfolio() {
        this.analyzeBrokerageHoldings();
        this.analyzeRetirementHoldings();

        document.getElementById('brokerage-analysis').style.display = 'block';
        document.getElementById('retirement-analysis').style.display = 'block';
    }

    analyzeBrokerageHoldings() {
        const holdings = this.holdings.brokerage;
        const holdingsValue = holdings.reduce((sum, h) => sum + ((h.shares || 0) * (h.price || 0)), 0);
        const cashValue = this.cashHoldings.brokerage || 0;
        const totalValue = holdingsValue + cashValue;

        // Concentration Risk Analysis
        const concentrationHtml = this.analyzeConcentration(holdings, totalValue);
        document.getElementById('concentration-risk').innerHTML = concentrationHtml;

        // Sector Breakdown (including cash)
        const sectorData = this.calculateSectorBreakdown(holdings, totalValue, cashValue);
        const sectorHtml = this.renderSectorBreakdown(sectorData);
        document.getElementById('sector-breakdown').innerHTML = sectorHtml;

        // Compliance Status (Sharia mode only)
        if (this.shariaMode) {
            const complianceHtml = this.analyzeCompliance(holdings, totalValue);
            document.getElementById('compliance-status').innerHTML = complianceHtml;
        }

        // Draw sector chart
        this.drawSectorChart(sectorData);

        // Cash rebalancing recommendations
        if (cashValue > 0) {
            const rebalancingHtml = this.generateRebalancingRecommendations(holdings, cashValue, holdingsValue);
            document.getElementById('rebalancing-suggestions').innerHTML = rebalancingHtml;
            document.getElementById('cash-rebalancing').style.display = 'block';
        } else {
            document.getElementById('cash-rebalancing').style.display = 'none';
        }
    }

    analyzeConcentration(holdings, totalValue) {
        const holdingsWithValue = holdings.map(h => ({
            ...h,
            calculatedValue: (h.shares || 0) * (h.price || 0)
        }));
        const sortedHoldings = [...holdingsWithValue].sort((a, b) => b.calculatedValue - a.calculatedValue);
        const top5 = sortedHoldings.slice(0, 5);
        const top5Value = top5.reduce((sum, h) => sum + h.calculatedValue, 0);
        const top5Pct = (top5Value / totalValue * 100).toFixed(1);

        let riskLevel = 'Low';
        let riskClass = 'low-risk';

        // Check for individual concentration > 10%
        const highConcentration = holdingsWithValue.filter(h => (h.calculatedValue / totalValue) > 0.10);

        if (highConcentration.length > 0 || top5Pct > 60) {
            riskLevel = 'High';
            riskClass = 'high-risk';
        } else if (top5Pct > 40) {
            riskLevel = 'Moderate';
            riskClass = 'moderate-risk';
        }

        let html = `<div class="risk-indicator ${riskClass}">${riskLevel} Concentration Risk</div>`;
        html += `<p>Top 5 holdings: ${top5Pct}% of portfolio</p>`;

        if (highConcentration.length > 0) {
            html += '<div class="concentration-warnings">';
            html += '<strong>High Concentration Positions (>10%):</strong><ul>';
            highConcentration.forEach(h => {
                const pct = (h.calculatedValue / totalValue * 100).toFixed(1);
                html += `<li>${h.ticker}: ${pct}% (${this.formatCurrency(h.calculatedValue)})</li>`;
            });
            html += '</ul></div>';
        }

        return html;
    }

    calculateSectorBreakdown(holdings, totalValue, cashValue = 0) {
        const sectors = {};
        holdings.forEach(h => {
            if (!sectors[h.sector]) {
                sectors[h.sector] = 0;
            }
            sectors[h.sector] += (h.shares || 0) * (h.price || 0);
        });

        // Add cash as a separate sector if it exists
        if (cashValue > 0) {
            sectors['Cash'] = cashValue;
        }

        return Object.entries(sectors).map(([name, value]) => ({
            name,
            value,
            percentage: (value / totalValue * 100).toFixed(1)
        })).sort((a, b) => b.value - a.value);
    }

    renderSectorBreakdown(sectorData) {
        return sectorData.map(s => `
            <div class="sector-item">
                <span class="sector-name">${s.name}</span>
                <span class="sector-value">${s.percentage}%</span>
                <div class="sector-bar" style="width: ${s.percentage}%"></div>
            </div>
        `).join('');
    }

    analyzeCompliance(holdings, totalValue) {
        const compliant = holdings.filter(h => h.compliant);
        const nonCompliant = holdings.filter(h => !h.compliant);

        const compliantValue = compliant.reduce((sum, h) => sum + ((h.shares || 0) * (h.price || 0)), 0);
        const nonCompliantValue = nonCompliant.reduce((sum, h) => sum + ((h.shares || 0) * (h.price || 0)), 0);

        const compliantPct = (compliantValue / totalValue * 100).toFixed(1);

        let html = `<div class="compliance-score">${compliantPct}% Sharia Compliant</div>`;

        if (nonCompliant.length > 0) {
            html += '<div class="non-compliant-list">';
            html += '<strong>Positions to Review:</strong><ul>';
            nonCompliant.forEach(h => {
                const value = (h.shares || 0) * (h.price || 0);
                html += `<li>${h.ticker} - ${h.name} (${this.formatCurrency(value)})</li>`;
            });
            html += '</ul></div>';
        } else {
            html += '<p class="success-text">All holdings are Sharia-compliant!</p>';
        }

        return html;
    }

    generateRebalancingRecommendations(holdings, cashValue, currentHoldingsValue) {
        // Calculate current sector allocations (without cash)
        const sectorAllocations = {};
        const sectorTickers = {};

        holdings.forEach(h => {
            const value = (h.shares || 0) * (h.price || 0);
            if (!sectorAllocations[h.sector]) {
                sectorAllocations[h.sector] = 0;
                sectorTickers[h.sector] = [];
            }
            sectorAllocations[h.sector] += value;
            sectorTickers[h.sector].push({
                ticker: h.ticker,
                name: h.name,
                price: h.price,
                currentValue: value,
                compliant: h.compliant
            });
        });

        // Calculate target allocation (equal weight across sectors that exist)
        const totalWithCash = currentHoldingsValue + cashValue;
        const sectors = Object.keys(sectorAllocations);
        const targetPerSector = totalWithCash / sectors.length;

        // Calculate how much each sector is under-allocated
        const underallocatedSectors = [];
        sectors.forEach(sector => {
            const currentAllocation = sectorAllocations[sector];
            const deficit = targetPerSector - currentAllocation;
            if (deficit > 0) {
                underallocatedSectors.push({
                    sector: sector,
                    deficit: deficit,
                    currentAllocation: currentAllocation,
                    targetAllocation: targetPerSector,
                    tickers: sectorTickers[sector]
                });
            }
        });

        // Sort by deficit (largest first)
        underallocatedSectors.sort((a, b) => b.deficit - a.deficit);

        // Generate recommendations
        let html = '<div class="rebalancing-intro">';
        html += `<p><strong>Available Cash:</strong> ${this.formatCurrency(cashValue)}</p>`;
        html += `<p><strong>Strategy:</strong> Invest cash to balance your portfolio across ${sectors.length} sectors.</p>`;
        html += '</div>';

        if (underallocatedSectors.length === 0) {
            html += '<p class="success-text">Your portfolio is already well-balanced! Consider adding to any position proportionally.</p>';
            return html;
        }

        // Allocate cash proportionally to deficits
        let remainingCash = cashValue;
        const totalDeficit = underallocatedSectors.reduce((sum, s) => sum + s.deficit, 0);
        const recommendations = [];

        underallocatedSectors.forEach(sector => {
            if (remainingCash <= 0) return;

            // Allocate cash proportionally to this sector's deficit
            const cashForSector = Math.min((sector.deficit / totalDeficit) * cashValue, remainingCash);

            if (cashForSector < 10) return; // Skip if less than $10

            // Filter compliant tickers if in Sharia mode
            let availableTickers = sector.tickers;
            if (this.shariaMode) {
                availableTickers = sector.tickers.filter(t => t.compliant);
                if (availableTickers.length === 0) {
                    availableTickers = sector.tickers; // Fallback to all if none compliant
                }
            }

            // Recommend the ticker with lowest current allocation in this sector
            availableTickers.sort((a, b) => a.currentValue - b.currentValue);
            const recommendedTicker = availableTickers[0];

            if (recommendedTicker && recommendedTicker.price > 0) {
                const sharesToBuy = Math.floor(cashForSector / recommendedTicker.price * 100) / 100; // 2 decimal places
                const actualCost = sharesToBuy * recommendedTicker.price;

                if (sharesToBuy > 0) {
                    recommendations.push({
                        ticker: recommendedTicker.ticker,
                        name: recommendedTicker.name,
                        sector: sector.sector,
                        shares: sharesToBuy,
                        price: recommendedTicker.price,
                        cost: actualCost,
                        deficit: sector.deficit
                    });
                    remainingCash -= actualCost;
                }
            }
        });

        if (recommendations.length === 0) {
            html += '<p>No specific recommendations at this time. Your portfolio is well-balanced.</p>';
            return html;
        }

        html += '<div class="recommendations-list">';
        html += '<table class="rebalancing-table">';
        html += '<thead><tr><th>Ticker</th><th>Name</th><th>Sector</th><th>Shares</th><th>Price</th><th>Cost</th></tr></thead>';
        html += '<tbody>';

        recommendations.forEach(rec => {
            html += `<tr>
                <td><strong>${rec.ticker}</strong></td>
                <td>${rec.name}</td>
                <td>${rec.sector}</td>
                <td>${rec.shares.toFixed(4)}</td>
                <td>${this.formatCurrency(rec.price)}</td>
                <td><strong>${this.formatCurrency(rec.cost)}</strong></td>
            </tr>`;
        });

        html += '</tbody></table>';
        html += '</div>';

        const totalInvested = recommendations.reduce((sum, r) => sum + r.cost, 0);
        html += `<div class="rebalancing-summary">`;
        html += `<p><strong>Total Investment:</strong> ${this.formatCurrency(totalInvested)}</p>`;
        if (remainingCash > 1) {
            html += `<p><strong>Remaining Cash:</strong> ${this.formatCurrency(remainingCash)}</p>`;
        }
        html += `<p class="note">💡 This rebalances toward equal weight across your existing ${sectors.length} sectors.</p>`;
        html += '</div>';

        return html;
    }

    analyzeRetirementHoldings() {
        const holdings = this.holdings.retirement;
        const totalValue = holdings.reduce((sum, h) => sum + ((h.shares || 0) * (h.price || 0)), 0);

        // Fund Allocation
        const allocationHtml = holdings.map(h => {
            const value = (h.shares || 0) * (h.price || 0);
            return `
            <div class="fund-item">
                <span class="fund-name">${h.name}</span>
                <span class="fund-value">${this.formatCurrency(value)} (${(value / totalValue * 100).toFixed(1)}%)</span>
            </div>
        `;
        }).join('');
        document.getElementById('fund-allocation').innerHTML = allocationHtml;

        if (this.shariaMode) {
            // Compliance Concerns
            const nonCompliant = holdings.filter(h => !h.compliant);
            let complianceHtml = '';

            if (nonCompliant.length > 0) {
                const nonCompliantValue = nonCompliant.reduce((sum, h) => sum + h.value, 0);
                complianceHtml = `
                    <div class="warning-box">
                        <strong>Compliance Issue:</strong> ${this.formatCurrency(nonCompliantValue)}
                        (${(nonCompliantValue / totalValue * 100).toFixed(1)}%) in non-compliant funds.
                    </div>
                    <p>Traditional index funds typically include financial services companies (banks, insurance)
                    and other non-compliant holdings. Consider transferring to SDBA for compliant alternatives.</p>
                `;
            }
            document.getElementById('retirement-compliance').innerHTML = complianceHtml;

            // SDBA Recommendation
            const sdbaHtml = `
                <div class="recommendation-box">
                    <strong>Recommended Action:</strong>
                    <p>Transfer ${this.formatCurrency(totalValue)} to a Self-Directed Brokerage Account (SDBA)
                    and invest in Sharia-compliant ETFs:</p>
                    <ul>
                        <li>SPUS - SP Funds S&P 500 Sharia ETF (0.49% expense)</li>
                        <li>HLAL - Wahed FTSE USA Shariah ETF (0.50% expense)</li>
                        <li>SPSK - SP Funds DJ Global Sukuk ETF (0.55% expense) - for fixed income</li>
                    </ul>
                </div>
            `;
            document.getElementById('sdba-recommendation').innerHTML = sdbaHtml;
        }
    }

    // ==================== GROWTH PROJECTIONS ====================

    calculateProjections() {
        if (!this.profile) return;

        const rates = {
            conservative: 0.06,
            moderate: 0.075,
            optimistic: 0.09
        };

        const rate = rates[this.projectionScenario];
        const projection = this.calculateFutureValue(rate);

        this.renderProjectionResults(projection);
        this.drawProjectionChart(projection);
    }

    calculateFutureValue(annualReturn) {
        const years = this.profile.yearsToRetirement;
        // Start with investment assets only (exclude cash reserves)
        let balance = this.profile.brokerageBalance + this.profile.retirementBalance;
        let employeeContrib = this.profile.employeeContribution;
        let employerContrib = this.profile.employerMatch;
        let totalContributions = 0;

        // Cash reserves tracking with monthly savings
        const cashGrowthRate = this.shariaMode ? 0 : 0.02; // 0% in Sharia mode, 2% HYSA otherwise
        let cashBalance = this.profile.cashReserves;
        let monthlySavings = this.profile.monthlySavings || 0;
        const savingsIncreaseRate = 0.03; // 3% annual increase for pay raises
        let totalCashSavings = 0;

        const yearlyData = [];

        for (let year = 1; year <= years; year++) {
            const startBalance = balance;
            const annualContribution = employeeContrib + employerContrib;
            totalContributions += annualContribution;

            // Calculate cash growth for the year
            const startCashBalance = cashBalance;
            const annualCashSavings = monthlySavings * 12;
            totalCashSavings += annualCashSavings;

            // Add monthly savings throughout the year, then apply interest
            cashBalance = (cashBalance + annualCashSavings) * (1 + cashGrowthRate);

            // Add contributions and growth to investment portfolio
            balance = (balance + annualContribution) * (1 + annualReturn);
            const growth = balance - startBalance - annualContribution;

            yearlyData.push({
                year: year,
                age: this.profile.currentAge + year,
                startBalance: startBalance,
                contribution: annualContribution,
                growth: growth,
                endBalance: balance,
                cashBalance: cashBalance,
                cashSavings: annualCashSavings
            });

            // Increase contributions for next year
            employeeContrib *= (1 + this.profile.employeeIncrease);
            employerContrib *= (1 + this.profile.employerIncrease);
            monthlySavings *= (1 + savingsIncreaseRate); // 3% increase for pay raises
        }

        const startingInvestments = this.profile.brokerageBalance + this.profile.retirementBalance;

        return {
            finalValue: balance,
            totalContributions: totalContributions,
            totalGrowth: balance - startingInvestments - totalContributions,
            yearlyData: yearlyData,
            finalCashBalance: cashBalance,
            totalCashSavings: totalCashSavings,
            cashGrowth: cashBalance - this.profile.cashReserves - totalCashSavings
        };
    }

    renderProjectionResults(projection) {
        document.getElementById('projection-final').textContent = this.formatCurrency(projection.finalValue);
        document.getElementById('projection-cash').textContent = this.formatCurrency(projection.finalCashBalance);

        const totalNetWorth = projection.finalValue + projection.finalCashBalance;
        document.getElementById('projection-total').textContent = this.formatCurrency(totalNetWorth);

        document.getElementById('projection-contributions').textContent = this.formatCurrency(projection.totalContributions);
        document.getElementById('projection-growth').textContent = this.formatCurrency(projection.totalGrowth);

        // Calculate "what if cash was invested" scenario
        const rates = {
            conservative: 0.06,
            moderate: 0.075,
            optimistic: 0.09
        };
        const rate = rates[this.projectionScenario];
        const investedScenario = this.calculateIfCashWasInvested(rate);

        // Populate comparison cards
        document.getElementById('current-investments').textContent = this.formatCurrency(projection.finalValue);
        document.getElementById('current-cash').textContent = this.formatCurrency(projection.finalCashBalance);
        document.getElementById('current-total').textContent = this.formatCurrency(totalNetWorth);

        document.getElementById('invested-total').textContent = this.formatCurrency(investedScenario.totalInvested);
        document.getElementById('invested-emergency-fund').textContent = this.formatCurrency(investedScenario.emergencyFund);
        document.getElementById('invested-grand-total').textContent = this.formatCurrency(investedScenario.totalNetWorth);

        const difference = investedScenario.totalNetWorth - totalNetWorth;
        const percentDifference = (difference / totalNetWorth * 100).toFixed(1);

        document.getElementById('difference-amount').textContent = this.formatCurrency(difference);
        document.getElementById('difference-percent').textContent = `+${percentDifference}%`;

        // Populate table
        const tbody = document.getElementById('projection-tbody');
        tbody.innerHTML = projection.yearlyData.map(data => `
            <tr>
                <td>${data.year}</td>
                <td>${data.age}</td>
                <td>${this.formatCurrency(data.startBalance)}</td>
                <td>${this.formatCurrency(data.contribution)}</td>
                <td>${this.formatCurrency(data.growth)}</td>
                <td><strong>${this.formatCurrency(data.endBalance)}</strong></td>
            </tr>
        `).join('');
    }

    calculateIfCashWasInvested(annualReturn) {
        // Calculate what would happen if excess cash (beyond 6-month emergency fund) + monthly savings were invested
        const years = this.profile.yearsToRetirement;

        // Calculate 6-month emergency fund requirement
        const monthlyExpenses = this.profile.monthlySpending || 0;
        const emergencyFund = monthlyExpenses * 6;

        // Only invest cash above the emergency fund threshold
        const excessCash = Math.max(0, this.profile.cashReserves - emergencyFund);

        // Start with investment assets + excess cash
        let balance = this.profile.brokerageBalance + this.profile.retirementBalance + excessCash;
        let employeeContrib = this.profile.employeeContribution;
        let employerContrib = this.profile.employerMatch;
        let monthlySavings = this.profile.monthlySavings || 0;
        const savingsIncreaseRate = 0.03;

        // Track emergency fund growth with monthly savings
        const cashGrowthRate = this.shariaMode ? 0 : 0.02;
        let emergencyFundBalance = emergencyFund;

        for (let year = 1; year <= years; year++) {
            // Add 401k contributions + monthly savings to investments
            const annualContribution = employeeContrib + employerContrib + (monthlySavings * 12);

            // Grow the investment balance
            balance = (balance + annualContribution) * (1 + annualReturn);

            // Emergency fund grows at savings rate (minimal growth)
            emergencyFundBalance = emergencyFundBalance * (1 + cashGrowthRate);

            // Increase contributions for next year
            employeeContrib *= (1 + this.profile.employeeIncrease);
            employerContrib *= (1 + this.profile.employerIncrease);
            monthlySavings *= (1 + savingsIncreaseRate);
        }

        return {
            totalInvested: balance,
            emergencyFund: emergencyFundBalance,
            totalNetWorth: balance + emergencyFundBalance
        };
    }

    setScenario(scenario) {
        this.projectionScenario = scenario;

        // Update button states
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.scenario === scenario) {
                btn.classList.add('active');
            }
        });

        this.calculateProjections();
    }

    // ==================== RETIREMENT READINESS ====================

    calculateRetirementReadiness() {
        if (!this.profile) return;

        const projection = this.calculateFutureValue(0.06);
        let portfolioAtRetirement = projection.finalValue;

        // Add spouse 401(k) if applicable
        if (this.profile.includeSpouse && this.profile.spouse401kBalance > 0) {
            portfolioAtRetirement += this.calculateSpouseFutureValue(0.06);
        }

        // Add cash reserves (but don't apply 4% withdrawal to it)
        const totalAssets = portfolioAtRetirement + projection.finalCashBalance;

        const annualWithdrawal = portfolioAtRetirement * 0.04;

        // Calculate equivalent annual income from cash reserves
        // Assume cash is spread over 35 years of retirement (age 65-100)
        const yearsInRetirement = 35;
        const annualCashAvailable = projection.finalCashBalance / yearsInRetirement;

        const totalIncome = annualWithdrawal + annualCashAvailable + this.profile.totalSocialSecurity + this.profile.totalPensionIncome;
        const annualNeed = this.profile.annualSpending;
        const surplus = totalIncome - annualNeed;

        // Calculate readiness score (0-100%)
        const readinessScore = Math.min(100, (totalIncome / annualNeed) * 100);

        // Update UI
        document.getElementById('annual-need').textContent = this.formatCurrency(annualNeed);
        document.getElementById('ss-income').textContent = this.formatCurrency(this.profile.totalSocialSecurity);
        document.getElementById('withdrawal-amount').textContent = this.formatCurrency(annualWithdrawal);
        document.getElementById('annual-surplus').textContent = this.formatCurrency(surplus);
        document.getElementById('annual-surplus').className = surplus >= 0 ? 'detail-value positive' : 'detail-value negative';
        document.getElementById('projected-retirement-cash').textContent = this.formatCurrency(projection.finalCashBalance);

        // Readiness score
        const scoreElement = document.getElementById('readiness-score');
        scoreElement.textContent = readinessScore.toFixed(0) + '%';
        scoreElement.className = 'readiness-score ' + (readinessScore >= 100 ? 'excellent' : readinessScore >= 80 ? 'good' : 'needs-work');

        // Cash flow projection - pass total assets including cash
        this.generateCashFlowProjection(totalAssets, projection.finalCashBalance);
    }

    generateCashFlowProjection(startingPortfolio, startingCash = 0) {
        const retirementAge = this.profile.retirementAge;
        const endAge = 100;
        const annualSpending = this.profile.annualSpending;
        const inflationRate = 0.025; // 2.5% inflation
        const withdrawalGrowth = 0.03; // 3% conservative growth in retirement

        // Split into investment portfolio and cash reserves
        let portfolio = startingPortfolio - startingCash; // Investment portfolio only
        let cashReserves = startingCash; // Cash reserves
        const cashFlowData = [];

        for (let age = retirementAge; age <= endAge; age++) {
            const yearsInRetirement = age - retirementAge;
            const inflatedSpending = annualSpending * Math.pow(1 + inflationRate, yearsInRetirement);

            // Calculate Social Security (may start at different ages)
            let ssIncome = this.profile.socialSecurity;
            if (this.profile.includeSpouse && age >= this.profile.spouseSsStartAge) {
                ssIncome += this.profile.spouseSocialSecurity;
            }

            // Calculate pension income with COLA
            let pensionIncome = 0;
            if (this.profile.hasPension && age >= this.profile.pensionStartAge) {
                pensionIncome += this.profile.pensionAmount * Math.pow(1 + this.profile.pensionCola, yearsInRetirement);
            }
            if (this.profile.includeSpouse && this.profile.spouseHasPension && age >= this.profile.spousePensionStartAge) {
                pensionIncome += this.profile.spousePensionAmount * Math.pow(1 + this.profile.spousePensionCola, yearsInRetirement);
            }

            const guaranteedIncome = ssIncome + pensionIncome;

            // Apply 4% withdrawal rule to portfolio each year
            const withdrawal = portfolio > 0 ? portfolio * 0.04 : 0;

            // Calculate how much additional funding is needed from cash reserves
            const totalIncomeBeforeCash = withdrawal + guaranteedIncome;
            const cashNeeded = Math.max(0, inflatedSpending - totalIncomeBeforeCash);
            const cashUsed = Math.min(cashReserves, cashNeeded);

            const totalIncome = withdrawal + cashUsed + guaranteedIncome;
            const surplus = totalIncome - inflatedSpending;

            cashFlowData.push({
                age: age,
                year: new Date().getFullYear() + (age - this.profile.currentAge),
                portfolio: portfolio,
                cashReserves: cashReserves,
                withdrawal: withdrawal,
                socialSecurity: ssIncome,
                pension: pensionIncome,
                totalIncome: totalIncome,
                spending: inflatedSpending,
                surplus: surplus
            });

            // Update cash reserves and portfolio for next year
            cashReserves = Math.max(0, cashReserves - cashUsed);
            portfolio = Math.max(0, (portfolio - withdrawal) * (1 + withdrawalGrowth));
        }

        // Render cash flow table
        const tbody = document.getElementById('cashflow-tbody');
        tbody.innerHTML = cashFlowData.map(data => `
            <tr class="${data.surplus < 0 ? 'deficit-row' : ''}">
                <td>${data.age}</td>
                <td>${data.year}</td>
                <td>${this.formatCurrency(data.portfolio)}</td>
                <td>${this.formatCurrency(data.withdrawal)}</td>
                <td>${this.formatCurrency(data.socialSecurity)}</td>
                <td>${this.formatCurrency(data.pension)}</td>
                <td>${this.formatCurrency(data.totalIncome)}</td>
                <td>${this.formatCurrency(data.spending)}</td>
                <td class="${data.surplus >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(data.surplus)}</td>
            </tr>
        `).join('');

        this.drawCashFlowChart(cashFlowData);
    }

    // ==================== STRESS TESTS ====================

    runStressTests() {
        if (!this.profile) return;

        const scenarios = [20, 30, 40];
        const currentTotal = this.profile.totalAssets;
        const years = this.profile.yearsToRetirement;
        const returnRate = 0.06;

        scenarios.forEach(decline => {
            const loss = currentTotal * (decline / 100);
            const newBalance = currentTotal - loss;

            // Calculate recovery time
            const recoveryYears = Math.log(currentTotal / newBalance) / Math.log(1 + returnRate);

            // Calculate value at retirement with crash
            const yearsRemaining = years;
            const projection = this.calculateFutureValueFromBalance(newBalance, returnRate, yearsRemaining);

            document.getElementById(`loss-${decline}`).textContent = this.formatCurrency(loss);
            document.getElementById(`balance-${decline}`).textContent = this.formatCurrency(newBalance);
            document.getElementById(`recovery-${decline}`).textContent = `${recoveryYears.toFixed(1)} years`;
            document.getElementById(`retirement-${decline}`).textContent = this.formatCurrency(projection);
        });

        // Risk assessment with comprehensive income analysis
        const normalProjection = this.calculateFutureValue(0.06);
        const normalPortfolio = normalProjection.finalValue;
        const normalCash = normalProjection.finalCashBalance;
        const worstCasePortfolio = this.calculateFutureValueFromBalance(currentTotal * 0.6, 0.06, years);

        // Calculate retirement income for both scenarios
        const normalWithdrawal = normalPortfolio * 0.04;
        const normalTotalIncome = normalWithdrawal + this.profile.totalSocialSecurity + this.profile.totalPensionIncome;
        const normalCashAnnual = normalCash / 35; // Spread over 35 years

        const worstCaseWithdrawal = worstCasePortfolio * 0.04;
        const worstCaseTotalIncome = worstCaseWithdrawal + this.profile.totalSocialSecurity + this.profile.totalPensionIncome;

        const annualNeed = this.profile.annualSpending;

        // Calculate for invested cash scenario
        const rates = { conservative: 0.06, moderate: 0.075, optimistic: 0.09 };
        const investedScenario = this.calculateIfCashWasInvested(0.06);
        const investedWithdrawal = investedScenario.totalInvested * 0.04;
        const investedTotalIncome = investedWithdrawal + this.profile.totalSocialSecurity + this.profile.totalPensionIncome;

        // Worst case for invested scenario (40% crash on invested amount)
        const investedWorstCase = investedScenario.totalInvested * 0.6;
        const investedWorstCaseProjection = this.calculateFutureValueFromBalance(investedWorstCase, 0.06, years);
        const investedWorstCaseWithdrawal = investedWorstCaseProjection * 0.04;
        const investedWorstCaseTotalIncome = investedWorstCaseWithdrawal + this.profile.totalSocialSecurity + this.profile.totalPensionIncome;

        let assessment = '';
        if (years >= 10) {
            assessment = `
                <div class="assessment-positive">
                    <strong>Recovery Outlook: Favorable</strong>
                    <p>With ${years} years until retirement, you have sufficient time to recover from even severe market downturns.
                    Historical data shows markets typically recover within 3-5 years from major corrections.</p>
                </div>
            `;
        } else if (years >= 5) {
            assessment = `
                <div class="assessment-moderate">
                    <strong>Recovery Outlook: Moderate Concern</strong>
                    <p>With ${years} years until retirement, a severe crash could impact your retirement timeline.
                    Consider gradually shifting to more conservative allocations to protect against sequence-of-returns risk.</p>
                </div>
            `;
        } else {
            assessment = `
                <div class="assessment-concern">
                    <strong>Recovery Outlook: Heightened Risk</strong>
                    <p>With only ${years} years until retirement, market volatility poses significant risk.
                    Consider increasing fixed income allocation and maintaining larger cash reserves.</p>
                </div>
            `;
        }

        // Current Strategy Assessment
        assessment += `
            <div class="stress-comparison-cards">
                <div class="stress-scenario-card">
                    <h4>Current Strategy (Separate Cash & Investments)</h4>
                    <div class="assessment-stats">
                        <div class="stat-row">
                            <span class="stat-label">Normal Scenario:</span>
                            <span class="stat-value">${this.formatCurrency(normalPortfolio + normalCash)}</span>
                        </div>
                        <div class="stat-row breakdown">
                            <span class="stat-label">• Portfolio (4% withdrawal):</span>
                            <span class="stat-value">${this.formatCurrency(normalWithdrawal)}/year</span>
                        </div>
                        <div class="stat-row breakdown">
                            <span class="stat-label">• Social Security:</span>
                            <span class="stat-value">${this.formatCurrency(this.profile.totalSocialSecurity)}/year</span>
                        </div>
                        ${this.profile.totalPensionIncome > 0 ? `
                        <div class="stat-row breakdown">
                            <span class="stat-label">• Pension:</span>
                            <span class="stat-value">${this.formatCurrency(this.profile.totalPensionIncome)}/year</span>
                        </div>
                        ` : ''}
                        <div class="stat-row breakdown">
                            <span class="stat-label">• Cash Reserves (annual):</span>
                            <span class="stat-value">${this.formatCurrency(normalCashAnnual)}/year</span>
                        </div>
                        <div class="stat-row total">
                            <span class="stat-label">Total Annual Income:</span>
                            <span class="stat-value ${normalTotalIncome + normalCashAnnual >= annualNeed ? 'positive' : 'negative'}">${this.formatCurrency(normalTotalIncome + normalCashAnnual)}/year</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Annual Need:</span>
                            <span class="stat-value">${this.formatCurrency(annualNeed)}/year</span>
                        </div>
                        <div class="stat-row surplus">
                            <span class="stat-label">Surplus/Deficit:</span>
                            <span class="stat-value ${normalTotalIncome + normalCashAnnual >= annualNeed ? 'positive' : 'negative'}">${this.formatCurrency((normalTotalIncome + normalCashAnnual) - annualNeed)}/year</span>
                        </div>
                    </div>

                    <div class="assessment-stats" style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #e0e0e0;">
                        <div class="stat-row">
                            <span class="stat-label">After 40% Crash:</span>
                            <span class="stat-value">${this.formatCurrency(worstCasePortfolio + normalCash)}</span>
                        </div>
                        <div class="stat-row total">
                            <span class="stat-label">Total Annual Income:</span>
                            <span class="stat-value ${worstCaseTotalIncome + normalCashAnnual >= annualNeed ? 'positive' : 'negative'}">${this.formatCurrency(worstCaseTotalIncome + normalCashAnnual)}/year</span>
                        </div>
                        <div class="stat-row surplus">
                            <span class="stat-label">Surplus/Deficit:</span>
                            <span class="stat-value ${worstCaseTotalIncome + normalCashAnnual >= annualNeed ? 'positive' : 'negative'}">${this.formatCurrency((worstCaseTotalIncome + normalCashAnnual) - annualNeed)}/year</span>
                        </div>
                    </div>
                </div>

                <div class="stress-scenario-card alternative">
                    <h4>If Cash Was Invested (Keep 6-mo Emergency Fund)</h4>
                    <div class="assessment-stats">
                        <div class="stat-row">
                            <span class="stat-label">Normal Scenario:</span>
                            <span class="stat-value">${this.formatCurrency(investedScenario.totalNetWorth)}</span>
                        </div>
                        <div class="stat-row breakdown">
                            <span class="stat-label">• Portfolio (4% withdrawal):</span>
                            <span class="stat-value">${this.formatCurrency(investedWithdrawal)}/year</span>
                        </div>
                        <div class="stat-row breakdown">
                            <span class="stat-label">• Social Security:</span>
                            <span class="stat-value">${this.formatCurrency(this.profile.totalSocialSecurity)}/year</span>
                        </div>
                        ${this.profile.totalPensionIncome > 0 ? `
                        <div class="stat-row breakdown">
                            <span class="stat-label">• Pension:</span>
                            <span class="stat-value">${this.formatCurrency(this.profile.totalPensionIncome)}/year</span>
                        </div>
                        ` : ''}
                        <div class="stat-row total">
                            <span class="stat-label">Total Annual Income:</span>
                            <span class="stat-value ${investedTotalIncome >= annualNeed ? 'positive' : 'negative'}">${this.formatCurrency(investedTotalIncome)}/year</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Annual Need:</span>
                            <span class="stat-value">${this.formatCurrency(annualNeed)}/year</span>
                        </div>
                        <div class="stat-row surplus">
                            <span class="stat-label">Surplus/Deficit:</span>
                            <span class="stat-value ${investedTotalIncome >= annualNeed ? 'positive' : 'negative'}">${this.formatCurrency(investedTotalIncome - annualNeed)}/year</span>
                        </div>
                    </div>

                    <div class="assessment-stats" style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #e0e0e0;">
                        <div class="stat-row">
                            <span class="stat-label">After 40% Crash:</span>
                            <span class="stat-value">${this.formatCurrency(investedWorstCaseProjection + investedScenario.emergencyFund)}</span>
                        </div>
                        <div class="stat-row total">
                            <span class="stat-label">Total Annual Income:</span>
                            <span class="stat-value ${investedWorstCaseTotalIncome >= annualNeed ? 'positive' : 'negative'}">${this.formatCurrency(investedWorstCaseTotalIncome)}/year</span>
                        </div>
                        <div class="stat-row surplus">
                            <span class="stat-label">Surplus/Deficit:</span>
                            <span class="stat-value ${investedWorstCaseTotalIncome >= annualNeed ? 'positive' : 'negative'}">${this.formatCurrency(investedWorstCaseTotalIncome - annualNeed)}/year</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('risk-assessment').innerHTML = assessment;
    }

    calculateFutureValueFromBalance(startBalance, rate, years) {
        let balance = startBalance;
        let employeeContrib = this.profile.employeeContribution;
        let employerContrib = this.profile.employerMatch;

        for (let year = 1; year <= years; year++) {
            const annualContribution = employeeContrib + employerContrib;
            balance = (balance + annualContribution) * (1 + rate);
            employeeContrib *= (1 + this.profile.employeeIncrease);
            employerContrib *= (1 + this.profile.employerIncrease);
        }

        return balance;
    }

    // ==================== REBALANCING PLAN ====================

    generateRebalancingPlan() {
        if (!this.profile) return;

        // Calculate target allocation based on age and risk tolerance
        let equityTarget, fixedTarget, cashTarget;

        const age = this.profile.currentAge;
        const baseEquity = 110 - age; // Rule of 110

        switch (this.profile.riskTolerance) {
            case 'conservative':
                equityTarget = Math.max(40, baseEquity - 15);
                break;
            case 'aggressive':
                equityTarget = Math.min(90, baseEquity + 10);
                break;
            default:
                equityTarget = baseEquity;
        }

        fixedTarget = Math.min(30, 100 - equityTarget - 10);
        cashTarget = 100 - equityTarget - fixedTarget;

        // Calculate cash reserve recommendations
        this.analyzeCashReserves();

        // Update UI
        document.getElementById('equity-target').textContent = equityTarget + '%';
        document.getElementById('fixed-target').textContent = fixedTarget + '%';
        document.getElementById('cash-target').textContent = cashTarget + '%';
        document.getElementById('equity-bar').style.width = equityTarget + '%';
        document.getElementById('fixed-bar').style.width = fixedTarget + '%';
        document.getElementById('cash-bar').style.width = cashTarget + '%';

        // SDBA allocation (Sharia mode)
        if (this.shariaMode) {
            const retirementBalance = this.profile.retirementBalance;
            const equityAmount = retirementBalance * (equityTarget / 100);
            const fixedAmount = retirementBalance * (fixedTarget / 100);

            document.getElementById('transfer-amount').textContent =
                `Transfer ${this.formatCurrency(retirementBalance)} from index funds to SDBA for Sharia-compliant reinvestment.`;

            document.getElementById('sdba-allocation').innerHTML = `
                <div class="allocation-row">
                    <span>SPUS (S&P 500 Sharia)</span>
                    <span>${this.formatCurrency(equityAmount * 0.5)} (${(equityTarget * 0.5).toFixed(0)}%)</span>
                </div>
                <div class="allocation-row">
                    <span>HLAL (Wahed FTSE USA Shariah)</span>
                    <span>${this.formatCurrency(equityAmount * 0.5)} (${(equityTarget * 0.5).toFixed(0)}%)</span>
                </div>
                <div class="allocation-row">
                    <span>SPSK (DJ Global Sukuk)</span>
                    <span>${this.formatCurrency(fixedAmount)} (${fixedTarget}%)</span>
                </div>
            `;
        }

        // Action checklists
        this.generateActionChecklists();
        this.generateTradeRecommendations(equityTarget, fixedTarget, cashTarget);
    }

    analyzeCashReserves() {
        if (!this.profile) return;

        const currentCash = this.profile.cashReserves;
        const monthlySavings = this.profile.monthlySavings || 0;
        const monthlyExpenses = this.profile.monthlySpending;
        const yearsToRetirement = this.profile.yearsToRetirement;

        // Calculate recommended emergency fund (3-6 months of expenses)
        const emergencyFundMin = monthlyExpenses * 3;
        const emergencyFundIdeal = monthlyExpenses * 6;

        // Calculate projected cash in 1 year with monthly savings
        const cashIn1Year = currentCash + (monthlySavings * 12);

        // Determine cash reserve status
        let cashStatus, cashRecommendation, cashClass;

        if (currentCash < emergencyFundMin) {
            cashStatus = 'Low - Build Emergency Fund';
            cashClass = 'warning';
            const deficit = emergencyFundMin - currentCash;
            const monthsToMin = Math.ceil(deficit / monthlySavings);
            cashRecommendation = `Your cash reserves are below the recommended 3-month emergency fund. ` +
                `Increase to at least ${this.formatCurrency(emergencyFundMin)}. ` +
                (monthlySavings > 0
                    ? `At your current savings rate of ${this.formatCurrency(monthlySavings)}/month, you'll reach the minimum in ${monthsToMin} months.`
                    : `Consider setting a monthly savings target to build your emergency fund.`);
        } else if (currentCash < emergencyFundIdeal) {
            cashStatus = 'Adequate - Consider Increasing';
            cashClass = 'moderate';
            const deficit = emergencyFundIdeal - currentCash;
            const monthsToIdeal = monthlySavings > 0 ? Math.ceil(deficit / monthlySavings) : 0;
            cashRecommendation = `You have a basic emergency fund. Consider increasing to ${this.formatCurrency(emergencyFundIdeal)} (6 months expenses). ` +
                (monthlySavings > 0
                    ? `At ${this.formatCurrency(monthlySavings)}/month, you'll reach this in ${monthsToIdeal} months.`
                    : `Set a monthly savings target to reach your ideal emergency fund.`);
        } else if (currentCash > emergencyFundIdeal * 2) {
            cashStatus = 'Excess Cash - Consider Investing';
            cashClass = 'info';
            const excess = currentCash - emergencyFundIdeal;

            // Calculate opportunity cost of holding excess cash
            const investmentReturn = 0.07; // Conservative 7% market return
            const cashReturn = this.shariaMode ? 0 : 0.02; // 2% HYSA or 0% Sharia
            const opportunityCostRate = investmentReturn - cashReturn;
            const futureValueIfInvested = excess * Math.pow(1 + investmentReturn, yearsToRetirement);
            const futureValueAsCash = excess * Math.pow(1 + cashReturn, yearsToRetirement);
            const opportunityCost = futureValueIfInvested - futureValueAsCash;

            cashRecommendation = `You have ${this.formatCurrency(excess)} above your ideal 6-month emergency fund. ` +
                `Consider investing this excess cash to grow your retirement savings.<br><br>` +
                `<strong>Opportunity Cost Analysis:</strong><br>` +
                `• If you invest the ${this.formatCurrency(excess)} excess: ${this.formatCurrency(futureValueIfInvested)} in ${yearsToRetirement} years<br>` +
                `• If you keep it as cash: ${this.formatCurrency(futureValueAsCash)} in ${yearsToRetirement} years<br>` +
                `• <strong>Potential loss by holding cash: ${this.formatCurrency(opportunityCost)}</strong>`;
        } else {
            cashStatus = 'Optimal - Well Positioned';
            cashClass = 'success';
            cashRecommendation = `Your cash reserves are in an ideal range. ` +
                `Continue saving ${this.formatCurrency(monthlySavings)}/month. ` +
                `In 1 year, you'll have ${this.formatCurrency(cashIn1Year)} in cash reserves.`;
        }

        // Add cash analysis to action checklist
        const cashAnalysisHtml = `
            <div class="cash-reserve-analysis ${cashClass}">
                <h4>💰 Cash Reserves Analysis</h4>
                <div class="cash-metrics">
                    <div class="cash-metric">
                        <span class="metric-label">Current Cash Reserves:</span>
                        <span class="metric-value">${this.formatCurrency(currentCash)}</span>
                    </div>
                    <div class="cash-metric">
                        <span class="metric-label">Monthly Savings:</span>
                        <span class="metric-value">${this.formatCurrency(monthlySavings)}</span>
                    </div>
                    <div class="cash-metric">
                        <span class="metric-label">Recommended Range:</span>
                        <span class="metric-value">${this.formatCurrency(emergencyFundMin)} - ${this.formatCurrency(emergencyFundIdeal)}</span>
                    </div>
                    <div class="cash-metric">
                        <span class="metric-label">Status:</span>
                        <span class="metric-value status-${cashClass}">${cashStatus}</span>
                    </div>
                </div>
                <div class="cash-recommendation">
                    <strong>Recommendation:</strong>
                    <div>${cashRecommendation}</div>
                </div>
            </div>
        `;

        // Insert before the action checklist section
        const checklistElement = document.querySelector('.action-checklist');
        if (checklistElement) {
            // Remove existing cash analysis if present
            const existing = document.querySelector('.cash-reserve-analysis');
            if (existing) existing.remove();

            // Insert new analysis before checklist
            checklistElement.insertAdjacentHTML('beforebegin', cashAnalysisHtml);
        }
    }

    generateActionChecklists() {
        const currentCash = this.profile.cashReserves;
        const monthlySavings = this.profile.monthlySavings || 0;
        const monthlyExpenses = this.profile.monthlySpending;
        const emergencyFundMin = monthlyExpenses * 3;
        const emergencyFundIdeal = monthlyExpenses * 6;

        // Immediate actions
        let immediateHtml = '';
        if (this.shariaMode) {
            immediateHtml = `
                <div class="checklist-item">
                    <input type="checkbox" id="check-1">
                    <label for="check-1">Contact Empower to confirm SDBA availability</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check-2">
                    <label for="check-2">Open SDBA account if not already active</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check-3">
                    <label for="check-3">Review and verify Zoya screening for all brokerage holdings</label>
                </div>
            `;
        }

        // Add cash reserve action if needed
        if (currentCash < emergencyFundMin) {
            immediateHtml += `
                <div class="checklist-item priority">
                    <input type="checkbox" id="check-cash-1">
                    <label for="check-cash-1">Priority: Build emergency fund to ${this.formatCurrency(emergencyFundMin)} (3 months expenses)</label>
                </div>
            `;
        } else if (currentCash > emergencyFundIdeal * 2) {
            immediateHtml += `
                <div class="checklist-item">
                    <input type="checkbox" id="check-cash-1">
                    <label for="check-cash-1">Consider investing excess cash reserves above ${this.formatCurrency(emergencyFundIdeal)}</label>
                </div>
            `;
        }

        immediateHtml += `
            <div class="checklist-item">
                <input type="checkbox" id="check-4">
                <label for="check-4">Review high-concentration positions</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-5">
                <label for="check-5">Confirm beneficiary designations are current</label>
            </div>
        `;
        document.getElementById('immediate-actions').innerHTML = immediateHtml;

        // Short-term actions
        let shortTermHtml = '';
        if (this.shariaMode) {
            shortTermHtml = `
                <div class="checklist-item">
                    <input type="checkbox" id="check-st-1">
                    <label for="check-st-1">Transfer 401(k) balance to SDBA</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check-st-2">
                    <label for="check-st-2">Purchase SPUS, HLAL, SPSK in SDBA</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check-st-3">
                    <label for="check-st-3">Set up automatic contributions to SDBA</label>
                </div>
            `;
        }
        shortTermHtml += `
            <div class="checklist-item">
                <input type="checkbox" id="check-st-4">
                <label for="check-st-4">Trim NVDA position to reduce concentration risk</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-st-5">
                <label for="check-st-5">Increase ${this.shariaMode ? 'sukuk' : 'fixed income'} allocation</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-st-6">
                <label for="check-st-6">Consider ${this.shariaMode ? 'Islamic savings account' : 'high-yield savings'} for cash reserves</label>
            </div>
        `;
        document.getElementById('short-term-actions').innerHTML = shortTermHtml;

        // Ongoing actions
        const ongoingHtml = `
            <div class="checklist-item">
                <input type="checkbox" id="check-on-1">
                <label for="check-on-1">Rebalance portfolio quarterly</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-on-2">
                <label for="check-on-2">Review and adjust contributions annually</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-on-3">
                <label for="check-on-3">${this.shariaMode ? 'Re-screen holdings through Zoya quarterly' : 'Review fund performance quarterly'}</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-on-4">
                <label for="check-on-4">Adjust risk allocation as retirement approaches</label>
            </div>
        `;
        document.getElementById('ongoing-actions').innerHTML = ongoingHtml;
    }

    generateTradeRecommendations(equityTarget, fixedTarget, cashTarget) {
        const totalAssets = this.profile.totalAssets;
        const brokerageHoldings = this.holdings.brokerage;
        const totalBrokerage = brokerageHoldings.reduce((sum, h) => sum + h.value, 0);

        // Find high concentration positions
        let sellHtml = '';
        const highConcentration = brokerageHoldings.filter(h => (h.value / totalBrokerage) > 0.10);

        highConcentration.forEach(h => {
            const currentPct = (h.value / totalBrokerage * 100);
            const targetValue = totalBrokerage * 0.05; // Target 5% max
            const trimAmount = h.value - targetValue;

            sellHtml += `
                <div class="trade-item sell">
                    <span class="trade-ticker">${h.ticker}</span>
                    <span class="trade-action">Trim ${this.formatCurrency(trimAmount)}</span>
                    <span class="trade-reason">Reduce from ${currentPct.toFixed(1)}% to 5%</span>
                </div>
            `;
        });

        if (!sellHtml) {
            sellHtml = '<p>No immediate sells recommended. Portfolio is reasonably balanced.</p>';
        }
        document.getElementById('sell-recommendations').innerHTML = sellHtml;

        // Buy recommendations
        let buyHtml = '';

        if (this.shariaMode) {
            buyHtml = `
                <div class="trade-item buy">
                    <span class="trade-ticker">SPSK</span>
                    <span class="trade-action">Add ${this.formatCurrency(totalAssets * 0.05)}</span>
                    <span class="trade-reason">Increase sukuk allocation for stability</span>
                </div>
                <div class="trade-item buy">
                    <span class="trade-ticker">HLAL</span>
                    <span class="trade-action">Add ${this.formatCurrency(totalAssets * 0.03)}</span>
                    <span class="trade-reason">Diversify compliant equity exposure</span>
                </div>
            `;
        } else {
            buyHtml = `
                <div class="trade-item buy">
                    <span class="trade-ticker">BND</span>
                    <span class="trade-action">Add ${this.formatCurrency(totalAssets * 0.05)}</span>
                    <span class="trade-reason">Increase fixed income allocation</span>
                </div>
                <div class="trade-item buy">
                    <span class="trade-ticker">VTI</span>
                    <span class="trade-action">Add ${this.formatCurrency(totalAssets * 0.03)}</span>
                    <span class="trade-reason">Diversify equity exposure</span>
                </div>
            `;
        }

        document.getElementById('buy-recommendations').innerHTML = buyHtml;
    }

    // ==================== SENSITIVITY ANALYSIS ====================

    runSensitivityAnalysis() {
        if (!this.profile) return;

        this.calculateEarlyRetirement();
        this.calculateLowerReturns();
        this.calculateHigherSpending();
        this.calculateSafeRetirementAge();
    }

    calculateEarlyRetirement() {
        const earlyAge = parseInt(document.getElementById('early-retire-age').value) || 63;
        const yearsLost = this.profile.retirementAge - earlyAge;
        const yearsToEarly = earlyAge - this.profile.currentAge;

        const earlyProjection = this.calculateFutureValueFromBalance(
            this.profile.totalAssets, 0.06, yearsToEarly
        );

        const normalProjection = this.calculateFutureValue(0.06).finalValue;
        const opportunityCost = normalProjection - earlyProjection;

        const earlyWithdrawal = earlyProjection * 0.04;
        const sustainable = (earlyWithdrawal + this.profile.socialSecurity) >= this.profile.annualSpending;

        document.getElementById('early-portfolio').textContent = this.formatCurrency(earlyProjection);
        document.getElementById('early-years-lost').textContent = `${yearsLost} years`;
        document.getElementById('early-cost').textContent = this.formatCurrency(opportunityCost);
        document.getElementById('early-sustainable').textContent = sustainable ? 'Sustainable' : 'May require adjustments';
        document.getElementById('early-sustainable').className = 'result-value ' + (sustainable ? 'positive' : 'negative');
    }

    calculateLowerReturns() {
        const lowerRate = (parseFloat(document.getElementById('lower-return-rate').value) || 5) / 100;

        const lowerProjection = this.calculateFutureValueFromBalance(
            this.profile.totalAssets, lowerRate, this.profile.yearsToRetirement
        );

        const normalProjection = this.calculateFutureValue(0.06).finalValue;
        const difference = normalProjection - lowerProjection;

        const lowerWithdrawal = lowerProjection * 0.04;
        const normalWithdrawal = normalProjection * 0.04;
        const incomeGap = normalWithdrawal - lowerWithdrawal;

        document.getElementById('lower-portfolio').textContent = this.formatCurrency(lowerProjection);
        document.getElementById('lower-difference').textContent = '-' + this.formatCurrency(difference);
        document.getElementById('lower-withdrawal').textContent = this.formatCurrency(lowerWithdrawal);
        document.getElementById('lower-gap').textContent = '-' + this.formatCurrency(incomeGap) + '/year';
    }

    calculateHigherSpending() {
        const higherMonthly = parseFloat(document.getElementById('higher-spending').value) || 5000;
        const higherAnnual = higherMonthly * 12;

        const projection = this.calculateFutureValue(0.06).finalValue;
        const neededAfterSS = higherAnnual - this.profile.socialSecurity;
        const requiredPortfolio = neededAfterSS / 0.04;
        const shortfall = requiredPortfolio - projection;

        // Calculate how long portfolio lasts
        let portfolio = projection;
        let years = 0;
        const growthInRetirement = 0.03;

        while (portfolio > 0 && years < 50) {
            portfolio = (portfolio - higherAnnual + this.profile.socialSecurity) * (1 + growthInRetirement);
            years++;
        }

        document.getElementById('higher-annual').textContent = this.formatCurrency(higherAnnual);
        document.getElementById('higher-required').textContent = this.formatCurrency(requiredPortfolio);
        document.getElementById('higher-shortfall').textContent = shortfall > 0 ?
            this.formatCurrency(shortfall) : this.formatCurrency(0) + ' (surplus)';
        document.getElementById('higher-shortfall').className = 'result-value ' + (shortfall > 0 ? 'negative' : 'positive');
        document.getElementById('higher-years').textContent = years >= 50 ? '50+ years' : `${years} years`;
    }

    calculateSafeRetirementAge() {
        const annualNeed = this.profile.annualSpending;
        const socialSecurity = this.profile.socialSecurity;
        const requiredFromPortfolio = annualNeed - socialSecurity;
        const requiredPortfolio = requiredFromPortfolio / 0.04;

        // Find earliest age where portfolio >= required
        let safeAge = this.profile.currentAge;

        for (let targetAge = this.profile.currentAge + 1; targetAge <= 75; targetAge++) {
            const years = targetAge - this.profile.currentAge;
            const projection = this.calculateFutureValueFromBalance(
                this.profile.totalAssets, 0.06, years
            );

            if (projection >= requiredPortfolio) {
                safeAge = targetAge;
                break;
            }
        }

        document.getElementById('safe-retire-age').textContent = safeAge;
        document.getElementById('safe-retire-details').textContent =
            `Based on ${this.formatCurrency(annualNeed)}/year spending and 4% withdrawal rule`;

        // Generate timeline
        this.generateRetireTimeline(requiredPortfolio);
    }

    generateRetireTimeline(requiredPortfolio) {
        const ages = [60, 62, 63, 65, 67, 70];
        const currentAge = this.profile.currentAge;

        let timelineHtml = '';

        ages.filter(age => age > currentAge).forEach(age => {
            const years = age - currentAge;
            const projection = this.calculateFutureValueFromBalance(
                this.profile.totalAssets, 0.06, years
            );
            const withdrawal = projection * 0.04;
            const totalIncome = withdrawal + this.profile.socialSecurity;
            const sustainable = projection >= requiredPortfolio;

            timelineHtml += `
                <div class="timeline-item ${sustainable ? 'sustainable' : 'not-sustainable'}">
                    <div class="timeline-age">Age ${age}</div>
                    <div class="timeline-details">
                        <span>Portfolio: ${this.formatCurrency(projection)}</span>
                        <span>Annual Income: ${this.formatCurrency(totalIncome)}</span>
                        <span class="timeline-status">${sustainable ? 'Sustainable' : 'Shortfall'}</span>
                    </div>
                </div>
            `;
        });

        document.getElementById('retire-timeline').innerHTML = timelineHtml;
    }

    // ==================== CHARTS ====================

    drawAllocationChart() {
        const ctx = document.getElementById('allocationChart');
        if (!ctx) return;

        if (this.charts.allocation) {
            this.charts.allocation.destroy();
        }

        this.charts.allocation = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Brokerage', '401(k)', 'Cash'],
                datasets: [{
                    data: [
                        this.profile.brokerageBalance,
                        this.profile.retirementBalance,
                        this.profile.cashReserves
                    ],
                    backgroundColor: ['#667eea', '#f5576c', '#10b981'],
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${this.formatCurrency(value)} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    drawSummaryGrowthChart() {
        const ctx = document.getElementById('growthChart');
        if (!ctx) return;

        if (this.charts.growth) {
            this.charts.growth.destroy();
        }

        const projection = this.calculateFutureValue(0.06);
        const labels = projection.yearlyData.map(d => `Age ${d.age}`);
        const portfolioValues = projection.yearlyData.map(d => d.endBalance);
        const cashValues = projection.yearlyData.map(d => d.cashBalance);

        // Calculate opportunity cost line (what cash would be worth if invested)
        const emergencyFundIdeal = this.profile.monthlySpending * 6;
        const opportunityCostValues = projection.yearlyData.map((d, index) => {
            const year = index + 1;
            const excessCash = Math.max(0, this.profile.cashReserves - emergencyFundIdeal);

            if (excessCash > 0) {
                // Calculate what the excess would be worth if invested at 7%
                const investmentReturn = 0.07;
                const cashReturn = this.shariaMode ? 0 : 0.02;

                // Start with excess cash growing at investment rate
                let investedValue = excessCash * Math.pow(1 + investmentReturn, year);
                // Add the emergency fund growing at cash rate
                let cashValue = emergencyFundIdeal * Math.pow(1 + cashReturn, year);

                // Add monthly savings that would have been invested
                let monthlySavings = this.profile.monthlySavings || 0;
                let savingsInvested = 0;
                for (let y = 1; y <= year; y++) {
                    savingsInvested += monthlySavings * 12;
                    monthlySavings *= 1.03; // 3% annual increase
                }
                savingsInvested *= Math.pow(1 + investmentReturn, year / 2); // Average growth

                return investedValue + cashValue + savingsInvested;
            }
            return null;
        });

        const datasets = [
            {
                label: 'Investment Portfolio',
                data: portfolioValues,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4,
                order: 2
            },
            {
                label: 'Cash Reserves',
                data: cashValues,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                order: 3
            }
        ];

        // Add opportunity cost line if there's excess cash
        if (opportunityCostValues.some(v => v !== null)) {
            datasets.push({
                label: 'If Excess Cash Was Invested',
                data: opportunityCostValues,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                order: 1
            });
        }

        this.charts.growth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
                        }
                    }
                }
            }
        });
    }

    drawSectorChart(sectorData) {
        const ctx = document.getElementById('sectorChart');
        if (!ctx) return;

        if (this.charts.sector) {
            this.charts.sector.destroy();
        }

        const colors = [
            '#667eea', '#f5576c', '#10b981', '#f59e0b', '#3b82f6',
            '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
        ];

        this.charts.sector = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: sectorData.map(s => s.name),
                datasets: [{
                    data: sectorData.map(s => s.value),
                    backgroundColor: colors.slice(0, sectorData.length),
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.label}: ${context.parsed}% (${this.formatCurrency(sectorData[context.dataIndex].value)})`;
                            }
                        }
                    }
                }
            }
        });
    }

    drawProjectionChart(projection) {
        const ctx = document.getElementById('projectionChart');
        if (!ctx) return;

        if (this.charts.projection) {
            this.charts.projection.destroy();
        }

        const labels = projection.yearlyData.map(d => `Year ${d.year}`);
        const balances = projection.yearlyData.map(d => d.endBalance);
        const contributions = projection.yearlyData.map(d => d.contribution);
        const cashBalances = projection.yearlyData.map(d => d.cashBalance);

        // Calculate opportunity cost line (what cash would be worth if invested)
        const emergencyFundIdeal = this.profile.monthlySpending * 6;
        const opportunityCostBalances = projection.yearlyData.map((d, index) => {
            const year = index + 1;
            const excessCash = Math.max(0, this.profile.cashReserves - emergencyFundIdeal);

            if (excessCash > 0) {
                // Calculate what the excess would be worth if invested at 7%
                const investmentReturn = 0.07;
                const cashReturn = this.shariaMode ? 0 : 0.02;

                // Start with excess cash growing at investment rate
                let investedValue = excessCash * Math.pow(1 + investmentReturn, year);
                // Add the emergency fund growing at cash rate
                let cashValue = emergencyFundIdeal * Math.pow(1 + cashReturn, year);

                // Add monthly savings that would have been invested
                let monthlySavings = this.profile.monthlySavings || 0;
                let savingsInvested = 0;
                for (let y = 1; y <= year; y++) {
                    savingsInvested += monthlySavings * 12;
                    monthlySavings *= 1.03; // 3% annual increase
                }
                savingsInvested *= Math.pow(1 + investmentReturn, year / 2); // Average growth

                return investedValue + cashValue + savingsInvested;
            }
            return null;
        });

        const datasets = [
            {
                label: 'Investment Portfolio',
                data: balances,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 2,
                type: 'line',
                yAxisID: 'y',
                order: 1
            },
            {
                label: 'Cash Reserves',
                data: cashBalances,
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: '#10b981',
                borderWidth: 2,
                type: 'line',
                yAxisID: 'y',
                order: 2
            },
            {
                label: 'Annual 401(k) Contribution',
                data: contributions,
                backgroundColor: 'rgba(245, 87, 108, 0.4)',
                borderColor: '#f5576c',
                borderWidth: 1,
                yAxisID: 'y1',
                order: 3
            }
        ];

        // Add opportunity cost line if there's excess cash
        if (opportunityCostBalances.some(v => v !== null)) {
            datasets.push({
                label: 'If Excess Cash Was Invested',
                data: opportunityCostBalances,
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                borderColor: '#f59e0b',
                borderWidth: 2,
                borderDash: [5, 5],
                type: 'line',
                yAxisID: 'y',
                order: 0
            });
        }

        this.charts.projection = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: {
                            callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
                        }
                    }
                }
            }
        });
    }

    drawCashFlowChart(cashFlowData) {
        const ctx = document.getElementById('cashflowChart');
        if (!ctx) return;

        if (this.charts.cashflow) {
            this.charts.cashflow.destroy();
        }

        const labels = cashFlowData.map(d => `Age ${d.age}`);
        const portfolios = cashFlowData.map(d => d.portfolio);
        const incomes = cashFlowData.map(d => d.totalIncome);
        const spendings = cashFlowData.map(d => d.spending);

        this.charts.cashflow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Portfolio Value',
                        data: portfolios,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Total Income',
                        data: incomes,
                        borderColor: '#10b981',
                        borderDash: [5, 5],
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Annual Spending',
                        data: spendings,
                        borderColor: '#f5576c',
                        borderDash: [5, 5],
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Portfolio Value' },
                        ticks: {
                            callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Annual Income/Spending' },
                        grid: { drawOnChartArea: false },
                        ticks: {
                            callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
                        }
                    }
                }
            }
        });
    }

    // ==================== DISPLAY MODE ==================

    setDisplayMode(mode) {
        this.displayMode = mode;
        localStorage.setItem('planner-display-mode', mode);

        // Update button states
        const simpleBtn = document.getElementById('simple-mode-btn');
        const advancedBtn = document.getElementById('advanced-mode-btn');

        if (mode === 'simple') {
            simpleBtn.classList.add('active');
            advancedBtn.classList.remove('active');
        } else {
            simpleBtn.classList.remove('active');
            advancedBtn.classList.add('active');
        }

        // Show/hide tabs based on mode
        this.updateTabsForMode();
    }

    updateTabsForMode() {
        const tabs = document.querySelectorAll('.nav-tab');

        if (this.displayMode === 'simple') {
            // Show: Overview, Portfolio, Planning, Transactions, Dividends
            // Hide: Projections, Retirement, Stress Test, Fixed Income, Rebalancing, Sensitivity, Performance, Expenses, Watchlist, Research
            const simpleTabs = ['overview', 'portfolio', 'planning', 'transactions', 'dividends'];
            tabs.forEach(tab => {
                const match = tab.getAttribute('onclick')?.match(/switchTab\('([^']+)'\)/);
                if (match) {
                    tab.style.display = simpleTabs.includes(match[1]) ? 'block' : 'none';
                }
            });
        } else {
            // Show all tabs
            tabs.forEach(tab => tab.style.display = 'block');
        }
    }

    // ==================== TRANSACTIONS METHODS ==================

    handleTransactionSubmit(e) {
        e.preventDefault();
        const form = e.target;

        const tickerSelect = form['txn-ticker'].value;
        const tickerCustom = form['txn-ticker-custom'].value.trim().toUpperCase();
        const ticker = tickerSelect || tickerCustom;

        if (!ticker) {
            UIUtils.showNotification('Please select or enter a ticker', 'error');
            return;
        }

        const transaction = {
            id: 'txn-' + Date.now(),
            ticker: ticker,
            accountType: form['txn-account'].value,
            type: form['txn-type'].value,
            date: form['txn-date'].value,
            shares: parseFloat(form['txn-shares'].value),
            pricePerShare: parseFloat(form['txn-price'].value),
            fees: parseFloat(form['txn-fees'].value) || 0,
            totalValue: 0,
            createdAt: new Date().toISOString()
        };
        transaction.totalValue = transaction.shares * transaction.pricePerShare + (transaction.type === 'buy' ? transaction.fees : -transaction.fees);

        this.transactions.push(transaction);
        this.saveData();
        this.renderTransactions();
        this.renderCostBasisCards();
        this.populateTransactionTickerDropdown();
        form.reset();
        this.setupDefaultDates();

        UIUtils.showNotification(`${transaction.type === 'buy' ? 'Buy' : 'Sell'} transaction recorded`, 'success', 2000);
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveData();
        this.renderTransactions();
        this.renderCostBasisCards();
        UIUtils.showNotification('Transaction deleted', 'success', 2000);
    }

    setTransactionFilter(filter) {
        this.transactionFilter = filter;
        document.querySelectorAll('#transactions-tab .filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        this.renderTransactions();
    }

    populateTransactionTickerDropdown() {
        const select = document.getElementById('txn-ticker');
        if (!select) return;

        const tickers = new Set();
        ['brokerage', 'retirement'].forEach(type => {
            (this.holdings[type] || []).forEach(h => {
                if (h.ticker) tickers.add(h.ticker);
            });
        });

        select.innerHTML = '<option value="">-- Select from holdings --</option>';
        [...tickers].sort().forEach(ticker => {
            select.innerHTML += `<option value="${Sanitizer.escapeHTML(ticker)}">${Sanitizer.escapeHTML(ticker)}</option>`;
        });
    }

    renderTransactions() {
        const tbody = document.getElementById('transactions-tbody');
        if (!tbody) return;

        let filtered = [...this.transactions];

        if (this.transactionFilter === 'buy') filtered = filtered.filter(t => t.type === 'buy');
        else if (this.transactionFilter === 'sell') filtered = filtered.filter(t => t.type === 'sell');
        else if (this.transactionFilter === 'brokerage') filtered = filtered.filter(t => t.accountType === 'brokerage');
        else if (this.transactionFilter === 'retirement') filtered = filtered.filter(t => t.accountType === 'retirement');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No transactions recorded</td></tr>';
            return;
        }

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        tbody.innerHTML = filtered.map(t => `
            <tr>
                <td>${this.formatDate(t.date)}</td>
                <td>${t.accountType === 'brokerage' ? 'Brokerage' : '401k/IRA'}</td>
                <td><strong>${Sanitizer.escapeHTML(t.ticker)}</strong></td>
                <td class="transaction-type-${t.type}">${t.type.toUpperCase()}</td>
                <td>${t.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                <td>${this.formatCurrency(t.pricePerShare)}</td>
                <td>${this.formatCurrency(t.totalValue)}</td>
                <td>${this.formatCurrency(t.fees || 0)}</td>
                <td><button class="btn-delete-small" onclick="planner.deleteTransaction('${t.id}')">Delete</button></td>
            </tr>
        `).join('');
    }

    // ==================== COST BASIS METHODS ==================

    calculateCostBasis(ticker, accountType) {
        const buys = this.transactions
            .filter(t => t.ticker === ticker && t.accountType === accountType && t.type === 'buy')
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const sells = this.transactions
            .filter(t => t.ticker === ticker && t.accountType === accountType && t.type === 'sell')
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // FIFO cost basis calculation
        const lots = buys.map(b => ({ ...b, remainingShares: b.shares }));
        let totalSoldCost = 0;
        let totalSoldShares = 0;

        for (const sell of sells) {
            let sharesToSell = sell.shares;
            while (sharesToSell > 0 && lots.length > 0) {
                const lot = lots.find(l => l.remainingShares > 0);
                if (!lot) break;

                const sharesFromLot = Math.min(sharesToSell, lot.remainingShares);
                totalSoldCost += sharesFromLot * lot.pricePerShare;
                totalSoldShares += sharesFromLot;
                lot.remainingShares -= sharesFromLot;
                sharesToSell -= sharesFromLot;
            }
        }

        const remainingLots = lots.filter(l => l.remainingShares > 0);
        const totalRemainingShares = remainingLots.reduce((sum, l) => sum + l.remainingShares, 0);
        const totalRemainingCost = remainingLots.reduce((sum, l) => sum + (l.remainingShares * l.pricePerShare), 0);
        const avgCostPerShare = totalRemainingShares > 0 ? totalRemainingCost / totalRemainingShares : 0;
        const totalFees = [...buys, ...sells].reduce((sum, t) => sum + (t.fees || 0), 0);

        return {
            totalShares: totalRemainingShares,
            totalCost: totalRemainingCost,
            avgCostPerShare,
            totalFees,
            lots: remainingLots
        };
    }

    calculateUnrealizedGains(ticker, accountType) {
        const basis = this.calculateCostBasis(ticker, accountType);
        if (basis.totalShares === 0) return null;

        // Find current price from holdings
        const holding = (this.holdings[accountType] || []).find(h => h.ticker === ticker);
        const currentPrice = holding ? (holding.price || 0) : 0;
        const currentValue = basis.totalShares * currentPrice;
        const gainLoss = currentValue - basis.totalCost;
        const gainLossPct = basis.totalCost > 0 ? (gainLoss / basis.totalCost) * 100 : 0;

        return {
            ...basis,
            currentPrice,
            currentValue,
            gainLoss,
            gainLossPct
        };
    }

    renderCostBasisCards() {
        const container = document.getElementById('cost-basis-cards');
        if (!container) return;

        // Get unique ticker+account combos from transactions
        const combos = new Map();
        this.transactions.forEach(t => {
            const key = `${t.ticker}-${t.accountType}`;
            if (!combos.has(key)) {
                combos.set(key, { ticker: t.ticker, accountType: t.accountType });
            }
        });

        if (combos.size === 0) {
            container.innerHTML = '<div class="empty-state">Record transactions to see cost basis analysis</div>';
            return;
        }

        let html = '<div class="cost-basis-grid">';
        for (const [, combo] of combos) {
            const data = this.calculateUnrealizedGains(combo.ticker, combo.accountType);
            if (!data || data.totalShares === 0) continue;

            const gainClass = data.gainLoss >= 0 ? 'positive' : 'negative';
            const gainSign = data.gainLoss >= 0 ? '+' : '';

            html += `
                <div class="cost-basis-card">
                    <div class="card-header">
                        <span class="ticker-badge">${Sanitizer.escapeHTML(combo.ticker)}</span>
                        <span class="account-badge">${combo.accountType === 'brokerage' ? 'Brokerage' : '401k/IRA'}</span>
                    </div>
                    <div class="card-metrics">
                        <div class="metric">
                            <span class="metric-label">Shares</span>
                            <span class="metric-value">${data.totalShares.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Avg Cost</span>
                            <span class="metric-value">${this.formatCurrency(data.avgCostPerShare)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Total Cost</span>
                            <span class="metric-value">${this.formatCurrency(data.totalCost)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Current Value</span>
                            <span class="metric-value">${this.formatCurrency(data.currentValue)}</span>
                        </div>
                    </div>
                    <div class="gain-loss">
                        <div class="gain-loss-value ${gainClass}">${gainSign}${this.formatCurrency(data.gainLoss)}</div>
                        <div class="gain-loss-pct">${gainSign}${data.gainLossPct.toFixed(2)}%</div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        container.innerHTML = html;
    }

    // ==================== PERFORMANCE TRACKING METHODS ==================

    handleSnapshotSubmit(e) {
        e.preventDefault();
        const form = e.target;

        const snapshot = {
            id: 'snap-' + Date.now(),
            date: form['snap-date'].value,
            brokerageValue: parseFloat(form['snap-brokerage'].value) || 0,
            retirementValue: parseFloat(form['snap-retirement'].value) || 0,
            cashValue: parseFloat(form['snap-cash'].value) || 0,
            contributions: 0,
            withdrawals: 0,
            createdAt: new Date().toISOString()
        };
        snapshot.totalValue = snapshot.brokerageValue + snapshot.retirementValue + snapshot.cashValue;

        this.performanceSnapshots.push(snapshot);
        this.saveData();
        this.renderPerformanceStats();
        this.renderSnapshotHistory();
        this.drawPortfolioValueChart();
        form.reset();
        this.setupDefaultDates();

        UIUtils.showNotification('Performance snapshot recorded', 'success', 2000);
    }

    autoCreatePerformanceSnapshot() {
        const today = new Date().toISOString().split('T')[0];

        // Don't create duplicate snapshots for the same day
        const existsToday = this.performanceSnapshots.some(s => s.date === today);
        if (existsToday) return;

        let brokerageValue = 0;
        let retirementValue = 0;

        ['brokerage', 'retirement'].forEach(type => {
            (this.holdings[type] || []).forEach(h => {
                const value = (h.shares || 0) * (h.price || 0);
                if (type === 'brokerage') brokerageValue += value;
                else retirementValue += value;
            });
        });

        const cashValue = (this.cashHoldings.brokerage || 0) + (this.cashHoldings.retirement || 0);

        // Only create snapshot if there's actual portfolio value
        if (brokerageValue === 0 && retirementValue === 0 && cashValue === 0) return;

        const snapshot = {
            id: 'snap-auto-' + Date.now(),
            date: today,
            brokerageValue,
            retirementValue,
            cashValue,
            contributions: 0,
            withdrawals: 0,
            totalValue: brokerageValue + retirementValue + cashValue,
            auto: true,
            createdAt: new Date().toISOString()
        };

        this.performanceSnapshots.push(snapshot);
        this.saveData();
        this.renderPerformanceStats();
        this.renderSnapshotHistory();
        this.drawPortfolioValueChart();
    }

    deleteSnapshot(id) {
        this.performanceSnapshots = this.performanceSnapshots.filter(s => s.id !== id);
        this.saveData();
        this.renderPerformanceStats();
        this.renderSnapshotHistory();
        this.drawPortfolioValueChart();
        UIUtils.showNotification('Snapshot deleted', 'success', 2000);
    }

    autoFillSnapshot() {
        let brokerageValue = 0;
        let retirementValue = 0;

        ['brokerage', 'retirement'].forEach(type => {
            (this.holdings[type] || []).forEach(h => {
                const value = (h.shares || 0) * (h.price || 0);
                if (type === 'brokerage') brokerageValue += value;
                else retirementValue += value;
            });
        });

        const cashValue = (this.cashHoldings.brokerage || 0) + (this.cashHoldings.retirement || 0);

        const dateInput = document.getElementById('snap-date');
        const brokInput = document.getElementById('snap-brokerage');
        const retInput = document.getElementById('snap-retirement');
        const cashInput = document.getElementById('snap-cash');

        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (brokInput) brokInput.value = brokerageValue.toFixed(2);
        if (retInput) retInput.value = retirementValue.toFixed(2);
        if (cashInput) cashInput.value = cashValue.toFixed(2);
    }

    calculatePerformanceMetrics() {
        const snapshots = [...this.performanceSnapshots].sort((a, b) => new Date(a.date) - new Date(b.date));
        if (snapshots.length < 2) {
            return { totalReturn: 0, ytd: 0, mtd: 0, bestDay: 0, worstDay: 0, cagr: 0 };
        }

        const first = snapshots[0];
        const last = snapshots[snapshots.length - 1];

        // Total return (simple)
        const totalContributions = snapshots.reduce((sum, s) => sum + (s.contributions || 0), 0);
        const totalWithdrawals = snapshots.reduce((sum, s) => sum + (s.withdrawals || 0), 0);
        const netFlows = totalContributions - totalWithdrawals;
        const totalReturn = first.totalValue > 0
            ? ((last.totalValue - first.totalValue - netFlows) / first.totalValue) * 100
            : 0;

        // YTD
        const yearStart = new Date().getFullYear() + '-01-01';
        const ytdSnapshots = snapshots.filter(s => s.date >= yearStart);
        let ytd = 0;
        if (ytdSnapshots.length >= 2) {
            const ytdFirst = ytdSnapshots[0];
            const ytdLast = ytdSnapshots[ytdSnapshots.length - 1];
            const ytdFlows = ytdSnapshots.reduce((sum, s) => sum + (s.contributions || 0) - (s.withdrawals || 0), 0);
            ytd = ytdFirst.totalValue > 0
                ? ((ytdLast.totalValue - ytdFirst.totalValue - ytdFlows) / ytdFirst.totalValue) * 100
                : 0;
        }

        // MTD
        const monthStart = new Date().toISOString().slice(0, 7) + '-01';
        const mtdSnapshots = snapshots.filter(s => s.date >= monthStart);
        let mtd = 0;
        if (mtdSnapshots.length >= 2) {
            const mtdFirst = mtdSnapshots[0];
            const mtdLast = mtdSnapshots[mtdSnapshots.length - 1];
            mtd = mtdFirst.totalValue > 0
                ? ((mtdLast.totalValue - mtdFirst.totalValue) / mtdFirst.totalValue) * 100
                : 0;
        }

        // Best / Worst day (period return between consecutive snapshots)
        let bestDay = 0;
        let worstDay = 0;
        for (let i = 1; i < snapshots.length; i++) {
            const prev = snapshots[i - 1];
            const curr = snapshots[i];
            if (prev.totalValue > 0) {
                const dayReturn = ((curr.totalValue - prev.totalValue) / prev.totalValue) * 100;
                if (dayReturn > bestDay) bestDay = dayReturn;
                if (dayReturn < worstDay) worstDay = dayReturn;
            }
        }

        // CAGR
        const daysDiff = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
        const years = daysDiff / 365.25;
        const cagr = years > 0 && first.totalValue > 0
            ? (Math.pow((last.totalValue - netFlows) / first.totalValue, 1 / years) - 1) * 100
            : 0;

        return { totalReturn, ytd, mtd, bestDay, worstDay, cagr };
    }

    renderPerformanceStats() {
        const metrics = this.calculatePerformanceMetrics();

        const setMetric = (id, value, isPercent = true) => {
            const el = document.getElementById(id);
            if (!el) return;
            const sign = value >= 0 ? '+' : '';
            el.textContent = isPercent ? `${sign}${value.toFixed(2)}%` : this.formatCurrency(value);
            el.className = 'stat-value ' + (value >= 0 ? 'positive' : 'negative');
        };

        setMetric('perf-total-return', metrics.totalReturn);
        setMetric('perf-ytd', metrics.ytd);
        setMetric('perf-mtd', metrics.mtd);
        setMetric('perf-best-day', metrics.bestDay);
        setMetric('perf-worst-day', metrics.worstDay);

        this.renderSnapshotHistory();
    }

    renderSnapshotHistory() {
        const tbody = document.getElementById('snapshots-tbody');
        if (!tbody) return;

        if (this.performanceSnapshots.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No snapshots recorded. Refresh prices to auto-generate.</td></tr>';
            return;
        }

        const sorted = [...this.performanceSnapshots].sort((a, b) => new Date(b.date) - new Date(a.date));

        tbody.innerHTML = sorted.map((s, i) => {
            // Calculate change from previous snapshot
            const next = sorted[i + 1]; // next in sorted (previous in time)
            let change = '';
            if (next) {
                const diff = s.totalValue - next.totalValue;
                const pct = next.totalValue > 0 ? (diff / next.totalValue) * 100 : 0;
                const sign = diff >= 0 ? '+' : '';
                const cls = diff >= 0 ? 'positive' : 'negative';
                change = `<span class="${cls}">${sign}${this.formatCurrency(diff)} (${sign}${pct.toFixed(1)}%)</span>`;
            } else {
                change = '--';
            }

            return `
                <tr>
                    <td>${this.formatDate(s.date)}${s.auto ? ' <small style="color:#9ca3af">(auto)</small>' : ''}</td>
                    <td>${this.formatCurrency(s.brokerageValue)}</td>
                    <td>${this.formatCurrency(s.retirementValue)}</td>
                    <td>${this.formatCurrency(s.cashValue || 0)}</td>
                    <td><strong>${this.formatCurrency(s.totalValue)}</strong></td>
                    <td>${change}</td>
                    <td><button class="btn-delete-small" onclick="planner.deleteSnapshot('${s.id}')">Delete</button></td>
                </tr>
            `;
        }).join('');
    }

    drawPortfolioValueChart(range) {
        let snapshots = [...this.performanceSnapshots].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Apply range filter
        if (range) {
            const r = range.toUpperCase();
            const now = new Date();
            let cutoff;
            if (r === 'YTD') cutoff = new Date(now.getFullYear(), 0, 1);
            else if (r === '1Y') { const d = new Date(); d.setFullYear(d.getFullYear() - 1); cutoff = d; }
            else if (r === '3Y') { const d = new Date(); d.setFullYear(d.getFullYear() - 3); cutoff = d; }
            // 'ALL' = no filter

            if (cutoff) {
                snapshots = snapshots.filter(s => new Date(s.date) >= cutoff);
            }

            // Update active button
            document.querySelectorAll('#performance-tab .range-btn').forEach(btn => btn.classList.remove('active'));
            event?.target?.classList.add('active');
        }

        const canvas = document.getElementById('portfolioValueChart');
        if (!canvas || snapshots.length === 0) return;

        if (this.charts.portfolioValue) {
            this.charts.portfolioValue.destroy();
        }

        this.charts.portfolioValue = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: snapshots.map(s => this.formatDate(s.date)),
                datasets: [{
                    label: 'Total Portfolio',
                    data: snapshots.map(s => s.totalValue),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        ticks: {
                            callback: value => '$' + (value / 1000).toFixed(0) + 'k'
                        }
                    }
                }
            }
        });
    }

    drawAccountPerformanceCharts() {
        const snapshots = [...this.performanceSnapshots].sort((a, b) => new Date(a.date) - new Date(b.date));
        const canvas = document.getElementById('accountComparisonChart');
        if (!canvas || snapshots.length === 0) return;

        if (this.charts.accountComparison) {
            this.charts.accountComparison.destroy();
        }

        this.charts.accountComparison = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: snapshots.map(s => this.formatDate(s.date)),
                datasets: [
                    {
                        label: 'Brokerage',
                        data: snapshots.map(s => s.brokerageValue),
                        borderColor: '#667eea',
                        tension: 0.3
                    },
                    {
                        label: 'Retirement',
                        data: snapshots.map(s => s.retirementValue),
                        borderColor: '#10b981',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        ticks: {
                            callback: value => '$' + (value / 1000).toFixed(0) + 'k'
                        }
                    }
                }
            }
        });
    }

    // ==================== ENHANCED DIVIDENDS METHODS ==================

    handleDividendSubmit(e) {
        e.preventDefault();
        const form = e.target;

        const symbol = form['dividend-symbol'].value.toUpperCase().trim();
        const accountType = form['dividend-account']?.value || 'brokerage';

        // Auto-fill shares from holdings if not provided
        let sharesOwned = parseFloat(form['dividend-shares-owned']?.value) || 0;
        if (sharesOwned === 0) {
            const holding = (this.holdings[accountType] || []).find(h => h.ticker === symbol);
            if (holding) sharesOwned = holding.shares || 0;
        }

        const dividend = {
            id: 'dividend-' + Date.now(),
            symbol: symbol,
            accountType: accountType,
            date: form['dividend-date'].value,
            amount: parseFloat(form['dividend-amount'].value),
            sharesOwned: sharesOwned,
            taxWithheld: parseFloat(form['dividend-tax']?.value) || 0,
            reinvested: form['dividend-drip'].checked,
            notes: form['dividend-notes']?.value || '',
            createdAt: new Date().toISOString()
        };

        // Calculate per-share dividend
        if (dividend.sharesOwned > 0) {
            dividend.dividendPerShare = dividend.amount / dividend.sharesOwned;
        }

        if (!this.dividends) this.dividends = [];
        this.dividends.push(dividend);

        // If DRIP enabled, auto-create a buy transaction
        if (dividend.reinvested) {
            this.handleDripReinvestment(dividend);
        }

        this.saveData();
        this.renderDividends();
        this.renderDividendYields();
        this.renderDividendCalendar();
        this.renderDividendStats();
        form.reset();
        this.setupDefaultDates();

        UIUtils.showNotification('Dividend recorded', 'success', 2000);
    }

    handleDripReinvestment(dividend) {
        // Find current price for the stock
        const holding = (this.holdings[dividend.accountType] || []).find(h => h.ticker === dividend.symbol);
        const pricePerShare = holding ? (holding.price || 0) : 0;

        if (pricePerShare > 0) {
            const sharesReinvested = dividend.amount / pricePerShare;
            const transaction = {
                id: 'txn-drip-' + Date.now(),
                ticker: dividend.symbol,
                accountType: dividend.accountType,
                type: 'buy',
                date: dividend.date,
                shares: sharesReinvested,
                pricePerShare: pricePerShare,
                fees: 0,
                totalValue: dividend.amount,
                drip: true,
                createdAt: new Date().toISOString()
            };
            this.transactions.push(transaction);
        }
    }

    deleteDividend(id) {
        this.dividends = this.dividends.filter(d => d.id !== id);
        this.saveData();
        this.renderDividends();
        this.renderDividendYields();
        this.renderDividendCalendar();
        this.renderDividendStats();
        UIUtils.showNotification('Dividend deleted', 'success', 2000);
    }

    renderDividends() {
        const container = document.getElementById('dividends-list');
        if (!container) return;

        if (!this.dividends || this.dividends.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No dividends recorded</p>';
            this.renderDividendStats();
            return;
        }

        const sorted = [...this.dividends].sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sorted.map(dividend => `
            <div class="dividend-item">
                <div class="dividend-symbol">${Sanitizer.escapeHTML(dividend.symbol)}</div>
                <div>${this.formatDate(dividend.date)}</div>
                <div style="font-size: 0.8rem; color: #6b7280;">${dividend.accountType === 'brokerage' ? 'Brokerage' : '401k/IRA'}</div>
                <div class="dividend-amount">${this.formatCurrency(dividend.amount)}</div>
                ${dividend.taxWithheld ? `<div style="font-size: 0.8rem; color: #ef4444;">Tax: ${this.formatCurrency(dividend.taxWithheld)}</div>` : ''}
                ${dividend.reinvested ? '<span class="drip-badge">DRIP</span>' : '<span>Received</span>'}
                <button type="button" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="planner.deleteDividend('${dividend.id}')">Delete</button>
            </div>
        `).join('');

        this.renderDividendStats();
    }

    renderDividendStats() {
        const now = new Date();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const dividends = this.dividends || [];

        // LTM (Last Twelve Months)
        const ltmDividends = dividends.filter(d => new Date(d.date) >= oneYearAgo);
        const ltmTotal = ltmDividends.reduce((sum, d) => sum + d.amount, 0);

        // YTD
        const ytdDividends = dividends.filter(d => new Date(d.date) >= yearStart);
        const ytdTotal = ytdDividends.reduce((sum, d) => sum + d.amount, 0);

        // This month
        const monthDividends = dividends.filter(d => new Date(d.date) >= monthStart);
        const monthTotal = monthDividends.reduce((sum, d) => sum + d.amount, 0);

        // Portfolio yield
        let portfolioValue = 0;
        ['brokerage', 'retirement'].forEach(type => {
            (this.holdings[type] || []).forEach(h => {
                portfolioValue += (h.shares || 0) * (h.price || 0);
            });
        });
        const portfolioYield = portfolioValue > 0 ? (ltmTotal / portfolioValue) * 100 : 0;

        // Annual income estimate (LTM as proxy)
        const annualEstimate = ltmTotal;

        // YoY Growth
        const twoYearsAgo = new Date(now);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const prevYearDividends = dividends.filter(d => {
            const date = new Date(d.date);
            return date >= twoYearsAgo && date < oneYearAgo;
        });
        const prevYearTotal = prevYearDividends.reduce((sum, d) => sum + d.amount, 0);
        const yoyGrowth = prevYearTotal > 0 ? ((ltmTotal - prevYearTotal) / prevYearTotal) * 100 : 0;

        // Update stats
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('dividends-total', this.formatCurrency(ltmTotal));
        setEl('dividends-ytd', this.formatCurrency(ytdTotal));
        setEl('dividends-month', this.formatCurrency(monthTotal));
        setEl('dividends-annual', this.formatCurrency(annualEstimate));
        setEl('portfolio-yield', portfolioYield.toFixed(2) + '%');

        const growthEl = document.getElementById('dividend-growth');
        if (growthEl) {
            if (prevYearTotal > 0) {
                const sign = yoyGrowth >= 0 ? '+' : '';
                growthEl.textContent = `${sign}${yoyGrowth.toFixed(1)}%`;
                growthEl.className = 'stat-value ' + (yoyGrowth >= 0 ? 'positive' : 'negative');
            } else {
                growthEl.textContent = '--';
                growthEl.className = 'stat-value';
            }
        }
    }

    calculateDividendYield(ticker, accountType) {
        const now = new Date();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const ltmDividends = (this.dividends || []).filter(d =>
            d.symbol === ticker && d.accountType === accountType && new Date(d.date) >= oneYearAgo
        );
        const ltmTotal = ltmDividends.reduce((sum, d) => sum + d.amount, 0);

        const holding = (this.holdings[accountType] || []).find(h => h.ticker === ticker);
        const holdingValue = holding ? (holding.shares || 0) * (holding.price || 0) : 0;
        const yield_ = holdingValue > 0 ? (ltmTotal / holdingValue) * 100 : 0;

        return { ltmTotal, holdingValue, yield: yield_, projected: ltmTotal };
    }

    renderDividendYields() {
        const tbody = document.getElementById('dividend-yield-body');
        if (!tbody) return;

        // Get unique symbol+account combos from dividends
        const combos = new Map();
        (this.dividends || []).forEach(d => {
            const key = `${d.symbol}-${d.accountType}`;
            if (!combos.has(key)) {
                combos.set(key, { symbol: d.symbol, accountType: d.accountType });
            }
        });

        if (combos.size === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Record dividends to see yield analysis</td></tr>';
            return;
        }

        let html = '';
        for (const [, combo] of combos) {
            const data = this.calculateDividendYield(combo.symbol, combo.accountType);
            const yieldClass = data.yield >= 3 ? 'yield-high' : data.yield >= 1 ? '' : 'yield-low';

            html += `
                <tr>
                    <td><strong>${Sanitizer.escapeHTML(combo.symbol)}</strong></td>
                    <td>${combo.accountType === 'brokerage' ? 'Brokerage' : '401k/IRA'}</td>
                    <td>${this.formatCurrency(data.ltmTotal)}</td>
                    <td>${this.formatCurrency(data.holdingValue)}</td>
                    <td class="${yieldClass}">${data.yield.toFixed(2)}%</td>
                    <td>${this.formatCurrency(data.projected)}</td>
                </tr>
            `;
        }
        tbody.innerHTML = html;
    }

    estimateDividendCalendar() {
        // Analyze payment frequency and project next 3 months
        const dividends = this.dividends || [];
        if (dividends.length === 0) return [];

        // Group by symbol + accountType
        const groups = {};
        dividends.forEach(d => {
            const key = `${d.symbol}-${d.accountType}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(d);
        });

        const projected = [];
        const now = new Date();

        for (const [key, divs] of Object.entries(groups)) {
            if (divs.length < 2) continue;

            // Sort by date and find average payment interval
            const sorted = [...divs].sort((a, b) => new Date(a.date) - new Date(b.date));
            const intervals = [];
            for (let i = 1; i < sorted.length; i++) {
                const diff = (new Date(sorted[i].date) - new Date(sorted[i - 1].date)) / (1000 * 60 * 60 * 24);
                intervals.push(diff);
            }
            const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
            const avgAmount = sorted.reduce((s, d) => s + d.amount, 0) / sorted.length;

            // Project next payments
            const lastDate = new Date(sorted[sorted.length - 1].date);
            let nextDate = new Date(lastDate);
            nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));

            const threeMonths = new Date(now);
            threeMonths.setMonth(threeMonths.getMonth() + 3);

            while (nextDate <= threeMonths) {
                if (nextDate >= now) {
                    projected.push({
                        symbol: divs[0].symbol,
                        accountType: divs[0].accountType,
                        date: nextDate.toISOString().split('T')[0],
                        estimatedAmount: avgAmount,
                        estimated: true
                    });
                }
                nextDate = new Date(nextDate);
                nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));
            }
        }

        return projected.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    renderDividendCalendar() {
        const container = document.getElementById('dividend-calendar');
        if (!container) return;

        const projected = this.estimateDividendCalendar();
        if (projected.length === 0) {
            container.innerHTML = '<div class="empty-state">Record dividends to see projected calendar</div>';
            return;
        }

        // Group by month
        const months = {};
        projected.forEach(p => {
            const monthKey = p.date.slice(0, 7);
            if (!months[monthKey]) months[monthKey] = [];
            months[monthKey].push(p);
        });

        let html = '';
        for (const [monthKey, payments] of Object.entries(months)) {
            const monthName = new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const monthTotal = payments.reduce((s, p) => s + p.estimatedAmount, 0);

            html += `
                <div class="calendar-month">
                    <div class="calendar-month-header">${monthName} <small style="float:right">~${this.formatCurrency(monthTotal)}</small></div>
                    ${payments.map(p => `
                        <div class="calendar-payment">
                            <span class="symbol">${Sanitizer.escapeHTML(p.symbol)}</span>
                            <span class="amount">~${this.formatCurrency(p.estimatedAmount)}</span>
                            <span class="est-label">est. ${this.formatDate(p.date)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        container.innerHTML = html;
    }

    // ==================== WATCHLIST METHODS ==================

    async handleWatchlistSubmit(e) {
        e.preventDefault();
        const form = e.target;

        const ticker = form['watchlist-ticker'].value.toUpperCase().trim();
        const name = form['watchlist-name'].value.trim();

        // Check for duplicates
        if (this.watchlist.some(w => w.ticker === ticker)) {
            UIUtils.showNotification(`${ticker} is already on your watchlist`, 'warning');
            return;
        }

        const item = {
            id: 'watch-' + Date.now(),
            ticker: ticker,
            name: name,
            sector: form['watchlist-sector'].value,
            rating: form['watchlist-rating'].value,
            targetBuyPrice: parseFloat(form['watchlist-target-price'].value) || null,
            priceAlertEnabled: form['watchlist-alert-toggle'].checked,
            currentPrice: null,
            priceHistory: [],
            notes: form['watchlist-notes']?.value || '',
            alertTriggered: false,
            createdAt: new Date().toISOString()
        };

        // Look up current price
        const result = await this.lookupStockPrice(ticker);
        if (result.success) {
            item.currentPrice = result.price;
            item.priceHistory.push({ date: new Date().toISOString().split('T')[0], price: result.price });
            if (!item.name || item.name === ticker) item.name = result.name;
            if (!item.sector) item.sector = result.sector;
        }

        this.watchlist.push(item);
        this.saveData();
        this.renderWatchlist();
        this.checkPriceAlerts();
        form.reset();

        UIUtils.showNotification(`${ticker} added to watchlist`, 'success', 2000);
    }

    deleteWatchlistItem(id) {
        this.watchlist = this.watchlist.filter(w => w.id !== id);
        this.saveData();
        this.renderWatchlist();
        this.checkPriceAlerts();
        UIUtils.showNotification('Removed from watchlist', 'success', 2000);
    }

    setWatchlistFilter(filter) {
        this.watchlistFilter = filter;
        document.querySelectorAll('#watchlist-tab .filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        this.renderWatchlist();
    }

    async refreshWatchlistPrice(id) {
        const item = this.watchlist.find(w => w.id === id);
        if (!item) return;

        const result = await this.lookupStockPrice(item.ticker);
        if (result.success) {
            item.currentPrice = result.price;
            item.priceHistory.push({ date: new Date().toISOString().split('T')[0], price: result.price });
            item.lastUpdated = new Date().toISOString();
            this.saveData();
            this.renderWatchlist();
            this.checkPriceAlerts();
        } else {
            UIUtils.showNotification(`Failed to fetch price for ${item.ticker}`, 'error');
        }
    }

    async refreshWatchlistPrices() {
        UIUtils.showNotification('Refreshing watchlist prices...', 'info', 3000);

        for (const item of this.watchlist) {
            const result = await this.lookupStockPrice(item.ticker);
            if (result.success) {
                item.currentPrice = result.price;
                const today = new Date().toISOString().split('T')[0];
                // Avoid duplicate entries for same day
                const lastEntry = item.priceHistory[item.priceHistory.length - 1];
                if (!lastEntry || lastEntry.date !== today) {
                    item.priceHistory.push({ date: today, price: result.price });
                } else {
                    lastEntry.price = result.price;
                }
                item.lastUpdated = new Date().toISOString();
            }
            await new Promise(resolve => setTimeout(resolve, 250));
        }

        this.saveData();
        this.renderWatchlist();
        this.checkPriceAlerts();
        UIUtils.showNotification('Watchlist prices updated', 'success', 2000);
    }

    async lookupWatchlistStock() {
        const tickerInput = document.getElementById('watchlist-ticker');
        const nameInput = document.getElementById('watchlist-name');
        if (!tickerInput?.value) {
            UIUtils.showNotification('Enter a ticker first', 'warning');
            return;
        }

        const result = await this.lookupStockPrice(tickerInput.value.toUpperCase().trim());
        if (result.success) {
            if (nameInput && (!nameInput.value || nameInput.value === tickerInput.value)) {
                nameInput.value = result.name;
            }
            UIUtils.showNotification(`${tickerInput.value.toUpperCase()}: $${result.price.toFixed(2)}`, 'success', 3000);
        } else {
            UIUtils.showNotification(`Lookup failed: ${result.error}`, 'error');
        }
    }

    checkPriceAlerts() {
        const triggered = this.watchlist.filter(w => {
            if (!w.priceAlertEnabled || !w.targetBuyPrice || !w.currentPrice) return false;
            return w.currentPrice <= w.targetBuyPrice;
        });

        // Update stats
        const countEl = document.getElementById('watchlist-count');
        const alertsEl = document.getElementById('watchlist-alerts-active');
        const triggeredEl = document.getElementById('watchlist-alerts-triggered');
        const discountEl = document.getElementById('watchlist-avg-discount');

        if (countEl) countEl.textContent = this.watchlist.length;
        if (alertsEl) alertsEl.textContent = this.watchlist.filter(w => w.priceAlertEnabled).length;
        if (triggeredEl) triggeredEl.textContent = triggered.length;

        // Calculate average discount to target
        const withTargets = this.watchlist.filter(w => w.targetBuyPrice && w.currentPrice);
        if (discountEl) {
            if (withTargets.length > 0) {
                const avgDiscount = withTargets.reduce((sum, w) => {
                    return sum + ((w.currentPrice - w.targetBuyPrice) / w.targetBuyPrice) * 100;
                }, 0) / withTargets.length;
                const sign = avgDiscount >= 0 ? '+' : '';
                discountEl.textContent = `${sign}${avgDiscount.toFixed(1)}%`;
            } else {
                discountEl.textContent = '--';
            }
        }

        // Render alert banner
        const banner = document.getElementById('watchlist-alerts-banner');
        const alertList = document.getElementById('triggered-alerts-list');
        if (banner && alertList) {
            if (triggered.length > 0) {
                banner.style.display = 'block';
                alertList.innerHTML = triggered.map(w => `
                    <div class="alert-item">
                        <div class="alert-info">
                            <span class="alert-ticker">${Sanitizer.escapeHTML(w.ticker)} - ${Sanitizer.escapeHTML(w.name)}</span>
                            <span class="alert-detail">Current: $${w.currentPrice.toFixed(2)} | Target: $${w.targetBuyPrice.toFixed(2)}</span>
                        </div>
                        <div class="alert-actions">
                            <button class="btn-alert-action btn-alert-add" onclick="planner.moveToHoldings('${w.id}')">Add to Holdings</button>
                            <button class="btn-alert-action btn-alert-dismiss" onclick="planner.dismissAlert('${w.id}')">Dismiss</button>
                        </div>
                    </div>
                `).join('');
            } else {
                banner.style.display = 'none';
            }
        }
    }

    dismissAlert(id) {
        const item = this.watchlist.find(w => w.id === id);
        if (item) {
            item.priceAlertEnabled = false;
            this.saveData();
            this.renderWatchlist();
            this.checkPriceAlerts();
        }
    }

    moveToHoldings(watchlistId) {
        const item = this.watchlist.find(w => w.id === watchlistId);
        if (!item) return;

        const accountType = prompt('Which account? (brokerage / retirement)', 'brokerage');
        if (!accountType || !['brokerage', 'retirement'].includes(accountType)) return;

        const shares = prompt('How many shares?', '1');
        if (!shares || isNaN(parseFloat(shares))) return;

        const numShares = parseFloat(shares);
        const price = item.currentPrice || 0;

        // Add as holding
        this.holdings[accountType].push({
            ticker: item.ticker,
            name: item.name,
            shares: numShares,
            price: price,
            sector: item.sector || 'Diversified',
            lastUpdated: new Date().toISOString()
        });

        // Create buy transaction
        const transaction = {
            id: 'txn-' + Date.now(),
            ticker: item.ticker,
            accountType: accountType,
            type: 'buy',
            date: new Date().toISOString().split('T')[0],
            shares: numShares,
            pricePerShare: price,
            fees: 0,
            totalValue: numShares * price,
            createdAt: new Date().toISOString()
        };
        this.transactions.push(transaction);

        // Remove from watchlist
        this.watchlist = this.watchlist.filter(w => w.id !== watchlistId);

        this.saveData();
        this.renderHoldings(accountType);
        this.renderTransactions();
        this.renderCostBasisCards();
        this.renderWatchlist();
        this.checkPriceAlerts();
        this.populateTransactionTickerDropdown();

        UIUtils.showNotification(`${item.ticker} added to ${accountType} holdings`, 'success', 3000);
    }

    renderWatchlist() {
        const tbody = document.getElementById('watchlist-body');
        if (!tbody) return;

        let filtered = [...this.watchlist];

        if (this.watchlistFilter === 'alerts') filtered = filtered.filter(w => w.priceAlertEnabled);
        else if (this.watchlistFilter === 'triggered') filtered = filtered.filter(w =>
            w.priceAlertEnabled && w.targetBuyPrice && w.currentPrice && w.currentPrice <= w.targetBuyPrice
        );

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Add stocks to your watchlist to monitor prices</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(w => {
            const discount = (w.targetBuyPrice && w.currentPrice)
                ? ((w.currentPrice - w.targetBuyPrice) / w.targetBuyPrice) * 100
                : null;
            const discountClass = discount !== null ? (discount <= 0 ? 'discount-positive' : 'discount-negative') : '';
            const isTriggered = w.priceAlertEnabled && w.targetBuyPrice && w.currentPrice && w.currentPrice <= w.targetBuyPrice;

            const ratingStars = w.rating ? '★'.repeat(parseInt(w.rating)) : '-';
            const alertBadge = !w.priceAlertEnabled ? '<span class="alert-badge off">Off</span>'
                : isTriggered ? '<span class="alert-badge triggered">Triggered!</span>'
                : '<span class="alert-badge active">Active</span>';

            return `
                <tr>
                    <td><strong>${Sanitizer.escapeHTML(w.ticker)}</strong></td>
                    <td>${Sanitizer.escapeHTML(w.name)}</td>
                    <td>${w.currentPrice ? '$' + w.currentPrice.toFixed(2) : '--'}</td>
                    <td>${w.targetBuyPrice ? '$' + w.targetBuyPrice.toFixed(2) : '--'}</td>
                    <td class="${discountClass}">${discount !== null ? (discount <= 0 ? '' : '+') + discount.toFixed(1) + '%' : '--'}</td>
                    <td class="watchlist-rating">${ratingStars}</td>
                    <td>${alertBadge}</td>
                    <td>
                        <div class="watchlist-actions">
                            <button class="btn-watchlist-action" onclick="planner.refreshWatchlistPrice('${w.id}')" title="Refresh price">↻</button>
                            <button class="btn-watchlist-action buy" onclick="planner.moveToHoldings('${w.id}')" title="Add to holdings">Buy</button>
                            <button class="btn-watchlist-action delete" onclick="planner.deleteWatchlistItem('${w.id}')" title="Remove">×</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==================== EXPENSES METHODS ==================

    handleExpenseSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const expense = {
            id: 'expense-' + Date.now(),
            date: form['expense-date'].value,
            category: form['expense-category'].value,
            amount: parseFloat(form['expense-amount'].value),
            description: form['expense-description'].value,
            createdAt: new Date().toISOString()
        };

        if (!this.expenses) this.expenses = [];
        this.expenses.push(expense);
        this.saveData();
        this.renderExpenses();
        form.reset();
        this.setupDefaultDates();

        UIUtils.showNotification('Expense added', 'success', 2000);
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(e => e.id !== id);
        this.saveData();
        this.renderExpenses();
        UIUtils.showNotification('Expense deleted', 'success', 2000);
    }

    renderExpenses() {
        const container = document.getElementById('expenses-list');
        if (!container) return;

        if (!this.expenses || this.expenses.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No expenses recorded</p>';
            return;
        }

        const monthExpenses = this.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            const now = new Date();
            return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        });

        if (monthExpenses.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No expenses this month</p>';
            return;
        }

        const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

        container.innerHTML = `
            <div style="margin-bottom: 1rem; padding: 1rem; background: #f9fafb; border-radius: 8px;">
                <strong>Total this month:</strong> ${this.formatCurrency(total)}
            </div>
            ${monthExpenses.map(expense => `
                <div class="expense-item">
                    <div class="expense-date">${this.formatDate(expense.date)}</div>
                    <div class="expense-category">${expense.category}</div>
                    <div>${expense.description || '-'}</div>
                    <div class="expense-amount">${this.formatCurrency(expense.amount)}</div>
                    <button type="button" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="planner.deleteExpense('${expense.id}')">Delete</button>
                </div>
            `).join('')}
        `;
    }

    handleBudgetSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const budget = {
            id: 'budget-' + Date.now(),
            category: form['budget-category'].value,
            limit: parseFloat(form['budget-limit'].value),
            month: new Date().toISOString().slice(0, 7),
            createdAt: new Date().toISOString()
        };

        if (!this.budgets) this.budgets = [];
        this.budgets.push(budget);
        this.saveData();
        this.renderBudgets();
        form.reset();

        UIUtils.showNotification('Budget set', 'success', 2000);
    }

    deleteBudget(id) {
        this.budgets = this.budgets.filter(b => b.id !== id);
        this.saveData();
        this.renderBudgets();
        UIUtils.showNotification('Budget deleted', 'success', 2000);
    }

    renderBudgets() {
        const container = document.getElementById('budgets-list');
        if (!container) return;

        if (!this.budgets) this.budgets = [];

        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthBudgets = this.budgets.filter(b => b.month === currentMonth);

        if (monthBudgets.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No budgets set for this month</p>';
            return;
        }

        container.innerHTML = monthBudgets.map(budget => {
            const spent = (this.expenses || [])
                .filter(e => e.category === budget.category && e.date.startsWith(currentMonth))
                .reduce((sum, e) => sum + e.amount, 0);

            const percent = Math.min(100, (spent / budget.limit) * 100);
            const status = spent > budget.limit ? 'Over budget' : 'On track';

            return `
                <div style="margin-bottom: 1rem; padding: 1rem; background: white; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong>${budget.category}</strong>
                        <span>${this.formatCurrency(spent)} / ${this.formatCurrency(budget.limit)}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;">
                        <div style="height: 100%; width: ${percent}%; background: ${spent > budget.limit ? '#ef4444' : '#10b981'};"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <small style="color: ${spent > budget.limit ? '#ef4444' : '#10b981'};">${status}</small>
                        <button type="button" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="planner.deleteBudget('${budget.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== RESEARCH METHODS ==================

    handleResearchSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const research = {
            id: 'research-' + Date.now(),
            symbol: form['research-symbol'].value.toUpperCase(),
            name: form['research-name'].value,
            type: form['research-type'].value,
            rating: form['research-rating'].value,
            sector: form['research-sector'].value,
            notes: form['research-notes'].value,
            createdAt: new Date().toISOString()
        };

        if (!this.research) this.research = [];
        this.research.push(research);
        this.saveData();
        this.renderResearch();
        form.reset();

        UIUtils.showNotification('Research entry saved', 'success', 2000);
    }

    deleteResearch(id) {
        this.research = this.research.filter(r => r.id !== id);
        this.saveData();
        this.renderResearch();
        UIUtils.showNotification('Research deleted', 'success', 2000);
    }

    setResearchFilter(filter) {
        this.researchFilter = filter;

        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        this.renderResearch();
    }

    renderResearch() {
        const container = document.getElementById('research-list');
        if (!container) return;

        if (!this.research) this.research = [];

        let entries = this.research;

        if (this.researchFilter !== 'all') {
            entries = entries.filter(r => r.type === this.researchFilter);
        }

        if (entries.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No research entries</p>';
            return;
        }

        container.innerHTML = entries.map(research => `
            <div class="research-card">
                <div class="research-header">
                    <div>
                        <div class="research-symbol">${research.symbol}</div>
                        <div class="research-name">${research.name}</div>
                    </div>
                    <button type="button" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="planner.deleteResearch('${research.id}')">×</button>
                </div>
                ${research.rating ? `<div class="research-rating">${research.rating}</div>` : ''}
                ${research.sector ? `<small>${research.sector}</small>` : ''}
                ${research.notes ? `<div class="research-notes">${research.notes}</div>` : ''}
            </div>
        `).join('');
    }

    // ==================== MONTE CARLO SIMULATION ====================

    /**
     * Run Monte Carlo simulation for current profile
     */
    runMonteCarloSimulation(iterations = 1000) {
        if (!this.profile) {
            UIUtils.showNotification('Please complete your profile first', 'warning');
            return null;
        }

        try {
            UIUtils.showNotification('Running Monte Carlo simulation...', 'info', 1000);
            
            const engine = new MonteCarloEngine(this.profile);
            const results = engine.runSimulation(iterations);
            
            this.monteCarloResults = results;
            this.renderMonteCarloResults(results);
            
            UIUtils.showNotification(`Simulation complete: ${(results.successRate * 100).toFixed(0)}% success rate`, 'success');
            
            return results;
        } catch (error) {
            console.error('Monte Carlo simulation error:', error);
            UIUtils.showNotification('Simulation failed. Please try again.', 'error');
            return null;
        }
    }

    /**
     * Render Monte Carlo results in UI
     */
    renderMonteCarloResults(results) {
        if (!results) return;

        // Update success rate display (if element exists)
        const successRateElement = document.getElementById('success-rate');
        if (successRateElement) {
            const percentage = Math.round(results.successRate * 100);
            successRateElement.textContent = `${percentage}%`;
            
            // Color coding
            successRateElement.className = 'success-rate';
            if (percentage >= 90) {
                successRateElement.classList.add('excellent');
            } else if (percentage >= 75) {
                successRateElement.classList.add('good');
            } else if (percentage >= 50) {
                successRateElement.classList.add('fair');
            } else {
                successRateElement.classList.add('poor');
            }
        }

        // Update percentiles display (if elements exist)
        const percentiles = results.percentiles;
        if (document.getElementById('mc-p10')) {
            document.getElementById('mc-p10').textContent = this.formatCurrency(percentiles.p10);
            document.getElementById('mc-p25').textContent = this.formatCurrency(percentiles.p25);
            document.getElementById('mc-p50').textContent = this.formatCurrency(percentiles.p50);
            document.getElementById('mc-p75').textContent = this.formatCurrency(percentiles.p75);
            document.getElementById('mc-p90').textContent = this.formatCurrency(percentiles.p90);
        }

        // Show percentile analysis section
        const percentileSection = document.getElementById('percentile-analysis');
        if (percentileSection) {
            percentileSection.style.display = 'block';
        }

        // Update confidence ranges
        const range50Element = document.getElementById('confidence-range-50');
        const range80Element = document.getElementById('confidence-range-80');
        
        if (range50Element) {
            range50Element.textContent = `${this.formatCurrency(percentiles.p25)} - ${this.formatCurrency(percentiles.p75)}`;
        }
        
        if (range80Element) {
            range80Element.textContent = `${this.formatCurrency(percentiles.p10)} - ${this.formatCurrency(percentiles.p90)}`;
        }

        // Draw distribution chart
        this.drawDistributionChart(results);

        // Enhanced logging with percentile analysis
        console.log('Monte Carlo Results:', {
            ...results,
            analysis: {
                successRate: `${(results.successRate * 100).toFixed(1)}%`,
                medianPortfolio: this.formatCurrency(percentiles.p50),
                worstCase: this.formatCurrency(percentiles.p10),
                bestCase: this.formatCurrency(percentiles.p90),
                confidenceRange: `${this.formatCurrency(percentiles.p25)} - ${this.formatCurrency(percentiles.p75)}`
            }
        });
    }

    /**
     * Draw distribution chart showing Monte Carlo outcomes
     */
    drawDistributionChart(results) {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts && this.charts.distribution) {
            this.charts.distribution.destroy();
        }

        if (!this.charts) this.charts = {};

        // Get portfolio values and create histogram
        const portfolioValues = results.portfolioValues || 
                               results.rawResults?.map(r => r.finalPortfolio) || 
                               Array.from({length: 1000}, () => Math.random() * 2000000 + 1000000); // Fallback data
        
        // Create histogram bins
        const numBins = 20;
        const min = Math.min(...portfolioValues);
        const max = Math.max(...portfolioValues);
        const binWidth = (max - min) / numBins;
        
        const bins = Array(numBins).fill(0);
        const binLabels = [];
        
        // Count values in each bin
        portfolioValues.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
            bins[binIndex]++;
        });
        
        // Create bin labels (in millions for readability)
        for (let i = 0; i < numBins; i++) {
            const binStart = min + i * binWidth;
            binLabels.push(`$${(binStart / 1000000).toFixed(1)}M`);
        }

        // Get percentiles for confidence bands
        const percentiles = results.percentiles;
        const total = portfolioValues.length;

        // Color bins based on confidence intervals
        const backgroundColors = bins.map((count, index) => {
            const binStart = min + index * binWidth;
            const binEnd = binStart + binWidth;
            const binMiddle = (binStart + binEnd) / 2;
            
            if (binMiddle >= percentiles.p25 && binMiddle <= percentiles.p75) {
                return 'rgba(102, 126, 234, 0.8)'; // Core confidence band (blue)
            } else if (binMiddle >= percentiles.p10 && binMiddle <= percentiles.p90) {
                return 'rgba(102, 126, 234, 0.5)'; // Extended confidence band (light blue)
            } else {
                return 'rgba(156, 163, 175, 0.4)'; // Outside confidence bands (gray)
            }
        });

        const borderColors = bins.map((count, index) => {
            const binStart = min + index * binWidth;
            const binEnd = binStart + binWidth;
            const binMiddle = (binStart + binEnd) / 2;
            
            if (binMiddle >= percentiles.p25 && binMiddle <= percentiles.p75) {
                return '#667eea';
            } else if (binMiddle >= percentiles.p10 && binMiddle <= percentiles.p90) {
                return '#9ca3af';
            } else {
                return '#d1d5db';
            }
        });

        this.charts.distribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: binLabels,
                datasets: [{
                    label: 'Number of Simulations',
                    data: bins,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const percentage = ((context.parsed.y / total) * 100).toFixed(1);
                                return `${context.parsed.y} simulations (${percentage}%)`;
                            },
                            afterLabel: (context) => {
                                const binStart = min + context.dataIndex * binWidth;
                                const binEnd = binStart + binWidth;
                                return `Range: ${this.formatCurrency(binStart)} - ${this.formatCurrency(binEnd)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Portfolio Value at Retirement'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Simulations'
                        },
                        ticks: {
                            callback: (value) => Math.round(value)
                        }
                    }
                }
            }
        });
    }

    /**
     * Run Monte Carlo simulation for current profile
     */
    runMonteCarloSimulation(iterations = 1000) {
        if (!this.profile) {
            UIUtils.showNotification('Please complete your profile first', 'warning');
            return null;
        }

        try {
            UIUtils.showNotification('Running Monte Carlo simulation...', 'info', 1000);
            
            const engine = new MonteCarloEngine(this.profile);
            const results = engine.runSimulation(iterations);
            
            this.monteCarloResults = results;
            this.renderMonteCarloResults(results);
            
            UIUtils.showNotification(`Simulation complete: ${(results.successRate * 100).toFixed(0)}% success rate`, 'success');
            
            return results;
        } catch (error) {
            console.error('Monte Carlo simulation error:', error);
            UIUtils.showNotification('Simulation failed. Please try again.', 'error');
            return null;
        }
    }

    /**
     * Render Monte Carlo results in UI
     */
    renderMonteCarloResults(results) {
        if (!results) return;

        // Update success rate display (if element exists)
        const successRateElement = document.getElementById('success-rate');
        if (successRateElement) {
            const percentage = Math.round(results.successRate * 100);
            successRateElement.textContent = `${percentage}%`;
            
            // Color coding
            successRateElement.className = 'success-rate';
            if (percentage >= 90) {
                successRateElement.classList.add('excellent');
            } else if (percentage >= 75) {
                successRateElement.classList.add('good');
            } else if (percentage >= 50) {
                successRateElement.classList.add('fair');
            } else {
                successRateElement.classList.add('poor');
            }
        }

        // Update percentiles display (if elements exist)
        const percentiles = results.percentiles;
        if (document.getElementById('mc-p10')) {
            document.getElementById('mc-p10').textContent = this.formatCurrency(percentiles.p10);
            document.getElementById('mc-p25').textContent = this.formatCurrency(percentiles.p25);
            document.getElementById('mc-p50').textContent = this.formatCurrency(percentiles.p50);
            document.getElementById('mc-p75').textContent = this.formatCurrency(percentiles.p75);
            document.getElementById('mc-p90').textContent = this.formatCurrency(percentiles.p90);
        }

        console.log('Monte Carlo Results:', results);
    }

    // ==================== SCENARIO MANAGEMENT ====================

    /**
     * Save current profile as a named scenario
     */
    saveScenario(name) {
        if (!this.profile) {
            UIUtils.showNotification('Please complete your profile first', 'warning');
            return false;
        }

        if (!name || name.trim() === '') {
            UIUtils.showNotification('Please provide a scenario name', 'warning');
            return false;
        }

        try {
            // Initialize scenarios if not exists
            if (!this.scenarios) {
                this.scenarios = [];
            }

            // Check if name already exists
            const existingIndex = this.scenarios.findIndex(s => s.name === name);
            
            const scenario = {
                id: existingIndex >= 0 ? this.scenarios[existingIndex].id : 'scenario-' + Date.now(),
                name: name,
                profile: { ...this.profile }, // Deep copy
                holdings: { 
                    brokerage: [...this.holdings.brokerage],
                    retirement: [...this.holdings.retirement]
                },
                cashHoldings: { ...this.cashHoldings },
                marketPreset: this.marketPreset || 'moderate',
                createdAt: existingIndex >= 0 ? this.scenarios[existingIndex].createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (existingIndex >= 0) {
                // Update existing scenario
                this.scenarios[existingIndex] = scenario;
                UIUtils.showNotification(`Scenario "${name}" updated`, 'success');
            } else {
                // Add new scenario
                this.scenarios.push(scenario);
                UIUtils.showNotification(`Scenario "${name}" saved`, 'success');
            }

            this.saveData();
            this.renderScenariosList();
            return true;
        } catch (error) {
            console.error('Error saving scenario:', error);
            UIUtils.showNotification('Failed to save scenario', 'error');
            return false;
        }
    }

    /**
     * Load a scenario by ID
     */
    loadScenario(scenarioId) {
        if (!this.scenarios) return false;

        const scenario = this.scenarios.find(s => s.id === scenarioId);
        if (!scenario) {
            UIUtils.showNotification('Scenario not found', 'error');
            return false;
        }

        try {
            // Load scenario data
            this.profile = { ...scenario.profile };
            this.holdings = {
                brokerage: [...scenario.holdings.brokerage],
                retirement: [...scenario.holdings.retirement]
            };
            this.cashHoldings = { ...scenario.cashHoldings };
            this.marketPreset = scenario.marketPreset || 'moderate';

            // Update UI
            this.populateProfileForm();
            this.renderHoldings('brokerage');
            this.renderHoldings('retirement');
            this.updateCashDisplay();
            
            // Set market preset
            if (this.marketPreset) {
                this.setMarketPreset(this.marketPreset);
            }

            // Run analysis
            this.runFullAnalysis();

            UIUtils.showNotification(`Loaded scenario "${scenario.name}"`, 'success');
            return true;
        } catch (error) {
            console.error('Error loading scenario:', error);
            UIUtils.showNotification('Failed to load scenario', 'error');
            return false;
        }
    }

    /**
     * Duplicate a scenario
     */
    duplicateScenario(scenarioId) {
        if (!this.scenarios) return false;

        const scenario = this.scenarios.find(s => s.id === scenarioId);
        if (!scenario) return false;

        const newName = `${scenario.name} (Copy)`;
        
        // Load the scenario first
        this.loadScenario(scenarioId);
        
        // Then save it with new name
        return this.saveScenario(newName);
    }

    /**
     * Delete a scenario
     */
    deleteScenario(scenarioId) {
        if (!this.scenarios) return false;

        const index = this.scenarios.findIndex(s => s.id === scenarioId);
        if (index === -1) return false;

        const scenarioName = this.scenarios[index].name;
        this.scenarios.splice(index, 1);
        
        this.saveData();
        this.renderScenariosList();
        
        UIUtils.showNotification(`Deleted scenario "${scenarioName}"`, 'success');
        return true;
    }

    /**
     * Render scenarios list (placeholder - would need UI element)
     */
    renderScenariosList() {
        // This would populate a scenarios dropdown/list in the UI
        // For now, just log available scenarios
        if (this.scenarios && this.scenarios.length > 0) {
            console.log('Available scenarios:', this.scenarios.map(s => ({
                id: s.id,
                name: s.name,
                updated: s.updatedAt
            })));
        }
    }

    /**
     * Export profile and scenarios as JSON
     */
    exportToJSON() {
        try {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                profile: this.profile,
                holdings: this.holdings,
                cashHoldings: this.cashHoldings,
                scenarios: this.scenarios || [],
                marketPreset: this.marketPreset || 'moderate',
                shariaMode: this.shariaMode
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const filename = `financial_planner_backup_${new Date().toISOString().slice(0, 10)}.json`;
            
            this.downloadFile(jsonString, filename, 'application/json');
            UIUtils.showNotification('Data exported successfully', 'success');
            
            return exportData;
        } catch (error) {
            console.error('Export error:', error);
            UIUtils.showNotification('Export failed', 'error');
            return null;
        }
    }

    /**
     * Import profile and scenarios from JSON
     */
    async importFromJSON(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            // Validate import data structure
            if (!importData.version || !importData.profile) {
                throw new Error('Invalid backup file format');
            }

            // Confirm before overwriting data
            const confirmed = await UIUtils.confirmAction(
                'This will replace all current data with the imported backup. Continue?'
            );
            
            if (!confirmed) return false;

            // Import data
            this.profile = importData.profile;
            this.holdings = importData.holdings || { brokerage: [], retirement: [] };
            this.cashHoldings = importData.cashHoldings || { brokerage: 0, retirement: 0 };
            this.scenarios = importData.scenarios || [];
            this.marketPreset = importData.marketPreset || 'moderate';
            this.shariaMode = importData.shariaMode || false;

            // Update UI
            document.getElementById('sharia-mode').checked = this.shariaMode;
            this.updateShariaVisibility();
            this.populateProfileForm();
            this.renderHoldings('brokerage');
            this.renderHoldings('retirement');
            this.updateCashDisplay();
            this.renderScenariosList();

            if (this.marketPreset) {
                this.setMarketPreset(this.marketPreset);
            }

            // Save imported data
            this.saveData();

            // Run analysis if profile exists
            if (this.profile) {
                this.runFullAnalysis();
            }

            UIUtils.showNotification('Data imported successfully', 'success');
            return true;
        } catch (error) {
            console.error('Import error:', error);
            UIUtils.showNotification('Import failed: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Show scenario comparison modal
     */
    showScenarioComparison() {
        if (!this.scenarios || this.scenarios.length < 1) {
            UIUtils.showNotification('Please save at least 1 scenario to compare with current settings', 'warning');
            return;
        }

        // Show modal
        const modal = document.getElementById('scenario-comparison-modal');
        modal.style.display = 'flex';

        // Populate scenario checkboxes
        this.populateScenarioCheckboxes();

        // Hide results initially
        document.getElementById('comparison-results').style.display = 'none';
    }

    /**
     * Populate scenario checkboxes
     */
    populateScenarioCheckboxes() {
        const container = document.getElementById('scenario-checkboxes');
        if (!container) return;

        // Add current scenario as option
        let html = `
            <div class="scenario-checkbox">
                <input type="checkbox" id="current-scenario" value="current" checked>
                <label for="current-scenario">Current (Unsaved)</label>
                <div class="scenario-meta">Current form values</div>
            </div>
        `;

        // Add saved scenarios
        if (this.scenarios) {
            this.scenarios.forEach((scenario, index) => {
                const checked = index === 0 ? 'checked' : '';
                html += `
                    <div class="scenario-checkbox">
                        <input type="checkbox" id="scenario-${scenario.id}" value="${scenario.id}" ${checked}>
                        <label for="scenario-${scenario.id}">${scenario.name}</label>
                        <div class="scenario-meta">
                            Expected Return: ${(scenario.profile.expectedReturn * 100).toFixed(1)}%, 
                            Withdrawal: ${scenario.profile.withdrawalStrategy || 'fixed'}
                        </div>
                    </div>
                `;
            });
        }

        container.innerHTML = html;
    }

    /**
     * Generate scenario comparison
     */
    async generateScenarioComparison() {
        const checkboxes = document.querySelectorAll('#scenario-checkboxes input[type="checkbox"]:checked');
        
        if (checkboxes.length < 2) {
            UIUtils.showNotification('Please select at least 2 scenarios to compare', 'warning');
            return;
        }

        if (checkboxes.length > 3) {
            UIUtils.showNotification('Please select no more than 3 scenarios to compare', 'warning');
            return;
        }

        UIUtils.showNotification('Generating comparison...', 'info', 2000);

        const selectedScenarios = [];

        // Get selected scenarios
        for (const checkbox of checkboxes) {
            if (checkbox.value === 'current') {
                selectedScenarios.push({
                    id: 'current',
                    name: 'Current (Unsaved)',
                    profile: this.profile,
                    holdings: this.holdings
                });
            } else {
                const scenario = this.scenarios.find(s => s.id === checkbox.value);
                if (scenario) {
                    selectedScenarios.push(scenario);
                }
            }
        }

        // Run quick projections for each scenario
        const comparisonData = [];
        for (const scenario of selectedScenarios) {
            try {
                const engine = new MonteCarloEngine(scenario.profile);
                const results = engine.runSimulation(200); // Fewer iterations for speed
                
                comparisonData.push({
                    scenario: scenario,
                    results: results,
                    projectedTotal: this.calculateProjectedValue(scenario.profile),
                    annualIncome: this.calculateAnnualIncome(scenario.profile, this.calculateProjectedValue(scenario.profile))
                });
            } catch (error) {
                console.error('Error running scenario simulation:', error);
                UIUtils.showNotification(`Error analyzing ${scenario.name}`, 'error');
                return;
            }
        }

        // Display comparison
        this.displayScenarioComparison(comparisonData);
    }

    /**
     * Calculate projected value for a profile
     */
    calculateProjectedValue(profile) {
        if (!profile) return 0;
        
        const years = profile.retirementAge - profile.currentAge;
        const balance = (profile.brokerageBalance || 0) + (profile.retirementBalance || 0);
        const rate = profile.expectedReturn || 0.075;
        
        let total = balance * Math.pow(1 + rate, years);
        
        // Add contributions
        let employeeContrib = profile.employeeContribution || 0;
        let employerContrib = profile.employerMatch || 0;
        
        for (let year = 1; year <= years; year++) {
            const annualContrib = employeeContrib + employerContrib;
            total += annualContrib * Math.pow(1 + rate, years - year);
            
            employeeContrib *= (1 + (profile.employeeIncrease || 0.02));
            employerContrib *= (1 + (profile.employerIncrease || 0.02));
        }

        return total;
    }

    /**
     * Calculate annual retirement income
     */
    calculateAnnualIncome(profile, portfolioValue) {
        if (!profile) return 0;
        
        const withdrawal = portfolioValue * 0.04;
        const ss = profile.socialSecurity || 0;
        const pension = profile.pensionAmount || 0;
        
        return withdrawal + ss + pension;
    }

    /**
     * Display scenario comparison results
     */
    displayScenarioComparison(comparisonData) {
        // Show results section
        document.getElementById('comparison-results').style.display = 'block';

        // Build comparison table
        const table = document.getElementById('comparison-table');
        const thead = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');

        // Clear existing content
        thead.innerHTML = '<th>Metric</th>';
        tbody.innerHTML = '';

        // Add scenario columns
        comparisonData.forEach(data => {
            const th = document.createElement('th');
            th.textContent = data.scenario.name;
            thead.appendChild(th);
        });

        // Define metrics to compare
        const metrics = [
            {
                label: 'Portfolio at Retirement',
                getValue: (data) => this.formatCurrency(data.projectedTotal)
            },
            {
                label: 'Success Rate',
                getValue: (data) => `${(data.results.successRate * 100).toFixed(0)}%`
            },
            {
                label: 'Median Portfolio Value',
                getValue: (data) => this.formatCurrency(data.results.percentiles.p50)
            },
            {
                label: 'Expected Annual Income',
                getValue: (data) => this.formatCurrency(data.annualIncome)
            },
            {
                label: 'Expected Return',
                getValue: (data) => `${(data.scenario.profile.expectedReturn * 100).toFixed(1)}%`
            },
            {
                label: 'Withdrawal Strategy',
                getValue: (data) => {
                    const strategy = data.scenario.profile.withdrawalStrategy || 'fixed';
                    return strategy.charAt(0).toUpperCase() + strategy.slice(1);
                }
            }
        ];

        // Build table rows
        metrics.forEach(metric => {
            const row = document.createElement('tr');
            
            const labelCell = document.createElement('td');
            labelCell.textContent = metric.label;
            labelCell.style.fontWeight = '600';
            row.appendChild(labelCell);

            comparisonData.forEach(data => {
                const cell = document.createElement('td');
                cell.textContent = metric.getValue(data);
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });
        
        UIUtils.showNotification('Comparison generated successfully', 'success');
    }

    // ==================== UTILITIES ====================

    setupDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.querySelectorAll('input[type="date"]').forEach(input => {
            if (!input.value) input.value = today;
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    // ==================== CSV EXPORT ====================

    /**
     * Export data to CSV file
     * @param {Array} data - Array of objects to export
     * @param {Array} columns - Column definitions [{ key, label }]
     * @param {string} filename - Output filename
     */
    exportToCSV(data, columns, filename) {
        if (!data || data.length === 0) {
            UIUtils.showNotification('No data to export', 'warning');
            return;
        }

        try {
            // Create CSV header
            const header = columns.map(col => `"${col.label}"`).join(',');
            
            // Create CSV rows
            const rows = data.map(row => {
                return columns.map(col => {
                    let value = row[col.key];
                    
                    // Handle different data types
                    if (value === null || value === undefined) {
                        value = '';
                    } else if (typeof value === 'number') {
                        // Keep numbers as numbers for Excel
                        value = value.toString();
                    } else {
                        // Escape quotes and wrap in quotes
                        value = `"${String(value).replace(/"/g, '""')}"`;
                    }
                    
                    return value;
                }).join(',');
            });

            // Combine header and rows
            const csv = [header, ...rows].join('\n');

            // Create and download file
            this.downloadFile(csv, filename, 'text/csv');
            
            UIUtils.showNotification(`${filename} exported successfully`, 'success');
        } catch (error) {
            console.error('CSV export error:', error);
            UIUtils.showNotification('Export failed. Please try again.', 'error');
        }
    }

    /**
     * Export projection data to CSV
     */
    exportProjectionCSV() {
        if (!this.profile) {
            UIUtils.showNotification('Please generate a projection first', 'warning');
            return;
        }

        const projection = this.calculateFutureValue(0.075); // Use moderate scenario
        
        const columns = [
            { key: 'year', label: 'Year' },
            { key: 'age', label: 'Age' },
            { key: 'startBalance', label: 'Starting Balance' },
            { key: 'contribution', label: 'Annual Contribution' },
            { key: 'growth', label: 'Investment Growth' },
            { key: 'endBalance', label: 'Ending Balance' },
            { key: 'cashBalance', label: 'Cash Reserves' }
        ];

        const filename = `financial_projection_${new Date().toISOString().slice(0, 10)}.csv`;
        this.exportToCSV(projection.yearlyData, columns, filename);
    }

    /**
     * Export cash flow data to CSV
     */
    exportCashflowCSV() {
        if (!this.profile) {
            UIUtils.showNotification('Please generate retirement analysis first', 'warning');
            return;
        }

        // Generate cash flow data
        const projection = this.calculateFutureValue(0.06);
        let portfolioAtRetirement = projection.finalValue;
        
        if (this.profile.includeSpouse && this.profile.spouse401kBalance > 0) {
            portfolioAtRetirement += this.calculateSpouseFutureValue(0.06);
        }

        const totalAssets = portfolioAtRetirement + projection.finalCashBalance;
        
        // Generate cash flow data similar to generateCashFlowProjection method
        const cashFlowData = this.generateCashFlowData(totalAssets, projection.finalCashBalance);

        const columns = [
            { key: 'age', label: 'Age' },
            { key: 'year', label: 'Year' },
            { key: 'portfolio', label: 'Portfolio Value' },
            { key: 'withdrawal', label: '4% Withdrawal' },
            { key: 'socialSecurity', label: 'Social Security' },
            { key: 'pension', label: 'Pension Income' },
            { key: 'totalIncome', label: 'Total Income' },
            { key: 'spending', label: 'Annual Spending' },
            { key: 'surplus', label: 'Surplus/Deficit' },
            { key: 'cashReserves', label: 'Cash Reserves' }
        ];

        const filename = `retirement_cashflow_${new Date().toISOString().slice(0, 10)}.csv`;
        this.exportToCSV(cashFlowData, columns, filename);
    }

    /**
     * Generate cash flow data for export (similar to generateCashFlowProjection)
     */
    generateCashFlowData(startingPortfolio, startingCash = 0) {
        const retirementAge = this.profile.retirementAge;
        const endAge = 100;
        const annualSpending = this.profile.annualSpending;
        const inflationRate = 0.025;
        const withdrawalGrowth = 0.03;

        let portfolio = startingPortfolio - startingCash;
        let cashReserves = startingCash;
        const cashFlowData = [];

        for (let age = retirementAge; age <= endAge; age++) {
            const yearsInRetirement = age - retirementAge;
            const inflatedSpending = annualSpending * Math.pow(1 + inflationRate, yearsInRetirement);

            let ssIncome = this.profile.socialSecurity;
            if (this.profile.includeSpouse && age >= this.profile.spouseSsStartAge) {
                ssIncome += this.profile.spouseSocialSecurity;
            }

            let pensionIncome = 0;
            if (this.profile.hasPension && age >= this.profile.pensionStartAge) {
                pensionIncome += this.profile.pensionAmount * Math.pow(1 + this.profile.pensionCola, yearsInRetirement);
            }
            if (this.profile.includeSpouse && this.profile.spouseHasPension && age >= this.profile.spousePensionStartAge) {
                pensionIncome += this.profile.spousePensionAmount * Math.pow(1 + this.profile.spousePensionCola, yearsInRetirement);
            }

            const withdrawal = portfolio > 0 ? portfolio * 0.04 : 0;
            const totalIncomeBeforeCash = withdrawal + ssIncome + pensionIncome;
            const cashNeeded = Math.max(0, inflatedSpending - totalIncomeBeforeCash);
            const cashUsed = Math.min(cashReserves, cashNeeded);
            const totalIncome = withdrawal + cashUsed + ssIncome + pensionIncome;
            const surplus = totalIncome - inflatedSpending;

            cashFlowData.push({
                age: age,
                year: new Date().getFullYear() + (age - this.profile.currentAge),
                portfolio: Math.round(portfolio),
                withdrawal: Math.round(withdrawal),
                socialSecurity: Math.round(ssIncome),
                pension: Math.round(pensionIncome),
                totalIncome: Math.round(totalIncome),
                spending: Math.round(inflatedSpending),
                surplus: Math.round(surplus),
                cashReserves: Math.round(cashReserves)
            });

            cashReserves = Math.max(0, cashReserves - cashUsed);
            portfolio = Math.max(0, (portfolio - withdrawal) * (1 + withdrawalGrowth));
        }

        return cashFlowData;
    }

    /**
     * Download file helper
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
    }
}

// Initialize planner (will be done in security initialization)

// ==================== TAB SWITCHING ====================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active to clicked nav tab
    event.target.classList.add('active');
}

// ==================== GLOBAL HANDLERS ====================

function toggleShariaMode() {
    planner.toggleShariaMode();
}

function handleProfileSubmit(event) {
    console.log('Form submitted!', event);
    console.log('Planner instance:', planner);
    
    if (!planner) {
        console.error('Planner instance not found!');
        alert('Error: Planner not initialized. Please refresh the page.');
        return;
    }
    
    try {
        planner.handleProfileSubmit(event);
    } catch (error) {
        console.error('Error in handleProfileSubmit:', error);
        alert('Error submitting form: ' + error.message);
    }
}

function addHolding(type) {
    planner.addHolding(type);
}

function analyzePortfolio() {
    planner.analyzePortfolio();
}

function setScenario(scenario) {
    planner.setScenario(scenario);
}

function calculateEarlyRetirement() {
    planner.calculateEarlyRetirement();
}

function calculateLowerReturns() {
    planner.calculateLowerReturns();
}

function calculateHigherSpending() {
    planner.calculateHigherSpending();
}

function exportProjectionCSV() {
    planner.exportProjectionCSV();
}

function exportCashflowCSV() {
    planner.exportCashflowCSV();
}

function setMarketPreset(preset) {
    planner.setMarketPreset(preset);
}

function runMonteCarloSimulation() {
    planner.runMonteCarloSimulation(1000);
}

function saveScenario() {
    const name = prompt('Enter scenario name:');
    if (name) {
        planner.saveScenario(name);
    }
}

function exportJSON() {
    planner.exportToJSON();
}

async function importJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await planner.importFromJSON(file);
        }
    };
    input.click();
}

function showScenarioComparison() {
    planner.showScenarioComparison();
}

function closeScenarioComparison() {
    document.getElementById('scenario-comparison-modal').style.display = 'none';
}

function generateComparison() {
    planner.generateScenarioComparison();
}

function clearProjectionTable() {
    // Clear the table body
    document.getElementById('projection-tbody').innerHTML = '';

    // Clear the summary values
    document.getElementById('projection-final').textContent = '$0';
    document.getElementById('projection-contributions').textContent = '$0';
    document.getElementById('projection-growth').textContent = '$0';

    // Destroy the chart if it exists
    if (planner.charts.projection) {
        planner.charts.projection.destroy();
        planner.charts.projection = null;
    }
}

function toggleSpouseFields() {
    const checkbox = document.getElementById('include-spouse');
    const fields = document.getElementById('spouse-fields');
    fields.style.display = checkbox.checked ? 'block' : 'none';
}

function toggleSpousePension() {
    const checkbox = document.getElementById('spouse-has-pension');
    const fields = document.getElementById('spouse-pension-fields');
    fields.style.display = checkbox.checked ? 'block' : 'none';
}

function togglePrimaryPension() {
    console.log('togglePrimaryPension called');
    const checkbox = document.getElementById('has-pension');
    const fields = document.getElementById('pension-fields');
    
    console.log('Checkbox:', checkbox, 'checked:', checkbox?.checked);
    console.log('Fields element:', fields);
    
    if (!checkbox || !fields) {
        console.error('Missing elements:', { checkbox, fields });
        return;
    }
    
    fields.style.display = checkbox.checked ? 'block' : 'none';
    console.log('Set fields display to:', checkbox.checked ? 'block' : 'none');
}

function resetProfileForm() {
    // Set all form fields to zero/empty
    document.getElementById('current-age').value = '';
    document.getElementById('retirement-age').value = '';
    document.getElementById('state').value = 'VA';
    document.getElementById('tax-bracket').value = '';
    document.getElementById('risk-tolerance').value = 'moderate';
    document.getElementById('brokerage-balance').value = '0';
    document.getElementById('retirement-balance').value = '0';
    document.getElementById('cash-reserves').value = '0';
    document.getElementById('employee-contribution').value = '0';
    document.getElementById('employer-match').value = '0';
    document.getElementById('employee-increase').value = '0';
    document.getElementById('employer-increase').value = '0';
    document.getElementById('social-security').value = '0';
    document.getElementById('monthly-spending').value = '0';

    // Reset pension fields
    document.getElementById('has-pension').checked = false;
    document.getElementById('pension-amount').value = '0';
    document.getElementById('pension-start-age').value = '65';
    document.getElementById('pension-cola').value = '0';
    document.getElementById('pension-survivor').value = '50';

    // Reset spouse fields
    document.getElementById('include-spouse').checked = false;
    document.getElementById('spouse-age').value = '';
    document.getElementById('spouse-retirement-age').value = '65';
    document.getElementById('spouse-401k-balance').value = '0';
    document.getElementById('spouse-employee-contribution').value = '0';
    document.getElementById('spouse-employer-match').value = '0';
    document.getElementById('spouse-contribution-increase').value = '2';
    document.getElementById('spouse-has-pension').checked = false;
    document.getElementById('spouse-pension-amount').value = '0';
    document.getElementById('spouse-pension-start-age').value = '65';
    document.getElementById('spouse-pension-cola').value = '0';
    document.getElementById('spouse-pension-survivor').value = '50';
    document.getElementById('spouse-social-security').value = '0';
    document.getElementById('spouse-ss-start-age').value = '65';

    // Hide optional sections
    document.getElementById('spouse-fields').style.display = 'none';
    document.getElementById('spouse-pension-fields').style.display = 'none';
    document.getElementById('pension-fields').style.display = 'none';

    // Hide the summary dashboard
    document.getElementById('summary-dashboard').style.display = 'none';

    // Clear stored profile data
    planner.profile = null;
    StorageManager.remove('financial-planner-profile');

    // Destroy charts if they exist
    if (planner.charts.allocation) {
        planner.charts.allocation.destroy();
        planner.charts.allocation = null;
    }
    if (planner.charts.growth) {
        planner.charts.growth.destroy();
        planner.charts.growth = null;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetPortfolioHoldings() {
    // Clear all holdings to empty
    planner.holdings.brokerage = [];
    planner.holdings.retirement = [];

    // Re-render holdings (will show empty)
    planner.renderHoldings('brokerage');
    planner.renderHoldings('retirement');

    // Hide analysis results
    document.getElementById('brokerage-analysis').style.display = 'none';
    document.getElementById('retirement-analysis').style.display = 'none';

    // Destroy sector chart if exists
    if (planner.charts.sector) {
        planner.charts.sector.destroy();
        planner.charts.sector = null;
    }

    // Save updated holdings
    planner.saveData();

    // Scroll to top of section
    document.querySelector('#portfolio-tab .planner-content').scrollIntoView({ behavior: 'smooth' });
}

// ==================== SECURITY UTILITIES ====================

class FinancialPlannerSecurity {
    static async initializeEncryption() {
        // Check if user wants to set up encryption
        if (!EncryptedStorage.hasExistingData() && !EncryptedStorage.isInitialized()) {
            const useEncryption = confirm(
                '🔒 Financial Data Protection\n\n' +
                'Would you like to password-protect your sensitive financial data?\n\n' +
                'This will encrypt your account balances, holdings, and financial details.\n\n' +
                'Click OK to set up encryption, or Cancel to continue without encryption.'
            );

            if (useEncryption) {
                const password = prompt(
                    '🔐 Set Encryption Password\n\n' +
                    'Enter a strong password to protect your financial data.\n' +
                    'Keep this password safe - it cannot be recovered if lost!'
                );

                if (password && password.length >= 6) {
                    const success = await EncryptedStorage.initialize(password);
                    if (success) {
                        alert('✅ Encryption enabled! Your financial data is now protected.');
                        return true;
                    } else {
                        alert('❌ Encryption setup failed. Your data will be stored normally.');
                        return false;
                    }
                }
            }
        } else if (EncryptedStorage.hasExistingData() && !EncryptedStorage.isInitialized()) {
            // Data exists but not unlocked
            return await this.promptForPassword();
        }
        return EncryptedStorage.isInitialized();
    }

    static async promptForPassword() {
        const password = prompt(
            '🔐 Financial Data Protection\n\n' +
            'Enter your password to access encrypted financial data:'
        );

        if (password) {
            const success = await EncryptedStorage.initialize(password);
            if (!success) {
                alert('❌ Incorrect password. Data will be stored normally until correct password is entered.');
                return false;
            }
            alert('✅ Financial data unlocked successfully!');
            return true;
        }
        return false;
    }

    static sanitizeFinancialDisplay(value, type = 'text') {
        if (value === null || value === undefined) return '';
        
        switch (type) {
            case 'currency':
                // Validate it's a number and format safely
                const num = parseFloat(value);
                if (isNaN(num)) return '$0';
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(num);
            
            case 'percentage':
                const pct = parseFloat(value);
                if (isNaN(pct)) return '0%';
                return `${pct.toFixed(2)}%`;
            
            case 'number':
                const number = parseFloat(value);
                if (isNaN(number)) return '0';
                return number.toLocaleString();
                
            default:
                return Sanitizer.escapeHTML(value);
        }
    }

    static validateAndSanitizeHolding(holding) {
        // Use the predefined holding validator
        const validation = Validator.holdingSchema.safeParse(holding);
        if (!validation.success) {
            console.error('Invalid holding data:', validation.errors);
            return null;
        }
        return validation.data;
    }
}

// Initialize encryption when the app loads
window.addEventListener('DOMContentLoaded', async () => {
    // Initialize security features
    await FinancialPlannerSecurity.initializeEncryption();
    
    // Initialize the planner
    window.planner = new FinancialPlanner();
});
