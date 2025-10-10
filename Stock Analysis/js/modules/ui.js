// UI Utilities and DOM Manipulation
export class UI {
    
    constructor() {
        this.elements = this.initializeElements();
    }

    initializeElements() {
        return {
            // Input elements
            tickerInput: document.getElementById('tickerInput'),
            searchButton: document.getElementById('searchButton'),
            searchButtonText: document.getElementById('searchButtonText'),
            searchButtonSpinner: document.getElementById('searchButtonSpinner'),
            addToWatchlistButton: document.getElementById('addToWatchlistButton'),
            
            // Display elements
            dashboard: document.getElementById('dashboard'),
            messageBox: document.getElementById('messageBox'),
            messageText: document.getElementById('messageText'),
            watchlist: document.getElementById('watchlist'),
            stockNameDisplay: document.getElementById('stockNameDisplay'),
            userId: document.getElementById('userId'),
            
            // Dashboard values
            priceValue: document.getElementById('priceValue'),
            volumeValue: document.getElementById('volumeValue'),
            ma50Value: document.getElementById('ma50Value'),
            ma200Value: document.getElementById('ma200Value'),
            rsiValue: document.getElementById('rsiValue'),
            macdValue: document.getElementById('macdValue'),
            macdSignalValue: document.getElementById('macdSignalValue'),
            
            // Chart
            priceChart: document.getElementById('priceChart')
        };
    }

    /**
     * Show loading state for search button
     */
    showSearchLoading() {
        this.elements.searchButtonText.textContent = 'Searching...';
        this.elements.searchButtonSpinner.classList.remove('hidden');
        this.elements.searchButton.disabled = true;
        this.elements.searchButton.classList.add('loading');
    }

    /**
     * Hide loading state for search button
     */
    hideSearchLoading() {
        this.elements.searchButtonText.textContent = 'Search';
        this.elements.searchButtonSpinner.classList.add('hidden');
        this.elements.searchButton.disabled = false;
        this.elements.searchButton.classList.remove('loading');
    }

    /**
     * Show success message
     * @param {string} message - Message to display
     */
    showMessage(message) {
        this.elements.messageBox.className = 'text-center p-4 rounded-lg mb-8 warning-message';
        this.elements.messageText.textContent = message;
        this.elements.messageBox.classList.remove('hidden');
        this.elements.dashboard.classList.add('hidden');
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.elements.messageBox.className = 'text-center p-4 rounded-lg mb-8 error-message';
        this.elements.messageText.textContent = message;
        this.elements.messageBox.classList.remove('hidden');
        this.elements.dashboard.classList.add('hidden');
    }

    /**
     * Show success message
     * @param {string} message - Success message to display
     */
    showSuccess(message) {
        this.elements.messageBox.className = 'text-center p-4 rounded-lg mb-8 success-message';
        this.elements.messageText.textContent = message;
        this.elements.messageBox.classList.remove('hidden');
    }

    /**
     * Update dashboard with stock data
     * @param {Object} data - Stock data object
     */
    updateDashboard(data) {
        if (!data) {
            this.showError('Stock data is not available.');
            return;
        }

        try {
            this.elements.dashboard.classList.remove('hidden');
            this.elements.messageBox.classList.add('hidden');
            
            this.elements.stockNameDisplay.textContent = data.name || 'Unknown Stock';
            this.elements.priceValue.textContent = `$${this.formatNumber(data.currentPrice, 2)}`;
            this.elements.volumeValue.textContent = this.formatLargeNumber(data.volume);
            this.elements.ma50Value.textContent = `$${this.formatNumber(data.ma50, 2)}`;
            this.elements.ma200Value.textContent = `$${this.formatNumber(data.ma200, 2)}`;
            this.elements.rsiValue.textContent = this.formatNumber(data.rsi, 2);
            this.elements.macdValue.textContent = this.formatNumber(data.macd, 4);
            this.elements.macdSignalValue.textContent = this.formatNumber(data.macdSignal, 4);

            // Update price value color based on change
            if (data.change !== undefined) {
                const isPositive = data.change >= 0;
                this.elements.priceValue.className = `text-2xl font-bold mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`;
            }
        } catch (error) {
            console.error('Error updating dashboard:', error);
            this.showError('Failed to update dashboard display.');
        }
    }

