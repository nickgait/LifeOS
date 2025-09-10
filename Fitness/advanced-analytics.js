/**
 * Advanced Analytics Module for Fitness Tracker
 * Provides sophisticated statistical analysis, forecasting, and insights
 */

// Statistical Analysis Engine
class StatisticalAnalysis {
    /**
     * Calculate linear regression for trend analysis
     * @param {Array} data - Array of {x, y} points
     * @returns {Object} - Regression coefficients and statistics
     */
    static linearRegression(data) {
        if (data.length < 2) return null;

        const n = data.length;
        const sumX = data.reduce((sum, point) => sum + point.x, 0);
        const sumY = data.reduce((sum, point) => sum + point.y, 0);
        const sumXY = data.reduce((sum, point) => sum + (point.x * point.y), 0);
        const sumXX = data.reduce((sum, point) => sum + (point.x * point.x), 0);
        const sumYY = data.reduce((sum, point) => sum + (point.y * point.y), 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate R-squared (correlation coefficient)
        const meanY = sumY / n;
        const totalSumSquares = data.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
        const residualSumSquares = data.reduce((sum, point) => {
            const predicted = slope * point.x + intercept;
            return sum + Math.pow(point.y - predicted, 2);
        }, 0);
        
        const rSquared = totalSumSquares === 0 ? 1 : 1 - (residualSumSquares / totalSumSquares);

        return {
            slope,
            intercept,
            rSquared,
            equation: `y = ${slope.toFixed(3)}x + ${intercept.toFixed(3)}`,
            correlation: Math.sqrt(Math.abs(rSquared)) * (slope >= 0 ? 1 : -1)
        };
    }

    /**
     * Calculate exponential moving average for smoothing trends
     * @param {Array} values - Array of numerical values
     * @param {number} alpha - Smoothing factor (0-1)
     * @returns {Array} - Smoothed values
     */
    static exponentialMovingAverage(values, alpha = 0.3) {
        if (values.length === 0) return [];

        const ema = [values[0]];
        for (let i = 1; i < values.length; i++) {
            ema.push(alpha * values[i] + (1 - alpha) * ema[i - 1]);
        }
        return ema;
    }

    /**
     * Calculate statistical summary
     * @param {Array} values - Array of numerical values
     * @returns {Object} - Statistical summary
     */
    static statisticalSummary(values) {
        if (values.length === 0) return null;

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);

        const q1Index = Math.floor(sorted.length * 0.25);
        const q3Index = Math.floor(sorted.length * 0.75);
        const medianIndex = Math.floor(sorted.length * 0.5);

        return {
            count: values.length,
            sum,
            mean,
            median: sorted[medianIndex],
            min: sorted[0],
            max: sorted[sorted.length - 1],
            q1: sorted[q1Index],
            q3: sorted[q3Index],
            variance,
            standardDeviation,
            coefficientOfVariation: mean !== 0 ? standardDeviation / mean : 0
        };
    }

    /**
     * Calculate standard deviation of values
     * @param {Array} values - Array of numerical values
     * @returns {number} - Standard deviation
     */
    static standardDeviation(values) {
        if (values.length === 0) return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    /**
     * Detect outliers using IQR method
     * @param {Array} values - Array of numerical values
     * @returns {Array} - Outlier values and indices
     */
    static detectOutliers(values) {
        const stats = this.statisticalSummary(values);
        if (!stats) return [];

        const iqr = stats.q3 - stats.q1;
        const lowerBound = stats.q1 - 1.5 * iqr;
        const upperBound = stats.q3 + 1.5 * iqr;

        const outliers = [];
        values.forEach((value, index) => {
            if (value < lowerBound || value > upperBound) {
                outliers.push({ value, index, type: value < lowerBound ? 'low' : 'high' });
            }
        });

        return outliers;
    }

    /**
     * Calculate correlation coefficient between two datasets
     * @param {Array} x - First dataset
     * @param {Array} y - Second dataset
     * @returns {number} - Pearson correlation coefficient
     */
    static correlation(x, y) {
        if (x.length !== y.length || x.length === 0) return 0;

        const meanX = x.reduce((a, b) => a + b, 0) / x.length;
        const meanY = y.reduce((a, b) => a + b, 0) / y.length;

        const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
        const denominatorX = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
        const denominatorY = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);

        if (denominatorX === 0 || denominatorY === 0) return 0;

        return numerator / Math.sqrt(denominatorX * denominatorY);
    }
}

