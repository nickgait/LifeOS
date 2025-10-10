// Main Application Entry Point
import { Config } from './config/config.js';
import { FirebaseService } from './modules/firebase.js';
import { FinnhubSimpleAPI } from './modules/finnhub-simple.js';
import { UI } from './modules/ui.js';
import { ChartManager } from './modules/chart.js';
import { PortfolioManager } from './modules/portfolio.js';
import { PortfolioUI } from './modules/portfolio-ui.js';

class StockDashboard {
    constructor() {
        this.config = new Config();
        this.firebase = new FirebaseService(this.config);
        this.stockAPI = new FinnhubSimpleAPI(this.config);
        this.ui = new UI();
        this.chart = new ChartManager();
        this.portfolio = new PortfolioManager(this.firebase);
        this.portfolioUI = new PortfolioUI(this.portfolio, this.ui, this.chart);
        
        this.currentTicker = '';
        this.currentStockData = null;
        this.watchlist = [];
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Stock Dashboard...');
            
            // Setup UI event listeners first (these always work)
            this.setupEventListeners();
            
            // Try to initialize Firebase
            try {
                await this.firebase.initialize();
                
                // Setup authentication listener
                this.firebase.setupAuthListener((userId) => {
                    if (userId) {
                        this.ui.updateUserId(userId);
                        this.firebase.setupWatchlistListener((stocks) => {
                            this.watchlist = stocks;
                            this.ui.renderWatchlist(
                                stocks,
                                (ticker) => this.handleWatchlistClick(ticker),
                                (docId) => this.handleRemoveFromWatchlist(docId)
                            );
                        });
                    } else {
                        console.warn('Firebase authentication failed');
                    }
                });
                
                console.log('Firebase features enabled');
                
            } catch (firebaseError) {
                console.warn('Firebase initialization failed, continuing without watchlist features:', firebaseError.message);
                this.ui.showMessage('Watchlist features unavailable (Firebase connection failed)');
                
                // Hide watchlist section if Firebase fails
                const watchlistSection = document.querySelector('#watchlist')?.parentElement;
                if (watchlistSection) {
                    watchlistSection.style.display = 'none';
                }
            }

            // Initialize portfolio UI
            await this.portfolioUI.initialize();
            
            // Create default portfolio if none exists
            if (this.firebase.isAuthenticated()) {
                try {
                    await this.portfolio.createPortfolio('My Portfolio', 'Default investment portfolio');
                    console.log('Default portfolio created');
                } catch (error) {
                    console.log('Portfolio already exists or creation failed:', error.message);
                }
            }
            
            console.log('Stock Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.ui.showError(`Initialization failed: ${error.message}`);
        }
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        this.ui.addEventListeners({
            onSearch: () => this.handleSearch(),
            onAddToWatchlist: () => this.handleAddToWatchlist(),
            onEnterKey: () => this.handleSearch()
        });

        // Add portfolio button listener
        const addToPortfolioBtn = document.getElementById('addToPortfolioButton');
        if (addToPortfolioBtn) {
            addToPortfolioBtn.addEventListener('click', () => this.handleAddToPortfolio());
        }
    }

    /**
     * Handle stock search
     */
    async handleSearch() {
        const ticker = this.ui.getTickerInput();
        
        // Validate ticker input
        const validation = this.ui.validateTicker(ticker);
        if (!validation.valid) {
            this.ui.showError(validation.message);
            return;
        }

        this.currentTicker = validation.ticker;
        
        try {
            this.ui.showSearchLoading();
            this.ui.showMessage(`Fetching data for ${this.currentTicker}...`);
            
            // Fetch stock data
            const stockData = await this.stockAPI.fetchStockData(this.currentTicker);
            
            if (stockData) {
                this.currentStockData = stockData;
                await this.updateDashboard(stockData);
            } else {
                this.ui.showError(`No data available for ${this.currentTicker}`);
            }
            
        } catch (error) {
            console.error('Search failed:', error);
            this.ui.showError(error.message);
        } finally {
            this.ui.hideSearchLoading();
        }
    }

