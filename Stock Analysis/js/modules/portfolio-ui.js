// Portfolio UI Management
export class PortfolioUI {
    
    constructor(portfolioManager, ui, chart) {
        this.portfolioManager = portfolioManager;
        this.ui = ui;
        this.chart = chart;
        this.currentView = 'overview';
    }

    /**
     * Initialize portfolio UI
     */
    async initialize() {
        this.createPortfolioTab();
        this.setupEventListeners();
        await this.loadAvailablePortfolios();
    }

    /**
     * Create portfolio tab in the main interface
     */
    createPortfolioTab() {
        // Add portfolio tab to the left sidebar
        const watchlistSection = document.querySelector('#watchlist').parentElement;
        
        const portfolioSection = document.createElement('div');
        portfolioSection.className = 'bg-gray-800 p-6 rounded-lg shadow-lg mt-8';
        portfolioSection.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Portfolio</h2>
                <button id="portfolioToggle" class="text-blue-400 hover:text-blue-300 text-sm">
                    View →
                </button>
            </div>
            
            <!-- Portfolio Selection/Creation -->
            <div id="portfolioSelection" class="mb-4">
                <div class="flex gap-2 mb-2">
                    <select id="portfolioSelect" class="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm">
                        <option value="">Select Portfolio...</option>
                    </select>
                    <button id="createPortfolioBtn" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
                        New
                    </button>
                </div>
                <div id="noPortfolioMessage" class="text-sm text-yellow-400 hidden">
                    Create a portfolio to start tracking investments!
                </div>
            </div>
            
            <div id="portfolioPreview" class="space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-400">Total Value:</span>
                    <span id="portfolioTotalValue" class="font-medium">$0.00</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-400">Total Return:</span>
                    <span id="portfolioTotalReturn" class="font-medium">$0.00 (0.00%)</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-400">Holdings:</span>
                    <span id="portfolioHoldingsCount" class="font-medium">0</span>
                </div>
            </div>
        `;
        
        watchlistSection.parentNode.insertBefore(portfolioSection, watchlistSection.nextSibling);
    }

    /**
     * Create portfolio main view
     */
    createPortfolioMainView() {
        const dashboard = document.getElementById('dashboard');
        
        // Hide stock dashboard, show portfolio view
        dashboard.innerHTML = `
            <div id="portfolioMainView">
                <!-- Portfolio Header -->
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-3xl font-bold">Portfolio Dashboard</h2>
                        <p class="text-gray-400">Track your investments and performance</p>
                    </div>
                    <div class="flex gap-3">
                        <button id="addTransactionBtn" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                            Add Transaction
                        </button>
                        <button id="backToStocksBtn" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">
                            Back to Stocks
                        </button>
                    </div>
                </div>

                <!-- Portfolio Metrics Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 class="text-gray-400 text-sm font-medium">Total Value</h3>
                        <p id="portfolioValueLarge" class="text-2xl font-bold text-green-400 mt-2">$0.00</p>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 class="text-gray-400 text-sm font-medium">Total Return</h3>
                        <p id="portfolioReturnLarge" class="text-2xl font-bold mt-2">$0.00</p>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 class="text-gray-400 text-sm font-medium">Cash</h3>
                        <p id="portfolioCashLarge" class="text-2xl font-bold text-white mt-2">$0.00</p>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 class="text-gray-400 text-sm font-medium">Holdings</h3>
                        <p id="portfolioHoldingsLarge" class="text-2xl font-bold text-white mt-2">0</p>
                    </div>
                </div>

                <!-- Portfolio Content Tabs -->
                <div class="mb-6">
                    <div class="border-b border-gray-700">
                        <nav class="-mb-px flex space-x-8">
                            <button id="holdingsTab" class="portfolio-tab border-b-2 border-blue-500 py-2 px-1 text-blue-400 font-medium">
                                Holdings
                            </button>
                            <button id="performanceTab" class="portfolio-tab border-b-2 border-transparent py-2 px-1 text-gray-400 hover:text-gray-300">
                                Performance
                            </button>
                            <button id="transactionsTab" class="portfolio-tab border-b-2 border-transparent py-2 px-1 text-gray-400 hover:text-gray-300">
                                Transactions
                            </button>
                            <button id="analyticsTab" class="portfolio-tab border-b-2 border-transparent py-2 px-1 text-gray-400 hover:text-gray-300">
                                Analytics
                            </button>
                        </nav>
                    </div>
                </div>

                <!-- Tab Content -->
                <div id="portfolioTabContent">
                    ${this.createHoldingsTabContent()}
                </div>
            </div>
        `;

        dashboard.classList.remove('hidden');
        this.setupPortfolioEventListeners();
    }

    /**
     * Create holdings tab content
     */
    createHoldingsTabContent() {
        return `
            <div id="holdingsContent" class="portfolio-tab-content">
                <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-700">
                        <h3 class="text-lg font-semibold">Current Holdings</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-700">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Symbol</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Shares</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Avg Cost</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Current Price</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Market Value</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Gain/Loss</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">%</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="holdingsTableBody" class="divide-y divide-gray-700">
                                <tr>
                                    <td colspan="8" class="px-6 py-8 text-center text-gray-400">
                                        No holdings yet. Add your first transaction to get started!
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create performance tab content
     */
    createPerformanceTabContent() {
        return `
            <div id="performanceContent" class="portfolio-tab-content hidden">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <!-- Performance Metrics -->
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 class="text-lg font-semibold mb-4">Performance Metrics</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-400">Total Return:</span>
                                <span id="perfTotalReturn" class="font-medium">$0.00 (0.00%)</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Annualized Return:</span>
                                <span id="perfAnnualizedReturn" class="font-medium">0.00%</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Volatility:</span>
                                <span id="perfVolatility" class="font-medium">0.00%</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Sharpe Ratio:</span>
                                <span id="perfSharpeRatio" class="font-medium">0.00</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Days Invested:</span>
                                <span id="perfDaysInvested" class="font-medium">0</span>
                            </div>
                        </div>
                    </div>

                    <!-- Sector Allocation -->
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 class="text-lg font-semibold mb-4">Sector Allocation</h3>
                        <canvas id="sectorChart" width="300" height="300"></canvas>
                    </div>
                </div>

                <!-- Portfolio Value Chart -->
                <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 class="text-lg font-semibold mb-4">Portfolio Value Over Time</h3>
                    <canvas id="portfolioChart" height="300"></canvas>
                </div>
            </div>
        `;
    }

    /**
     * Create add transaction modal
     */
    createTransactionModal() {
        const modal = document.createElement('div');
        modal.id = 'transactionModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Add Transaction</h3>
                    <button id="closeTransactionModal" class="text-gray-400 hover:text-white">✕</button>
                </div>
                
                <form id="transactionForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Type</label>
                        <select id="transactionType" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
                        <input type="text" id="transactionSymbol" placeholder="e.g., AAPL" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white uppercase">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Shares</label>
                            <input type="number" id="transactionShares" min="0.01" step="0.01" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Price ($)</label>
                            <input type="number" id="transactionPrice" min="0.01" step="0.01" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Date</label>
                        <input type="date" id="transactionDate" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Notes (Optional)</label>
                        <input type="text" id="transactionNotes" placeholder="Add notes..." class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                    </div>
                    
                    <div id="transactionTotal" class="text-sm text-gray-400"></div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                            Add Transaction
                        </button>
                        <button type="button" id="cancelTransaction" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Setup portfolio event listeners
     */
    setupPortfolioEventListeners() {
        // Portfolio toggle
        document.getElementById('portfolioToggle')?.addEventListener('click', () => {
            this.showPortfolioView();
        });

        // Back to stocks
        document.getElementById('backToStocksBtn')?.addEventListener('click', () => {
            this.showStockView();
        });

        // Add transaction
        document.getElementById('addTransactionBtn')?.addEventListener('click', () => {
            this.showTransactionModal();
        });

        // Tab switching
        document.querySelectorAll('.portfolio-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.id.replace('Tab', ''));
            });
        });