// Forecasting Engine
class ForecastingEngine {
    /**
     * Simple linear trend forecasting
     * @param {Array} historicalData - Historical data points
     * @param {number} periodsAhead - Number of periods to forecast
     * @returns {Array} - Forecasted values
     */
    static linearTrendForecast(historicalData, periodsAhead = 7) {
        if (historicalData.length < 3) return [];

        // Convert data to regression format
        const regressionData = historicalData.map((value, index) => ({ x: index, y: value }));
        const regression = StatisticalAnalysis.linearRegression(regressionData);
        
        if (!regression) return [];

        const forecasts = [];
        const lastIndex = historicalData.length - 1;

        for (let i = 1; i <= periodsAhead; i++) {
            const futureIndex = lastIndex + i;
            const forecastValue = regression.slope * futureIndex + regression.intercept;
            forecasts.push({
                period: i,
                value: Math.max(0, forecastValue), // Ensure non-negative
                confidence: Math.max(0, regression.rSquared)
            });
        }

        return forecasts;
    }

    /**
     * Exponential smoothing forecast
     * @param {Array} historicalData - Historical data points
     * @param {number} periodsAhead - Number of periods to forecast
     * @param {number} alpha - Smoothing parameter
     * @returns {Array} - Forecasted values
     */
    static exponentialSmoothingForecast(historicalData, periodsAhead = 7, alpha = 0.3) {
        if (historicalData.length === 0) return [];

        const smoothed = StatisticalAnalysis.exponentialMovingAverage(historicalData, alpha);
        const lastSmoothedValue = smoothed[smoothed.length - 1];

        return Array.from({ length: periodsAhead }, (_, i) => ({
            period: i + 1,
            value: lastSmoothedValue,
            confidence: 0.7 // Fixed confidence for exponential smoothing
        }));
    }

    /**
     * Seasonal decomposition and forecasting
     * @param {Array} data - Time series data
     * @param {number} seasonLength - Length of seasonal cycle
     * @param {number} periodsAhead - Number of periods to forecast
     * @returns {Object} - Decomposed components and forecast
     */
    static seasonalForecast(data, seasonLength = 7, periodsAhead = 7) {
        if (data.length < seasonLength * 2) {
            return this.linearTrendForecast(data, periodsAhead);
        }

        // Calculate seasonal indices
        const seasonalIndices = this.calculateSeasonalIndices(data, seasonLength);
        
        // Deseasonalize data
        const deseasonalizedData = data.map((value, index) => {
            const seasonIndex = index % seasonLength;
            return seasonalIndices[seasonIndex] !== 0 ? value / seasonalIndices[seasonIndex] : value;
        });

        // Forecast deseasonalized trend
        const trendForecast = this.linearTrendForecast(deseasonalizedData, periodsAhead);

        // Reseasonalize forecast
        return trendForecast.map((forecast, index) => {
            const seasonIndex = (data.length + index) % seasonLength;
            return {
                ...forecast,
                value: forecast.value * seasonalIndices[seasonIndex]
            };
        });
    }

    /**
     * Calculate seasonal indices for time series
     * @param {Array} data - Time series data
     * @param {number} seasonLength - Length of seasonal cycle
     * @returns {Array} - Seasonal indices
     */
    static calculateSeasonalIndices(data, seasonLength) {
        const seasonalSums = new Array(seasonLength).fill(0);
        const seasonalCounts = new Array(seasonLength).fill(0);

        // Calculate average for each season position
        data.forEach((value, index) => {
            const seasonIndex = index % seasonLength;
            seasonalSums[seasonIndex] += value;
            seasonalCounts[seasonIndex]++;
        });

        const seasonalAverages = seasonalSums.map((sum, index) => 
            seasonalCounts[index] > 0 ? sum / seasonalCounts[index] : 0
        );

        // Normalize seasonal indices
        const overallAverage = seasonalAverages.reduce((sum, avg) => sum + avg, 0) / seasonLength;
        return seasonalAverages.map(avg => overallAverage !== 0 ? avg / overallAverage : 1);
    }
}

// Performance Analysis Engine
class PerformanceAnalysis {
    /**
     * Analyze goal performance patterns
     * @param {Object} goal - Goal object with history
     * @returns {Object} - Performance analysis
     */
    static analyzeGoalPerformance(goal) {
        if (!goal.history || goal.history.length === 0) {
            return this.getEmptyAnalysis();
        }

        const values = goal.history.map(entry => entry.amount);
        const dates = goal.history.map(entry => new Date(entry.fullDate));
        
        // Sort by date (oldest first)
        const sortedEntries = goal.history
            .map((entry, index) => ({ ...entry, index }))
            .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
        
        const sortedValues = sortedEntries.map(entry => entry.amount);
        const stats = StatisticalAnalysis.statisticalSummary(sortedValues);

        // Calculate daily progress rate
        const dailyRates = [];
        for (let i = 1; i < sortedEntries.length; i++) {
            const daysDiff = Math.max(1, Math.floor(
                (new Date(sortedEntries[i].fullDate) - new Date(sortedEntries[i-1].fullDate)) / (1000 * 60 * 60 * 24)
            ));
            dailyRates.push(sortedEntries[i].amount / daysDiff);
        }

        // Trend analysis
        const trendData = sortedValues.map((value, index) => ({ x: index, y: value }));
        const trend = StatisticalAnalysis.linearRegression(trendData);

        // Consistency analysis
        const consistency = this.calculateConsistency(sortedValues, goal.dailyTarget);
        
        // Performance phases
        const phases = this.identifyPerformancePhases(sortedValues);

        // Forecast next week
        const forecast = ForecastingEngine.seasonalForecast(sortedValues, 7, 7);

        return {
            statistics: stats,
            trend,
            consistency,
            phases,
            forecast,
            outliers: StatisticalAnalysis.detectOutliers(sortedValues),
            dailyRateStats: dailyRates.length > 0 ? StatisticalAnalysis.statisticalSummary(dailyRates) : null,
            performanceScore: this.calculatePerformanceScore(goal, stats, trend, consistency)
        };
    }

