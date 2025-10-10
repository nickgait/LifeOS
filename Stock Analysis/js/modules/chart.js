// Chart.js Integration and Visualization
export class ChartManager {
    
    constructor() {
        this.priceChart = null;
        this.chartCanvas = document.getElementById('priceChart');
    }

    /**
     * Create or update the price chart
     * @param {Object} stockData - Stock data object with prices, dates, and indicators
     */
    async updateChart(stockData) {
        if (!stockData || !stockData.prices || !stockData.dates) {
            console.error('Invalid stock data for chart');
            return;
        }

        try {
            // Destroy existing chart if it exists
            if (this.priceChart) {
                this.priceChart.destroy();
                this.priceChart = null;
            }

            if (!this.chartCanvas) {
                console.error('Chart canvas not found');
                return;
            }

            const ctx = this.chartCanvas.getContext('2d');
            
            try {
                // Import technical analysis for moving averages
                const { TechnicalAnalysis } = await import('./technical.js');
                const ma50Data = TechnicalAnalysis.calculateSMA(stockData.prices, 50);
                const ma200Data = TechnicalAnalysis.calculateSMA(stockData.prices, 200);

                // Prepare datasets
                const datasets = [
                    {
                        label: 'Price',
                        data: stockData.prices,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }
                ];

                // Add 50-day MA if we have enough data
                if (ma50Data.length > 0) {
                    datasets.push({
                        label: '50-Day MA',
                        data: this.alignMovingAverageData(ma50Data, stockData.prices.length, 50),
                        borderColor: 'rgb(255, 205, 86)',
                        borderWidth: 1,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: false
                    });
                }

                // Add 200-day MA if we have enough data
                if (ma200Data.length > 0) {
                    datasets.push({
                        label: '200-Day MA',
                        data: this.alignMovingAverageData(ma200Data, stockData.prices.length, 200),
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: false
                    });
                }

                this.priceChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: stockData.dates,
                        datasets: datasets
                    },
                    options: this.getChartOptions(stockData.name)
                });

            } catch (error) {
                console.error('Error creating chart:', error);
                // Create basic chart without moving averages
                this.createBasicChart(ctx, stockData);
            }

        } catch (error) {
            console.error('Failed to update chart:', error);
        }
    }

    /**
     * Create a basic chart without moving averages (fallback)
     * @param {CanvasRenderingContext2D} ctx - Chart context
     * @param {Object} stockData - Stock data
     */
    createBasicChart(ctx, stockData) {
        this.priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: stockData.dates,
                datasets: [{
                    label: 'Price',
                    data: stockData.prices,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: this.getChartOptions(stockData.name)
        });
    }

    /**
     * Align moving average data with price data length
     * @param {number[]} maData - Moving average data
     * @param {number} totalLength - Total length of price data
     * @param {number} window - Moving average window
     * @returns {Array} Aligned data with null values for initial periods
     */
    alignMovingAverageData(maData, totalLength, window) {
        const aligned = new Array(totalLength);
        
        // Fill initial values with null
        for (let i = 0; i < window - 1; i++) {
            aligned[i] = null;
        }
        
        // Add moving average values
        for (let i = 0; i < maData.length; i++) {
            aligned[window - 1 + i] = maData[i];
        }
        
        return aligned;
    }

    /**
     * Get chart configuration options
     * @param {string} stockName - Stock name for title
     * @returns {Object} Chart options
     */
    getChartOptions(stockName) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: `${stockName} - Price Chart`,
                    color: '#e2e8f0',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#e2e8f0',
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 6,
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
                            }
                            return `${context.dataset.label}: $${context.parsed.y?.toFixed(2) || 'N/A'}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: { 
                        color: 'rgba(255, 255, 255, 0.1)' 
                    },
                    ticks: { 
                        color: '#94a3b8',
                        maxTicksLimit: 10
                    },
                    title: {
                        display: true,
                        text: 'Date',
                        color: '#94a3b8'
                    }
                },
                y: {
                    display: true,
                    grid: { 
                        color: 'rgba(255, 255, 255, 0.1)' 
                    },
                    ticks: { 
                        color: '#94a3b8',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Price ($)',
                        color: '#94a3b8'
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 6,
                    hoverBorderWidth: 2
                },
                line: {
                    borderJoinStyle: 'round'
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        };
    }

    /**
     * Destroy the current chart
     */
    destroyChart() {
        if (this.priceChart) {
            this.priceChart.destroy();
            this.priceChart = null;
        }
    }

    /**
     * Check if chart exists
     * @returns {boolean} True if chart exists
     */
    hasChart() {
        return !!this.priceChart;
    }

    /**
     * Update chart theme (for future dark/light mode support)
     * @param {string} theme - Theme name ('dark' or 'light')
     */
    updateTheme(theme) {
        if (!this.priceChart) return;

        const isDark = theme === 'dark';
        const textColor = isDark ? '#e2e8f0' : '#1f2937';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        this.priceChart.options.plugins.legend.labels.color = textColor;
        this.priceChart.options.plugins.title.color = textColor;
        this.priceChart.options.scales.x.ticks.color = textColor;
        this.priceChart.options.scales.x.grid.color = gridColor;
        this.priceChart.options.scales.y.ticks.color = textColor;
        this.priceChart.options.scales.y.grid.color = gridColor;

        this.priceChart.update();
    }

    /**
     * Export chart as image
     * @param {string} format - Image format ('png', 'jpeg')
     * @returns {string} Base64 encoded image
     */
    exportChart(format = 'png') {
        if (!this.priceChart) {
            throw new Error('No chart available for export');
        }

        return this.priceChart.toBase64Image(`image/${format}`, 1.0);
    }

    /**
     * Get chart statistics
     * @returns {Object} Chart statistics
     */
    getChartStats() {
        if (!this.priceChart) {
            return { hasChart: false };
        }

        const data = this.priceChart.data;
        return {
            hasChart: true,
            dataPoints: data.labels?.length || 0,
            datasets: data.datasets?.length || 0,
            chartType: this.priceChart.config.type
        };
    }
}