        // Portfolio selection and creation
        document.getElementById('portfolioSelect')?.addEventListener('change', (e) => {
            this.selectPortfolio(e.target.value);
        });

        document.getElementById('createPortfolioBtn')?.addEventListener('click', () => {
            this.showCreatePortfolioModal();
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Calculate transaction total when inputs change
        document.addEventListener('input', (e) => {
            if (e.target.id === 'transactionShares' || e.target.id === 'transactionPrice') {
                this.updateTransactionTotal();
            }
        });
    }

    /**
     * Show portfolio view
     */
    showPortfolioView() {
        this.createPortfolioMainView();
        this.updatePortfolioDisplay();
        this.currentView = 'portfolio';
    }

    /**
     * Show stock view
     */
    showStockView() {
        // This would restore the original stock dashboard
        location.reload(); // Simple approach for now
    }

    /**
     * Show transaction modal
     */
    showTransactionModal() {
        if (!document.getElementById('transactionModal')) {
            this.createTransactionModal();
            this.setupTransactionModalListeners();
        }
        
        // Set default date to today
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        
        document.getElementById('transactionModal').classList.remove('hidden');
    }

    /**
     * Setup transaction modal listeners
     */
    setupTransactionModalListeners() {
        const modal = document.getElementById('transactionModal');
        
        // Close modal
        document.getElementById('closeTransactionModal').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        document.getElementById('cancelTransaction').addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        // Submit transaction
        document.getElementById('transactionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleTransactionSubmit();
        });
    }