    /**
     * Calculate consistency metrics
     * @param {Array} values - Performance values
     * @param {number} target - Target value
     * @returns {Object} - Consistency metrics
     */
    static calculateConsistency(values, target) {
        if (values.length === 0) return { score: 0, variance: 0, reliability: 0 };

        const targetHits = values.filter(value => value >= target * 0.8).length;
        const reliability = targetHits / values.length;
        
        const deviations = values.map(value => Math.abs(value - target));
        const averageDeviation = deviations.reduce((a, b) => a + b, 0) / values.length;
        
        const maxDeviation = Math.max(...deviations);
        const consistency = maxDeviation > 0 ? 1 - (averageDeviation / maxDeviation) : 1;

        return {
            score: consistency,
            reliability,
            averageDeviation,
            maxDeviation,
            targetHitRate: reliability
        };
    }

    /**
     * Identify performance phases (improvement, plateau, decline)
     * @param {Array} values - Performance values
     * @returns {Array} - Phase information
     */
    static identifyPerformancePhases(values) {
        if (values.length < 6) return [];

        const phases = [];
        const windowSize = Math.max(3, Math.floor(values.length / 5));
        
        for (let i = 0; i <= values.length - windowSize; i += windowSize) {
            const window = values.slice(i, i + windowSize);
            const windowData = window.map((value, index) => ({ x: index, y: value }));
            const trend = StatisticalAnalysis.linearRegression(windowData);
            
            let phase = 'stable';
            if (trend && Math.abs(trend.slope) > 0.1) {
                phase = trend.slope > 0 ? 'improving' : 'declining';
            }

            phases.push({
                startIndex: i,
                endIndex: Math.min(i + windowSize - 1, values.length - 1),
                phase,
                trendStrength: trend ? Math.abs(trend.slope) : 0,
                averageValue: window.reduce((a, b) => a + b, 0) / window.length
            });
        }

        return phases;
    }

    /**
     * Calculate overall performance score
     * @param {Object} goal - Goal object
     * @param {Object} stats - Statistical summary
     * @param {Object} trend - Trend analysis
     * @param {Object} consistency - Consistency metrics
     * @returns {number} - Performance score (0-100)
     */
    static calculatePerformanceScore(goal, stats, trend, consistency) {
        let score = 0;

        // Progress score (40% weight)
        const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
        const progressRatio = Math.min(1, completed / goal.target);
        score += progressRatio * 40;

        // Consistency score (30% weight)
        score += consistency.score * 30;

        // Trend score (20% weight)
        if (trend && trend.rSquared > 0.5) {
            const trendScore = trend.slope > 0 ? Math.min(1, trend.slope / goal.dailyTarget) : 0;
            score += trendScore * 20;
        }

        // Activity score (10% weight)
        const activityRatio = Math.min(1, goal.history.length / 30); // Based on 30 days of activity
        score += activityRatio * 10;

        return Math.round(Math.min(100, Math.max(0, score)));
    }

    static getEmptyAnalysis() {
        return {
            statistics: null,
            trend: null,
            consistency: { score: 0, variance: 0, reliability: 0 },
            phases: [],
            forecast: [],
            outliers: [],
            dailyRateStats: null,
            performanceScore: 0
        };
    }
}

// Health Insights Engine
class HealthInsights {
    /**
     * Generate health insights and recommendations
     * @param {Array} goals - All user goals
     * @param {Object} biometrics - Biometric data (optional)
     * @returns {Object} - Health insights
     */
    static generateInsights(goals, biometrics = {}) {
        const insights = {
            general: [],
            specific: [],
            warnings: [],
            recommendations: [],
            trends: {}
        };

        // Analyze overall activity patterns
        const activityAnalysis = this.analyzeActivityPatterns(goals);
        insights.trends.activity = activityAnalysis;

        // Generate general insights
        insights.general = this.generateGeneralInsights(goals, activityAnalysis);

        // Generate goal-specific insights
        insights.specific = goals.map(goal => this.generateGoalInsights(goal));

        // Check for potential issues
        insights.warnings = this.identifyHealthWarnings(goals, biometrics);

        // Generate recommendations
        insights.recommendations = this.generateRecommendations(goals, activityAnalysis, biometrics);

        return insights;
    }

