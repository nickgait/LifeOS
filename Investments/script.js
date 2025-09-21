// LifeOS Investments Module - Stock Analysis & Portfolio Management
class InvestmentDashboard {
    constructor() {
        this.currentTicker = '';
        this.currentStockData = null;
        this.watchlist = this.loadWatchlist();
        this.portfolio = this.loadPortfolio();
        this.dividendReminders = this.loadDividendReminders();
        this.cashBalance = this.loadCashBalance();
        this.currentPrices = {}; // Cache for current stock prices
        this.previousClosePrices = {}; // Cache for previous close prices
        this.editingReminderId = null; // Track which reminder is being edited
        this.allocationChart = null; // Chart.js instance for allocation chart
        this.sectorChart = null; // Chart.js instance for sector chart
        this.performanceChart = null; // Chart.js instance for performance chart
        this.benchmarkChart = null; // Chart.js instance for benchmark chart
        this.dividendProjectionsChart = null; // Chart.js instance for dividend projections chart
        this.apiKey = 'd379vepr01qskrefa3u0d379vepr01qskrefa3ug'; // Finnhub API key
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderWatchlist();
        this.updatePortfolioSummary();
        this.renderDividendReminders();
        this.renderAllocationChart();
        this.renderSectorAnalysis();
        this.renderPerformanceChart();
        this.renderBenchmarkChart();
        this.renderDividendProjectionsChart();
        this.refreshCurrentPrices();
        this.setDefaultDate();
    }

    setupEventListeners() {
        // Search functionality
        const searchBtn = document.getElementById('searchButton');
        const tickerInput = document.getElementById('tickerInput');
        
        searchBtn.addEventListener('click', () => this.handleSearch());
        tickerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Watchlist actions
        const addToWatchlistBtn = document.getElementById('addToWatchlistButton');
        addToWatchlistBtn.addEventListener('click', () => this.handleAddToWatchlist());

        // Portfolio actions
        const addToPortfolioBtn = document.getElementById('addToPortfolioButton');
        const managePortfolioBtn = document.getElementById('managePortfolioBtn');
        const addDividendReminderBtn = document.getElementById('addDividendReminderBtn');
        const advanceOverdueBtn = document.getElementById('advanceOverdueBtn');
        const manageCashBtn = document.getElementById('manageCashBtn');
        const refreshPricesBtn = document.getElementById('refreshPricesBtn');
        const takeSnapshotBtn = document.getElementById('takeSnapshotBtn');
        const performancePeriod = document.getElementById('performancePeriod');
        const fetchBenchmarkBtn = document.getElementById('fetchBenchmarkBtn');
        const benchmarkPeriod = document.getElementById('benchmarkPeriod');
        
        addToPortfolioBtn.addEventListener('click', () => this.showPortfolioModal());
        managePortfolioBtn.addEventListener('click', () => this.showPortfolioDetails());
        addDividendReminderBtn.addEventListener('click', () => this.showDividendReminderModal());
        advanceOverdueBtn.addEventListener('click', () => this.advanceOverdueReminders());
        manageCashBtn.addEventListener('click', () => this.showCashManagementModal());
        refreshPricesBtn.addEventListener('click', () => this.refreshPortfolioPrices());
        takeSnapshotBtn.addEventListener('click', () => this.takePortfolioSnapshot());
        performancePeriod.addEventListener('change', () => this.renderPerformanceChart());
        fetchBenchmarkBtn.addEventListener('click', () => this.fetchSP500Data());
        benchmarkPeriod.addEventListener('change', () => this.renderBenchmarkChart());
        
        // Dividend projections controls
        const projectionPeriod = document.getElementById('projectionPeriod');
        const updateProjectionsBtn = document.getElementById('updateProjectionsBtn');
        projectionPeriod.addEventListener('change', () => this.renderDividendProjectionsChart());
        updateProjectionsBtn.addEventListener('click', () => this.updateDividendProjections());

        // Modal functionality
        this.setupModalListeners();
        this.setupPortfolioDetailsListeners();
        this.setupDividendReminderListeners();
        this.setupDividendReinvestmentListeners();
        this.setupCashManagementListeners();
    }