    /**
     * Handle transaction form submission
     */
    async handleTransactionSubmit() {
        // Check if portfolio is selected
        if (!this.portfolioManager.currentPortfolio) {
            this.ui.showError('Please select or create a portfolio first.');
            return;
        }

        const type = document.getElementById('transactionType').value;
        const symbol = document.getElementById('transactionSymbol').value.toUpperCase();
        const shares = parseFloat(document.getElementById('transactionShares').value);
        const price = parseFloat(document.getElementById('transactionPrice').value);
        const date = new Date(document.getElementById('transactionDate').value);
        const notes = document.getElementById('transactionNotes').value;

        try {
            if (type === 'buy') {
                await this.portfolioManager.buyStock(symbol, shares, price, date, notes);
            } else {
                await this.portfolioManager.sellStock(symbol, shares, price, date);
            }

            // Close modal and update display
            document.getElementById('transactionModal').classList.add('hidden');
            this.updatePortfolioDisplay();
            
            // Show success message
            this.ui.showSuccess(`${type === 'buy' ? 'Bought' : 'Sold'} ${shares} shares of ${symbol}`);
            
        } catch (error) {
            this.ui.showError(error.message);
        }
    }

    /**
     * Update transaction total display
     */
    updateTransactionTotal() {
        const shares = parseFloat(document.getElementById('transactionShares').value) || 0;
        const price = parseFloat(document.getElementById('transactionPrice').value) || 0;
        const total = shares * price;
        
        document.getElementById('transactionTotal').textContent = 
            `Total: $${total.toFixed(2)}`;
    }

    /**
     * Switch portfolio tabs
     */
    switchTab(tabName) {
        // Update tab styling
        document.querySelectorAll('.portfolio-tab').forEach(tab => {
            tab.classList.remove('border-blue-500', 'text-blue-400');
            tab.classList.add('border-transparent', 'text-gray-400');
        });
        
        document.getElementById(tabName + 'Tab').classList.remove('border-transparent', 'text-gray-400');
        document.getElementById(tabName + 'Tab').classList.add('border-blue-500', 'text-blue-400');

        // Update content
        const tabContent = document.getElementById('portfolioTabContent');
        switch(tabName) {
            case 'holdings':
                tabContent.innerHTML = this.createHoldingsTabContent();
                this.updateHoldingsTable();
                break;
            case 'performance':
                tabContent.innerHTML = this.createPerformanceTabContent();
                this.updatePerformanceTab();
                break;
            case 'transactions':
                tabContent.innerHTML = this.createTransactionsTabContent();
                this.updateTransactionsTable();
                break;
            case 'analytics':
                tabContent.innerHTML = this.createAnalyticsTabContent();
                this.updateAnalyticsTab();
                break;
        }
    }