    /**
     * Analyze activity patterns across all goals
     * @param {Array} goals - All user goals
     * @returns {Object} - Activity pattern analysis
     */
    static analyzeActivityPatterns(goals) {
        const allEntries = goals.flatMap(goal => 
            goal.history.map(entry => ({
                ...entry,
                goalName: goal.name,
                goalType: goal.type,
                goalCategory: goal.category
            }))
        );

        if (allEntries.length === 0) {
            return { totalEntries: 0, avgPerDay: 0, mostActiveDay: null, patterns: {} };
        }

        // Sort by date
        allEntries.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

        // Analyze by day of week
        const dayPatterns = {};
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        allEntries.forEach(entry => {
            const dayOfWeek = new Date(entry.fullDate).getDay();
            const dayName = dayNames[dayOfWeek];
            
            if (!dayPatterns[dayName]) {
                dayPatterns[dayName] = { count: 0, totalAmount: 0 };
            }
            
            dayPatterns[dayName].count++;
            dayPatterns[dayName].totalAmount += entry.amount;
        });

        // Find most active day
        const mostActiveDay = Object.entries(dayPatterns)
            .reduce((max, [day, data]) => data.count > (max.data?.count || 0) ? { day, data } : max, {});

        // Calculate time-based patterns
        const timePatterns = this.analyzeTimePatterns(allEntries);

        return {
            totalEntries: allEntries.length,
            avgPerDay: allEntries.length / Math.max(1, this.getDaySpan(allEntries)),
            mostActiveDay: mostActiveDay.day,
            dayPatterns,
            timePatterns,
            categoryDistribution: this.analyzeCategoryDistribution(goals)
        };
    }

    /**
     * Generate general health insights
     * @param {Array} goals - All user goals
     * @param {Object} activityAnalysis - Activity pattern analysis
     * @returns {Array} - General insights
     */
    static generateGeneralInsights(goals, activityAnalysis) {
        const insights = [];

        // Activity frequency insight
        if (activityAnalysis.avgPerDay > 3) {
            insights.push({
                type: 'positive',
                title: 'High Activity Level',
                message: `You're averaging ${activityAnalysis.avgPerDay.toFixed(1)} activity entries per day - excellent consistency!`,
                icon: '🔥'
            });
        } else if (activityAnalysis.avgPerDay < 1) {
            insights.push({
                type: 'warning',
                title: 'Low Activity Level',
                message: 'Consider increasing your daily activity frequency for better results.',
                icon: '⚠️'
            });
        }

        // Goal diversity insight
        const categories = new Set(goals.map(goal => goal.category));
        if (categories.size >= 3) {
            insights.push({
                type: 'positive',
                title: 'Well-Rounded Goals',
                message: `You're tracking ${categories.size} different categories - great for overall health!`,
                icon: '🎯'
            });
        }

        // Most active day insight
        if (activityAnalysis.mostActiveDay) {
            insights.push({
                type: 'info',
                title: 'Peak Activity Day',
                message: `${activityAnalysis.mostActiveDay} is your most active day. Consider balancing your weekly routine.`,
                icon: '📊'
            });
        }

        return insights;
    }

    /**
     * Generate goal-specific insights
     * @param {Object} goal - Individual goal
     * @returns {Object} - Goal-specific insights
     */
    static generateGoalInsights(goal) {
        const analysis = PerformanceAnalysis.analyzeGoalPerformance(goal);
        const insights = [];

        // Performance trend
        if (analysis.trend && analysis.trend.correlation > 0.5) {
            insights.push({
                type: 'positive',
                message: 'Strong upward trend in your progress!',
                icon: '📈'
            });
        } else if (analysis.trend && analysis.trend.correlation < -0.3) {
            insights.push({
                type: 'warning',
                message: 'Declining trend detected. Consider adjusting your approach.',
                icon: '📉'
            });
        }

        // Consistency
        if (analysis.consistency.score > 0.8) {
            insights.push({
                type: 'positive',
                message: 'Excellent consistency in your efforts!',
                icon: '🎯'
            });
        } else if (analysis.consistency.score < 0.5) {
            insights.push({
                type: 'suggestion',
                message: 'Try to maintain more consistent daily progress.',
                icon: '⚖️'
            });
        }

        return {
            goalName: goal.name,
            performanceScore: analysis.performanceScore,
            insights
        };
    }