    setupModalListeners() {
        const modal = document.getElementById('portfolioModal');
        const closeBtn = document.getElementById('closePortfolioModal');
        const cancelBtn = document.getElementById('cancelPortfolio');
        const form = document.getElementById('portfolioForm');

        closeBtn.addEventListener('click', () => this.hidePortfolioModal());
        cancelBtn.addEventListener('click', () => this.hidePortfolioModal());
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePortfolioTransaction();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hidePortfolioModal();
        });
    }

    // Stock Data Fetching
    async fetchStockData(ticker) {
        try {
            const response = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch stock data');
            }
            
            const data = await response.json();
            
            if (!data.c) {
                throw new Error('No data available for this ticker');
            }

            // Fetch additional data for technical analysis
            let historicalData = await this.fetchHistoricalData(ticker);
            
            // If no historical data available, create mock data for demo purposes
            if (!historicalData) {
                console.log('Creating mock historical data for technical analysis demo');
                historicalData = this.generateMockHistoricalData(data.c, 200);
            }
            
            return {
                ticker: ticker.toUpperCase(),
                currentPrice: data.c,
                change: data.d,
                changePercent: data.dp,
                high: data.h,
                low: data.l,
                open: data.o,
                previousClose: data.pc,
                volume: await this.fetchVolume(ticker),
                historicalData: historicalData
            };
        } catch (error) {
            console.error('Error fetching stock data:', error);
            throw error;
        }
    }

    async fetchHistoricalData(ticker) {
        try {
            const endDate = Math.floor(Date.now() / 1000);
            const startDate = endDate - (200 * 24 * 60 * 60); // 200 days ago
            
            const url = `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${startDate}&to=${endDate}&token=${this.apiKey}`;
            console.log('Fetching historical data from:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error('Historical data fetch failed:', response.status, response.statusText);
                return null;
            }
            
            const data = await response.json();
            console.log('Historical data response:', data);
            
            if (data.s === 'ok' && data.c && data.c.length > 0) {
                console.log(`Successfully fetched ${data.c.length} historical data points`);
                return {
                    timestamps: data.t,
                    closes: data.c,
                    opens: data.o,
                    highs: data.h,
                    lows: data.l,
                    volumes: data.v
                };
            } else if (data.s === 'no_data') {
                console.warn('No historical data available for', ticker);
                return null;
            } else {
                console.error('Invalid historical data response:', data);
                return null;
            }
            
        } catch (error) {
            console.error('Error fetching historical data:', error);
            return null;
        }
    }

    async fetchVolume(ticker) {
        // This would typically come from the historical data
        // For now, return a placeholder
        return Math.floor(Math.random() * 10000000);
    }

    generateMockHistoricalData(currentPrice, days = 200) {
        const closes = [];
        const opens = [];
        const highs = [];
        const lows = [];
        const volumes = [];
        const timestamps = [];

        let price = currentPrice * 0.9; // Start 10% below current price
        const now = Date.now();

        for (let i = days; i >= 0; i--) {
            // Generate realistic price movement
            const change = (Math.random() - 0.5) * price * 0.05; // Max 5% daily change
            price = Math.max(price + change, currentPrice * 0.5); // Don't go below 50% of current

            const open = price;
            const dailyRange = price * 0.03; // 3% daily range
            const high = open + (Math.random() * dailyRange);
            const low = open - (Math.random() * dailyRange);
            const close = low + (Math.random() * (high - low));

            opens.push(open);
            highs.push(high);
            lows.push(low);
            closes.push(close);
            volumes.push(Math.floor(Math.random() * 5000000) + 1000000);
            timestamps.push(Math.floor((now - (i * 24 * 60 * 60 * 1000)) / 1000));

            price = close;
        }

        // Adjust the last price to match current price
        closes[closes.length - 1] = currentPrice;

        console.log(`Generated ${closes.length} mock data points for technical analysis`);

        return {
            timestamps: timestamps,
            closes: closes,
            opens: opens,
            highs: highs,
            lows: lows,
            volumes: volumes
        };
    }

    // Technical Analysis Functions
    calculateSMA(prices, period) {
        if (prices.length < period) return [];
        
        const sma = [];
        for (let i = period - 1; i < prices.length; i++) {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
        return sma;
    }

    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return [];
        
        const changes = [];
        for (let i = 1; i < prices.length; i++) {
            changes.push(prices[i] - prices[i - 1]);
        }
        
        const gains = changes.map(change => change > 0 ? change : 0);
        const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
        
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        const rsi = [];
        
        for (let i = period; i < changes.length; i++) {
            const rs = avgGain / avgLoss;
            rsi.push(100 - (100 / (1 + rs)));
            
            avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
            avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
        }
        
        return rsi;
    }

    calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const fastEMA = this.calculateEMA(prices, fastPeriod);
        const slowEMA = this.calculateEMA(prices, slowPeriod);
        
        if (fastEMA.length === 0 || slowEMA.length === 0) return { macd: [], signal: [] };
        
        const macdLine = [];
        const minLength = Math.min(fastEMA.length, slowEMA.length);
        
        for (let i = 0; i < minLength; i++) {
            macdLine.push(fastEMA[fastEMA.length - minLength + i] - slowEMA[slowEMA.length - minLength + i]);
        }
        
        const signal = this.calculateEMA(macdLine, signalPeriod);
        
        return { macd: macdLine, signal: signal };
    }

    calculateEMA(prices, period) {
        if (prices.length < period) return [];
        
        const multiplier = 2 / (period + 1);
        const ema = [prices[0]];
        
        for (let i = 1; i < prices.length; i++) {
            ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
        }
        
        return ema.slice(period - 1);
    }

    // Search and Dashboard Updates
    async handleSearch() {
        const ticker = document.getElementById('tickerInput').value.trim().toUpperCase();
        
        if (!ticker) {
            this.showMessage('Please enter a stock ticker', 'error');
            return;
        }

        try {
            this.showSearchLoading(true);
            this.showMessage(`Fetching data for ${ticker}...`, 'warning');
            
            const stockData = await this.fetchStockData(ticker);
            this.currentTicker = ticker;
            this.currentStockData = stockData;
            
            this.updateDashboard(stockData);
            this.updateChart(stockData);
            this.showMessage(`Successfully loaded ${ticker} data`, 'success');
            
        } catch (error) {
            this.showMessage(`Error loading ${ticker}: ${error.message}`, 'error');
        } finally {
            this.showSearchLoading(false);
        }
    }

    updateDashboard(stockData) {
        console.log('Updating dashboard with stock data:', stockData);
        
        try {
            // Show dashboard
            const dashboard = document.getElementById('dashboard');
            dashboard.classList.remove('hidden');
            
            // Update stock name
            document.getElementById('stockNameDisplay').textContent = 
                `${stockData.ticker} - $${stockData.currentPrice.toFixed(2)}`;
            
            // Update metrics
            document.getElementById('priceValue').textContent = `$${stockData.currentPrice.toFixed(2)}`;
            document.getElementById('volumeValue').textContent = stockData.volume.toLocaleString();
            
            // Calculate and display technical indicators
            if (stockData.historicalData && stockData.historicalData.closes) {
                console.log('Historical data available, calculating indicators...');
                const prices = stockData.historicalData.closes;
                console.log(`Price data points: ${prices.length}`);
                
                const sma50 = this.calculateSMA(prices, 50);
                const sma200 = this.calculateSMA(prices, 200);
                const rsi = this.calculateRSI(prices);
                const macdData = this.calculateMACD(prices);
                
                console.log('Technical indicators calculated:', {
                    sma50: sma50.length,
                    sma200: sma200.length,
                    rsi: rsi.length,
                    macd: macdData.macd.length
                });
                
                document.getElementById('ma50Value').textContent = 
                    sma50.length > 0 ? `$${sma50[sma50.length - 1].toFixed(2)}` : 'N/A';
                document.getElementById('ma200Value').textContent = 
                    sma200.length > 0 ? `$${sma200[sma200.length - 1].toFixed(2)}` : 'N/A';
                document.getElementById('rsiValue').textContent = 
                    rsi.length > 0 ? rsi[rsi.length - 1].toFixed(2) : 'N/A';
                document.getElementById('macdValue').textContent = 
                    macdData.macd.length > 0 ? macdData.macd[macdData.macd.length - 1].toFixed(2) : 'N/A';
            } else {
                console.log('No historical data available for technical analysis');
                document.getElementById('ma50Value').textContent = 'N/A';
                document.getElementById('ma200Value').textContent = 'N/A';
                document.getElementById('rsiValue').textContent = 'N/A';
                document.getElementById('macdValue').textContent = 'N/A';
            }
        } catch (error) {
            console.error('Error updating dashboard:', error);
            this.showMessage('Error updating dashboard display', 'error');
        }
    }

    updateChart(stockData) {
        if (!stockData.historicalData || !stockData.historicalData.closes) {
            console.warn('No historical data available for chart');
            return;
        }

        const ctx = document.getElementById('priceChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }
        
        const prices = stockData.historicalData.closes;
        const timestamps = stockData.historicalData.timestamps;
        const labels = timestamps.map(ts => new Date(ts * 1000).toLocaleDateString());
        
        const sma50 = this.calculateSMA(prices, 50);
        const sma200 = this.calculateSMA(prices, 200);
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Price',
                        data: prices,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        fill: true
                    },
                    {
                        label: '50-Day MA',
                        data: [...Array(prices.length - sma50.length).fill(null), ...sma50],
                        borderColor: '#ff6b6b',
                        borderWidth: 1,
                        fill: false
                    },
                    {
                        label: '200-Day MA',
                        data: [...Array(prices.length - sma200.length).fill(null), ...sma200],
                        borderColor: '#4ecdc4',
                        borderWidth: 1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }

    // Watchlist Management
    handleAddToWatchlist() {
        if (!this.currentTicker) {
            this.showMessage('Please search for a stock first', 'error');
            return;
        }

        if (this.watchlist.find(item => item.ticker === this.currentTicker)) {
            this.showMessage(`${this.currentTicker} is already in your watchlist`, 'error');
            return;
        }

        const watchlistItem = {
            id: Date.now().toString(),
            ticker: this.currentTicker,
            addedAt: new Date().toISOString(),
            currentPrice: this.currentStockData ? this.currentStockData.currentPrice : 0
        };

        this.watchlist.push(watchlistItem);
        this.saveWatchlist();
        this.renderWatchlist();
        this.showMessage(`${this.currentTicker} added to watchlist`, 'success');
    }

    removeFromWatchlist(id) {
        this.watchlist = this.watchlist.filter(item => item.id !== id);
        this.saveWatchlist();
        this.renderWatchlist();
        this.showMessage('Stock removed from watchlist', 'success');
    }

    renderWatchlist() {
        const container = document.getElementById('watchlist');
        
        if (this.watchlist.length === 0) {
            container.innerHTML = '<p class="empty-state">Your watchlist is empty. Search for stocks to add them here.</p>';
            return;
        }

        container.innerHTML = this.watchlist.map(item => {
            const currentPrice = this.currentPrices[item.ticker] || item.currentPrice;
            const previousClose = this.previousClosePrices[item.ticker] || currentPrice;
            const dayChange = currentPrice - previousClose;
            const dayChangePercent = previousClose > 0 ? (dayChange / previousClose) * 100 : 0;
            const changeColor = dayChange >= 0 ? '#28a745' : '#dc3545';
            
            return `
            <div class="watchlist-item" onclick="investmentDashboard.searchTicker('${item.ticker}')">
                <div>
                    <div class="watchlist-symbol">${item.ticker}</div>
                    <div style="font-size: 0.9rem; color: #666;">$${currentPrice.toFixed(2)}</div>
                    <div style="font-size: 0.8rem; color: ${changeColor};">
                        ${dayChange >= 0 ? '+' : ''}$${dayChange.toFixed(2)} (${dayChangePercent >= 0 ? '+' : ''}${dayChangePercent.toFixed(2)}%)
                    </div>
                </div>
                <button class="watchlist-remove" onclick="event.stopPropagation(); investmentDashboard.removeFromWatchlist('${item.id}')">×</button>
            </div>`;
        }).join('');
    }

    renderAllocationChart() {
        const holdings = this.calculateDetailedPortfolioStats().holdings;
        const canvas = document.getElementById('allocationChart');
        const legendContainer = document.getElementById('allocationLegend');
        
        // Check if we have any holdings
        const hasHoldings = Object.keys(holdings).some(symbol => holdings[symbol].shares > 0);
        
        if (!hasHoldings) {
            legendContainer.innerHTML = '<p class="empty-state">No portfolio holdings to display</p>';
            if (this.allocationChart) {
                this.allocationChart.destroy();
                this.allocationChart = null;
            }
            return;
        }

        // Calculate allocation data
        const allocationData = [];
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ];
        
        let totalValue = 0;
        Object.entries(holdings).forEach(([symbol, holding]) => {
            if (holding.shares > 0) {
                // Use current price if available, otherwise fall back to average cost
                const currentPrice = this.currentPrices[symbol] || (holding.totalInvested / holding.shares);
                const value = holding.shares * currentPrice;
                totalValue += value;
                allocationData.push({
                    symbol: symbol,
                    value: value,
                    shares: holding.shares,
                    percentage: 0 // Will calculate after we have totalValue
                });
            }
        });

        // Calculate percentages and sort by value
        allocationData.forEach(item => {
            item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
        });
        allocationData.sort((a, b) => b.value - a.value);

        // Create chart data
        const chartData = {
            labels: allocationData.map(item => item.symbol),
            datasets: [{
                data: allocationData.map(item => item.value),
                backgroundColor: colors.slice(0, allocationData.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        // Create or update chart
        if (this.allocationChart) {
            this.allocationChart.destroy();
        }

        this.allocationChart = new Chart(canvas, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false // We'll create our own legend
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const percentage = ((value / totalValue) * 100).toFixed(1);
                                return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Create custom legend
        legendContainer.innerHTML = allocationData.map((item, index) => `
            <div class="legend-item">
                <div class="legend-info">
                    <div class="legend-color" style="background-color: ${colors[index]}"></div>
                    <span class="legend-symbol">${item.symbol}</span>
                    <span class="legend-value">${item.shares.toFixed(3)} shares</span>
                </div>
                <div class="legend-percentage">${item.percentage.toFixed(1)}%</div>
            </div>
        `).join('');

        // Generate risk concentration warnings
        this.renderRiskWarnings(allocationData);
    }

    renderSectorAnalysis() {
        try {
            const sectorData = this.calculateSectorAllocation();
            const canvas = document.getElementById('sectorChart');
            const breakdownContainer = document.getElementById('sectorBreakdown');
            
            // Check if we have any sector data
            if (sectorData.sectorCount === 0) {
                breakdownContainer.innerHTML = '<p class="empty-state">No sector data available</p>';
                document.getElementById('diversificationScore').textContent = '0/100';
                document.getElementById('sectorsCount').textContent = '0';
                
                if (this.sectorChart) {
                    this.sectorChart.destroy();
                    this.sectorChart = null;
                }
                return;
            }

            // Update metrics
            document.getElementById('diversificationScore').textContent = `${sectorData.diversificationScore}/100`;
            document.getElementById('sectorsCount').textContent = sectorData.sectorCount.toString();

            // Prepare chart data
            const sectors = Object.entries(sectorData.sectors).sort((a, b) => b[1].percentage - a[1].percentage);
            const sectorColors = {
                'Technology': '#36A2EB',
                'Healthcare': '#4BC0C0', 
                'Financial': '#FFCE56',
                'Consumer Discretionary': '#FF6384',
                'Consumer Staples': '#9966FF',
                'Energy': '#FF9F40',
                'Industrials': '#FF6B6B',
                'Materials': '#4ECDC4',
                'Utilities': '#45B7D1',
                'Real Estate': '#96CEB4',
                'Communication': '#FECA57',
                'Communication Services': '#FECA57',
                'Other': '#DDD6FE'
            };

            const chartData = {
                labels: sectors.map(([sector]) => sector),
                datasets: [{
                    data: sectors.map(([, data]) => data.value),
                    backgroundColor: sectors.map(([sector]) => sectorColors[sector] || '#DDD6FE'),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            };

            // Create or update chart
            if (this.sectorChart) {
                this.sectorChart.destroy();
            }

            this.sectorChart = new Chart(canvas, {
                type: 'pie',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const sector = context.label;
                                    const value = context.parsed;
                                    const percentage = sectors.find(([s]) => s === sector)[1].percentage;
                                    return `${sector}: $${value.toFixed(2)} (${percentage.toFixed(1)}%)`;
                                }
                            }
                        }
                    }
                }
            });

            // Create breakdown legend
            breakdownContainer.innerHTML = sectors.map(([sector, data], index) => `
                <div class="sector-item">
                    <div class="sector-info">
                        <div class="sector-color" style="background-color: ${sectorColors[sector] || '#DDD6FE'}"></div>
                        <span class="sector-name">${sector}</span>
                        <span class="sector-stocks">${data.stockCount} stock${data.stockCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="sector-percentage">${data.percentage.toFixed(1)}%</div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error rendering sector analysis:', error);
            const breakdownContainer = document.getElementById('sectorBreakdown');
            if (breakdownContainer) {
                breakdownContainer.innerHTML = '<p class="error-state">Error loading sector analysis</p>';
            }
        }
    }

    renderRiskWarnings(allocationData) {
        const warningsContainer = document.getElementById('riskWarnings');
        const warnings = [];

        // Check for concentration risk
        allocationData.forEach(item => {
            if (item.percentage >= 30) {
                warnings.push({
                    type: 'high',
                    icon: '⚠️',
                    message: `${item.symbol} represents ${item.percentage.toFixed(1)}% of portfolio (high concentration risk)`
                });
            } else if (item.percentage >= 20) {
                warnings.push({
                    type: 'medium',
                    icon: '⚡',
                    message: `${item.symbol} represents ${item.percentage.toFixed(1)}% of portfolio (moderate concentration)`
                });
            }
        });

        // Check for overall diversification
        if (allocationData.length === 1) {
            warnings.push({
                type: 'high',
                icon: '🎯',
                message: 'Portfolio is not diversified - consider adding more stocks'
            });
        } else if (allocationData.length <= 3) {
            warnings.push({
                type: 'medium',
                icon: '📊',
                message: 'Limited diversification - consider adding more positions'
            });
        }

        // Display warnings or hide container
        if (warnings.length > 0) {
            warningsContainer.style.display = 'block';
            warningsContainer.innerHTML = warnings.map(warning => `
                <div class="risk-warning risk-warning-${warning.type}">
                    <span class="risk-warning-icon">${warning.icon}</span>
                    <span>${warning.message}</span>
                </div>
            `).join('');
        } else {
            warningsContainer.style.display = 'none';
        }
    }

    async searchTicker(ticker) {
        document.getElementById('tickerInput').value = ticker;
        await this.handleSearch();
    }

    // Portfolio Management
    showPortfolioModal() {
        console.log('Showing portfolio modal...');
        
        if (!this.currentTicker || !this.currentStockData) {
            this.showMessage('Please search for a stock first', 'error');
            return;
        }

        try {
            const modal = document.getElementById('portfolioModal');
            if (!modal) {
                console.error('Portfolio modal not found');
                return;
            }

            // Pre-fill form
            const symbolInput = document.getElementById('transactionSymbol');
            const priceInput = document.getElementById('transactionPrice');
            
            if (symbolInput) symbolInput.value = this.currentTicker;
            if (priceInput) priceInput.value = this.currentStockData.currentPrice.toFixed(2);
            
            modal.classList.add('active');
            console.log('Portfolio modal should now be visible');
            
            // Ensure form is in correct initial state
            this.handleTransactionTypeChange();
            
        } catch (error) {
            console.error('Error showing portfolio modal:', error);
            this.showMessage('Error opening portfolio modal', 'error');
        }
    }

    hidePortfolioModal() {
        const modal = document.getElementById('portfolioModal');
        modal.classList.remove('active');
        document.getElementById('portfolioForm').reset();
        
        // Reset form visibility
        document.getElementById('sharesGroup').style.display = 'block';
        document.getElementById('priceGroup').style.display = 'block';
        document.getElementById('dividendGroup').style.display = 'none';
        document.getElementById('reinvestmentGroup').style.display = 'none';
        document.getElementById('reinvestmentDetailsGroup').style.display = 'none';
    }

    handlePortfolioTransaction() {
        try {
            // Get form values
            const symbol = document.getElementById('transactionSymbol').value;
            const type = document.getElementById('transactionType').value;
            const shares = parseFloat(document.getElementById('transactionShares').value);
            const price = parseFloat(document.getElementById('transactionPrice').value);
            const date = document.getElementById('transactionDate').value;

            // Validate inputs
            if (!symbol || !shares || !price || !date) {
                this.showMessage('Please fill in all required fields', 'error');
                return;
            }

            if (shares <= 0 || price <= 0) {
                this.showMessage('Shares and price must be greater than 0', 'error');
                return;
            }

            const transaction = {
                id: Date.now().toString(),
                symbol: symbol,
                type: type,
                shares: shares,
                price: price,
                date: date,
                timestamp: new Date().toISOString()
            };

            this.portfolio.push(transaction);
            this.savePortfolio();
            this.updatePortfolioSummary();
            this.renderAllocationChart();
            this.renderSectorAnalysis();
            this.hidePortfolioModal();
            
            const action = transaction.type === 'buy' ? 'purchased' : 'sold';
            this.showMessage(`Successfully ${action} ${transaction.shares} shares of ${transaction.symbol}`, 'success');
            this.showToast(`Transaction recorded: ${action} ${shares} shares of ${symbol}`, 'success');

        } catch (error) {
            console.error('Error handling portfolio transaction:', error);
            this.showMessage('Error recording transaction: ' + error.message, 'error');
        }
    }

    updatePortfolioSummary() {
        try {
            const performance = this.calculatePortfolioPerformance();
            
            // Update display elements
            document.getElementById('cashBalance').textContent = `$${this.cashBalance.toFixed(2)}`;
            document.getElementById('holdingsValue').textContent = `$${performance.holdingsValue.toFixed(2)}`;
            document.getElementById('totalPortfolioValue').textContent = `$${performance.totalPortfolioValue.toFixed(2)}`;
            
            // Update today's change with color coding
            const todaysChangeElement = document.getElementById('todaysChange');
            if (todaysChangeElement) {
                const dayChange = performance.dayChange;
                const dayChangePercent = performance.dayChangePercent;
                todaysChangeElement.textContent = `${dayChange >= 0 ? '+' : ''}$${dayChange.toFixed(2)} (${dayChangePercent >= 0 ? '+' : ''}${dayChangePercent.toFixed(2)}%)`;
                todaysChangeElement.style.color = dayChange >= 0 ? '#28a745' : '#dc3545';
            }
            
            // Update total gain/loss with color coding
            const totalGainLossElement = document.getElementById('totalGainLoss');
            if (totalGainLossElement) {
                const gainLoss = performance.totalGainLoss;
                totalGainLossElement.textContent = `${gainLoss >= 0 ? '+' : ''}$${gainLoss.toFixed(2)}`;
                totalGainLossElement.style.color = gainLoss >= 0 ? '#28a745' : '#dc3545';
            }
            
            // Update YTD performance with color coding
            const ytdPerformanceElement = document.getElementById('ytdPerformance');
            if (ytdPerformanceElement) {
                const ytdPerf = performance.ytdPerformance;
                ytdPerformanceElement.textContent = `${ytdPerf >= 0 ? '+' : ''}${ytdPerf.toFixed(2)}%`;
                ytdPerformanceElement.style.color = ytdPerf >= 0 ? '#28a745' : '#dc3545';
            }
            
            // Update lifetime return with color coding
            const lifetimeReturnElement = document.getElementById('lifetimeReturn');
            if (lifetimeReturnElement) {
                const lifetimeRet = performance.lifetimeReturn;
                lifetimeReturnElement.textContent = `${lifetimeRet >= 0 ? '+' : ''}${lifetimeRet.toFixed(2)}%`;
                lifetimeReturnElement.style.color = lifetimeRet >= 0 ? '#28a745' : '#dc3545';
            }
            
            // Show day change with color coding (if element exists)
            const dayChangeElement = document.getElementById('portfolioDayChange');
            if (dayChangeElement) {
                const dayChange = performance.dayChange;
                dayChangeElement.textContent = `${dayChange >= 0 ? '+' : ''}$${dayChange.toFixed(2)}`;
                dayChangeElement.style.color = dayChange >= 0 ? '#28a745' : '#dc3545';
            }
            
        } catch (error) {
            console.error('Error updating portfolio summary:', error);
            document.getElementById('cashBalance').textContent = '$0.00';
            document.getElementById('holdingsValue').textContent = '$0.00';
            document.getElementById('totalPortfolioValue').textContent = '$0.00';
            
            // Reset new elements on error
            const todaysChangeElement = document.getElementById('todaysChange');
            if (todaysChangeElement) todaysChangeElement.textContent = '$0.00 (0.00%)';
            
            const totalGainLossElement = document.getElementById('totalGainLoss');
            if (totalGainLossElement) totalGainLossElement.textContent = '$0.00';
            
            const ytdPerformanceElement = document.getElementById('ytdPerformance');
            if (ytdPerformanceElement) ytdPerformanceElement.textContent = '+0.00%';
            
            const lifetimeReturnElement = document.getElementById('lifetimeReturn');
            if (lifetimeReturnElement) lifetimeReturnElement.textContent = '+0.00%';
        }
    }

    calculatePortfolioValue() {
        if (!this.portfolio || this.portfolio.length === 0) {
            return 0;
        }

        // Calculate total invested amount (cost basis)
        return this.portfolio.reduce((total, transaction) => {
            const value = transaction.shares * transaction.price;
            return transaction.type === 'buy' 
                ? total + value 
                : total - value;
        }, 0);
    }

    calculatePortfolioStats() {
        const stats = {
            totalTransactions: this.portfolio.length,
            totalBuys: this.portfolio.filter(t => t.type === 'buy').length,
            totalSells: this.portfolio.filter(t => t.type === 'sell').length,
            totalShares: 0,
            totalInvested: 0
        };

        this.portfolio.forEach(transaction => {
            if (transaction.type === 'buy') {
                stats.totalShares += transaction.shares;
                stats.totalInvested += transaction.shares * transaction.price;
            } else {
                stats.totalShares -= transaction.shares;
                stats.totalInvested -= transaction.shares * transaction.price;
            }
        });

        return stats;
    }

    setupPortfolioDetailsListeners() {
        const modal = document.getElementById('portfolioDetailsModal');
        const closeBtn = document.getElementById('closePortfolioDetailsModal');
        const filterSelect = document.getElementById('transactionFilter');

        closeBtn.addEventListener('click', () => this.hidePortfolioDetailsModal());
        
        filterSelect.addEventListener('change', () => this.renderTransactionHistory());

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hidePortfolioDetailsModal();
        });
    }

    showPortfolioDetails() {
        const modal = document.getElementById('portfolioDetailsModal');
        this.renderPortfolioDetails();
        modal.classList.add('active');
    }

    hidePortfolioDetailsModal() {
        const modal = document.getElementById('portfolioDetailsModal');
        modal.classList.remove('active');
    }

    renderPortfolioDetails() {
        try {
            this.renderPortfolioSummary();
            this.renderCurrentHoldings();
            this.renderDividendIncomeSummary();
            this.renderTransactionHistory();
        } catch (error) {
            console.error('Error rendering portfolio details:', error);
            this.showMessage('Error loading portfolio details', 'error');
        }
    }

    renderPortfolioSummary() {
        const stats = this.calculateDetailedPortfolioStats();
        const dividendMetrics = this.calculatePortfolioDividendMetrics();
        
        document.getElementById('totalInvested').textContent = `$${Math.abs(stats.totalInvested).toFixed(2)}`;
        document.getElementById('totalShares').textContent = stats.totalShares.toFixed(3);
        document.getElementById('totalTransactions').textContent = stats.totalTransactions.toString();
        document.getElementById('uniqueStocks').textContent = stats.uniqueStocks.toString();
        
        // Update dividend metrics
        document.getElementById('avgDividendYield').textContent = `${dividendMetrics.avgDividendYield.toFixed(2)}%`;
        document.getElementById('annualDividendIncome').textContent = `$${dividendMetrics.totalAnnualDividendIncome.toFixed(2)}`;
    }

    calculateDetailedPortfolioStats() {
        const stats = {
            totalTransactions: this.portfolio.length,
            totalBuys: 0,
            totalSells: 0,
            totalShares: 0,
            totalInvested: 0,
            uniqueStocks: 0,
            holdings: {}
        };

        // Calculate holdings by stock
        this.portfolio.forEach(transaction => {
            const symbol = transaction.symbol;
            
            if (!stats.holdings[symbol]) {
                stats.holdings[symbol] = {
                    symbol: symbol,
                    shares: 0,
                    totalInvested: 0,
                    transactions: []
                };
            }

            stats.holdings[symbol].transactions.push(transaction);

            if (transaction.type === 'buy') {
                stats.totalBuys++;
                stats.holdings[symbol].shares += transaction.shares;
                stats.holdings[symbol].totalInvested += transaction.shares * transaction.price;
                stats.totalShares += transaction.shares;
                stats.totalInvested += transaction.shares * transaction.price;
            } else {
                stats.totalSells++;
                stats.holdings[symbol].shares -= transaction.shares;
                stats.holdings[symbol].totalInvested -= transaction.shares * transaction.price;
                stats.totalShares -= transaction.shares;
                stats.totalInvested -= transaction.shares * transaction.price;
            }
        });

        // Count unique stocks with positive holdings
        stats.uniqueStocks = Object.values(stats.holdings).filter(holding => holding.shares > 0).length;

        return stats;
    }

    renderCurrentHoldings() {
        try {
            const stats = this.calculateDetailedPortfolioStats();
            const dividendYields = this.calculateDividendYields();
            const holdingsList = document.getElementById('holdingsList');
        
        const activeHoldings = Object.values(stats.holdings).filter(holding => holding.shares > 0);
        
        if (activeHoldings.length === 0) {
            holdingsList.innerHTML = `
                <div class="empty-portfolio">
                    <div class="empty-portfolio-icon">📊</div>
                    <p>No current holdings</p>
                    <small>Buy some stocks to see your holdings here</small>
                </div>
            `;
            return;
        }

        holdingsList.innerHTML = activeHoldings.map(holding => {
            const avgPrice = holding.totalInvested / holding.shares;
            const currentPrice = this.currentPrices[holding.symbol] || avgPrice;
            const currentValue = holding.shares * currentPrice;
            const gainLoss = currentValue - holding.totalInvested;
            const gainLossPercent = holding.totalInvested > 0 ? ((gainLoss / holding.totalInvested) * 100) : 0;
            
            // Get dividend yield data
            const dividendData = dividendYields[holding.symbol];
            const yieldDisplay = dividendData && dividendData.yield > 0 
                ? `${dividendData.yield.toFixed(2)}%` 
                : 'N/A';
            const annualDividendDisplay = dividendData && dividendData.projectedAnnualIncome > 0
                ? `$${dividendData.projectedAnnualIncome.toFixed(2)}`
                : 'N/A';
            
            return `
                <div class="holding-item">
                    <div class="holding-symbol">${holding.symbol}</div>
                    <div class="holding-details">
                        <div class="holding-stat">
                            <span class="holding-stat-label">Shares</span>
                            <span class="holding-stat-value">${holding.shares.toFixed(3)}</span>
                        </div>
                        <div class="holding-stat">
                            <span class="holding-stat-label">Avg Price</span>
                            <span class="holding-stat-value">$${avgPrice.toFixed(2)}</span>
                        </div>
                        <div class="holding-stat">
                            <span class="holding-stat-label">Current Value</span>
                            <span class="holding-stat-value">$${currentValue.toFixed(2)}</span>
                        </div>
                        <div class="holding-stat">
                            <span class="holding-stat-label">Gain/Loss</span>
                            <span class="holding-stat-value" style="color: ${gainLoss >= 0 ? '#28a745' : '#dc3545'}">
                                ${gainLoss >= 0 ? '+' : ''}$${gainLoss.toFixed(2)} (${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(1)}%)
                            </span>
                        </div>
                        <div class="holding-stat">
                            <span class="holding-stat-label">Dividend Yield</span>
                            <span class="holding-stat-value">${yieldDisplay}</span>
                        </div>
                        <div class="holding-stat">
                            <span class="holding-stat-label">Annual Dividends</span>
                            <span class="holding-stat-value">${annualDividendDisplay}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        } catch (error) {
            console.error('Error rendering current holdings:', error);
            const holdingsList = document.getElementById('holdingsList');
            if (holdingsList) {
                holdingsList.innerHTML = '<p class="error-state">Error loading holdings. Please refresh the page.</p>';
            }
        }
    }

    renderDividendIncomeSummary() {
        const dividendStats = this.calculateDividendStats();
        
        // Update summary statistics
        document.getElementById('totalDividendsReceived').textContent = `$${dividendStats.totalReceived.toFixed(2)}`;
        document.getElementById('totalDividendsReinvested').textContent = `$${dividendStats.totalReinvested.toFixed(2)}`;
        document.getElementById('totalCashDividends').textContent = `$${dividendStats.totalCash.toFixed(2)}`;
        document.getElementById('dividendsThisYear').textContent = `$${dividendStats.thisYear.toFixed(2)}`;
        
        // Render dividend breakdown by stock
        const dividendsByStock = document.getElementById('dividendsByStock');
        
        if (Object.keys(dividendStats.byStock).length === 0) {
            dividendsByStock.innerHTML = '<p class="empty-state">No dividend payments recorded</p>';
            return;
        }

        dividendsByStock.innerHTML = Object.entries(dividendStats.byStock).map(([symbol, data]) => {
            return `
                <div class="dividend-stock-item">
                    <div class="dividend-stock-main">
                        <div class="dividend-stock-symbol">${symbol}</div>
                        <div class="dividend-stock-details">
                            ${data.count} payments • ${data.reinvestmentCount > 0 ? `${data.reinvestmentCount} reinvested` : 'All cash'}
                        </div>
                    </div>
                    <div class="dividend-stock-amount">
                        <div class="dividend-stock-total">$${data.total.toFixed(2)}</div>
                        <div class="dividend-stock-count">
                            Cash: $${data.cash.toFixed(2)} | DRIP: $${data.reinvested.toFixed(2)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    calculateDividendStats() {
        const currentYear = new Date().getFullYear();
        const stats = {
            totalReceived: 0,
            totalReinvested: 0,
            totalCash: 0,
            thisYear: 0,
            byStock: {}
        };

        // Get all dividend transactions
        const dividendTransactions = this.portfolio.filter(t => t.type === 'dividend');
        
        dividendTransactions.forEach(transaction => {
            const amount = transaction.dividendAmount || 0;
            const year = new Date(transaction.date).getFullYear();
            const symbol = transaction.symbol;
            
            // Update totals
            stats.totalReceived += amount;
            
            if (transaction.reinvested) {
                stats.totalReinvested += amount;
            } else {
                stats.totalCash += amount;
            }
            
            if (year === currentYear) {
                stats.thisYear += amount;
            }
            
            // Update by-stock breakdown
            if (!stats.byStock[symbol]) {
                stats.byStock[symbol] = {
                    total: 0,
                    cash: 0,
                    reinvested: 0,
                    count: 0,
                    reinvestmentCount: 0
                };
            }
            
            stats.byStock[symbol].total += amount;
            stats.byStock[symbol].count += 1;
            
            if (transaction.reinvested) {
                stats.byStock[symbol].reinvested += amount;
                stats.byStock[symbol].reinvestmentCount += 1;
            } else {
                stats.byStock[symbol].cash += amount;
            }
        });

        return stats;
    }

    renderTransactionHistory() {
        const filterValue = document.getElementById('transactionFilter').value;
        const transactionHistory = document.getElementById('transactionHistory');
        
        let filteredTransactions = [...this.portfolio];
        
        if (filterValue !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === filterValue);
        }

        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (filteredTransactions.length === 0) {
            transactionHistory.innerHTML = `
                <div class="empty-portfolio">
                    <div class="empty-portfolio-icon">📋</div>
                    <p>No transactions found</p>
                    <small>Start trading to see your transaction history</small>
                </div>
            `;
            return;
        }

        transactionHistory.innerHTML = filteredTransactions.map(transaction => {
            const transactionDate = new Date(transaction.date).toLocaleDateString();
            let transactionDetails, totalValue;
            
            if (transaction.type === 'dividend') {
                const reinvestText = transaction.reinvested ? ' (REINVESTED)' : ' (CASH)';
                transactionDetails = `DIVIDEND PAYMENT: $${transaction.dividendAmount.toFixed(2)}${reinvestText}`;
                totalValue = transaction.dividendAmount;
            } else if (transaction.isDRIP) {
                transactionDetails = `DRIP PURCHASE: ${transaction.shares} shares @ $${transaction.price.toFixed(2)}`;
                totalValue = transaction.shares * transaction.price;
            } else {
                transactionDetails = `${transaction.type.toUpperCase()}: ${transaction.shares} shares @ $${transaction.price.toFixed(2)}`;
                totalValue = transaction.shares * transaction.price;
            }
            
            return `
                <div class="transaction-item ${transaction.type}">
                    <div class="transaction-main">
                        <div class="transaction-symbol">${transaction.symbol}</div>
                        <div class="transaction-details">${transactionDetails}</div>
                    </div>
                    <div class="transaction-amount">
                        <div class="transaction-value">$${totalValue.toFixed(2)}</div>
                        <div class="transaction-date">${transactionDate}</div>
                    </div>
                    <div class="transaction-actions">
                        <button class="transaction-delete" onclick="investmentDashboard.deleteTransaction('${transaction.id}')">×</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    deleteTransaction(transactionId) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.portfolio = this.portfolio.filter(t => t.id !== transactionId);
            this.savePortfolio();
            this.updatePortfolioSummary();
            this.renderAllocationChart();
            this.renderSectorAnalysis();
            this.renderPortfolioDetails();
            this.showToast('Transaction deleted successfully', 'success');
        }
    }

    // Data Management
    loadWatchlist() {
        try {
            const data = localStorage.getItem('lifeos_investments_watchlist');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading watchlist:', error);
            return [];
        }
    }

    saveWatchlist() {
        try {
            localStorage.setItem('lifeos_investments_watchlist', JSON.stringify(this.watchlist));
        } catch (error) {
            console.error('Error saving watchlist:', error);
        }
    }

    loadPortfolio() {
        try {
            const data = localStorage.getItem('lifeos_investments_portfolio');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading portfolio:', error);
            return [];
        }
    }

    savePortfolio() {
        try {
            localStorage.setItem('lifeos_investments_portfolio', JSON.stringify(this.portfolio));
        } catch (error) {
            console.error('Error saving portfolio:', error);
        }
    }

    // UI Helpers
    showMessage(message, type = 'info') {
        const messageBox = document.getElementById('messageBox');
        const messageText = document.getElementById('messageText');
        
        messageBox.className = `message-box ${type}`;
        messageText.textContent = message;
        messageBox.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 5000);
    }

    showSearchLoading(loading) {
        const button = document.getElementById('searchButton');
        const text = document.getElementById('searchButtonText');
        const spinner = document.getElementById('searchButtonSpinner');
        
        if (loading) {
            button.disabled = true;
            text.textContent = 'Searching...';
            spinner.classList.remove('hidden');
        } else {
            button.disabled = false;
            text.textContent = 'Search';
            spinner.classList.add('hidden');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toastContainer');
        container.appendChild(toast);
        
        // Remove after 4 seconds
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transactionDate').value = today;
    }

    // Cash Management Functions
    setupCashManagementListeners() {
        const modal = document.getElementById('cashManagementModal');
        const closeBtn = document.getElementById('closeCashManagementModal');
        const cancelBtn = document.getElementById('cancelCashTransaction');
        const form = document.getElementById('cashTransactionForm');

        closeBtn.addEventListener('click', () => this.hideCashManagementModal());
        cancelBtn.addEventListener('click', () => this.hideCashManagementModal());
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCashTransaction();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideCashManagementModal();
        });
    }

    showCashManagementModal() {
        const modal = document.getElementById('cashManagementModal');
        document.getElementById('currentCashDisplay').textContent = `$${this.cashBalance.toFixed(2)}`;
        modal.classList.add('active');
    }

    hideCashManagementModal() {
        const modal = document.getElementById('cashManagementModal');
        modal.classList.remove('active');
        document.getElementById('cashTransactionForm').reset();
    }

    handleCashTransaction() {
        try {
            const type = document.getElementById('cashTransactionType').value;
            const amount = parseFloat(document.getElementById('cashAmount').value);
            const note = document.getElementById('cashNote').value;

            if (!amount || amount <= 0) {
                this.showMessage('Please enter a valid amount', 'error');
                return;
            }

            let newBalance = this.cashBalance;
            let actionText = '';

            switch (type) {
                case 'deposit':
                    newBalance += amount;
                    actionText = `Deposited $${amount.toFixed(2)}`;
                    break;
                case 'withdrawal':
                    if (amount > this.cashBalance) {
                        this.showMessage('Insufficient cash balance', 'error');
                        return;
                    }
                    newBalance -= amount;
                    actionText = `Withdrew $${amount.toFixed(2)}`;
                    break;
                case 'set':
                    newBalance = amount;
                    actionText = `Set balance to $${amount.toFixed(2)}`;
                    break;
            }

            this.cashBalance = newBalance;
            this.saveCashBalance();
            this.updatePortfolioSummary();
            this.hideCashManagementModal();

            this.showMessage(actionText, 'success');
            this.showToast(`Cash balance: $${newBalance.toFixed(2)}`, 'success');

        } catch (error) {
            console.error('Error handling cash transaction:', error);
            this.showMessage('Error updating cash balance', 'error');
        }
    }

    // Portfolio Performance Functions
    async refreshCurrentPrices() {
        try {
            const holdings = this.calculateDetailedPortfolioStats().holdings;
            const symbols = Object.keys(holdings).filter(symbol => holdings[symbol].shares > 0);
            
            if (symbols.length === 0) {
                this.updatePortfolioSummary();
                return;
            }

            console.log('Fetching current prices for:', symbols);
            
            // Fetch prices for all symbols
            for (const symbol of symbols) {
                try {
                    const price = await this.fetchCurrentPrice(symbol);
                    if (price > 0) {
                        this.currentPrices[symbol] = price;
                    }
                } catch (error) {
                    console.warn(`Failed to fetch price for ${symbol}:`, error);
                }
            }

            this.updatePortfolioSummary();
            
        } catch (error) {
            console.error('Error refreshing prices:', error);
        }
    }

    async fetchCurrentPrice(symbol) {
        try {
            const response = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            return data.c || 0; // Current price
            
        } catch (error) {
            console.warn(`Error fetching price for ${symbol}:`, error);
            return 0;
        }
    }

    calculatePortfolioPerformance() {
        const holdings = this.calculateDetailedPortfolioStats().holdings;
        let totalCurrentValue = 0;
        let totalCostBasis = 0;
        let totalDayChange = 0;

        Object.entries(holdings).forEach(([symbol, holding]) => {
            if (holding.shares > 0) {
                const currentPrice = this.currentPrices[symbol] || 0;
                const previousClose = this.previousClosePrices[symbol] || currentPrice;
                const costBasis = holding.totalInvested;
                const currentValue = holding.shares * currentPrice;
                const previousValue = holding.shares * previousClose;
                
                totalCurrentValue += currentValue;
                totalCostBasis += costBasis;
                
                // Real day change calculation using previous close
                const dayChange = currentValue - previousValue;
                totalDayChange += dayChange;
            }
        });

        // Calculate YTD performance
        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const ytdTransactions = this.portfolio.filter(t => new Date(t.date) >= yearStart);
        
        let ytdInvested = 0;
        let ytdReceived = 0;
        
        ytdTransactions.forEach(transaction => {
            const amount = transaction.shares * transaction.price;
            if (transaction.type === 'buy') {
                ytdInvested += amount;
            } else if (transaction.type === 'sell') {
                ytdReceived += amount;
            } else if (transaction.type === 'dividend') {
                // Add dividend payments to YTD performance
                ytdReceived += (transaction.dividendAmount || 0);
            }
        });

        // Get portfolio value at start of year (estimated based on cost basis)
        const yearStartPortfolioValue = totalCostBasis - ytdInvested + ytdReceived;
        const currentPortfolioValue = totalCurrentValue + this.cashBalance;
        const ytdGain = currentPortfolioValue - yearStartPortfolioValue - ytdInvested + ytdReceived;
        const ytdPerformance = yearStartPortfolioValue > 0 ? (ytdGain / yearStartPortfolioValue) * 100 : 0;

        // Calculate lifetime performance
        let lifetimeInvested = 0;
        let lifetimeReceived = 0;
        let lifetimeDividends = 0;
        
        this.portfolio.forEach(transaction => {
            const amount = transaction.shares * transaction.price;
            if (transaction.type === 'buy') {
                lifetimeInvested += amount;
            } else if (transaction.type === 'sell') {
                lifetimeReceived += amount;
            } else if (transaction.type === 'dividend') {
                lifetimeDividends += (transaction.dividendAmount || 0);
            }
        });

        // Add cash transactions to lifetime calculations
        const cashTransactions = this.getCashTransactions();
        const totalCashDeposited = cashTransactions
            .filter(t => t.type === 'deposit')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalNetInvested = lifetimeInvested + totalCashDeposited - lifetimeReceived - lifetimeDividends;
        const lifetimeGain = currentPortfolioValue - totalNetInvested;
        const lifetimeReturn = totalNetInvested > 0 ? (lifetimeGain / totalNetInvested) * 100 : 0;

        // Calculate day change percentage based on previous day's portfolio value
        const previousPortfolioValue = currentPortfolioValue - totalDayChange;
        const dayChangePercent = previousPortfolioValue > 0 ? (totalDayChange / previousPortfolioValue) * 100 : 0;

        return {
            holdingsValue: totalCurrentValue,
            costBasis: totalCostBasis,
            totalGainLoss: totalCurrentValue - totalCostBasis,
            totalPercentGain: totalCostBasis > 0 ? ((totalCurrentValue - totalCostBasis) / totalCostBasis) * 100 : 0,
            dayChange: totalDayChange,
            dayChangePercent: dayChangePercent,
            totalPortfolioValue: currentPortfolioValue,
            ytdPerformance: ytdPerformance,
            lifetimeReturn: lifetimeReturn,
            lifetimeGain: lifetimeGain
        };
    }

    async refreshPortfolioPrices() {
        const refreshBtn = document.getElementById('refreshPricesBtn');
        const originalText = refreshBtn.textContent;
        
        try {
            // Show loading state
            refreshBtn.textContent = '🔄 Refreshing...';
            refreshBtn.disabled = true;
            
            // Get unique symbols from portfolio
            const portfolioSymbols = [...new Set(this.portfolio.map(t => t.symbol))];
            const watchlistSymbols = this.watchlist.map(item => item.ticker);
            const allSymbols = [...new Set([...portfolioSymbols, ...watchlistSymbols])];
            
            // Fetch current prices for all symbols
            for (const symbol of allSymbols) {
                try {
                    const priceData = await this.fetchStockPrice(symbol);
                    console.log(`Updated ${symbol}: $${priceData.current} (${priceData.changePercent >= 0 ? '+' : ''}${priceData.changePercent.toFixed(2)}%)`);
                    // Small delay to respect API limits
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.warn(`Failed to refresh price for ${symbol}:`, error);
                }
            }
            
            // Update displays
            this.updatePortfolioSummary();
            this.renderWatchlist();
            this.renderAllocationChart();
            this.renderSectorAnalysis();
            
            this.showMessage('Portfolio prices refreshed successfully', 'success');
            
        } catch (error) {
            console.error('Error refreshing portfolio prices:', error);
            this.showMessage('Error refreshing prices: ' + error.message, 'error');
        } finally {
            // Restore button state
            refreshBtn.textContent = originalText;
            refreshBtn.disabled = false;
        }
    }

    async fetchStockPrice(symbol) {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.c && data.c > 0) {
            this.currentPrices[symbol] = data.c;
            
            // Store previous close price for day change calculations
            if (data.pc && data.pc > 0) {
                this.previousClosePrices = this.previousClosePrices || {};
                this.previousClosePrices[symbol] = data.pc;
            }
            
            return {
                current: data.c,
                previousClose: data.pc,
                change: data.c - data.pc,
                changePercent: data.pc > 0 ? ((data.c - data.pc) / data.pc) * 100 : 0
            };
        } else {
            throw new Error(`Invalid price data for ${symbol}`);
        }
    }

    getCashTransactions() {
        return JSON.parse(localStorage.getItem('lifeos_investments_cash_transactions') || '[]');
    }

    getSectorMapping() {
        // Comprehensive sector mapping for common stocks
        return {
            // Technology
            'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'GOOG': 'Technology',
            'AMZN': 'Technology', 'META': 'Technology', 'TSLA': 'Technology', 'NVDA': 'Technology',
            'NFLX': 'Technology', 'AMD': 'Technology', 'INTC': 'Technology', 'ORCL': 'Technology',
            'CRM': 'Technology', 'ADBE': 'Technology', 'PYPL': 'Technology', 'UBER': 'Technology',
            'LYFT': 'Technology', 'TWTR': 'Technology', 'SNAP': 'Technology', 'SQ': 'Technology',
            'SPOT': 'Technology', 'ROKU': 'Technology', 'ZM': 'Technology', 'DOCU': 'Technology',
            
            // Healthcare & Biotech
            'JNJ': 'Healthcare', 'PFE': 'Healthcare', 'UNH': 'Healthcare', 'ABBV': 'Healthcare',
            'MRK': 'Healthcare', 'TMO': 'Healthcare', 'ABT': 'Healthcare', 'LLY': 'Healthcare',
            'BMY': 'Healthcare', 'AMGN': 'Healthcare', 'GILD': 'Healthcare', 'CVS': 'Healthcare',
            'ANTM': 'Healthcare', 'CI': 'Healthcare', 'HUM': 'Healthcare', 'BIIB': 'Healthcare',
            'REGN': 'Healthcare', 'VRTX': 'Healthcare', 'ILMN': 'Healthcare', 'MRNA': 'Healthcare',
            
            // Financial Services
            'BRK.A': 'Financial', 'BRK.B': 'Financial', 'JPM': 'Financial', 'BAC': 'Financial',
            'WFC': 'Financial', 'GS': 'Financial', 'MS': 'Financial', 'C': 'Financial',
            'AXP': 'Financial', 'BLK': 'Financial', 'SPGI': 'Financial', 'CME': 'Financial',
            'ICE': 'Financial', 'MCO': 'Financial', 'COF': 'Financial', 'USB': 'Financial',
            'TFC': 'Financial', 'PNC': 'Financial', 'SCHW': 'Financial', 'CB': 'Financial',
            
            // Consumer Discretionary
            'AMZN': 'Consumer Discretionary', 'HD': 'Consumer Discretionary', 'MCD': 'Consumer Discretionary',
            'NKE': 'Consumer Discretionary', 'SBUX': 'Consumer Discretionary', 'LOW': 'Consumer Discretionary',
            'TJX': 'Consumer Discretionary', 'BKNG': 'Consumer Discretionary', 'CMG': 'Consumer Discretionary',
            'DIS': 'Consumer Discretionary', 'F': 'Consumer Discretionary', 'GM': 'Consumer Discretionary',
            
            // Consumer Staples
            'WMT': 'Consumer Staples', 'PG': 'Consumer Staples', 'KO': 'Consumer Staples',
            'PEP': 'Consumer Staples', 'COST': 'Consumer Staples', 'WBA': 'Consumer Staples',
            'EL': 'Consumer Staples', 'CL': 'Consumer Staples', 'KMB': 'Consumer Staples',
            'GIS': 'Consumer Staples', 'K': 'Consumer Staples', 'HSY': 'Consumer Staples',
            
            // Energy
            'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'EOG': 'Energy',
            'SLB': 'Energy', 'PSX': 'Energy', 'VLO': 'Energy', 'MPC': 'Energy',
            'OXY': 'Energy', 'HAL': 'Energy', 'BKR': 'Energy', 'DVN': 'Energy',
            
            // Industrials
            'BA': 'Industrials', 'GE': 'Industrials', 'CAT': 'Industrials', 'MMM': 'Industrials',
            'HON': 'Industrials', 'UPS': 'Industrials', 'LMT': 'Industrials', 'RTX': 'Industrials',
            'DE': 'Industrials', 'FDX': 'Industrials', 'NOC': 'Industrials', 'GD': 'Industrials',
            
            // Materials
            'LIN': 'Materials', 'APD': 'Materials', 'SHW': 'Materials', 'FCX': 'Materials',
            'NEM': 'Materials', 'DOW': 'Materials', 'DD': 'Materials', 'PPG': 'Materials',
            
            // Utilities
            'NEE': 'Utilities', 'DUK': 'Utilities', 'SO': 'Utilities', 'D': 'Utilities',
            'AEP': 'Utilities', 'EXC': 'Utilities', 'XEL': 'Utilities', 'SRE': 'Utilities',
            
            // Real Estate
            'AMT': 'Real Estate', 'PLD': 'Real Estate', 'CCI': 'Real Estate', 'EQIX': 'Real Estate',
            'PSA': 'Real Estate', 'WY': 'Real Estate', 'DLR': 'Real Estate', 'O': 'Real Estate',
            
            // Communication Services
            'T': 'Communication', 'VZ': 'Communication', 'CMCSA': 'Communication', 'CHTR': 'Communication',
            'TMUS': 'Communication', 'DISH': 'Communication', 'NFLX': 'Communication Services'
        };
    }

    calculateSectorAllocation() {
        try {
            const holdings = this.calculateDetailedPortfolioStats().holdings;
            const sectorMapping = this.getSectorMapping();
            const sectorData = {};
            let totalValue = 0;

            // Calculate sector allocations
            Object.entries(holdings).forEach(([symbol, holding]) => {
                if (holding.shares > 0) {
                    const currentPrice = this.currentPrices[symbol] || (holding.totalInvested / holding.shares);
                    const value = holding.shares * currentPrice;
                    const sector = sectorMapping[symbol] || 'Other';
                    
                    if (!sectorData[sector]) {
                        sectorData[sector] = {
                            value: 0,
                            percentage: 0,
                            stocks: [],
                            stockCount: 0
                        };
                    }
                    
                    sectorData[sector].value += value;
                    sectorData[sector].stocks.push({
                        symbol: symbol,
                        value: value,
                        shares: holding.shares
                    });
                    sectorData[sector].stockCount++;
                    totalValue += value;
                }
            });

            // Calculate percentages
            Object.keys(sectorData).forEach(sector => {
                sectorData[sector].percentage = totalValue > 0 ? (sectorData[sector].value / totalValue) * 100 : 0;
            });

            // Calculate diversification score (0-100)
            const sectorCount = Object.keys(sectorData).length;
            const idealSectorCount = 8; // Good diversification target
            let diversificationScore = 0;
            
            if (sectorCount > 0) {
                // Base score for having multiple sectors
                const sectorCountScore = Math.min(sectorCount / idealSectorCount, 1) * 60;
                
                // Penalty for over-concentration in any sector
                const maxSectorPercentage = Math.max(...Object.values(sectorData).map(s => s.percentage));
                const concentrationPenalty = maxSectorPercentage > 40 ? (maxSectorPercentage - 40) : 0;
                
                // Balance bonus for even distribution
                const percentages = Object.values(sectorData).map(s => s.percentage);
                const avgPercentage = 100 / sectorCount;
                const variance = percentages.reduce((sum, p) => sum + Math.pow(p - avgPercentage, 2), 0) / sectorCount;
                const balanceBonus = Math.max(0, 40 - (variance / 50));
                
                diversificationScore = Math.max(0, Math.min(100, sectorCountScore + balanceBonus - concentrationPenalty));
            }

            return {
                sectors: sectorData,
                totalValue: totalValue,
                sectorCount: sectorCount,
                diversificationScore: Math.round(diversificationScore)
            };
        } catch (error) {
            console.error('Error calculating sector allocation:', error);
            return {
                sectors: {},
                totalValue: 0,
                sectorCount: 0,
                diversificationScore: 0
            };
        }
    }

    // Performance Tracking Functions
    loadPerformanceSnapshots() {
        try {
            const data = localStorage.getItem('lifeos_investments_performance_snapshots');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading performance snapshots:', error);
            return [];
        }
    }

    savePerformanceSnapshots(snapshots) {
        try {
            localStorage.setItem('lifeos_investments_performance_snapshots', JSON.stringify(snapshots));
        } catch (error) {
            console.error('Error saving performance snapshots:', error);
        }
    }

    takePortfolioSnapshot() {
        try {
            const performance = this.calculatePortfolioPerformance();
            const holdings = this.calculateDetailedPortfolioStats().holdings;
            
            const snapshot = {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
                timestamp: new Date().toISOString(),
                totalValue: performance.totalPortfolioValue,
                holdingsValue: performance.holdingsValue,
                cashBalance: this.cashBalance,
                totalGainLoss: performance.totalGainLoss,
                dayChange: performance.dayChange,
                dayChangePercent: performance.dayChangePercent,
                stockCount: Object.keys(holdings).filter(symbol => holdings[symbol].shares > 0).length,
                notes: 'Manual snapshot'
            };

            const snapshots = this.loadPerformanceSnapshots();
            
            // Check if we already have a snapshot for today
            const today = snapshot.date;
            const existingTodayIndex = snapshots.findIndex(s => s.date === today);
            
            if (existingTodayIndex >= 0) {
                // Update existing snapshot for today
                snapshots[existingTodayIndex] = snapshot;
                this.showMessage('Today\'s snapshot updated', 'success');
            } else {
                // Add new snapshot
                snapshots.push(snapshot);
                this.showMessage('Portfolio snapshot taken successfully', 'success');
            }

            // Keep only last 2 years of data (730 days)
            snapshots.sort((a, b) => new Date(b.date) - new Date(a.date));
            if (snapshots.length > 730) {
                snapshots.splice(730);
            }

            this.savePerformanceSnapshots(snapshots);
            this.renderPerformanceChart();
            
        } catch (error) {
            console.error('Error taking portfolio snapshot:', error);
            this.showMessage('Error taking snapshot: ' + error.message, 'error');
        }
    }

    calculatePerformanceMetrics(snapshots, periodDays) {
        try {
            if (snapshots.length < 2) {
                return {
                    periodReturn: 0,
                    bestDay: 0,
                    worstDay: 0,
                    volatility: 0,
                    totalDays: 0
                };
            }

            // Sort by date ascending
            const sortedSnapshots = [...snapshots].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            const startValue = sortedSnapshots[0].totalValue;
            const endValue = sortedSnapshots[sortedSnapshots.length - 1].totalValue;
            const periodReturn = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

            // Calculate daily returns
            const dailyReturns = [];
            for (let i = 1; i < sortedSnapshots.length; i++) {
                const prevValue = sortedSnapshots[i - 1].totalValue;
                const currentValue = sortedSnapshots[i].totalValue;
                if (prevValue > 0) {
                    const dailyReturn = ((currentValue - prevValue) / prevValue) * 100;
                    dailyReturns.push(dailyReturn);
                }
            }

            const bestDay = dailyReturns.length > 0 ? Math.max(...dailyReturns) : 0;
            const worstDay = dailyReturns.length > 0 ? Math.min(...dailyReturns) : 0;

            // Calculate volatility (standard deviation of daily returns)
            let volatility = 0;
            if (dailyReturns.length > 1) {
                const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
                const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / dailyReturns.length;
                volatility = Math.sqrt(variance);
            }

            return {
                periodReturn,
                bestDay,
                worstDay,
                volatility,
                totalDays: dailyReturns.length
            };
        } catch (error) {
            console.error('Error calculating performance metrics:', error);
            return {
                periodReturn: 0,
                bestDay: 0,
                worstDay: 0,
                volatility: 0,
                totalDays: 0
            };
        }
    }

    renderPerformanceChart() {
        try {
            const snapshots = this.loadPerformanceSnapshots();
            const canvas = document.getElementById('performanceChart');
            const periodSelect = document.getElementById('performancePeriod');
            const periodDays = parseInt(periodSelect.value);

            if (!canvas) return;

            // Filter snapshots based on selected period
            let filteredSnapshots = snapshots;
            if (periodDays !== 'all' && !isNaN(periodDays)) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - periodDays);
                filteredSnapshots = snapshots.filter(snapshot => 
                    new Date(snapshot.date) >= cutoffDate
                );
            }

            // Sort by date
            filteredSnapshots.sort((a, b) => new Date(a.date) - new Date(b.date));

            if (filteredSnapshots.length === 0) {
                // If we have portfolio transactions but no snapshots, create an initial snapshot
                if (this.portfolio.length > 0) {
                    console.log('No snapshots found but portfolio exists. Creating initial snapshot...');
                    this.takePortfolioSnapshot();
                    // Recursively call this function to render with the new snapshot
                    setTimeout(() => this.renderPerformanceChart(), 100);
                    return;
                } else {
                    // Show demo data when no snapshots and no portfolio exist
                    this.renderPerformanceDemoChart();
                    return;
                }
            }

            // Calculate metrics
            const metrics = this.calculatePerformanceMetrics(filteredSnapshots, periodDays);

            // Update metrics display
            document.getElementById('periodReturn').textContent = `${metrics.periodReturn >= 0 ? '+' : ''}${metrics.periodReturn.toFixed(2)}%`;
            document.getElementById('periodReturn').className = `metric-value ${metrics.periodReturn >= 0 ? 'performance-positive' : 'performance-negative'}`;

            document.getElementById('bestDay').textContent = `+${metrics.bestDay.toFixed(2)}%`;
            document.getElementById('bestDay').className = 'metric-value performance-positive';

            document.getElementById('worstDay').textContent = `${metrics.worstDay.toFixed(2)}%`;
            document.getElementById('worstDay').className = 'metric-value performance-negative';

            document.getElementById('volatility').textContent = `${metrics.volatility.toFixed(2)}%`;

            // Prepare chart data
            const chartData = {
                labels: filteredSnapshots.map(snapshot => {
                    const date = new Date(snapshot.date);
                    return date.toLocaleDateString();
                }),
                datasets: [{
                    label: 'Portfolio Value',
                    data: filteredSnapshots.map(snapshot => snapshot.totalValue),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            };

            // Create or update chart
            if (this.performanceChart) {
                this.performanceChart.destroy();
            }

            this.performanceChart = new Chart(canvas, {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Portfolio: $${context.parsed.y.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Portfolio Value ($)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(0);
                                }
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error rendering performance chart:', error);
        }
    }

    // Benchmark Comparison Functions
    loadSP500Data() {
        try {
            const data = localStorage.getItem('lifeos_investments_sp500_data');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading S&P 500 data:', error);
            return [];
        }
    }

    saveSP500Data(data) {
        try {
            localStorage.setItem('lifeos_investments_sp500_data', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving S&P 500 data:', error);
        }
    }

    async fetchSP500Data() {
        const fetchBtn = document.getElementById('fetchBenchmarkBtn');
        const originalText = fetchBtn.textContent;
        
        try {
            fetchBtn.textContent = '🔄 Fetching...';
            fetchBtn.disabled = true;

            // Fetch S&P 500 data using SPY ETF as proxy
            const endDate = Math.floor(Date.now() / 1000);
            const startDate = endDate - (365 * 24 * 60 * 60); // 1 year ago
            
            const url = `https://finnhub.io/api/v1/stock/candle?symbol=SPY&resolution=D&from=${startDate}&to=${endDate}&token=${this.apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.s === 'ok' && data.t && data.c) {
                // Convert to daily data format
                const sp500Data = data.t.map((timestamp, index) => ({
                    date: new Date(timestamp * 1000).toISOString().split('T')[0],
                    timestamp: timestamp,
                    price: data.c[index],
                    open: data.o[index],
                    high: data.h[index],
                    low: data.l[index],
                    volume: data.v[index]
                }));

                this.saveSP500Data(sp500Data);
                this.renderBenchmarkChart();
                this.showMessage('S&P 500 data updated successfully', 'success');
            } else {
                throw new Error('Invalid S&P 500 data received');
            }

        } catch (error) {
            console.error('Error fetching S&P 500 data:', error);
            this.showMessage('Error fetching S&P 500 data: ' + error.message, 'error');
            
            // Generate mock S&P 500 data for demonstration
            this.generateMockSP500Data();
            this.renderBenchmarkChart();
            this.showMessage('Using mock S&P 500 data for demonstration', 'warning');
        } finally {
            fetchBtn.textContent = originalText;
            fetchBtn.disabled = false;
        }
    }

    generateMockSP500Data() {
        // Generate mock S&P 500 data for the last year
        const mockData = [];
        const today = new Date();
        let currentPrice = 4500; // Approximate S&P 500 level
        
        for (let i = 365; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Simulate realistic market movements
            const dailyReturn = (Math.random() - 0.5) * 0.04; // -2% to +2% daily
            currentPrice *= (1 + dailyReturn);
            
            mockData.push({
                date: date.toISOString().split('T')[0],
                timestamp: Math.floor(date.getTime() / 1000),
                price: currentPrice,
                open: currentPrice * (1 + (Math.random() - 0.5) * 0.01),
                high: currentPrice * (1 + Math.random() * 0.015),
                low: currentPrice * (1 - Math.random() * 0.015),
                volume: Math.floor(Math.random() * 100000000)
            });
        }
        
        this.saveSP500Data(mockData);
    }

    calculateBenchmarkMetrics(portfolioSnapshots, sp500Data, periodDays) {
        try {
            if (portfolioSnapshots.length < 2 || sp500Data.length < 2) {
                return {
                    portfolioReturn: 0,
                    sp500Return: 0,
                    alpha: 0,
                    beta: 1.0,
                    outperformanceDays: 0,
                    totalDays: 0
                };
            }

            // Filter data for the period
            let filteredPortfolio = portfolioSnapshots;
            let filteredSP500 = sp500Data;
            
            if (periodDays !== 'all' && !isNaN(periodDays)) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - periodDays);
                
                filteredPortfolio = portfolioSnapshots.filter(snapshot => 
                    new Date(snapshot.date) >= cutoffDate
                );
                filteredSP500 = sp500Data.filter(data => 
                    new Date(data.date) >= cutoffDate
                );
            }

            // Sort by date
            filteredPortfolio.sort((a, b) => new Date(a.date) - new Date(b.date));
            filteredSP500.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Calculate returns
            const portfolioStart = filteredPortfolio[0].totalValue;
            const portfolioEnd = filteredPortfolio[filteredPortfolio.length - 1].totalValue;
            const portfolioReturn = portfolioStart > 0 ? ((portfolioEnd - portfolioStart) / portfolioStart) * 100 : 0;

            const sp500Start = filteredSP500[0].price;
            const sp500End = filteredSP500[filteredSP500.length - 1].price;
            const sp500Return = sp500Start > 0 ? ((sp500End - sp500Start) / sp500Start) * 100 : 0;

            const alpha = portfolioReturn - sp500Return;

            // Calculate beta (simplified using correlation and volatility)
            const portfolioReturns = [];
            const marketReturns = [];
            
            // Align dates and calculate daily returns
            for (let i = 1; i < Math.min(filteredPortfolio.length, filteredSP500.length); i++) {
                const portfolioPrevValue = filteredPortfolio[i-1].totalValue;
                const portfolioCurrentValue = filteredPortfolio[i].totalValue;
                
                const marketPrevValue = filteredSP500[i-1].price;
                const marketCurrentValue = filteredSP500[i].price;
                
                if (portfolioPrevValue > 0 && marketPrevValue > 0) {
                    portfolioReturns.push((portfolioCurrentValue - portfolioPrevValue) / portfolioPrevValue);
                    marketReturns.push((marketCurrentValue - marketPrevValue) / marketPrevValue);
                }
            }

            let beta = 1.0;
            if (portfolioReturns.length > 1 && marketReturns.length > 1) {
                // Calculate covariance and market variance
                const portfolioMean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
                const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;
                
                let covariance = 0;
                let marketVariance = 0;
                
                for (let i = 0; i < Math.min(portfolioReturns.length, marketReturns.length); i++) {
                    covariance += (portfolioReturns[i] - portfolioMean) * (marketReturns[i] - marketMean);
                    marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
                }
                
                if (marketVariance > 0) {
                    beta = covariance / marketVariance;
                }
            }

            // Count outperformance days
            let outperformanceDays = 0;
            for (let i = 1; i < Math.min(filteredPortfolio.length, filteredSP500.length); i++) {
                const portfolioDailyReturn = filteredPortfolio[i].totalValue / filteredPortfolio[i-1].totalValue - 1;
                const marketDailyReturn = filteredSP500[i].price / filteredSP500[i-1].price - 1;
                
                if (portfolioDailyReturn > marketDailyReturn) {
                    outperformanceDays++;
                }
            }

            return {
                portfolioReturn,
                sp500Return,
                alpha,
                beta,
                outperformanceDays,
                totalDays: Math.min(filteredPortfolio.length - 1, filteredSP500.length - 1)
            };
        } catch (error) {
            console.error('Error calculating benchmark metrics:', error);
            return {
                portfolioReturn: 0,
                sp500Return: 0,
                alpha: 0,
                beta: 1.0,
                outperformanceDays: 0,
                totalDays: 0
            };
        }
    }

    renderBenchmarkChart() {
        try {
            const portfolioSnapshots = this.loadPerformanceSnapshots();
            const sp500Data = this.loadSP500Data();
            const canvas = document.getElementById('benchmarkChart');
            const periodSelect = document.getElementById('benchmarkPeriod');
            const periodDays = parseInt(periodSelect.value);

            if (!canvas) return;

            // If no S&P 500 data, generate mock data
            if (sp500Data.length === 0) {
                this.generateMockSP500Data();
                setTimeout(() => this.renderBenchmarkChart(), 100);
                return;
            }

            if (portfolioSnapshots.length === 0) {
                // If we have portfolio transactions but no snapshots, create an initial snapshot
                if (this.portfolio.length > 0) {
                    console.log('No snapshots found but portfolio exists. Creating initial snapshot for benchmark...');
                    this.takePortfolioSnapshot();
                    // Recursively call this function to render with the new snapshot
                    setTimeout(() => this.renderBenchmarkChart(), 100);
                    return;
                } else {
                    // Show demo benchmark comparison when no portfolio exists
                    this.renderBenchmarkDemoChart();
                    return;
                }
            }

            // Calculate metrics
            const metrics = this.calculateBenchmarkMetrics(portfolioSnapshots, sp500Data, periodDays);

            // Update metrics display
            document.getElementById('portfolioBenchmarkReturn').textContent = `${metrics.portfolioReturn >= 0 ? '+' : ''}${metrics.portfolioReturn.toFixed(2)}%`;
            document.getElementById('portfolioBenchmarkReturn').className = `metric-value ${metrics.portfolioReturn >= 0 ? 'performance-positive' : 'performance-negative'}`;

            document.getElementById('sp500Return').textContent = `${metrics.sp500Return >= 0 ? '+' : ''}${metrics.sp500Return.toFixed(2)}%`;
            document.getElementById('sp500Return').className = `metric-value ${metrics.sp500Return >= 0 ? 'performance-positive' : 'performance-negative'}`;

            document.getElementById('alphaValue').textContent = `${metrics.alpha >= 0 ? '+' : ''}${metrics.alpha.toFixed(2)}%`;
            document.getElementById('alphaValue').className = `metric-value ${metrics.alpha >= 0 ? 'performance-positive' : 'performance-negative'}`;

            document.getElementById('betaValue').textContent = metrics.beta.toFixed(2);

            // Generate insights
            this.generateBenchmarkInsights(metrics);

            // Filter data for chart
            let filteredPortfolio = portfolioSnapshots;
            let filteredSP500 = sp500Data;
            
            if (periodDays !== 'all' && !isNaN(periodDays)) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - periodDays);
                
                filteredPortfolio = portfolioSnapshots.filter(snapshot => 
                    new Date(snapshot.date) >= cutoffDate
                );
                filteredSP500 = sp500Data.filter(data => 
                    new Date(data.date) >= cutoffDate
                );
            }

            // Sort and normalize data
            filteredPortfolio.sort((a, b) => new Date(a.date) - new Date(b.date));
            filteredSP500.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Normalize to percentage changes from start
            const portfolioStart = filteredPortfolio[0]?.totalValue || 1;
            const sp500Start = filteredSP500[0]?.price || 1;

            const portfolioNormalized = filteredPortfolio.map(snapshot => ({
                date: snapshot.date,
                value: ((snapshot.totalValue - portfolioStart) / portfolioStart) * 100
            }));

            const sp500Normalized = filteredSP500.map(data => ({
                date: data.date,
                value: ((data.price - sp500Start) / sp500Start) * 100
            }));

            // Prepare chart data
            const chartData = {
                labels: portfolioNormalized.map(item => new Date(item.date).toLocaleDateString()),
                datasets: [
                    {
                        label: 'Your Portfolio',
                        data: portfolioNormalized.map(item => item.value),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'S&P 500',
                        data: sp500Normalized.map(item => item.value),
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    }
                ]
            };

            // Create or update chart
            if (this.benchmarkChart) {
                this.benchmarkChart.destroy();
            }

            this.benchmarkChart = new Chart(canvas, {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y >= 0 ? '+' : ''}${context.parsed.y.toFixed(2)}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Return (%)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(1) + '%';
                                }
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error rendering benchmark chart:', error);
        }
    }

    generateBenchmarkInsights(metrics) {
        const insightsContainer = document.getElementById('benchmarkInsights');
        const insights = [];

        // Alpha insights
        if (metrics.alpha > 2) {
            insights.push({
                icon: '🚀',
                text: `Excellent! Your portfolio is outperforming the S&P 500 by ${metrics.alpha.toFixed(2)}%`,
                type: 'positive'
            });
        } else if (metrics.alpha > 0) {
            insights.push({
                icon: '📈',
                text: `Good performance! You're beating the market by ${metrics.alpha.toFixed(2)}%`,
                type: 'positive'
            });
        } else if (metrics.alpha > -2) {
            insights.push({
                icon: '⚖️',
                text: `Close to market performance with ${metrics.alpha.toFixed(2)}% difference`,
                type: 'neutral'
            });
        } else {
            insights.push({
                icon: '📉',
                text: `Portfolio underperforming market by ${Math.abs(metrics.alpha).toFixed(2)}%`,
                type: 'negative'
            });
        }

        // Beta insights
        if (metrics.beta > 1.2) {
            insights.push({
                icon: '⚡',
                text: `High volatility portfolio (Beta: ${metrics.beta.toFixed(2)}) - higher risk/reward`,
                type: 'neutral'
            });
        } else if (metrics.beta < 0.8) {
            insights.push({
                icon: '🛡️',
                text: `Conservative portfolio (Beta: ${metrics.beta.toFixed(2)}) - lower market risk`,
                type: 'neutral'
            });
        } else {
            insights.push({
                icon: '🎯',
                text: `Balanced market exposure (Beta: ${metrics.beta.toFixed(2)})`,
                type: 'neutral'
            });
        }

        // Outperformance insights
        if (metrics.totalDays > 0) {
            const outperformanceRate = (metrics.outperformanceDays / metrics.totalDays) * 100;
            if (outperformanceRate > 60) {
                insights.push({
                    icon: '🏆',
                    text: `Consistently strong - outperformed market ${outperformanceRate.toFixed(0)}% of days`,
                    type: 'positive'
                });
            } else if (outperformanceRate < 40) {
                insights.push({
                    icon: '🎯',
                    text: `Room for improvement - outperformed ${outperformanceRate.toFixed(0)}% of days`,
                    type: 'negative'
                });
            }
        }

        // Render insights
        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-item insight-${insight.type}">
                <span class="insight-icon">${insight.icon}</span>
                <span>${insight.text}</span>
            </div>
        `).join('');
    }

    calculateDividendYields() {
        try {
            const holdings = this.calculateDetailedPortfolioStats().holdings;
            const dividendYields = {};
            
            // Calculate dividend yield for each holding
            Object.entries(holdings).forEach(([symbol, holding]) => {
                if (holding.shares > 0) {
                    const currentPrice = this.currentPrices[symbol] || 0;
                    
                    // Get dividend payments for this symbol from the last 12 months
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    
                    const dividendTransactions = this.portfolio.filter(t => 
                        t.symbol === symbol && 
                        t.type === 'dividend' && 
                        new Date(t.date) >= oneYearAgo
                    );
                    
                    // Calculate total dividends received and weighted dividend per share
                    let totalDividends = 0;
                    let weightedDividendPerShare = 0;
                    let totalDividendWeight = 0;
                    
                    dividendTransactions.forEach(transaction => {
                        totalDividends += (transaction.dividendAmount || 0);
                        
                        // Calculate shares held at the time of this dividend
                        const sharesAtDividendTime = this.calculateSharesAtDate(symbol, transaction.date);
                        
                        if (sharesAtDividendTime > 0) {
                            const dividendPerShare = transaction.dividendAmount / sharesAtDividendTime;
                            weightedDividendPerShare += dividendPerShare * transaction.dividendAmount;
                            totalDividendWeight += transaction.dividendAmount;
                        }
                    });
                    
                    // Calculate annualized dividend per share based on weighted average
                    const annualDividendPerShare = totalDividendWeight > 0 ? 
                        weightedDividendPerShare / totalDividendWeight : 0;
                    
                    // Calculate dividend yield (annual dividend per share / current price)
                    const dividendYield = currentPrice > 0 ? (annualDividendPerShare / currentPrice) * 100 : 0;
                    
                    dividendYields[symbol] = {
                        yield: dividendYield,
                        annualDividendPerShare: annualDividendPerShare,
                        totalAnnualDividends: totalDividends,
                        projectedAnnualIncome: holding.shares * annualDividendPerShare
                    };
                }
            });
            
            return dividendYields;
        } catch (error) {
            console.error('Error calculating dividend yields:', error);
            return {};
        }
    }

    calculatePortfolioDividendMetrics() {
        try {
            const holdings = this.calculateDetailedPortfolioStats().holdings;
            const dividendYields = this.calculateDividendYields();
            
            let totalPortfolioValue = 0;
            let weightedYieldSum = 0;
            let totalAnnualDividendIncome = 0;
            let stocksWithDividends = 0;
            
            Object.entries(holdings).forEach(([symbol, holding]) => {
                if (holding.shares > 0) {
                    const currentPrice = this.currentPrices[symbol] || 0;
                    const holdingValue = holding.shares * currentPrice;
                    totalPortfolioValue += holdingValue;
                    
                    if (dividendYields[symbol]) {
                        const yieldData = dividendYields[symbol];
                        
                        // Weight the yield by the holding's portfolio percentage
                        weightedYieldSum += yieldData.yield * holdingValue;
                        totalAnnualDividendIncome += yieldData.projectedAnnualIncome;
                        
                        if (yieldData.yield > 0) {
                            stocksWithDividends++;
                        }
                    }
                }
            });
            
            const avgDividendYield = totalPortfolioValue > 0 ? weightedYieldSum / totalPortfolioValue : 0;
            
            return {
                avgDividendYield,
                totalAnnualDividendIncome,
                stocksWithDividends,
                dividendYields
            };
        } catch (error) {
            console.error('Error calculating portfolio dividend metrics:', error);
            return {
                avgDividendYield: 0,
                totalAnnualDividendIncome: 0,
                stocksWithDividends: 0,
                dividendYields: {}
            };
        }
    }

    // Transaction Type Handling
    handleTransactionTypeChange() {
        console.log('handleTransactionTypeChange called');
        const type = document.getElementById('transactionType').value;
        console.log('Transaction type:', type);
        
        const sharesGroup = document.getElementById('sharesGroup');
        const priceGroup = document.getElementById('priceGroup');
        const dividendGroup = document.getElementById('dividendGroup');
        const reinvestmentGroup = document.getElementById('reinvestmentGroup');
        const priceLabel = document.getElementById('priceLabel');
        const sharesInput = document.getElementById('transactionShares');
        const priceInput = document.getElementById('transactionPrice');

        if (type === 'dividend') {
            console.log('Setting up dividend form');
            sharesGroup.style.display = 'none';
            priceGroup.style.display = 'none';
            dividendGroup.style.display = 'block';
            if (reinvestmentGroup) {
                reinvestmentGroup.style.display = 'block';
                console.log('Reinvestment group should now be visible');
            } else {
                console.error('Reinvestment group not found');
            }
            sharesInput.required = false;
            priceInput.required = false;
        } else {
            sharesGroup.style.display = 'block';
            priceGroup.style.display = 'block';
            dividendGroup.style.display = 'none';
            document.getElementById('reinvestmentGroup').style.display = 'none';
            document.getElementById('reinvestmentDetailsGroup').style.display = 'none';
            sharesInput.required = true;
            priceInput.required = true;
            
            if (type === 'buy') {
                priceLabel.textContent = 'Price per Share';
            } else {
                priceLabel.textContent = 'Sale Price per Share';
            }
        }
    }

    // Dividend Reinvestment Handling
    setupDividendReinvestmentListeners() {
        const reinvestmentCheckbox = document.getElementById('dividendReinvested');
        
        reinvestmentCheckbox.addEventListener('change', () => {
            const detailsGroup = document.getElementById('reinvestmentDetailsGroup');
            if (reinvestmentCheckbox.checked) {
                detailsGroup.style.display = 'block';
            } else {
                detailsGroup.style.display = 'none';
            }
        });
    }

    // Dividend Reminder Management
    setupDividendReminderListeners() {
        const modal = document.getElementById('dividendReminderModal');
        const closeBtn = document.getElementById('closeDividendReminderModal');
        const cancelBtn = document.getElementById('cancelDividendReminder');
        const form = document.getElementById('dividendReminderForm');

        closeBtn.addEventListener('click', () => this.hideDividendReminderModal());
        cancelBtn.addEventListener('click', () => this.hideDividendReminderModal());
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddDividendReminder();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideDividendReminderModal();
        });
    }

    showDividendReminderModal() {
        const modal = document.getElementById('dividendReminderModal');
        
        // Update modal for new reminder
        document.querySelector('#dividendReminderModal .modal-header h3').textContent = '💰 Add Dividend Reminder';
        document.querySelector('#dividendReminderForm button[type="submit"]').textContent = 'Add Reminder';
        this.editingReminderId = null;
        
        modal.classList.add('active');
    }

    hideDividendReminderModal() {
        const modal = document.getElementById('dividendReminderModal');
        modal.classList.remove('active');
        document.getElementById('dividendReminderForm').reset();
        this.editingReminderId = null;
    }

    editDividendReminder(reminderId) {
        const reminder = this.dividendReminders.find(r => r.id === reminderId);
        if (!reminder) {
            this.showMessage('Reminder not found', 'error');
            return;
        }

        // Update modal for editing
        document.querySelector('#dividendReminderModal .modal-header h3').textContent = '✏️ Edit Dividend Reminder';
        document.querySelector('#dividendReminderForm button[type="submit"]').textContent = 'Save Changes';
        this.editingReminderId = reminderId;

        // Populate form with existing data
        document.getElementById('dividendSymbol').value = reminder.symbol;
        document.getElementById('dividendExDate').value = reminder.exDate;
        document.getElementById('dividendPayDate').value = reminder.payDate;
        document.getElementById('dividendPerShare').value = reminder.dividendPerShare;
        document.getElementById('dividendFrequency').value = reminder.frequency || 'quarterly';
        document.getElementById('autoReschedule').checked = reminder.autoReschedule !== false; // Default to true
        document.getElementById('dividendNotes').value = reminder.notes || '';

        // Show modal
        const modal = document.getElementById('dividendReminderModal');
        modal.classList.add('active');
    }

    handleAddDividendReminder() {
        try {
            const symbol = document.getElementById('dividendSymbol').value.toUpperCase();
            const exDate = document.getElementById('dividendExDate').value;
            const payDate = document.getElementById('dividendPayDate').value;
            const perShare = parseFloat(document.getElementById('dividendPerShare').value);
            const frequency = document.getElementById('dividendFrequency').value;
            const autoReschedule = document.getElementById('autoReschedule').checked;
            const notes = document.getElementById('dividendNotes').value;

            if (!symbol || !exDate || !payDate || !perShare || !frequency) {
                this.showMessage('Please fill in all required fields', 'error');
                return;
            }

            if (this.editingReminderId) {
                // Edit existing reminder
                const reminderIndex = this.dividendReminders.findIndex(r => r.id === this.editingReminderId);
                if (reminderIndex === -1) {
                    this.showMessage('Reminder not found', 'error');
                    return;
                }

                const existingReminder = this.dividendReminders[reminderIndex];
                
                // Update the reminder while preserving creation date and times advanced
                this.dividendReminders[reminderIndex] = {
                    ...existingReminder,
                    symbol: symbol,
                    exDate: exDate,
                    payDate: payDate,
                    dividendPerShare: perShare,
                    frequency: frequency,
                    autoReschedule: autoReschedule,
                    notes: notes,
                    updatedAt: new Date().toISOString()
                };

                this.saveDividendReminders();
                this.renderDividendReminders();
                this.hideDividendReminderModal();
                
                this.showMessage(`Dividend reminder updated for ${symbol}`, 'success');
                this.showToast(`${symbol} reminder updated for ${payDate}`, 'success');

            } else {
                // Add new reminder
                const reminder = {
                    id: Date.now().toString(),
                    symbol: symbol,
                    exDate: exDate,
                    payDate: payDate,
                    dividendPerShare: perShare,
                    frequency: frequency,
                    autoReschedule: autoReschedule,
                    notes: notes,
                    createdAt: new Date().toISOString(),
                    timesAdvanced: 0 // Track how many times this has been automatically advanced
                };

                this.dividendReminders.push(reminder);
                this.saveDividendReminders();
                this.renderDividendReminders();
                this.hideDividendReminderModal();
                
                this.showMessage(`Dividend reminder added for ${symbol}`, 'success');
                this.showToast(`Dividend reminder set for ${symbol} on ${payDate}`, 'success');
            }

        } catch (error) {
            console.error('Error saving dividend reminder:', error);
            this.showMessage('Error saving dividend reminder: ' + error.message, 'error');
        }
    }

    renderDividendReminders() {
        const container = document.getElementById('dividendReminders');
        const advanceBtn = document.getElementById('advanceOverdueBtn');
        
        if (this.dividendReminders.length === 0) {
            container.innerHTML = '<p class="empty-state">No upcoming dividend payments</p>';
            advanceBtn.style.display = 'none';
            return;
        }

        // Sort by payment date
        const sortedReminders = [...this.dividendReminders].sort((a, b) => 
            new Date(a.payDate) - new Date(b.payDate)
        );

        const today = new Date();
        let hasOverdue = false;
        
        container.innerHTML = sortedReminders.map(reminder => {
            const payDate = new Date(reminder.payDate);
            const exDate = new Date(reminder.exDate);
            const daysToPayment = Math.ceil((payDate - today) / (1000 * 60 * 60 * 24));
            
            let statusClass = '';
            let statusText = '';
            
            if (daysToPayment < 0) {
                statusClass = 'overdue';
                statusText = `${Math.abs(daysToPayment)} days ago`;
                hasOverdue = true;
            } else if (daysToPayment <= 7) {
                statusClass = 'upcoming';
                statusText = daysToPayment === 0 ? 'Today' : `${daysToPayment} days`;
            } else {
                statusText = `${daysToPayment} days`;
            }

            // Calculate expected total based on holdings
            const holdings = this.getHoldingsForStock(reminder.symbol);
            const expectedTotal = holdings * reminder.dividendPerShare;

            // Format frequency display
            const frequencyDisplay = this.getFrequencyDisplay(reminder.frequency);
            const advancedText = reminder.timesAdvanced > 0 ? ` (advanced ${reminder.timesAdvanced}x)` : '';

            return `
                <div class="dividend-reminder-item ${statusClass}">
                    <div class="dividend-reminder-main">
                        <div class="dividend-reminder-symbol">${reminder.symbol}</div>
                        <div class="dividend-reminder-details">
                            $${reminder.dividendPerShare.toFixed(3)}/share • ${frequencyDisplay} • ${statusText}${advancedText}
                            ${reminder.notes ? ` • ${reminder.notes}` : ''}
                        </div>
                    </div>
                    <div class="dividend-reminder-amount">
                        <div class="dividend-reminder-value">
                            ${expectedTotal > 0 ? `~$${expectedTotal.toFixed(2)}` : 'No holdings'}
                        </div>
                        <div class="dividend-reminder-date">${payDate.toLocaleDateString()}</div>
                    </div>
                    <div class="dividend-reminder-actions">
                        ${daysToPayment < 0 && reminder.frequency !== 'special' && reminder.autoReschedule ? 
                            `<button class="btn btn-sm" onclick="investmentDashboard.advanceSingleReminder('${reminder.id}')" style="background: #ffc107; color: #000; margin-right: 5px;">⏭</button>` : 
                            ''}
                        <button class="btn btn-sm" onclick="investmentDashboard.editDividendReminder('${reminder.id}')" style="background: #667eea; color: white; margin-right: 5px;">✏️</button>
                        <button class="dividend-reminder-delete" onclick="investmentDashboard.deleteDividendReminder('${reminder.id}')">×</button>
                    </div>
                </div>
            `;
        }).join('');

        // Show/hide advance overdue button
        advanceBtn.style.display = hasOverdue ? 'block' : 'none';
    }

    getFrequencyDisplay(frequency) {
        const frequencyMap = {
            'weekly': 'Weekly',
            'monthly': 'Monthly', 
            'quarterly': 'Quarterly',
            'semi-annually': 'Semi-Annual',
            'annually': 'Annual',
            'special': 'One-time'
        };
        return frequencyMap[frequency] || frequency;
    }

    getHoldingsForStock(symbol) {
        const holdings = this.calculateDetailedPortfolioStats().holdings[symbol];
        return holdings ? holdings.shares : 0;
    }

    deleteDividendReminder(reminderId) {
        if (confirm('Are you sure you want to delete this dividend reminder?')) {
            this.dividendReminders = this.dividendReminders.filter(r => r.id !== reminderId);
            this.saveDividendReminders();
            this.renderDividendReminders();
            this.showToast('Dividend reminder deleted', 'success');
        }
    }

    advanceSingleReminder(reminderId) {
        const reminder = this.dividendReminders.find(r => r.id === reminderId);
        if (!reminder) return;

        if (reminder.frequency === 'special') {
            this.showMessage('Cannot advance one-time dividend reminders', 'warning');
            return;
        }

        const newDates = this.calculateNextDividendDates(reminder.payDate, reminder.exDate, reminder.frequency);
        
        // Update the reminder
        reminder.payDate = newDates.payDate;
        reminder.exDate = newDates.exDate;
        reminder.timesAdvanced = (reminder.timesAdvanced || 0) + 1;

        this.saveDividendReminders();
        this.renderDividendReminders();
        this.showToast(`${reminder.symbol} reminder advanced to ${newDates.payDate}`, 'success');
    }

    advanceOverdueReminders() {
        const today = new Date();
        let advancedCount = 0;

        this.dividendReminders.forEach(reminder => {
            const payDate = new Date(reminder.payDate);
            const isOverdue = payDate < today;
            
            if (isOverdue && reminder.autoReschedule && reminder.frequency !== 'special') {
                const newDates = this.calculateNextDividendDates(reminder.payDate, reminder.exDate, reminder.frequency);
                reminder.payDate = newDates.payDate;
                reminder.exDate = newDates.exDate;
                reminder.timesAdvanced = (reminder.timesAdvanced || 0) + 1;
                advancedCount++;
            }
        });

        if (advancedCount > 0) {
            this.saveDividendReminders();
            this.renderDividendReminders();
            this.showToast(`Advanced ${advancedCount} overdue reminder${advancedCount > 1 ? 's' : ''}`, 'success');
        } else {
            this.showMessage('No eligible overdue reminders to advance', 'warning');
        }
    }

    calculateNextDividendDates(currentPayDate, currentExDate, frequency) {
        const payDate = new Date(currentPayDate);
        const exDate = new Date(currentExDate);
        
        // Calculate the gap between ex-date and pay-date
        const gapDays = Math.ceil((payDate - exDate) / (1000 * 60 * 60 * 24));

        let monthsToAdd = 0;
        let daysToAdd = 0;

        switch (frequency) {
            case 'weekly':
                daysToAdd = 7;
                break;
            case 'monthly':
                monthsToAdd = 1;
                break;
            case 'quarterly':
                monthsToAdd = 3;
                break;
            case 'semi-annually':
                monthsToAdd = 6;
                break;
            case 'annually':
                monthsToAdd = 12;
                break;
            default:
                // Default to quarterly if unknown
                monthsToAdd = 3;
        }

        // Calculate new payment date
        let newPayDate = new Date(payDate);
        if (monthsToAdd > 0) {
            newPayDate.setMonth(newPayDate.getMonth() + monthsToAdd);
        } else {
            newPayDate.setDate(newPayDate.getDate() + daysToAdd);
        }

        // Calculate new ex-date (maintain the same gap)
        let newExDate = new Date(newPayDate);
        newExDate.setDate(newExDate.getDate() - gapDays);

        return {
            payDate: newPayDate.toISOString().split('T')[0],
            exDate: newExDate.toISOString().split('T')[0]
        };
    }

    // Enhanced Portfolio Transaction Handling
    handlePortfolioTransaction() {
        try {
            const type = document.getElementById('transactionType').value;
            const symbol = document.getElementById('transactionSymbol').value;
            const date = document.getElementById('transactionDate').value;

            let transaction;

            if (type === 'dividend') {
                const dividendAmount = parseFloat(document.getElementById('dividendAmount').value);
                const isReinvested = document.getElementById('dividendReinvested').checked;
                
                if (!symbol || !dividendAmount || !date) {
                    this.showMessage('Please fill in all required fields', 'error');
                    return;
                }

                if (dividendAmount <= 0) {
                    this.showMessage('Dividend amount must be greater than 0', 'error');
                    return;
                }

                transaction = {
                    id: Date.now().toString(),
                    symbol: symbol,
                    type: 'dividend',
                    dividendAmount: dividendAmount,
                    shares: 0, // Not applicable for dividends
                    price: 0,  // Not applicable for dividends
                    date: date,
                    timestamp: new Date().toISOString(),
                    reinvested: isReinvested
                };

                // If reinvested, also add a buy transaction
                if (isReinvested) {
                    const reinvestShares = parseFloat(document.getElementById('reinvestmentShares').value);
                    const reinvestPrice = parseFloat(document.getElementById('reinvestmentPrice').value);
                    
                    if (!reinvestShares || !reinvestPrice) {
                        this.showMessage('Please enter reinvestment shares and price', 'error');
                        return;
                    }

                    if (reinvestShares <= 0 || reinvestPrice <= 0) {
                        this.showMessage('Reinvestment shares and price must be greater than 0', 'error');
                        return;
                    }

                    // Create a separate buy transaction for the reinvestment
                    const reinvestmentTransaction = {
                        id: (Date.now() + 1).toString(), // Ensure unique ID
                        symbol: symbol,
                        type: 'buy',
                        shares: reinvestShares,
                        price: reinvestPrice,
                        date: date,
                        timestamp: new Date().toISOString(),
                        isDRIP: true, // Mark as dividend reinvestment
                        dividendTransactionId: transaction.id
                    };

                    this.portfolio.push(reinvestmentTransaction);
                    this.showMessage(`Dividend of $${dividendAmount} recorded and reinvested into ${reinvestShares} shares`, 'success');
                    this.showToast(`DRIP: $${dividendAmount} → ${reinvestShares} shares of ${symbol}`, 'success');
                } else {
                    this.showMessage(`Dividend payment of $${dividendAmount} recorded for ${symbol}`, 'success');
                    this.showToast(`Dividend recorded: $${dividendAmount} from ${symbol}`, 'success');
                }

            } else {
                // Existing buy/sell logic
                const shares = parseFloat(document.getElementById('transactionShares').value);
                const price = parseFloat(document.getElementById('transactionPrice').value);

                if (!symbol || !shares || !price || !date) {
                    this.showMessage('Please fill in all required fields', 'error');
                    return;
                }

                if (shares <= 0 || price <= 0) {
                    this.showMessage('Shares and price must be greater than 0', 'error');
                    return;
                }

                transaction = {
                    id: Date.now().toString(),
                    symbol: symbol,
                    type: type,
                    shares: shares,
                    price: price,
                    date: date,
                    timestamp: new Date().toISOString()
                };

                const action = type === 'buy' ? 'purchased' : 'sold';
                this.showMessage(`Successfully ${action} ${shares} shares of ${symbol}`, 'success');
                this.showToast(`Transaction recorded: ${action} ${shares} shares of ${symbol}`, 'success');
            }

            this.portfolio.push(transaction);
            
            // Handle cash management
            this.updateCashForTransaction(transaction);
            
            // Update dividend reminders if holdings changed
            this.updateDividendRemindersForHoldings();
            
            this.savePortfolio();
            this.updatePortfolioSummary();
            this.hidePortfolioModal();
            
            // Refresh prices after transaction
            setTimeout(() => this.refreshCurrentPrices(), 1000);

        } catch (error) {
            console.error('Error handling portfolio transaction:', error);
            this.showMessage('Error recording transaction: ' + error.message, 'error');
        }
    }

    updateCashForTransaction(transaction) {
        if (transaction.type === 'buy' || transaction.isDRIP) {
            // Subtract cash for purchases (except DRIP which uses dividend cash)
            if (!transaction.isDRIP) {
                const totalCost = transaction.shares * transaction.price;
                this.cashBalance -= totalCost;
                this.saveCashBalance();
            }
        } else if (transaction.type === 'sell') {
            // Add cash for sales
            const totalProceeds = transaction.shares * transaction.price;
            this.cashBalance += totalProceeds;
            this.saveCashBalance();
        } else if (transaction.type === 'dividend' && !transaction.reinvested) {
            // Add cash for cash dividends
            this.cashBalance += transaction.dividendAmount;
            this.saveCashBalance();
        }
    }

    updateDividendRemindersForHoldings() {
        // Update dividend reminder expected amounts based on current holdings
        this.dividendReminders.forEach(reminder => {
            const holdings = this.getHoldingsForStock(reminder.symbol);
            // This automatically updates the display when reminders are re-rendered
        });
        this.renderDividendReminders();
    }

    // Data Management for Dividend Reminders
    loadDividendReminders() {
        try {
            const data = localStorage.getItem('lifeos_investments_dividend_reminders');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading dividend reminders:', error);
            return [];
        }
    }

    saveDividendReminders() {
        try {
            localStorage.setItem('lifeos_investments_dividend_reminders', JSON.stringify(this.dividendReminders));
        } catch (error) {
            console.error('Error saving dividend reminders:', error);
        }
    }

    loadCashBalance() {
        try {
            const data = localStorage.getItem('lifeos_investments_cash_balance');
            return data ? parseFloat(data) : 0;
        } catch (error) {
            console.error('Error loading cash balance:', error);
            return 0;
        }
    }

    saveCashBalance() {
        try {
            localStorage.setItem('lifeos_investments_cash_balance', this.cashBalance.toString());
        } catch (error) {
            console.error('Error saving cash balance:', error);
        }
    }

    // Forward Dividend Income Projections
    renderDividendProjectionsChart() {
        try {
            const canvas = document.getElementById('dividendProjectionsChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            
            // Destroy existing chart
            if (this.dividendProjectionsChart) {
                this.dividendProjectionsChart.destroy();
                this.dividendProjectionsChart = null;
            }

            const projectionData = this.calculateDividendProjections();
            
            if (!projectionData || projectionData.monthlyProjections.length === 0) {
                this.showDividendProjectionsEmptyState();
                return;
            }

            // Create chart data
            const chartData = {
                labels: projectionData.monthlyProjections.map(p => p.monthLabel),
                datasets: [
                    {
                        label: 'Projected Dividend Income',
                        data: projectionData.monthlyProjections.map(p => p.amount),
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderColor: 'rgba(40, 167, 69, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(40, 167, 69, 1)',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: 'Cumulative Income',
                        data: projectionData.monthlyProjections.map(p => p.cumulative),
                        backgroundColor: 'rgba(103, 126, 234, 0.1)',
                        borderColor: 'rgba(103, 126, 234, 1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(103, 126, 234, 1)',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        yAxisID: 'y1'
                    }
                ]
            };

            // Chart configuration
            const config = {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: false
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: (context) => {
                                    const value = context.parsed.y;
                                    return `${context.dataset.label}: $${value.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Month'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Monthly Income ($)'
                            },
                            beginAtZero: true
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Cumulative Income ($)'
                            },
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false,
                            },
                        }
                    }
                }
            };

            // Create the chart
            this.dividendProjectionsChart = new Chart(ctx, config);

            // Update metrics display
            this.updateDividendProjectionsMetrics(projectionData);
            this.renderDividendCalendar(projectionData);

        } catch (error) {
            console.error('Error rendering dividend projections chart:', error);
            this.showDividendProjectionsEmptyState();
        }
    }

    calculateDividendProjections() {
        try {
            const periodMonths = parseInt(document.getElementById('projectionPeriod').value);
            const holdings = this.calculateDetailedPortfolioStats().holdings;
            const dividendYields = this.calculateDividendYields();
            
            if (Object.keys(holdings).length === 0) {
                return null;
            }

            const projections = [];
            const currentDate = new Date();
            const dividendCalendar = [];
            
            // For each month in the projection period
            for (let monthOffset = 0; monthOffset < periodMonths; monthOffset++) {
                const projectionDate = new Date(currentDate);
                projectionDate.setMonth(projectionDate.getMonth() + monthOffset);
                
                let monthlyIncome = 0;
                const monthLabel = projectionDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: projectionDate.getFullYear() !== currentDate.getFullYear() ? 'numeric' : undefined 
                });

                // Calculate expected dividends for this month from each holding
                Object.entries(holdings).forEach(([symbol, holding]) => {
                    if (holding.shares > 0 && dividendYields[symbol]) {
                        const yieldData = dividendYields[symbol];
                        
                        // Estimate monthly dividend based on typical quarterly payments
                        // Most stocks pay quarterly, so divide annual dividend by 4 and then by 3 months
                        const estimatedMonthlyDividend = (yieldData.projectedAnnualIncome / 4) / 3;
                        
                        // Add some variation based on typical dividend calendars
                        // Many stocks pay in specific months (Mar, Jun, Sep, Dec)
                        const month = projectionDate.getMonth() + 1;
                        let multiplier = 0.33; // Base monthly allocation
                        
                        // Boost for typical dividend months (quarterly pattern)
                        if (month % 3 === 0) { // Mar, Jun, Sep, Dec
                            multiplier = 1.0; // Full quarterly dividend
                        }
                        
                        const monthlyDividendIncome = yieldData.projectedAnnualIncome * multiplier / 4;
                        monthlyIncome += monthlyDividendIncome;
                        
                        // Add to calendar if significant amount
                        if (monthlyDividendIncome > 1) {
                            dividendCalendar.push({
                                symbol: symbol,
                                amount: monthlyDividendIncome,
                                month: monthLabel,
                                date: projectionDate.toISOString().split('T')[0],
                                frequency: 'quarterly', // Assumed
                                shares: holding.shares,
                                estimatedPerShare: monthlyDividendIncome / holding.shares
                            });
                        }
                    }
                });

                projections.push({
                    month: monthOffset,
                    monthLabel: monthLabel,
                    amount: monthlyIncome,
                    cumulative: projections.reduce((sum, p) => sum + p.amount, 0) + monthlyIncome
                });
            }

            // Calculate additional metrics
            const totalPeriodIncome = projections.reduce((sum, p) => sum + p.amount, 0);
            const annualizedIncome = (totalPeriodIncome / periodMonths) * 12;
            const avgQuarterlyPayment = annualizedIncome / 4;
            const totalPortfolioValue = this.calculatePortfolioPerformance().totalPortfolioValue;
            const portfolioYield = totalPortfolioValue > 0 ? (annualizedIncome / totalPortfolioValue) * 100 : 0;

            return {
                monthlyProjections: projections,
                dividendCalendar: dividendCalendar,
                metrics: {
                    expectedPeriodIncome: totalPeriodIncome,
                    annualizedIncome: annualizedIncome,
                    avgQuarterlyPayment: avgQuarterlyPayment,
                    portfolioYield: portfolioYield,
                    periodMonths: periodMonths
                }
            };

        } catch (error) {
            console.error('Error calculating dividend projections:', error);
            return null;
        }
    }

    updateDividendProjectionsMetrics(projectionData) {
        const { metrics } = projectionData;
        
        document.getElementById('expectedPeriodIncome').textContent = `$${metrics.expectedPeriodIncome.toFixed(2)}`;
        document.getElementById('annualizedIncome').textContent = `$${metrics.annualizedIncome.toFixed(2)}`;
        document.getElementById('avgQuarterlyPayment').textContent = `$${metrics.avgQuarterlyPayment.toFixed(2)}`;
        document.getElementById('portfolioYield').textContent = `${metrics.portfolioYield.toFixed(2)}%`;
        
        // Apply color coding to yield
        const yieldElement = document.getElementById('portfolioYield');
        if (metrics.portfolioYield >= 4) {
            yieldElement.style.color = '#28a745'; // High yield - green
        } else if (metrics.portfolioYield >= 2) {
            yieldElement.style.color = '#ffc107'; // Moderate yield - yellow
        } else {
            yieldElement.style.color = '#6c757d'; // Low yield - gray
        }
    }

    renderDividendCalendar(projectionData) {
        const container = document.getElementById('dividendCalendar');
        
        if (!projectionData.dividendCalendar || projectionData.dividendCalendar.length === 0) {
            container.innerHTML = '<div class="dividend-empty-state">No significant dividend payments projected for this period</div>';
            return;
        }

        // Sort by amount (highest first) and limit to top entries
        const sortedDividends = projectionData.dividendCalendar
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8); // Show top 8 entries

        container.innerHTML = sortedDividends.map(dividend => {
            return `
                <div class="dividend-calendar-item dividend-calendar-${dividend.frequency}">
                    <div class="dividend-calendar-left">
                        <div class="dividend-calendar-symbol">${dividend.symbol}</div>
                        <div class="dividend-calendar-date">${dividend.month} • ~${dividend.shares.toFixed(0)} shares • $${dividend.estimatedPerShare.toFixed(3)}/share</div>
                    </div>
                    <div class="dividend-calendar-amount">$${dividend.amount.toFixed(2)}</div>
                </div>
            `;
        }).join('');

        // Add summary if there are more dividends
        if (projectionData.dividendCalendar.length > 8) {
            const remainingCount = projectionData.dividendCalendar.length - 8;
            const remainingAmount = projectionData.dividendCalendar
                .slice(8)
                .reduce((sum, d) => sum + d.amount, 0);
            
            container.innerHTML += `
                <div class="projection-summary">
                    <div class="projection-summary-title">Additional Projections</div>
                    <div class="projection-summary-text">
                        ${remainingCount} more dividend payment${remainingCount > 1 ? 's' : ''} 
                        projected for approximately $${remainingAmount.toFixed(2)} additional income.
                    </div>
                </div>
            `;
        }
    }

    showDividendProjectionsEmptyState() {
        const container = document.getElementById('dividendCalendar');
        container.innerHTML = '<div class="dividend-empty-state">No portfolio holdings with dividend history to project from</div>';
        
        // Clear metrics
        document.getElementById('expectedPeriodIncome').textContent = '$0.00';
        document.getElementById('annualizedIncome').textContent = '$0.00';
        document.getElementById('avgQuarterlyPayment').textContent = '$0.00';
        document.getElementById('portfolioYield').textContent = '0.00%';
    }

    updateDividendProjections() {
        this.renderDividendProjectionsChart();
        this.showToast('Dividend projections updated', 'success');
    }

    // Demo chart for performance when no data exists
    renderPerformanceDemoChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.performanceChart) {
            this.performanceChart.destroy();
            this.performanceChart = null;
        }

        // Generate demo data for the last 30 days
        const demoData = [];
        const today = new Date();
        let value = 10000; // Starting value
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Simulate some market movement
            const change = (Math.random() - 0.5) * 200; // Random change between -100 and +100
            value += change;
            
            demoData.push({
                date: date.toISOString().split('T')[0],
                value: Math.max(value, 8000) // Don't go below 8000
            });
        }

        // Update demo metrics
        document.getElementById('periodReturn').textContent = '+2.47%';
        document.getElementById('periodReturn').className = 'metric-value performance-positive';
        document.getElementById('bestDay').textContent = '+1.23%';
        document.getElementById('bestDay').className = 'metric-value performance-positive';
        document.getElementById('worstDay').textContent = '-0.87%';
        document.getElementById('worstDay').className = 'metric-value performance-negative';
        document.getElementById('volatility').textContent = '1.15%';

        // Create chart
        const chartData = {
            labels: demoData.map(d => new Date(d.date).toLocaleDateString()),
            datasets: [{
                label: 'Portfolio Value (Demo)',
                data: demoData.map(d => d.value),
                borderColor: 'rgba(103, 126, 234, 1)',
                backgroundColor: 'rgba(103, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };

        const config = {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Demo Portfolio Performance (Add transactions to see real data)',
                        color: '#666',
                        font: { size: 12 }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: 'Portfolio Value ($)' }
                    },
                    x: {
                        title: { display: true, text: 'Date' }
                    }
                }
            }
        };

        this.performanceChart = new Chart(ctx, config);
    }

    // Demo chart for benchmark comparison when no data exists
    renderBenchmarkDemoChart() {
        const canvas = document.getElementById('benchmarkChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.benchmarkChart) {
            this.benchmarkChart.destroy();
            this.benchmarkChart = null;
        }

        // Generate demo data for portfolio vs S&P 500
        const demoData = [];
        const today = new Date();
        let portfolioValue = 100; // Starting at 100%
        let sp500Value = 100;
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Simulate portfolio outperforming slightly
            const portfolioChange = (Math.random() - 0.45) * 2; // Slight positive bias
            const sp500Change = (Math.random() - 0.5) * 1.8;
            
            portfolioValue += portfolioChange;
            sp500Value += sp500Change;
            
            demoData.push({
                date: date.toISOString().split('T')[0],
                portfolio: Math.max(portfolioValue, 95),
                sp500: Math.max(sp500Value, 95)
            });
        }

        // Update demo metrics
        document.getElementById('portfolioBenchmarkReturn').textContent = '+3.21%';
        document.getElementById('portfolioBenchmarkReturn').className = 'metric-value performance-positive';
        document.getElementById('sp500Return').textContent = '+2.89%';
        document.getElementById('sp500Return').className = 'metric-value performance-positive';
        document.getElementById('alphaValue').textContent = '+0.32%';
        document.getElementById('alphaValue').className = 'metric-value performance-positive';
        document.getElementById('betaValue').textContent = '1.12';

        // Clear insights for demo
        document.getElementById('benchmarkInsights').innerHTML = `
            <div class="insight-item insight-positive">
                <span class="insight-icon">📈</span>
                <span>Demo data showing portfolio slightly outperforming S&P 500</span>
            </div>
            <div class="insight-item insight-neutral">
                <span class="insight-icon">ℹ️</span>
                <span>Add portfolio transactions to see real benchmark comparison</span>
            </div>
        `;

        // Create chart
        const chartData = {
            labels: demoData.map(d => new Date(d.date).toLocaleDateString()),
            datasets: [
                {
                    label: 'Portfolio (Demo)',
                    data: demoData.map(d => d.portfolio),
                    borderColor: 'rgba(103, 126, 234, 1)',
                    backgroundColor: 'rgba(103, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'S&P 500',
                    data: demoData.map(d => d.sp500),
                    borderColor: 'rgba(255, 193, 7, 1)',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }
            ]
        };

        const config = {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Demo Benchmark Comparison (Add portfolio data to see real comparison)',
                        color: '#666',
                        font: { size: 12 }
                    },
                    legend: { 
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: 'Normalized Performance (%)' }
                    },
                    x: {
                        title: { display: true, text: 'Date' }
                    }
                }
            }
        };

        this.benchmarkChart = new Chart(ctx, config);
    }

    // Helper function to calculate shares held at a specific date
    calculateSharesAtDate(symbol, targetDate) {
        try {
            const targetDateTime = new Date(targetDate);
            let totalShares = 0;
            
            // Get all transactions for this symbol up to the target date
            const relevantTransactions = this.portfolio
                .filter(t => 
                    t.symbol === symbol && 
                    new Date(t.date) <= targetDateTime &&
                    (t.type === 'buy' || t.type === 'sell')
                )
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Calculate shares held by processing transactions chronologically
            relevantTransactions.forEach(transaction => {
                if (transaction.type === 'buy') {
                    totalShares += transaction.shares;
                } else if (transaction.type === 'sell') {
                    totalShares -= transaction.shares;
                }
            });
            
            return Math.max(totalShares, 0); // Don't return negative shares
        } catch (error) {
            console.error('Error calculating shares at date:', error);
            return 0;
        }
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.investmentDashboard = new InvestmentDashboard();
});