    /**
     * Update dashboard with stock data
     * @param {Object} stockData - Stock data object
     */
    async updateDashboard(stockData) {
        try {
            // Update UI dashboard
            this.ui.updateDashboard(stockData);
            
            // Update chart
            await this.chart.updateChart(stockData);
            
            console.log(`Dashboard updated for ${stockData.ticker}`);
            
        } catch (error) {
            console.error('Failed to update dashboard:', error);
            this.ui.showError('Failed to update dashboard display');
        }
    }

    /**
     * Handle adding stock to watchlist
     */
    async handleAddToWatchlist() {
        if (!this.currentTicker) {
            this.ui.showError('Please search for a stock first.');
            return;
        }

        if (!this.firebase.isAuthenticated()) {
            this.ui.showError('Watchlist feature requires Firebase setup. Stock data works without it!');
            return;
        }

        // Check if already in watchlist
        if (this.firebase.isTickerInWatchlist(this.watchlist, this.currentTicker)) {
            this.ui.showError(`${this.currentTicker} is already in your watchlist.`);
            return;
        }

        try {
            await this.firebase.addToWatchlist(this.currentTicker);
            this.ui.showSuccess(`${this.currentTicker} added to watchlist!`);
            
        } catch (error) {
            console.error('Failed to add to watchlist:', error);
            this.ui.showError(error.message);
        }
    }

    /**
     * Handle removing stock from watchlist
     * @param {string} docId - Firestore document ID
     */
    async handleRemoveFromWatchlist(docId) {
        if (!this.firebase.isAuthenticated()) {
            this.ui.showError('Authentication required.');
            return;
        }

        try {
            await this.firebase.removeFromWatchlist(docId);
            this.ui.showSuccess('Stock removed from watchlist.');
            
        } catch (error) {
            console.error('Failed to remove from watchlist:', error);
            this.ui.showError(error.message);
        }
    }

    /**
     * Handle clicking on watchlist item
     * @param {string} ticker - Stock ticker
     */
    async handleWatchlistClick(ticker) {
        if (!ticker) return;
        
        this.ui.setTickerInput(ticker);
        await this.handleSearch();
    }

    /**
     * Handle adding stock to portfolio (quick buy)
     */
    async handleAddToPortfolio() {
        if (!this.currentTicker || !this.currentStockData) {
            this.ui.showError('Please search for a stock first.');
            return;
        }

        if (!this.firebase.isAuthenticated()) {
            this.ui.showError('Portfolio feature requires Firebase setup. Stock data works without it!');
            return;
        }

        // Pre-fill transaction modal with current stock data
        this.portfolioUI.showTransactionModal();
        
        // Pre-populate with current stock data
        setTimeout(() => {
            document.getElementById('transactionSymbol').value = this.currentTicker;
            document.getElementById('transactionPrice').value = this.currentStockData.currentPrice.toFixed(2);
            document.getElementById('transactionType').value = 'buy';
        }, 100);
    }

    /**
     * Get application status
     * @returns {Object} Application status
     */
    getStatus() {
        return {
            firebase: this.firebase.getStatus(),
            cache: this.stockAPI.getCacheStats(),
            chart: this.chart.getChartStats(),
            currentTicker: this.currentTicker,
            watchlistSize: this.watchlist.length,
            hasCurrentData: !!this.currentStockData
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.firebase.cleanup();
        this.chart.destroyChart();
        this.stockAPI.clearCache();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new StockDashboard();
        await app.init();
        
        // Make app available globally for debugging
        window.stockDashboard = app;
        
    } catch (error) {
        console.error('Failed to start application:', error);
        
        // Show error in UI if possible
        const messageBox = document.getElementById('messageBox');
        const messageText = document.getElementById('messageText');
        
        if (messageBox && messageText) {
            messageBox.className = 'text-center p-4 rounded-lg mb-8 error-message';
            messageText.textContent = `Application failed to start: ${error.message}`;
            messageBox.classList.remove('hidden');
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.stockDashboard) {
        window.stockDashboard.cleanup();
    }
});

// Export for module usage
export { StockDashboard };