    /**
     * Update portfolio display
     */
    updatePortfolioDisplay() {
        if (!this.portfolioManager.currentPortfolio) return;

        const metrics = this.portfolioManager.getPerformanceMetrics();
        
        // Update preview (sidebar)
        const totalValueEl = document.getElementById('portfolioTotalValue');
        const totalReturnEl = document.getElementById('portfolioTotalReturn');
        const holdingsCountEl = document.getElementById('portfolioHoldingsCount');
        
        if (totalValueEl) {
            totalValueEl.textContent = `$${metrics.totalValue.toFixed(2)}`;
        }
        
        if (totalReturnEl) {
            const returnClass = metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400';
            totalReturnEl.textContent = `$${metrics.totalReturn.toFixed(2)} (${metrics.totalReturnPercent.toFixed(2)}%)`;
            totalReturnEl.className = `font-medium ${returnClass}`;
        }
        
        if (holdingsCountEl) {
            holdingsCountEl.textContent = this.portfolioManager.currentPortfolio.holdings.size.toString();
        }

        // Update main view if visible
        if (this.currentView === 'portfolio') {
            this.updatePortfolioMainDisplay(metrics);
        }
    }

    /**
     * Update main portfolio display
     */
    updatePortfolioMainDisplay(metrics) {
        document.getElementById('portfolioValueLarge').textContent = `$${metrics.totalValue.toFixed(2)}`;
        
        const returnEl = document.getElementById('portfolioReturnLarge');
        returnEl.textContent = `$${metrics.totalReturn.toFixed(2)}`;
        returnEl.className = `text-2xl font-bold mt-2 ${metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`;
        
        document.getElementById('portfolioCashLarge').textContent = `$${metrics.cash.toFixed(2)}`;
        document.getElementById('portfolioHoldingsLarge').textContent = this.portfolioManager.currentPortfolio.holdings.size.toString();
    }

    /**
     * Show create portfolio modal
     */
    showCreatePortfolioModal() {
        if (!document.getElementById('createPortfolioModal')) {
            this.createPortfolioModal();
        }
        document.getElementById('createPortfolioModal').classList.remove('hidden');
    }

