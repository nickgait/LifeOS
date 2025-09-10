/**
 * Long-term Health Trend Monitoring Module
 * Tracks and analyzes health trends over extended periods
 */

// Health Trend Monitor
class HealthTrendMonitor {
    constructor() {
        this.trendData = JSON.parse(localStorage.getItem('healthTrendData')) || {};
        this.trendConfig = JSON.parse(localStorage.getItem('trendConfig')) || this.getDefaultConfig();
        this.alerts = JSON.parse(localStorage.getItem('trendAlerts')) || [];
        this.lastAnalysis = localStorage.getItem('lastTrendAnalysis') || null;
    }

    /**
     * Get default trend monitoring configuration
     */
    getDefaultConfig() {
        return {
            analysisIntervals: {
                weekly: { enabled: true, threshold: 0.1 },
                monthly: { enabled: true, threshold: 0.15 },
                quarterly: { enabled: true, threshold: 0.2 },
                yearly: { enabled: true, threshold: 0.25 }
            },
            alertThresholds: {
                declining: 0.3,      // Alert if declining trend > 30%
                stagnant: 0.05,      // Alert if no change for > 5%
                volatility: 0.4      // Alert if volatility > 40%
            },
            trackingMetrics: {
                goalCompletion: true,
                averageDaily: true,
                consistency: true,
                streaks: true,
                categories: true,
                biometrics: true
            }
        };
    }

    /**
     * Analyze long-term trends for all goals and health metrics
     * @param {Array} goals - All user goals
     * @param {Object} biometricData - Biometric data from BiometricDataManager
     * @returns {Object} - Comprehensive trend analysis
     */
    analyzeLongTermTrends(goals, biometricData = {}) {
        try {
            const analysis = {
                timestamp: new Date().toISOString(),
                trends: {},
                healthMetrics: {},
                alerts: [],
                summary: {},
                recommendations: []
            };

            // Analyze goal trends
            analysis.trends.goals = this.analyzeGoalTrends(goals);
            
            // Analyze biometric trends
            if (Object.keys(biometricData).length > 0) {
                analysis.trends.biometrics = this.analyzeBiometricTrends(biometricData);
            }

            // Analyze category trends
            analysis.trends.categories = this.analyzeCategoryTrends(goals);

            // Generate health metrics
            analysis.healthMetrics = this.generateHealthMetrics(goals, biometricData);

            // Check for trend alerts
            analysis.alerts = this.checkTrendAlerts(analysis.trends);

            // Generate summary
            analysis.summary = this.generateTrendSummary(analysis);

            // Generate recommendations
            analysis.recommendations = this.generateTrendRecommendations(analysis);

            // Store analysis
            this.storeTrendAnalysis(analysis);

            return analysis;

        } catch (error) {
            ErrorHandler.handle(error, 'Trend Analysis');
            return this.getEmptyAnalysis();
        }
    }

    /**
     * Analyze trends for individual goals
     * @param {Array} goals - All user goals
     * @returns {Object} - Goal trend analysis
     */
    analyzeGoalTrends(goals) {
        const goalTrends = {};

        goals.forEach(goal => {
            goalTrends[goal.name] = this.analyzeIndividualGoalTrend(goal);
        });

        return goalTrends;
    }

    /**
     * Analyze trend for individual goal
     * @param {Object} goal - Single goal object
     * @returns {Object} - Individual goal trend analysis
     */
    analyzeIndividualGoalTrend(goal) {
        if (!goal.history || goal.history.length < 7) {
            return { insufficient_data: true };
        }

        // Sort history by date
        const sortedHistory = [...goal.history].sort((a, b) => 
            new Date(a.fullDate) - new Date(b.fullDate)
        );

        // Analyze different time periods
        const trends = {};
        const timeframes = {
            week: 7,
            month: 30,
            quarter: 90,
            year: 365
        };

        Object.entries(timeframes).forEach(([period, days]) => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const periodData = sortedHistory.filter(entry => 
                new Date(entry.fullDate) >= cutoffDate
            );

            if (periodData.length >= Math.min(days / 7, 3)) { // Need at least 3 data points or 1/7th of period
                trends[period] = this.calculatePeriodTrend(periodData, goal.dailyTarget);
            }
        });