    /**
     * Identify potential health warnings
     * @param {Array} goals - All user goals
     * @param {Object} biometrics - Biometric data
     * @returns {Array} - Warning messages
     */
    static identifyHealthWarnings(goals, biometrics) {
        const warnings = [];

        // Check for overexertion
        goals.forEach(goal => {
            if (goal.type === 'count' && goal.history.length > 0) {
                const recentValues = goal.history.slice(0, 7).map(entry => entry.amount);
                const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
                
                if (avg > goal.dailyTarget * 2) {
                    warnings.push({
                        type: 'warning',
                        title: 'Potential Overexertion',
                        message: `Your recent ${goal.name} activity is significantly above target. Consider rest days.`,
                        goalName: goal.name,
                        icon: '⚠️'
                    });
                }
            }
        });

        // Check for prolonged inactivity
        const now = new Date();
        goals.forEach(goal => {
            if (goal.history.length > 0) {
                const lastEntry = new Date(goal.history[0].fullDate);
                const daysSinceLastActivity = Math.floor((now - lastEntry) / (1000 * 60 * 60 * 24));
                
                if (daysSinceLastActivity > 7) {
                    warnings.push({
                        type: 'info',
                        title: 'Activity Gap',
                        message: `No activity logged for ${goal.name} in ${daysSinceLastActivity} days.`,
                        goalName: goal.name,
                        icon: '📅'
                    });
                }
            }
        });

        return warnings;
    }

    /**
     * Generate personalized recommendations
     * @param {Array} goals - All user goals
     * @param {Object} activityAnalysis - Activity analysis
     * @param {Object} biometrics - Biometric data
     * @returns {Array} - Recommendations
     */
    static generateRecommendations(goals, activityAnalysis, biometrics) {
        const recommendations = [];

        // Activity timing recommendations
        if (activityAnalysis.mostActiveDay) {
            const leastActiveDay = Object.entries(activityAnalysis.dayPatterns)
                .reduce((min, [day, data]) => !min || data.count < min.data.count ? { day, data } : min, null);
            
            if (leastActiveDay) {
                recommendations.push({
                    type: 'suggestion',
                    title: 'Balance Your Week',
                    message: `Try adding more activities on ${leastActiveDay.day} to balance your weekly routine.`,
                    priority: 'medium',
                    icon: '⚖️'
                });
            }
        }

        // Goal completion recommendations
        goals.forEach(goal => {
            const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
            const progressRatio = completed / goal.target;
            
            if (progressRatio > 0.8) {
                recommendations.push({
                    type: 'success',
                    title: 'Goal Achievement',
                    message: `You're ${Math.round(progressRatio * 100)}% complete with ${goal.name}! Consider setting a new challenge.`,
                    goalName: goal.name,
                    priority: 'high',
                    icon: '🏆'
                });
            } else if (progressRatio < 0.3 && goal.history.length > 10) {
                recommendations.push({
                    type: 'suggestion',
                    title: 'Goal Adjustment',
                    message: `Consider adjusting your ${goal.name} target or daily approach for better progress.`,
                    goalName: goal.name,
                    priority: 'medium',
                    icon: '🎯'
                });
            }
        });

        // Rest day recommendations
        const fitnessGoals = goals.filter(goal => goal.category === 'fitness');
        if (fitnessGoals.length > 0 && activityAnalysis.avgPerDay > 2) {
            recommendations.push({
                type: 'health',
                title: 'Rest and Recovery',
                message: 'High activity detected. Ensure you include rest days for optimal recovery.',
                priority: 'high',
                icon: '😴'
            });
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        });
    }

    // Helper methods
    static getDaySpan(entries) {
        if (entries.length === 0) return 1;
        const firstDate = new Date(entries[entries.length - 1].fullDate);
        const lastDate = new Date(entries[0].fullDate);
        return Math.max(1, Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1);
    }

    static analyzeTimePatterns(entries) {
        const hourPatterns = {};
        
        entries.forEach(entry => {
            const hour = new Date(entry.fullDate).getHours();
            const timeSlot = this.getTimeSlot(hour);
            
            if (!hourPatterns[timeSlot]) {
                hourPatterns[timeSlot] = 0;
            }
            hourPatterns[timeSlot]++;
        });

        return hourPatterns;
    }

    static getTimeSlot(hour) {
        if (hour >= 5 && hour < 12) return 'Morning';
        if (hour >= 12 && hour < 17) return 'Afternoon';
        if (hour >= 17 && hour < 21) return 'Evening';
        return 'Night';
    }

    static analyzeCategoryDistribution(goals) {
        const distribution = {};
        
        goals.forEach(goal => {
            const category = goal.category || 'other';
            if (!distribution[category]) {
                distribution[category] = 0;
            }
            distribution[category]++;
        });

        return distribution;
    }
}

// Goal Difficulty Analyzer
class GoalDifficultyAnalyzer {
    /**
     * Calculate goal difficulty score
     * @param {Object} goal - Goal object
     * @returns {Object} - Difficulty analysis
     */
    static analyzeGoalDifficulty(goal) {
        const factors = this.analyzeDifficultyFactors(goal);
        const score = this.calculateDifficultyScore(factors);
        const recommendations = this.generateDifficultyRecommendations(goal, factors, score);

        return {
            score, // 1-10 scale (1 = very easy, 10 = extremely difficult)
            level: this.getDifficultyLevel(score),
            factors,
            recommendations,
            feasibilityAssessment: this.assessFeasibility(goal, factors)
        };
    }