    /**
     * Create portfolio modal
     */
    createPortfolioModal() {
        const modal = document.createElement('div');
        modal.id = 'createPortfolioModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        modal.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                <h3 class="text-xl font-bold mb-4">Create New Portfolio</h3>
                <form id="createPortfolioForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Portfolio Name</label>
                        <input type="text" id="portfolioName" required 
                            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" 
                            placeholder="My Investment Portfolio">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Description (Optional)</label>
                        <textarea id="portfolioDescription" rows="3" 
                            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" 
                            placeholder="Long-term growth portfolio..."></textarea>
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">Starting Cash</label>
                        <input type="number" id="portfolioCash" value="10000" step="100" min="0" 
                            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    </div>
                    <div class="flex gap-3">
                        <button type="button" id="cancelCreatePortfolio" 
                            class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">
                            Cancel
                        </button>
                        <button type="submit" 
                            class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                            Create Portfolio
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup modal listeners
        document.getElementById('cancelCreatePortfolio').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        document.getElementById('createPortfolioForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCreatePortfolio();
        });
    }

    /**
     * Handle portfolio creation
     */
    async handleCreatePortfolio() {
        const name = document.getElementById('portfolioName').value.trim();
        const description = document.getElementById('portfolioDescription').value.trim();
        const cash = parseFloat(document.getElementById('portfolioCash').value) || 10000;
        
        if (!name) {
            alert('Please enter a portfolio name');
            return;
        }
        
        try {
            const portfolioId = await this.portfolioManager.createPortfolio(name, description);
            
            // Set the starting cash if different from default
            if (cash !== 10000) {
                this.portfolioManager.currentPortfolio.cash = cash;
                await this.portfolioManager.savePortfolio(this.portfolioManager.currentPortfolio);
            }
            
            document.getElementById('createPortfolioModal').classList.add('hidden');
            
            // Clear form
            document.getElementById('portfolioName').value = '';
            document.getElementById('portfolioDescription').value = '';
            document.getElementById('portfolioCash').value = '10000';
            
            // Update UI
            await this.loadAvailablePortfolios();
            this.updatePortfolioDisplay();
            
            // Show success message
            if (this.ui) {
                this.ui.showSuccess(`Portfolio "${name}" created successfully!`);
            }
            
            console.log(`Portfolio created: ${name} (ID: ${portfolioId})`);
            
        } catch (error) {
            console.error('Error creating portfolio:', error);
            if (this.ui) {
                this.ui.showError(`Failed to create portfolio: ${error.message}`);
            } else {
                alert(`Failed to create portfolio: ${error.message}`);
            }
        }
    }

    /**
     * Select a portfolio
     */
    async selectPortfolio(portfolioId) {
        if (!portfolioId) {
            this.portfolioManager.currentPortfolio = null;
            this.updatePortfolioSelectionUI();
            return;
        }
        
        try {
            // Load portfolio from storage
            const portfolioData = localStorage.getItem(`portfolio_${portfolioId}`);
            if (portfolioData) {
                const portfolio = JSON.parse(portfolioData);
                
                // Convert holdings back to Map
                portfolio.holdings = new Map(Object.entries(portfolio.holdings || {}));
                
                this.portfolioManager.currentPortfolio = portfolio;
                this.portfolioManager.portfolios.set(portfolioId, portfolio);
                
                this.updatePortfolioSelectionUI();
                this.updatePortfolioDisplay();
                
                console.log(`Portfolio selected: ${portfolio.name}`);
                
                if (this.ui) {
                    this.ui.showSuccess(`Portfolio "${portfolio.name}" selected`);
                }
            } else {
                throw new Error('Portfolio not found');
            }
            
        } catch (error) {
            console.error('Error selecting portfolio:', error);
            if (this.ui) {
                this.ui.showError(`Failed to select portfolio: ${error.message}`);
            }
        }
    }

    /**
     * Load available portfolios and populate dropdown
     */
    async loadAvailablePortfolios() {
        const select = document.getElementById('portfolioSelect');
        if (!select) return;
        
        // Clear existing options except the first one
        select.innerHTML = '<option value="">Select Portfolio...</option>';
        
        // Get portfolios from localStorage
        const portfolios = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('portfolio_')) {
                try {
                    const portfolioData = JSON.parse(localStorage.getItem(key));
                    portfolios.push(portfolioData);
                } catch (error) {
                    console.warn(`Failed to parse portfolio ${key}:`, error);
                }
            }
        }
        
        // Sort by creation date
        portfolios.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Add options
        portfolios.forEach(portfolio => {
            const option = document.createElement('option');
            option.value = portfolio.id;
            option.textContent = portfolio.name;
            if (this.portfolioManager.currentPortfolio?.id === portfolio.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        this.updatePortfolioSelectionUI();
    }

    /**
     * Update portfolio selection UI state
     */
    updatePortfolioSelectionUI() {
        const select = document.getElementById('portfolioSelect');
        const noPortfolioMessage = document.getElementById('noPortfolioMessage');
        
        if (select && noPortfolioMessage) {
            if (this.portfolioManager.currentPortfolio) {
                noPortfolioMessage.classList.add('hidden');
                select.value = this.portfolioManager.currentPortfolio.id;
            } else {
                noPortfolioMessage.classList.remove('hidden');
                select.value = '';
            }
        }
    }

    /**
     * Update holdings table
     */
    updateHoldingsTable() {
        // Implementation for holdings table update
        // This would populate the holdings table with current data
    }
}