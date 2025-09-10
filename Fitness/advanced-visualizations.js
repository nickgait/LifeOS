/**
 * Advanced Data Visualization Module for Fitness Tracker
 * Provides sophisticated charts, heatmaps, and interactive visualizations
 */

// Advanced Chart Renderer
class AdvancedChartRenderer {
    /**
     * Create a comprehensive progress chart with multiple data series
     * @param {string} containerId - Container element ID
     * @param {Object} goal - Goal object with history
     * @param {Object} analysis - Performance analysis data
     */
    static createAdvancedProgressChart(containerId, goal, analysis) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.className = 'chart-canvas';
        container.innerHTML = '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        if (!goal.history || goal.history.length === 0) {
            this.drawEmptyChart(ctx, canvas.width, canvas.height);
            return;
        }

        // Prepare data
        const sortedHistory = [...goal.history].sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
        const data = this.prepareChartData(sortedHistory, goal, analysis);

        // Draw chart
        this.drawAdvancedChart(ctx, canvas.width, canvas.height, data);
    }

    /**
     * Create a trend analysis chart with regression lines
     * @param {string} containerId - Container element ID
     * @param {Object} goal - Goal object
     * @param {Object} analysis - Performance analysis
     */
    static createTrendAnalysisChart(containerId, goal, analysis) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.className = 'chart-canvas';
        container.innerHTML = '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        if (!analysis.trend || !goal.history || goal.history.length < 3) {
            this.drawEmptyChart(ctx, canvas.width, canvas.height, 'Insufficient data for trend analysis');
            return;
        }

        this.drawTrendChart(ctx, canvas.width, canvas.height, goal, analysis);
    }

    /**
     * Create a performance heatmap
     * @param {string} containerId - Container element ID
     * @param {Array} goals - All goals
     */
    static createPerformanceHeatmap(containerId, goals) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        if (goals.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500">No goals to display</div>';
            return;
        }

        const heatmapData = this.prepareHeatmapData(goals);
        this.renderHeatmap(container, heatmapData);
    }

    /**
     * Create a comparative performance chart
     * @param {string} containerId - Container element ID
     * @param {Array} goals - Goals to compare
     */
    static createComparativeChart(containerId, goals) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.className = 'chart-canvas';
        container.innerHTML = '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        if (goals.length === 0) {
            this.drawEmptyChart(ctx, canvas.width, canvas.height, 'No goals to compare');
            return;
        }

        this.drawComparativeChart(ctx, canvas.width, canvas.height, goals);
    }

    // Data preparation methods
    static prepareChartData(history, goal, analysis) {
        let cumulativeAmount = 0;
        const points = history.map((entry, index) => {
            cumulativeAmount += entry.amount;
            return {
                x: index,
                y: cumulativeAmount,
                date: entry.date,
                amount: entry.amount,
                percentage: (cumulativeAmount / goal.target) * 100
            };
        });

        // Add forecast points if available
        let forecastPoints = [];
        if (analysis.forecast && analysis.forecast.length > 0) {
            const lastPoint = points[points.length - 1];
            let forecastCumulative = lastPoint.y;
            
            forecastPoints = analysis.forecast.map((forecast, index) => {
                forecastCumulative += forecast.value;
                return {
                    x: points.length + index,
                    y: forecastCumulative,
                    isForecast: true,
                    confidence: forecast.confidence
                };
            });
        }

        return {
            actual: points,
            forecast: forecastPoints,
            target: goal.target,
            dailyTarget: goal.dailyTarget,
            trend: analysis.trend
        };
    }

    static prepareHeatmapData(goals) {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toDateString();
        }).reverse();

        const heatmapData = [];

        goals.forEach(goal => {
            const goalData = {
                name: goal.name,
                category: goal.category,
                days: []
            };

            last30Days.forEach(dateStr => {
                const entry = goal.history.find(h => new Date(h.fullDate).toDateString() === dateStr);
                const intensity = entry ? Math.min(1, (entry.amount / goal.dailyTarget) * 0.8 + 0.2) : 0;
                
                goalData.days.push({
                    date: dateStr,
                    intensity,
                    amount: entry ? entry.amount : 0,
                    target: goal.dailyTarget
                });
            });

            heatmapData.push(goalData);
        });

        return heatmapData;
    }

    // Chart drawing methods
    static drawAdvancedChart(ctx, width, height, data) {
        const padding = 60;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        this.drawGrid(ctx, padding, padding, chartWidth, chartHeight, data.target);

        // Draw target line
        this.drawTargetLine(ctx, padding, padding, chartWidth, chartHeight, data.target);

        // Draw actual progress line
        if (data.actual.length > 0) {
            this.drawProgressLine(ctx, padding, padding, chartWidth, chartHeight, data.actual, data.target, '#0ea5e9', false);
        }

        // Draw forecast line
        if (data.forecast.length > 0) {
            const allPoints = [...data.actual, ...data.forecast];
            this.drawProgressLine(ctx, padding, padding, chartWidth, chartHeight, allPoints, data.target, '#9333ea', true, data.actual.length);
        }

        // Draw trend line
        if (data.trend && data.trend.rSquared > 0.3) {
            this.drawTrendLine(ctx, padding, padding, chartWidth, chartHeight, data);
        }

        // Draw data points
        this.drawDataPoints(ctx, padding, padding, chartWidth, chartHeight, data.actual, data.target, '#0ea5e9');

        // Draw axes
        this.drawAxes(ctx, padding, padding, chartWidth, chartHeight);

        // Draw labels
        this.drawChartLabels(ctx, padding, padding, chartWidth, chartHeight, data);

        // Draw legend
        this.drawLegend(ctx, width - 150, 20, data);
    }

    static drawTrendChart(ctx, width, height, goal, analysis) {
        const padding = 60;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        ctx.clearRect(0, 0, width, height);

        // Prepare trend data
        const sortedHistory = [...goal.history].sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
        const values = sortedHistory.map(entry => entry.amount);
        const maxValue = Math.max(...values) * 1.1;

        // Draw grid
        this.drawGrid(ctx, padding, padding, chartWidth, chartHeight, maxValue);

        // Draw trend line
        const trend = analysis.trend;
        const startY = padding + chartHeight - ((trend.intercept / maxValue) * chartHeight);
        const endX = padding + chartWidth;
        const endY = padding + chartHeight - (((trend.slope * (values.length - 1) + trend.intercept) / maxValue) * chartHeight);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw actual data points
        ctx.fillStyle = '#0ea5e9';
        values.forEach((value, index) => {
            const x = padding + (index / (values.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((value / maxValue) * chartHeight);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw correlation info
        ctx.fillStyle = '#374151';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`Correlation: ${trend.correlation.toFixed(3)}`, 20, 30);
        ctx.fillText(`R²: ${trend.rSquared.toFixed(3)}`, 20, 50);
        ctx.fillText(`Trend: ${trend.slope > 0 ? 'Increasing' : 'Decreasing'}`, 20, 70);
    }

    static drawComparativeChart(ctx, width, height, goals) {
        const padding = 60;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        ctx.clearRect(0, 0, width, height);

        // Calculate progress percentages
        const goalData = goals.map(goal => {
            const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
            return {
                name: goal.name,
                progress: (completed / goal.target) * 100,
                category: goal.category
            };
        }).sort((a, b) => b.progress - a.progress);

        const maxProgress = Math.max(100, Math.max(...goalData.map(g => g.progress)));

        // Draw bars
        const barHeight = chartHeight / (goalData.length * 1.5);
        const barSpacing = barHeight * 0.5;

        goalData.forEach((goal, index) => {
            const barWidth = (goal.progress / maxProgress) * chartWidth;
            const y = padding + index * (barHeight + barSpacing);
            
            // Draw bar background
            ctx.fillStyle = '#e5e7eb';
            ctx.fillRect(padding, y, chartWidth, barHeight);
            
            // Draw progress bar
            const color = this.getCategoryColor(goal.category);
            ctx.fillStyle = color;
            ctx.fillRect(padding, y, barWidth, barHeight);
            
            // Draw goal name
            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText(goal.name, padding - 50, y + barHeight/2 + 4);
            
            // Draw percentage
            ctx.fillStyle = '#ffffff';
            if (barWidth > 40) {
                ctx.fillText(`${Math.round(goal.progress)}%`, padding + barWidth - 35, y + barHeight/2 + 4);
            }
        });

        // Draw title
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('Goal Progress Comparison', padding, padding - 20);
    }

    static renderHeatmap(container, heatmapData) {
        const heatmap = document.createElement('div');
        heatmap.className = 'heatmap-container';
        heatmap.style.cssText = `
            display: grid;
            grid-template-columns: 150px repeat(30, 12px);
            gap: 2px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            font-family: Inter, sans-serif;
            font-size: 12px;
        `;

        // Add header row
        const emptyCell = document.createElement('div');
        heatmap.appendChild(emptyCell);

        // Add day headers (abbreviated)
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayCell = document.createElement('div');
            dayCell.textContent = date.getDate();
            dayCell.style.cssText = `
                text-align: center;
                font-size: 10px;
                color: #6b7280;
            `;
            heatmap.appendChild(dayCell);
        }

        // Add goal rows
        heatmapData.forEach(goalData => {
            // Goal name cell
            const nameCell = document.createElement('div');
            nameCell.textContent = goalData.name;
            nameCell.style.cssText = `
                font-weight: 500;
                color: #374151;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;
            heatmap.appendChild(nameCell);

            // Day cells
            goalData.days.forEach(day => {
                const dayCell = document.createElement('div');
                const intensity = day.intensity;
                const opacity = intensity;
                
                dayCell.style.cssText = `
                    width: 12px;
                    height: 12px;
                    background-color: ${intensity > 0 ? `rgba(14, 165, 233, ${opacity})` : '#f3f4f6'};
                    border-radius: 2px;
                    cursor: pointer;
                    position: relative;
                `;

                // Add tooltip
                dayCell.title = `${new Date(day.date).toLocaleDateString()}: ${day.amount} / ${day.target}`;
                
                heatmap.appendChild(dayCell);
            });
        });

        // Add legend
        const legend = document.createElement('div');
        legend.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 16px;
            font-size: 11px;
            color: #6b7280;
        `;

        legend.innerHTML = `
            <span>Less</span>
            ${Array.from({length: 5}, (_, i) => 
                `<div style="width: 12px; height: 12px; background-color: rgba(14, 165, 233, ${(i + 1) * 0.2}); border-radius: 2px;"></div>`
            ).join('')}
            <span>More</span>
        `;

        container.appendChild(heatmap);
        container.appendChild(legend);
    }

    // Helper drawing methods
    static drawGrid(ctx, x, y, width, height, maxValue) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;

        // Horizontal lines
        for (let i = 0; i <= 5; i++) {
            const lineY = y + (i * height / 5);
            ctx.beginPath();
            ctx.moveTo(x, lineY);
            ctx.lineTo(x + width, lineY);
            ctx.stroke();
        }

        // Vertical lines
        for (let i = 0; i <= 10; i++) {
            const lineX = x + (i * width / 10);
            ctx.beginPath();
            ctx.moveTo(lineX, y);
            ctx.lineTo(lineX, y + height);
            ctx.stroke();
        }
    }

    static drawProgressLine(ctx, x, y, width, height, points, maxValue, color, isDashed = false, splitIndex = null) {
        if (points.length < 2) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = isDashed ? 2 : 3;
        
        if (isDashed) {
            ctx.setLineDash([5, 5]);
        }

        ctx.beginPath();
        
        points.forEach((point, index) => {
            const px = x + (point.x / (points.length - 1)) * width;
            const py = y + height - ((point.y / maxValue) * height);
            
            if (splitIndex && index === splitIndex) {
                // Start new path for forecast
                ctx.stroke();
                ctx.strokeStyle = '#9333ea';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(px, py);
            } else if (index === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        });

        ctx.stroke();
        ctx.setLineDash([]);
    }

    static drawTargetLine(ctx, x, y, width, height, target) {
        const targetY = y;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(x, targetY);
        ctx.lineTo(x + width, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target label
        ctx.fillStyle = '#ef4444';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(`Target: ${target}`, x + width - 80, targetY - 5);
    }

    static drawDataPoints(ctx, x, y, width, height, points, maxValue, color) {
        ctx.fillStyle = color;
        
        points.forEach(point => {
            const px = x + (point.x / (points.length - 1)) * width;
            const py = y + height - ((point.y / maxValue) * height);
            
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add white border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    static drawAxes(ctx, x, y, width, height) {
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();
    }

    static drawChartLabels(ctx, x, y, width, height, data) {
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';

        // Y-axis labels
        for (let i = 0; i <= 5; i++) {
            const value = (data.target * (5 - i) / 5).toFixed(0);
            const labelY = y + (i * height / 5) + 4;
            ctx.textAlign = 'right';
            ctx.fillText(value, x - 10, labelY);
        }

        // X-axis labels (dates)
        if (data.actual.length > 0) {
            const labelInterval = Math.max(1, Math.floor(data.actual.length / 5));
            for (let i = 0; i < data.actual.length; i += labelInterval) {
                const point = data.actual[i];
                const labelX = x + (point.x / (data.actual.length - 1)) * width;
                ctx.textAlign = 'center';
                ctx.fillText(point.date, labelX, y + height + 20);
            }
        }
    }

    static drawLegend(ctx, x, y, data) {
        const legend = [
            { color: '#0ea5e9', label: 'Actual Progress', style: 'solid' },
            { color: '#9333ea', label: 'Forecast', style: 'dashed' },
            { color: '#ef4444', label: 'Target', style: 'dashed' }
        ];

        legend.forEach((item, index) => {
            const itemY = y + index * 20;
            
            // Draw line sample
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 2;
            if (item.style === 'dashed') {
                ctx.setLineDash([5, 5]);
            }
            
            ctx.beginPath();
            ctx.moveTo(x, itemY);
            ctx.lineTo(x + 20, itemY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw label
            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, x + 25, itemY + 4);
        });
    }

    static drawEmptyChart(ctx, width, height, message = 'No data available') {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(message, width / 2, height / 2);
    }

    static getCategoryColor(category) {
        const colors = {
            fitness: '#0ea5e9',
            health: '#10b981',
            learning: '#8b5cf6',
            lifestyle: '#f59e0b',
            personal: '#ef4444',
            other: '#6b7280'
        };
        return colors[category] || colors.other;
    }
}

// Interactive Chart Controls
class ChartInteractivity {
    /**
     * Add interactive controls to charts
     * @param {string} containerId - Container element ID
     * @param {Object} options - Interaction options
     */
    static addChartControls(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const controls = document.createElement('div');
        controls.className = 'chart-controls';
        controls.style.cssText = `
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        `;

        // Time range selector
        if (options.timeRange) {
            const timeRangeSelect = document.createElement('select');
            timeRangeSelect.className = 'chart-control-select';
            timeRangeSelect.style.cssText = `
                padding: 4px 8px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                font-size: 12px;
            `;

            const timeRanges = [
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 3 months' },
                { value: 'all', label: 'All time' }
            ];

            timeRanges.forEach(range => {
                const option = document.createElement('option');
                option.value = range.value;
                option.textContent = range.label;
                timeRangeSelect.appendChild(option);
            });

            timeRangeSelect.addEventListener('change', (e) => {
                if (options.onTimeRangeChange) {
                    options.onTimeRangeChange(e.target.value);
                }
            });

            controls.appendChild(timeRangeSelect);
        }

        // Chart type selector
        if (options.chartTypes) {
            const chartTypeSelect = document.createElement('select');
            chartTypeSelect.className = 'chart-control-select';
            chartTypeSelect.style.cssText = `
                padding: 4px 8px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                font-size: 12px;
            `;

            options.chartTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.value;
                option.textContent = type.label;
                chartTypeSelect.appendChild(option);
            });

            chartTypeSelect.addEventListener('change', (e) => {
                if (options.onChartTypeChange) {
                    options.onChartTypeChange(e.target.value);
                }
            });

            controls.appendChild(chartTypeSelect);
        }

        // Smoothing toggle
        if (options.smoothing) {
            const smoothingToggle = document.createElement('label');
            smoothingToggle.style.cssText = `
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                cursor: pointer;
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.addEventListener('change', (e) => {
                if (options.onSmoothingChange) {
                    options.onSmoothingChange(e.target.checked);
                }
            });

            smoothingToggle.appendChild(checkbox);
            smoothingToggle.appendChild(document.createTextNode('Smooth trend'));
            controls.appendChild(smoothingToggle);
        }

        container.insertBefore(controls, container.firstChild);
    }

    /**
     * Add zoom and pan functionality to charts
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Function} redrawCallback - Function to redraw chart with new bounds
     */
    static addZoomPan(canvas, redrawCallback) {
        let isMouseDown = false;
        let startX = 0;
        let startY = 0;
        let zoomLevel = 1;
        let offsetX = 0;
        let offsetY = 0;

        canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            startX = e.clientX - canvas.offsetLeft;
            startY = e.clientY - canvas.offsetTop;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;

            const currentX = e.clientX - canvas.offsetLeft;
            const currentY = e.clientY - canvas.offsetTop;
            
            offsetX += currentX - startX;
            offsetY += currentY - startY;
            
            startX = currentX;
            startY = currentY;
            
            redrawCallback({ zoomLevel, offsetX, offsetY });
        });

        canvas.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            zoomLevel *= delta;
            zoomLevel = Math.max(0.5, Math.min(5, zoomLevel));
            
            redrawCallback({ zoomLevel, offsetX, offsetY });
        });
    }
}

// Chart Animation System
class ChartAnimations {
    /**
     * Animate chart rendering
     * @param {Function} drawFunction - Function to draw the chart
     * @param {number} duration - Animation duration in milliseconds
     */
    static animateChart(drawFunction, duration = 1000) {
        const startTime = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out cubic)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            drawFunction(easeProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    /**
     * Create a smooth progress bar animation
     * @param {HTMLElement} progressBar - Progress bar element
     * @param {number} targetWidth - Target width percentage
     * @param {number} duration - Animation duration
     */
    static animateProgressBar(progressBar, targetWidth, duration = 800) {
        const startWidth = parseFloat(progressBar.style.width) || 0;
        const startTime = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing
            const easedProgress = 1 - Math.pow(1 - progress, 2);
            const currentWidth = startWidth + (targetWidth - startWidth) * easedProgress;
            
            progressBar.style.width = `${currentWidth}%`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    /**
     * Animate number counting
     * @param {HTMLElement} element - Element containing the number
     * @param {number} targetNumber - Target number to count to
     * @param {number} duration - Animation duration
     */
    static animateNumber(element, targetNumber, duration = 1000) {
        const startNumber = parseFloat(element.textContent) || 0;
        const startTime = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing
            const easedProgress = 1 - Math.pow(1 - progress, 2);
            const currentNumber = startNumber + (targetNumber - startNumber) * easedProgress;
            
            element.textContent = Math.round(currentNumber);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.AdvancedVisualizations = {
        AdvancedChartRenderer,
        ChartInteractivity,
        ChartAnimations
    };
}