    /**
     * Analyze factors that contribute to goal difficulty
     * @param {Object} goal - Goal object
     * @returns {Object} - Difficulty factors
     */
    static analyzeDifficultyFactors(goal) {
        const factors = {};

        // Target size factor
        factors.targetMagnitude = this.assessTargetMagnitude(goal);

        // Daily commitment factor
        factors.dailyCommitment = this.assessDailyCommitment(goal);

        // Time duration factor
        factors.duration = this.assessDuration(goal);

        // Consistency requirement factor
        factors.consistencyRequirement = this.assessConsistencyRequirement(goal);

        // Progress pattern factor (if history available)
        if (goal.history && goal.history.length > 0) {
            factors.progressPattern = this.assessProgressPattern(goal);
        }

        return factors;
    }

    /**
     * Calculate overall difficulty score
     * @param {Object} factors - Difficulty factors
     * @returns {number} - Difficulty score (1-10)
     */
    static calculateDifficultyScore(factors) {
        const weights = {
            targetMagnitude: 0.3,
            dailyCommitment: 0.25,
            duration: 0.2,
            consistencyRequirement: 0.15,
            progressPattern: 0.1
        };

        let score = 0;
        let totalWeight = 0;

        Object.entries(factors).forEach(([factor, value]) => {
            if (weights[factor] && value !== undefined) {
                score += value * weights[factor];
                totalWeight += weights[factor];
            }
        });

        return totalWeight > 0 ? Math.round((score / totalWeight) * 10) / 10 : 5;
    }

    // Assessment methods for individual factors
    static assessTargetMagnitude(goal) {
        const benchmarks = {
            count: { easy: 100, moderate: 1000, hard: 5000, extreme: 10000 },
            weight: { easy: 50, moderate: 200, hard: 500, extreme: 1000 },
            distance: { easy: 10, moderate: 100, hard: 500, extreme: 1000 },
            time: { easy: 60, moderate: 300, hard: 1000, extreme: 3000 }
        };

        const benchmark = benchmarks[goal.type] || benchmarks.count;
        const target = goal.target;

        if (target <= benchmark.easy) return 2;
        if (target <= benchmark.moderate) return 4;
        if (target <= benchmark.hard) return 7;
        if (target <= benchmark.extreme) return 9;
        return 10;
    }

    static assessDailyCommitment(goal) {
        const dailyTarget = goal.dailyTarget;
        const totalDays = Math.ceil(goal.target / dailyTarget);
        const dailyIntensity = dailyTarget / totalDays;

        // Scale based on daily requirement intensity
        if (dailyIntensity < 0.01) return 2;
        if (dailyIntensity < 0.05) return 4;
        if (dailyIntensity < 0.1) return 6;
        if (dailyIntensity < 0.2) return 8;
        return 10;
    }

    static assessDuration(goal) {
        const estimatedDays = Math.ceil(goal.target / goal.dailyTarget);
        
        if (estimatedDays <= 30) return 2;      // 1 month
        if (estimatedDays <= 90) return 4;      // 3 months
        if (estimatedDays <= 180) return 6;     // 6 months
        if (estimatedDays <= 365) return 8;     // 1 year
        return 10;                              // Over 1 year
    }

    static assessConsistencyRequirement(goal) {
        const dailyTarget = goal.dailyTarget;
        const avgDaily = goal.target / Math.ceil(goal.target / dailyTarget);
        const consistencyRatio = dailyTarget / avgDaily;

        // Higher ratio means less flexibility in daily amounts
        if (consistencyRatio >= 0.9) return 8;  // Very strict daily requirements
        if (consistencyRatio >= 0.7) return 6;  // Moderate flexibility
        if (consistencyRatio >= 0.5) return 4;  // Good flexibility
        return 2;                               // High flexibility
    }

    static assessProgressPattern(goal) {
        const analysis = PerformanceAnalysis.analyzeGoalPerformance(goal);
        
        if (!analysis.trend) return 5;

        // Positive trend = easier to continue, negative = harder
        if (analysis.trend.correlation > 0.5) return 3;
        if (analysis.trend.correlation > 0) return 4;
        if (analysis.trend.correlation > -0.3) return 6;
        return 8;
    }

    static getDifficultyLevel(score) {
        if (score <= 2) return 'Very Easy';
        if (score <= 4) return 'Easy';
        if (score <= 6) return 'Moderate';
        if (score <= 8) return 'Challenging';
        return 'Very Difficult';
    }

    static generateDifficultyRecommendations(goal, factors, score) {
        const recommendations = [];

        if (score >= 8) {
            recommendations.push({
                type: 'warning',
                title: 'High Difficulty Detected',
                message: 'This goal is very challenging. Consider breaking it into smaller milestones.',
                icon: '⚠️'
            });
        }

        if (factors.dailyCommitment >= 8) {
            recommendations.push({
                type: 'suggestion',
                title: 'High Daily Commitment',
                message: 'Consider reducing daily targets and extending the timeline for better sustainability.',
                icon: '📅'
            });
        }

        if (factors.duration >= 8) {
            recommendations.push({
                type: 'suggestion',
                title: 'Long-term Goal',
                message: 'Set intermediate checkpoints and rewards to maintain motivation over time.',
                icon: '🎯'
            });
        }

        if (factors.consistencyRequirement >= 7) {
            recommendations.push({
                type: 'suggestion',
                title: 'Strict Consistency Required',
                message: 'Build buffer days into your plan to account for life interruptions.',
                icon: '🛡️'
            });
        }

        return recommendations;
    }