    /**
     * Update user ID display
     * @param {string} userId - User ID to display
     */
    updateUserId(userId) {
        if (this.elements.userId && userId) {
            this.elements.userId.textContent = `User ID: ${userId}`;
        }
    }

    /**
     * Render watchlist items
     * @param {Array} stocks - Array of stock objects
     * @param {Function} onStockClick - Callback for stock click
     * @param {Function} onRemoveClick - Callback for remove click
     */
    renderWatchlist(stocks, onStockClick, onRemoveClick) {
        if (!this.elements.watchlist) return;

        this.elements.watchlist.innerHTML = '';
        
        if (!Array.isArray(stocks) || stocks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.classList.add('text-gray-400', 'text-center', 'py-4');
            emptyMessage.textContent = 'No stocks in watchlist';
            this.elements.watchlist.appendChild(emptyMessage);
            return;
        }

        stocks.forEach(stock => {
            const li = document.createElement('li');
            li.classList.add('flex', 'justify-between', 'items-center', 'bg-gray-700', 'p-3', 'rounded-md', 'mb-2');
            
            const tickerSpan = document.createElement('span');
            tickerSpan.textContent = stock.ticker || 'Unknown';
            tickerSpan.classList.add('font-semibold', 'text-white', 'cursor-pointer', 'hover:text-blue-400');
            tickerSpan.onclick = () => onStockClick && onStockClick(stock.ticker);

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.classList.add('px-3', 'py-1', 'bg-red-600', 'hover:bg-red-700', 'text-white', 'rounded-md', 'text-sm', 'transition-colors');
            removeBtn.onclick = () => onRemoveClick && onRemoveClick(stock.id);

            li.appendChild(tickerSpan);
            li.appendChild(removeBtn);
            this.elements.watchlist.appendChild(li);
        });
    }

    /**
     * Get current ticker input value
     * @returns {string} Ticker symbol
     */
    getTickerInput() {
        return this.elements.tickerInput?.value?.trim()?.toUpperCase() || '';
    }

    /**
     * Set ticker input value
     * @param {string} ticker - Ticker symbol
     */
    setTickerInput(ticker) {
        if (this.elements.tickerInput) {
            this.elements.tickerInput.value = ticker;
        }
    }

    /**
     * Clear ticker input
     */
    clearTickerInput() {
        if (this.elements.tickerInput) {
            this.elements.tickerInput.value = '';
        }
    }

    /**
     * Format number with specified decimal places
     * @param {number} num - Number to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number
     */
    formatNumber(num, decimals = 2) {
        if (typeof num !== 'number' || isNaN(num)) {
            return '0.00';
        }
        return num.toFixed(decimals);
    }

    /**
     * Format large numbers with appropriate suffixes
     * @param {number} num - Number to format
     * @returns {string} Formatted number with suffix
     */
    formatLargeNumber(num) {
        if (typeof num !== 'number' || isNaN(num)) {
            return '0';
        }

        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }

    /**
     * Validate ticker input
     * @param {string} ticker - Ticker to validate
     * @returns {Object} Validation result
     */
    validateTicker(ticker) {
        if (!ticker || typeof ticker !== 'string') {
            return { valid: false, message: 'Please enter a stock ticker.' };
        }

        const cleanTicker = ticker.trim().toUpperCase();
        
        if (cleanTicker.length === 0) {
            return { valid: false, message: 'Please enter a stock ticker.' };
        }

        if (cleanTicker.length > 10) {
            return { valid: false, message: 'Ticker symbol is too long.' };
        }

        if (!/^[A-Z0-9.-]+$/.test(cleanTicker)) {
            return { valid: false, message: 'Ticker contains invalid characters.' };
        }

        return { valid: true, ticker: cleanTicker };
    }

    /**
     * Add event listeners
     * @param {Object} handlers - Event handler functions
     */
    addEventListeners(handlers) {
        if (this.elements.searchButton && handlers.onSearch) {
            this.elements.searchButton.addEventListener('click', handlers.onSearch);
        }

        if (this.elements.addToWatchlistButton && handlers.onAddToWatchlist) {
            this.elements.addToWatchlistButton.addEventListener('click', handlers.onAddToWatchlist);
        }

        if (this.elements.tickerInput && handlers.onEnterKey) {
            this.elements.tickerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handlers.onEnterKey();
                }
            });
        }
    }
}