        // Calculate overall trend
        const overallTrend = this.calculateOverallTrend(sortedHistory, goal);

        return {
            trends,
            overall: overallTrend,
            dataQuality: this.assessDataQuality(sortedHistory),
            prediction: this.predictGoalCompletion(goal, overallTrend)
        };
    }

    /**
     * Calculate trend for a specific time period
     * @param {Array} data - History data for the period
     * @param {number} target - Daily target
     * @returns {Object} - Period trend analysis
     */
    calculatePeriodTrend(data, target) {
        const values = data.map(entry => entry.amount);
        const dates = data.map(entry => new Date(entry.fullDate));
        
        // Create regression data
        const regressionData = values.map((value, index) => ({ x: index, y: value }));
        const regression = StatisticalAnalysis.linearRegression(regressionData);
        
        // Calculate metrics
        const stats = StatisticalAnalysis.statisticalSummary(values);
        const consistency = this.calculateConsistencyScore(values, target);
        const volatility = stats.standardDeviation / stats.mean;

        return {
            regression,
            statistics: stats,
            consistency,
            volatility,
            direction: this.getTrendDirection(regression?.slope || 0),
            strength: this.getTrendStrength(regression?.rSquared || 0),
            targetAchievementRate: values.filter(v => v >= target * 0.8).length / values.length
        };
    }

    /**
     * Calculate overall trend across all available data
     * @param {Array} history - Complete history data
     * @param {Object} goal - Goal object
     * @returns {Object} - Overall trend analysis
     */
    calculateOverallTrend(history, goal) {
        // Calculate cumulative progress trend
        let cumulative = 0;
        const cumulativeData = history.map((entry, index) => {
            cumulative += entry.amount;
            return {
                x: index,
                y: cumulative,
                date: entry.fullDate,
                progress: (cumulative / goal.target) * 100
            };
        });

        const regression = StatisticalAnalysis.linearRegression(cumulativeData);
        
        // Calculate velocity (progress rate over time)
        const timeSpan = (new Date(history[0].fullDate) - new Date(history[history.length - 1].fullDate)) / (1000 * 60 * 60 * 24);
        const velocity = cumulative / Math.max(timeSpan, 1);

        // Analyze momentum (recent vs. historical performance)
        const momentum = this.calculateMomentum(history);

        return {
            progressRate: regression?.slope || 0,
            velocity,
            momentum,
            totalProgress: (cumulative / goal.target) * 100,
            estimatedCompletion: this.estimateCompletionDate(goal, velocity),
            trendQuality: regression?.rSquared || 0
        };
    }

    /**
     * Calculate momentum (recent performance vs. historical)
     * @param {Array} history - Complete history data
     * @returns {Object} - Momentum analysis
     */
    calculateMomentum(history) {
        if (history.length < 10) return { insufficient_data: true };

        const recent = history.slice(0, Math.floor(history.length / 3));
        const historical = history.slice(Math.floor(history.length / 3));

        const recentAvg = recent.reduce((sum, entry) => sum + entry.amount, 0) / recent.length;
        const historicalAvg = historical.reduce((sum, entry) => sum + entry.amount, 0) / historical.length;

        const momentumScore = historicalAvg > 0 ? (recentAvg - historicalAvg) / historicalAvg : 0;

        return {
            score: momentumScore,
            direction: momentumScore > 0.1 ? 'accelerating' : 
                      momentumScore < -0.1 ? 'decelerating' : 'stable',
            recentAverage: recentAvg,
            historicalAverage: historicalAvg
        };
    }

    /**
     * Analyze biometric trends
     * @param {Object} biometricData - Biometric data
     * @returns {Object} - Biometric trend analysis
     */
    analyzeBiometricTrends(biometricData) {
        const biometricTrends = {};

        Object.entries(biometricData).forEach(([type, data]) => {
            if (Array.isArray(data) && data.length > 0) {
                biometricTrends[type] = this.analyzeBiometricTypeTrend(type, data);
            }
        });

        return biometricTrends;
    }

    /**
     * Analyze trend for specific biometric type
     * @param {string} type - Biometric type
     * @param {Array} data - Biometric data points
     * @returns {Object} - Biometric type trend analysis
     */
    analyzeBiometricTypeTrend(type, data) {
        // Group by day and calculate daily averages
        const dailyData = {};
        data.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            const value = entry.value || entry.bpm || entry.steps || entry.magnitude;
            
            if (value) {
                if (!dailyData[date]) {
                    dailyData[date] = [];
                }
                dailyData[date].push(value);
            }
        });

        // Convert to trend data
        const trendData = Object.keys(dailyData)
            .sort((a, b) => new Date(a) - new Date(b))
            .map((date, index) => {
                const values = dailyData[date];
                const average = values.reduce((a, b) => a + b, 0) / values.length;
                
                return { x: index, y: average, date };
            });

        if (trendData.length < 7) {
            return { insufficient_data: true };
        }

        // Calculate trend
        const regression = StatisticalAnalysis.linearRegression(trendData);
        const stats = StatisticalAnalysis.statisticalSummary(trendData.map(d => d.y));
        
        // Health range assessment
        const healthAssessment = this.assessBiometricHealth(type, stats);

        return {
            trend: regression,
            statistics: stats,
            dataPoints: trendData.length,
            healthAssessment,
            recentTrend: this.calculateRecentBiometricTrend(trendData.slice(-14)) // Last 2 weeks
        };
    }

    /**
     * Assess biometric health based on normal ranges
     * @param {string} type - Biometric type
     * @param {Object} stats - Statistical summary
     * @returns {Object} - Health assessment
     */
    assessBiometricHealth(type, stats) {
        const healthRanges = {
            heartRate: { min: 60, max: 100, unit: 'bpm' },
            steps: { min: 8000, max: 15000, unit: 'steps' },
            sleep: { min: 7, max: 9, unit: 'hours' },
            weight: { min: null, max: null, unit: 'lbs' }, // Depends on individual
            bloodPressure: { min: 90, max: 140, unit: 'mmHg' }
        };

        const range = healthRanges[type];
        if (!range || (!range.min && !range.max)) {
            return { assessment: 'unknown', message: 'No standard range available' };
        }

        const avgValue = stats.mean;
        
        if (range.min && avgValue < range.min) {
            return {
                assessment: 'low',
                message: `Average ${type} (${avgValue.toFixed(1)} ${range.unit}) is below normal range`,
                severity: 'moderate'
            };
        } else if (range.max && avgValue > range.max) {
            return {
                assessment: 'high',
                message: `Average ${type} (${avgValue.toFixed(1)} ${range.unit}) is above normal range`,
                severity: 'moderate'
            };
        } else {
            return {
                assessment: 'normal',
                message: `${type} is within normal range`,
                severity: 'none'
            };
        }
    }

    /**
     * Calculate recent biometric trend
     * @param {Array} recentData - Recent biometric data
     * @returns {Object} - Recent trend analysis
     */
    calculateRecentBiometricTrend(recentData) {
        if (recentData.length < 3) return null;

        const regression = StatisticalAnalysis.linearRegression(recentData);
        return {
            slope: regression?.slope || 0,
            direction: this.getTrendDirection(regression?.slope || 0),
            reliability: regression?.rSquared || 0
        };
    }

    /**
     * Analyze category trends
     * @param {Array} goals - All user goals
     * @returns {Object} - Category trend analysis
     */
    analyzeCategoryTrends(goals) {
        const categoryData = {};

        // Group goals by category
        goals.forEach(goal => {
            const category = goal.category || 'other';
            if (!categoryData[category]) {
                categoryData[category] = [];
            }
            categoryData[category].push(goal);
        });

        // Analyze each category
        const categoryTrends = {};
        Object.entries(categoryData).forEach(([category, categoryGoals]) => {
            categoryTrends[category] = this.analyzeCategoryTrend(categoryGoals);
        });

        return categoryTrends;
    }

    /**
     * Analyze trend for specific category
     * @param {Array} goals - Goals in the category
     * @returns {Object} - Category trend analysis
     */
    analyzeCategoryTrend(goals) {
        // Calculate category-wide metrics
        const totalGoals = goals.length;
        const completedGoals = goals.filter(goal => {
            const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
            return completed >= goal.target;
        }).length;

        // Calculate average progress
        const averageProgress = goals.reduce((sum, goal) => {
            const completed = goal.history.reduce((s, entry) => s + entry.amount, 0);
            return sum + (completed / goal.target);
        }, 0) / goals.length;

        // Calculate category activity trend
        const allEntries = goals.flatMap(goal => 
            goal.history.map(entry => ({
                ...entry,
                goalName: goal.name
            }))
        );

        const activityTrend = this.calculateCategoryActivityTrend(allEntries);

        return {
            totalGoals,
            completedGoals,
            completionRate: completedGoals / totalGoals,
            averageProgress,
            activityTrend,
            recentActivity: this.getRecentCategoryActivity(allEntries)
        };
    }

    /**
     * Calculate activity trend for category
     * @param {Array} entries - All entries for the category
     * @returns {Object} - Activity trend
     */
    calculateCategoryActivityTrend(entries) {
        if (entries.length === 0) return null;

        // Group by week
        const weeklyActivity = {};
        entries.forEach(entry => {
            const date = new Date(entry.fullDate);
            const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!weeklyActivity[weekKey]) {
                weeklyActivity[weekKey] = 0;
            }
            weeklyActivity[weekKey]++;
        });

        // Convert to trend data
        const weeks = Object.keys(weeklyActivity).sort();
        const trendData = weeks.map((week, index) => ({
            x: index,
            y: weeklyActivity[week]
        }));

        if (trendData.length < 3) return null;

        const regression = StatisticalAnalysis.linearRegression(trendData);
        return {
            trend: regression,
            direction: this.getTrendDirection(regression?.slope || 0),
            weeklyData: weeklyActivity
        };
    }

    /**
     * Get recent category activity
     * @param {Array} entries - All entries for the category
     * @returns {Object} - Recent activity summary
     */
    getRecentCategoryActivity(entries) {
        const last30Days = entries.filter(entry => {
            const entryDate = new Date(entry.fullDate);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            return entryDate >= cutoff;
        });

        return {
            totalEntries: last30Days.length,
            averagePerDay: last30Days.length / 30,
            uniqueGoals: new Set(last30Days.map(e => e.goalName)).size
        };
    }

    /**
     * Generate comprehensive health metrics
     * @param {Array} goals - All user goals
     * @param {Object} biometricData - Biometric data
     * @returns {Object} - Health metrics
     */
    generateHealthMetrics(goals, biometricData) {
        const metrics = {
            fitness: this.calculateFitnessScore(goals, biometricData),
            consistency: this.calculateOverallConsistency(goals),
            wellness: this.calculateWellnessScore(biometricData),
            progress: this.calculateProgressMomentum(goals),
            balance: this.calculateLifeBalance(goals)
        };

        // Calculate composite health score
        metrics.composite = this.calculateCompositeHealthScore(metrics);

        return metrics;
    }

    /**
     * Calculate fitness score based on goals and biometrics
     * @param {Array} goals - All user goals
     * @param {Object} biometricData - Biometric data
     * @returns {Object} - Fitness score
     */
    calculateFitnessScore(goals, biometricData) {
        let fitnessScore = 0;
        let components = 0;

        // Goal-based fitness score
        const fitnessGoals = goals.filter(goal => goal.category === 'fitness');
        if (fitnessGoals.length > 0) {
            const avgProgress = fitnessGoals.reduce((sum, goal) => {
                const completed = goal.history.reduce((s, entry) => s + entry.amount, 0);
                return sum + Math.min(1, completed / goal.target);
            }, 0) / fitnessGoals.length;
            
            fitnessScore += avgProgress * 40;
            components++;
        }

        // Biometric-based fitness score
        if (biometricData.steps && biometricData.steps.length > 0) {
            const recentSteps = biometricData.steps.slice(-7); // Last week
            const avgSteps = recentSteps.reduce((sum, entry) => sum + (entry.steps || entry.value || 0), 0) / recentSteps.length;
            const stepScore = Math.min(1, avgSteps / 10000); // 10k steps = perfect score
            fitnessScore += stepScore * 30;
            components++;
        }

        if (biometricData.heartRate && biometricData.heartRate.length > 0) {
            const recentHR = biometricData.heartRate.slice(-7);
            const avgHR = recentHR.reduce((sum, entry) => sum + entry.bpm, 0) / recentHR.length;
            const hrScore = avgHR >= 60 && avgHR <= 100 ? 1 : 0.5; // Normal resting HR
            fitnessScore += hrScore * 30;
            components++;
        }

        return {
            score: components > 0 ? fitnessScore / components : 0,
            components: {
                goalProgress: fitnessGoals.length > 0,
                stepCount: biometricData.steps?.length > 0,
                heartRate: biometricData.heartRate?.length > 0
            }
        };
    }

    /**
     * Calculate overall consistency across all goals
     * @param {Array} goals - All user goals
     * @returns {Object} - Consistency score
     */
    calculateOverallConsistency(goals) {
        if (goals.length === 0) return { score: 0, breakdown: {} };

        const consistencyScores = goals.map(goal => {
            if (!goal.history || goal.history.length === 0) return 0;
            
            const values = goal.history.map(entry => entry.amount);
            return this.calculateConsistencyScore(values, goal.dailyTarget);
        });

        const avgConsistency = consistencyScores.reduce((sum, score) => sum + score, 0) / consistencyScores.length;

        return {
            score: avgConsistency,
            breakdown: {
                totalGoals: goals.length,
                averageScore: avgConsistency,
                bestScore: Math.max(...consistencyScores),
                worstScore: Math.min(...consistencyScores)
            }
        };
    }

    /**
     * Calculate wellness score from biometric data
     * @param {Object} biometricData - Biometric data
     * @returns {Object} - Wellness score
     */
    calculateWellnessScore(biometricData) {
        let wellnessScore = 0;
        let components = 0;

        // Sleep quality (if available)
        if (biometricData.sleep) {
            const recentSleep = biometricData.sleep.slice(-7);
            if (recentSleep.length > 0) {
                const avgSleep = recentSleep.reduce((sum, entry) => sum + entry.value, 0) / recentSleep.length;
                const sleepScore = avgSleep >= 7 && avgSleep <= 9 ? 1 : Math.max(0, 1 - Math.abs(avgSleep - 8) / 3);
                wellnessScore += sleepScore * 100;
                components++;
            }
        }

        // Heart rate variability (if available)
        if (biometricData.heartRate) {
            const recentHR = biometricData.heartRate.slice(-14);
            if (recentHR.length > 5) {
                const hrValues = recentHR.map(entry => entry.bpm);
                const hrVariability = StatisticalAnalysis.statisticalSummary(hrValues).standardDeviation;
                const variabilityScore = hrVariability > 5 && hrVariability < 20 ? 1 : 0.5; // Healthy HRV range
                wellnessScore += variabilityScore * 100;
                components++;
            }
        }

        return {
            score: components > 0 ? wellnessScore / components : 50, // Default to 50 if no data
            components: {
                sleep: biometricData.sleep?.length > 0,
                heartRateVariability: biometricData.heartRate?.length > 5
            }
        };
    }

    /**
     * Calculate progress momentum
     * @param {Array} goals - All user goals
     * @returns {Object} - Progress momentum
     */
    calculateProgressMomentum(goals) {
        const momentumScores = goals.map(goal => {
            const momentum = this.calculateMomentum(goal.history || []);
            return momentum.score || 0;
        });

        const avgMomentum = momentumScores.reduce((sum, score) => sum + score, 0) / momentumScores.length;

        return {
            score: Math.max(0, Math.min(100, (avgMomentum + 1) * 50)), // Convert -1 to 1 scale to 0-100
            direction: avgMomentum > 0.1 ? 'accelerating' : 
                      avgMomentum < -0.1 ? 'decelerating' : 'stable',
            breakdown: momentumScores
        };
    }

    /**
     * Calculate life balance based on goal categories
     * @param {Array} goals - All user goals
     * @returns {Object} - Life balance score
     */
    calculateLifeBalance(goals) {
        const categories = {};
        goals.forEach(goal => {
            const category = goal.category || 'other';
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category]++;
        });

        const categoryCount = Object.keys(categories).length;
        const idealCategoryCount = 4; // Fitness, Health, Learning, Personal/Lifestyle
        const balanceScore = Math.min(1, categoryCount / idealCategoryCount) * 100;

        return {
            score: balanceScore,
            categories: Object.keys(categories),
            distribution: categories,
            recommendations: categoryCount < 3 ? ['Consider adding goals in different life areas'] : []
        };
    }

    /**
     * Calculate composite health score
     * @param {Object} metrics - Individual health metrics
     * @returns {Object} - Composite score
     */
    calculateCompositeHealthScore(metrics) {
        const weights = {
            fitness: 0.25,
            consistency: 0.20,
            wellness: 0.20,
            progress: 0.20,
            balance: 0.15
        };

        let compositeScore = 0;
        Object.entries(weights).forEach(([metric, weight]) => {
            const score = metrics[metric]?.score || 0;
            compositeScore += score * weight;
        });

        return {
            score: Math.round(compositeScore),
            grade: this.getHealthGrade(compositeScore),
            breakdown: Object.entries(metrics).map(([name, data]) => ({
                metric: name,
                score: data.score || 0,
                weight: weights[name] || 0
            }))
        };
    }

    /**
     * Get health grade based on composite score
     * @param {number} score - Composite health score
     * @returns {string} - Health grade
     */
    getHealthGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'A-';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'B-';
        if (score >= 60) return 'C+';
        if (score >= 55) return 'C';
        if (score >= 50) return 'C-';
        if (score >= 40) return 'D';
        return 'F';
    }

    /**
     * Check for trend alerts
     * @param {Object} trends - Trend analysis data
     * @returns {Array} - Trend alerts
     */
    checkTrendAlerts(trends) {
        const alerts = [];
        const thresholds = this.trendConfig.alertThresholds;

        // Check goal trends
        if (trends.goals) {
            Object.entries(trends.goals).forEach(([goalName, trend]) => {
                if (trend.overall && trend.overall.momentum) {
                    const momentum = trend.overall.momentum.score;
                    
                    if (momentum < -thresholds.declining) {
                        alerts.push({
                            type: 'warning',
                            category: 'goal_declining',
                            title: `${goalName} Progress Declining`,
                            message: `Your progress on ${goalName} has been declining recently.`,
                            severity: 'high',
                            goalName,
                            icon: '📉'
                        });
                    } else if (Math.abs(momentum) < thresholds.stagnant) {
                        alerts.push({
                            type: 'info',
                            category: 'goal_stagnant',
                            title: `${goalName} Progress Stagnant`,
                            message: `Your progress on ${goalName} has plateaued.`,
                            severity: 'medium',
                            goalName,
                            icon: '📊'
                        });
                    }
                }
            });
        }

        // Check biometric trends
        if (trends.biometrics) {
            Object.entries(trends.biometrics).forEach(([biometricType, trend]) => {
                if (trend.healthAssessment && trend.healthAssessment.severity !== 'none') {
                    alerts.push({
                        type: 'health',
                        category: 'biometric_concern',
                        title: `${biometricType} Health Concern`,
                        message: trend.healthAssessment.message,
                        severity: trend.healthAssessment.severity,
                        biometricType,
                        icon: '🏥'
                    });
                }
            });
        }

        return alerts;
    }

    /**
     * Generate trend summary
     * @param {Object} analysis - Complete trend analysis
     * @returns {Object} - Trend summary
     */
    generateTrendSummary(analysis) {
        const summary = {
            overallHealth: 'good',
            keyTrends: [],
            concerns: [],
            improvements: [],
            dataQuality: 'good'
        };

        // Analyze overall health from health metrics
        if (analysis.healthMetrics && analysis.healthMetrics.composite) {
            const score = analysis.healthMetrics.composite.score;
            if (score >= 80) summary.overallHealth = 'excellent';
            else if (score >= 70) summary.overallHealth = 'good';
            else if (score >= 60) summary.overallHealth = 'fair';
            else summary.overallHealth = 'poor';
        }

        // Extract key trends
        if (analysis.trends.goals) {
            Object.entries(analysis.trends.goals).forEach(([goalName, trend]) => {
                if (trend.overall && trend.overall.momentum) {
                    const momentum = trend.overall.momentum;
                    if (momentum.score > 0.2) {
                        summary.improvements.push(`${goalName}: ${momentum.direction}`);
                    } else if (momentum.score < -0.2) {
                        summary.concerns.push(`${goalName}: ${momentum.direction}`);
                    }
                }
            });
        }

        // Add biometric trends
        if (analysis.trends.biometrics) {
            Object.entries(analysis.trends.biometrics).forEach(([type, trend]) => {
                if (trend.recentTrend) {
                    const direction = trend.recentTrend.direction;
                    if (direction !== 'stable') {
                        summary.keyTrends.push(`${type}: ${direction}`);
                    }
                }
            });
        }

        return summary;
    }

    /**
     * Generate trend-based recommendations
     * @param {Object} analysis - Complete trend analysis
     * @returns {Array} - Recommendations
     */
    generateTrendRecommendations(analysis) {
        const recommendations = [];

        // Goal-based recommendations
        if (analysis.trends.goals) {
            Object.entries(analysis.trends.goals).forEach(([goalName, trend]) => {
                if (trend.overall && trend.overall.momentum) {
                    const momentum = trend.overall.momentum.score;
                    
                    if (momentum < -0.3) {
                        recommendations.push({
                            type: 'improvement',
                            priority: 'high',
                            title: `Revitalize ${goalName}`,
                            message: `Your ${goalName} progress is declining. Consider adjusting your approach or target.`,
                            category: 'goal_optimization',
                            goalName,
                            icon: '🔄'
                        });
                    }
                }
            });
        }

        // Health metric recommendations
        if (analysis.healthMetrics) {
            const fitness = analysis.healthMetrics.fitness;
            const consistency = analysis.healthMetrics.consistency;
            const balance = analysis.healthMetrics.balance;

            if (fitness.score < 60) {
                recommendations.push({
                    type: 'health',
                    priority: 'high',
                    title: 'Improve Fitness Activities',
                    message: 'Your fitness score could be improved. Consider adding more physical activity goals.',
                    category: 'fitness',
                    icon: '🏋️'
                });
            }

            if (consistency.score < 50) {
                recommendations.push({
                    type: 'behavior',
                    priority: 'medium',
                    title: 'Build Better Consistency',
                    message: 'Focus on maintaining regular daily progress rather than sporadic large efforts.',
                    category: 'consistency',
                    icon: '⚖️'
                });
            }

            if (balance.score < 60) {
                recommendations.push({
                    type: 'lifestyle',
                    priority: 'medium',
                    title: 'Balance Your Goals',
                    message: 'Consider adding goals in different life areas for better overall balance.',
                    category: 'balance',
                    icon: '🎯'
                });
            }
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        });
    }

    // Helper methods
    calculateConsistencyScore(values, target) {
        if (values.length === 0) return 0;
        
        const targetHits = values.filter(value => value >= target * 0.8).length;
        const reliability = targetHits / values.length;
        
        const deviations = values.map(value => Math.abs(value - target));
        const avgDeviation = deviations.reduce((a, b) => a + b, 0) / values.length;
        const maxDeviation = Math.max(...deviations);
        
        const consistency = maxDeviation > 0 ? 1 - (avgDeviation / maxDeviation) : 1;
        
        return (reliability * 0.6 + consistency * 0.4) * 100; // 0-100 scale
    }

    getTrendDirection(slope) {
        if (Math.abs(slope) < 0.1) return 'stable';
        return slope > 0 ? 'improving' : 'declining';
    }

    getTrendStrength(rSquared) {
        if (rSquared >= 0.7) return 'strong';
        if (rSquared >= 0.4) return 'moderate';
        if (rSquared >= 0.2) return 'weak';
        return 'negligible';
    }

    assessDataQuality(history) {
        const daySpan = (new Date() - new Date(history[history.length - 1]?.fullDate || new Date())) / (1000 * 60 * 60 * 24);
        const dataPoints = history.length;
        const frequency = dataPoints / Math.max(daySpan, 1);

        if (frequency >= 0.8) return 'excellent';
        if (frequency >= 0.5) return 'good';
        if (frequency >= 0.2) return 'fair';
        return 'poor';
    }

    predictGoalCompletion(goal, trend) {
        if (!trend.velocity || trend.velocity <= 0) return null;

        const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
        const remaining = goal.target - completed;
        const daysToCompletion = remaining / trend.velocity;

        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + Math.ceil(daysToCompletion));

        return {
            estimatedDate: completionDate.toISOString(),
            daysRemaining: Math.ceil(daysToCompletion),
            confidence: trend.trendQuality
        };
    }

    estimateCompletionDate(goal, velocity) {
        const completed = goal.history.reduce((sum, entry) => sum + entry.amount, 0);
        const remaining = goal.target - completed;
        
        if (velocity <= 0) return null;
        
        const daysToCompletion = remaining / velocity;
        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + Math.ceil(daysToCompletion));
        
        return completionDate.toISOString();
    }

    storeTrendAnalysis(analysis) {
        // Store current analysis
        this.trendData[analysis.timestamp] = analysis;
        
        // Keep only last 10 analyses to manage storage
        const timestamps = Object.keys(this.trendData).sort();
        if (timestamps.length > 10) {
            const toDelete = timestamps.slice(0, timestamps.length - 10);
            toDelete.forEach(timestamp => delete this.trendData[timestamp]);
        }
        
        this.lastAnalysis = analysis.timestamp;
        
        // Save to localStorage
        localStorage.setItem('healthTrendData', JSON.stringify(this.trendData));
        localStorage.setItem('lastTrendAnalysis', this.lastAnalysis);
    }

    getEmptyAnalysis() {
        return {
            timestamp: new Date().toISOString(),
            trends: {},
            healthMetrics: {},
            alerts: [],
            summary: {
                overallHealth: 'unknown',
                keyTrends: [],
                concerns: [],
                improvements: [],
                dataQuality: 'insufficient'
            },
            recommendations: []
        };
    }

    /**
     * Get historical trend data
     * @param {number} limit - Number of analyses to return
     * @returns {Array} - Historical trend analyses
     */
    getHistoricalTrends(limit = 5) {
        const timestamps = Object.keys(this.trendData).sort().reverse();
        return timestamps.slice(0, limit).map(timestamp => this.trendData[timestamp]);
    }

    /**
     * Export trend data
     */
    exportTrendData() {
        return {
            trendData: this.trendData,
            trendConfig: this.trendConfig,
            alerts: this.alerts,
            lastAnalysis: this.lastAnalysis,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.HealthTrendMonitoring = {
        HealthTrendMonitor
    };
}

// Global instance
let healthTrendMonitor = null;

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        healthTrendMonitor = new HealthTrendMonitor();
        
        // Make available globally
        window.healthTrendMonitor = healthTrendMonitor;
    });
}