    static assessFeasibility(goal, factors) {
        const score = this.calculateDifficultyScore(factors);
        
        if (score <= 4) {
            return {
                level: 'high',
                message: 'This goal appears very achievable with your current plan.',
                confidence: 0.9
            };
        } else if (score <= 6) {
            return {
                level: 'moderate',
                message: 'This goal is achievable but will require consistent effort.',
                confidence: 0.7
            };
        } else if (score <= 8) {
            return {
                level: 'low',
                message: 'This goal is challenging and may require adjustments to your approach.',
                confidence: 0.5
            };
        } else {
            return {
                level: 'very-low',
                message: 'This goal may be too ambitious. Consider breaking it down or adjusting targets.',
                confidence: 0.3
            };
        }
    }
}

// Export all classes for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StatisticalAnalysis,
        ForecastingEngine,
        PerformanceAnalysis,
        HealthInsights,
        GoalDifficultyAnalyzer
    };
}

// Journal Analytics Integration
class JournalAnalytics {
    /**
     * Analyze mood trends and correlations with goal performance
     * @param {Array} journalEntries - Journal entries with mood data
     * @param {Array} goals - Fitness goals data
     * @returns {Object} - Comprehensive journal analytics
     */
    static analyzeMoodAndPerformance(journalEntries, goals) {
        const moodEntries = journalEntries.filter(entry => entry.mood !== null);
        if (moodEntries.length === 0) {
            return { hasSufficientData: false };
        }

        // Group entries by date for correlation analysis
        const dateMap = new Map();
        moodEntries.forEach(entry => {
            const date = entry.date;
            if (!dateMap.has(date)) {
                dateMap.set(date, { mood: entry.mood, entries: [entry] });
            }
        });

        // Calculate goal performance on journal days
        const performanceCorrelations = goals.map(goal => {
            const correlationData = [];
            
            goal.history.forEach(historyEntry => {
                const dateEntry = dateMap.get(historyEntry.date);
                if (dateEntry) {
                    correlationData.push({
                        x: dateEntry.mood,
                        y: historyEntry.amount
                    });
                }
            });

            if (correlationData.length < 3) return null;

            const regression = StatisticalAnalysis.linearRegression(correlationData);
            return {
                goalName: goal.name,
                correlation: regression?.correlation || 0,
                significance: this.calculateSignificance(correlationData),
                dataPoints: correlationData.length
            };
        }).filter(Boolean);

        // Mood trend analysis
        const moodTrend = this.analyzeMoodTrend(moodEntries);
        
        // Category performance analysis
        const categoryAnalysis = this.analyzeCategoryPerformance(journalEntries);

        return {
            hasSufficientData: true,
            moodTrend,
            performanceCorrelations,
            categoryAnalysis,
            insights: this.generateJournalInsights(moodEntries, performanceCorrelations, categoryAnalysis)
        };
    }

    static analyzeMoodTrend(moodEntries) {
        if (moodEntries.length < 5) return null;

        const sortedEntries = moodEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
        const moodData = sortedEntries.map((entry, index) => ({
            x: index,
            y: entry.mood
        }));

        const regression = StatisticalAnalysis.linearRegression(moodData);
        const recentMoods = sortedEntries.slice(-7).map(e => e.mood);
        const avgRecentMood = recentMoods.reduce((sum, mood) => sum + mood, 0) / recentMoods.length;

        return {
            trend: regression?.slope > 0.05 ? 'improving' : regression?.slope < -0.05 ? 'declining' : 'stable',
            trendStrength: Math.abs(regression?.slope || 0),
            correlation: regression?.rSquared || 0,
            currentAverage: avgRecentMood,
            volatility: StatisticalAnalysis.standardDeviation(recentMoods)
        };
    }

    static analyzeCategoryPerformance(journalEntries) {
        const categoryData = {};
        
        journalEntries.forEach(entry => {
            if (!entry.category || entry.mood === null) return;
            
            if (!categoryData[entry.category]) {
                categoryData[entry.category] = { moods: [], count: 0 };
            }
            
            categoryData[entry.category].moods.push(entry.mood);
            categoryData[entry.category].count++;
        });

        return Object.entries(categoryData).map(([category, data]) => ({
            category,
            averageMood: data.moods.reduce((sum, mood) => sum + mood, 0) / data.moods.length,
            entryCount: data.count,
            consistency: StatisticalAnalysis.standardDeviation(data.moods)
        })).sort((a, b) => b.averageMood - a.averageMood);
    }

    static generateJournalInsights(moodEntries, correlations, categoryAnalysis) {
        const insights = [];

        // Mood trend insights
        if (moodEntries.length >= 7) {
            const recentMoods = moodEntries.slice(-7).map(e => e.mood);
            const avgMood = recentMoods.reduce((sum, mood) => sum + mood, 0) / recentMoods.length;
            
            if (avgMood >= 4.0) {
                insights.push({
                    type: 'positive',
                    icon: '😊',
                    title: 'Excellent Mood Pattern',
                    message: `Your recent mood average is ${avgMood.toFixed(1)}/5. Keep up the great work!`
                });
            } else if (avgMood <= 2.5) {
                insights.push({
                    type: 'warning',
                    icon: '😟',
                    title: 'Concerning Mood Trend',
                    message: `Your recent mood average is ${avgMood.toFixed(1)}/5. Consider talking to someone or adjusting your routine.`
                });
            }
        }

        // Performance correlation insights
        const strongCorrelations = correlations.filter(c => Math.abs(c.correlation) > 0.5 && c.dataPoints >= 5);
        if (strongCorrelations.length > 0) {
            const strongest = strongCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))[0];
            
            if (strongest.correlation > 0) {
                insights.push({
                    type: 'positive',
                    icon: '💪',
                    title: 'Mood-Performance Connection',
                    message: `Higher moods strongly correlate with better ${strongest.goalName} performance!`
                });
            } else {
                insights.push({
                    type: 'info',
                    icon: '🤔',
                    title: 'Interesting Pattern',
                    message: `There's a negative correlation between mood and ${strongest.goalName} performance. Perhaps this goal is stressing you?`
                });
            }
        }

        // Category insights
        if (categoryAnalysis.length > 1) {
            const bestCategory = categoryAnalysis[0];
            const worstCategory = categoryAnalysis[categoryAnalysis.length - 1];
            
            if (bestCategory.averageMood - worstCategory.averageMood > 1) {
                insights.push({
                    type: 'info',
                    icon: '📊',
                    title: 'Category Impact',
                    message: `${bestCategory.category} entries have significantly higher mood scores than ${worstCategory.category} entries.`
                });
            }
        }

        return insights;
    }

    static calculateSignificance(data) {
        // Simple significance calculation based on sample size and correlation strength
        if (data.length < 3) return 'low';
        if (data.length < 10) return 'moderate';
        return 'high';
    }

    /**
     * Generate journal-based health recommendations
     */
    static generateJournalRecommendations(journalEntries, goals) {
        const recommendations = [];
        
        // Analyze writing frequency
        const recentEntries = journalEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return entryDate >= weekAgo;
        });

        if (recentEntries.length < 3) {
            recommendations.push({
                type: 'info',
                icon: '📝',
                title: 'Consistency Matters',
                message: 'Try to journal more regularly. Daily reflection can improve mood and goal achievement.',
                priority: 'medium'
            });
        }

        // Analyze mood patterns
        const moodEntries = journalEntries.filter(e => e.mood !== null);
        if (moodEntries.length >= 10) {
            const avgMood = moodEntries.reduce((sum, e) => sum + e.mood, 0) / moodEntries.length;
            
            if (avgMood < 3) {
                recommendations.push({
                    type: 'warning',
                    icon: '🧘',
                    title: 'Mood Support',
                    message: 'Your journal shows concerning mood patterns. Consider mindfulness practices or professional support.',
                    priority: 'high'
                });
            }
        }

        // Tag analysis for recommendations
        const tagCounts = {};
        journalEntries.forEach(entry => {
            entry.tags.forEach(tag => {
                tagCounts[tag.toLowerCase()] = (tagCounts[tag.toLowerCase()] || 0) + 1;
            });
        });

        const stressTags = ['stress', 'tired', 'exhausted', 'overwhelmed', 'anxiety'];
        const stressCount = stressTags.reduce((sum, tag) => sum + (tagCounts[tag] || 0), 0);
        
        if (stressCount > journalEntries.length * 0.3) {
            recommendations.push({
                type: 'warning',
                icon: '😌',
                title: 'Stress Management',
                message: 'Your entries frequently mention stress. Consider adding rest days or relaxation activities.',
                priority: 'high'
            });
        }

        return recommendations.sort((a, b) => {
            const priority = { high: 3, medium: 2, low: 1 };
            return priority[b.priority] - priority[a.priority];
        });
    }
}

// Export for both Node.js and Browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StatisticalAnalysis,
        ForecastingEngine,
        PerformanceAnalysis,
        HealthInsights,
        GoalDifficultyAnalyzer,
        JournalAnalytics
    };
} else if (typeof window !== 'undefined') {
    window.AdvancedAnalytics = {
        StatisticalAnalysis,
        ForecastingEngine,
        PerformanceAnalysis,
        HealthInsights,
        GoalDifficultyAnalyzer,
        JournalAnalytics
    };
}