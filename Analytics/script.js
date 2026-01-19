/**
 * Analytics Dashboard Script
 * Displays comprehensive insights across all LifeOS apps
 */

let currentAnalytics = null;

// Initialize analytics dashboard
document.addEventListener('DOMContentLoaded', function() {
    ThemeManager.init();
    loadAnalytics();
    setupTrendControls();
});

async function loadAnalytics() {
    showLoading();
    
    try {
        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 500));
        
        currentAnalytics = Analytics.getComprehensiveAnalytics();
        
        if (hasMinimumData()) {
            displayAnalytics();
            showContent();
        } else {
            showNoDataState();
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        showNoDataState();
    }
}

function hasMinimumData() {
    const { overview } = currentAnalytics;
    return overview.totalActivities > 0 || 
           overview.totalJournalEntries > 0 || 
           overview.totalGoals > 0 ||
           overview.totalExpenses > 0;
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('analytics-content').style.display = 'none';
    document.getElementById('no-data').style.display = 'none';
}

function showContent() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('analytics-content').style.display = 'block';
    document.getElementById('no-data').style.display = 'none';
}

function showNoDataState() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('analytics-content').style.display = 'none';
    document.getElementById('no-data').style.display = 'block';
}

function displayAnalytics() {
    displayOverview();
    displayFitnessAnalytics();
    displayGoalsAnalytics();
    displayJournalAnalytics();
    displayFinanceAnalytics();
    displayCorrelationAnalytics();
    displayTrends('week');
}

function displayOverview() {
    const { overview } = currentAnalytics;
    
    document.getElementById('total-activities').textContent = overview.totalActivities;
    document.getElementById('total-entries').textContent = overview.totalJournalEntries;
    document.getElementById('active-goals').textContent = overview.activeGoals;
    document.getElementById('total-expenses').textContent = `$${overview.totalExpenses}`;
}

function displayFitnessAnalytics() {
    const container = document.getElementById('fitness-analytics');
    const { fitness } = currentAnalytics;
    
    if (!fitness.hasData) {
        container.innerHTML = `
            <div class="insight-card">
                <h3>No Fitness Data</h3>
                <p>Start logging workouts to see insights here!</p>
                <a href="../Fitness/index.html" class="action-btn">Go to Fitness</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="insight-card">
            <h3>🏃 Activity Overview</h3>
            <div class="insight-value">${fitness.totalActivities}</div>
            <div class="insight-description">Total workouts logged</div>
        </div>
        
        <div class="insight-card">
            <h3>🔥 Current Streak</h3>
            <div class="insight-value">${fitness.streaks.current} days</div>
            <div class="insight-description">Longest: ${fitness.streaks.longest} days</div>
        </div>
        
        <div class="insight-card">
            <h3>🎯 Goal Progress</h3>
            <div class="insight-description">
                ${fitness.goalProgress.map(goal => `
                    <div style="margin: 8px 0;">
                        <strong>${goal.name}</strong>: ${goal.completionRate}% complete
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${goal.completionRate}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="insight-card">
            <h3>🏆 Badges Earned</h3>
            <div class="insight-value">${fitness.earnedBadges}/${fitness.totalBadges}</div>
            <div class="insight-description">${((fitness.earnedBadges/fitness.totalBadges)*100).toFixed(1)}% of badges unlocked</div>
        </div>
        
        <div class="insight-card">
            <h3>📊 Activity Types</h3>
            <div class="insight-description">
                ${fitness.activityTypes.map(type => `
                    <div class="analytics-list">
                        <li>
                            <span class="label">${type.type}</span>
                            <span class="value">${type.count} (${type.percentage}%)</span>
                        </li>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function displayGoalsAnalytics() {
    const container = document.getElementById('goals-analytics');
    const { goals } = currentAnalytics;
    
    if (!goals.hasData) {
        container.innerHTML = `
            <div class="insight-card">
                <h3>No Goals Data</h3>
                <p>Create some goals to see analytics here!</p>
                <a href="../Goals/index.html" class="action-btn">Go to Goals</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="insight-card">
            <h3>🎯 Goal Summary</h3>
            <div class="insight-value">${goals.total}</div>
            <div class="insight-description">
                ${goals.active} active, ${goals.completed} completed
                ${goals.overdue > 0 ? `<span class="badge-indicator error">${goals.overdue} overdue</span>` : ''}
            </div>
        </div>
        
        <div class="insight-card">
            <h3>✅ Completion Rate</h3>
            <div class="insight-value">${goals.completionRates.overall}%</div>
            <div class="insight-description">${goals.completionRates.completed} of ${goals.completionRates.total} goals completed</div>
        </div>
        
        <div class="insight-card">
            <h3>📅 Timeline Analysis</h3>
            <div class="insight-description">
                <ul class="analytics-list">
                    <li>
                        <span class="label">Due this week</span>
                        <span class="value">${goals.timeAnalysis.upcomingThisWeek}</span>
                    </li>
                    <li>
                        <span class="label">Overdue</span>
                        <span class="value">${goals.timeAnalysis.overdue}</span>
                    </li>
                </ul>
            </div>
        </div>
        
        <div class="insight-card">
            <h3>📊 By Category</h3>
            <div class="insight-description">
                ${goals.categoryBreakdown.map(category => `
                    <div style="margin: 8px 0;">
                        <strong>${category.category}</strong>: ${category.total} total
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${category.total > 0 ? (category.completed/category.total)*100 : 0}%"></div>
                        </div>
                        <small>${category.completed}/${category.total} completed</small>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function displayJournalAnalytics() {
    const container = document.getElementById('journal-analytics');
    const { journal } = currentAnalytics;
    
    if (!journal.hasData) {
        container.innerHTML = `
            <div class="insight-card">
                <h3>No Journal Data</h3>
                <p>Start journaling to see insights here!</p>
                <a href="../Journal/index.html" class="action-btn">Go to Journal</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="insight-card">
            <h3>📔 Writing Overview</h3>
            <div class="insight-value">${journal.totalEntries}</div>
            <div class="insight-description">
                Avg ${journal.averageWordCount} words per entry
            </div>
        </div>
        
        <div class="insight-card">
            <h3>🔥 Writing Streak</h3>
            <div class="insight-value">${journal.streaks.current} days</div>
            <div class="insight-description">Longest: ${journal.streaks.longest} days</div>
        </div>
        
        ${journal.moodAnalysis.hasData ? `
        <div class="insight-card">
            <h3>😊 Mood Analysis</h3>
            <div class="insight-value">${journal.moodAnalysis.averageMood}/5.0</div>
            <div class="insight-description">
                Average mood score
                <div style="margin-top: 8px;">
                    ${journal.moodAnalysis.distribution.map(mood => `
                        <div>${mood.mood} ${mood.count} times (${mood.percentage}%)</div>
                    `).join('')}
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="insight-card">
            <h3>🕐 Writing Patterns</h3>
            <div class="insight-description">
                <strong>Preferred time:</strong>
                ${journal.writingPatterns.timeOfDayPreference.map(time => `
                    <div>${time.time}: ${time.percentage}%</div>
                `).join('')}
            </div>
        </div>
        
        ${journal.tagsAnalysis.length > 0 ? `
        <div class="insight-card">
            <h3>🏷️ Popular Tags</h3>
            <div class="insight-description">
                ${journal.tagsAnalysis.slice(0, 5).map(tag => `
                    <span class="badge-indicator">${tag.tag} (${tag.count})</span>
                `).join(' ')}
            </div>
        </div>
        ` : ''}
    `;
}

function displayFinanceAnalytics() {
    const container = document.getElementById('finance-analytics');
    const { finance } = currentAnalytics;
    
    if (!finance.hasData) {
        container.innerHTML = `
            <div class="insight-card">
                <h3>No Finance Data</h3>
                <p>Log some expenses to see financial insights!</p>
                <a href="../Financial Planner/index.html" class="action-btn">Go to Financial Planner</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="insight-card">
            <h3>💰 Spending Overview</h3>
            <div class="insight-value">$${finance.totalAmount.toFixed(2)}</div>
            <div class="insight-description">${finance.totalExpenses} total expenses</div>
        </div>
        
        <div class="insight-card">
            <h3>📊 Daily Average</h3>
            <div class="insight-value">$${finance.averageDaily}</div>
            <div class="insight-description">Average spending per day</div>
        </div>
        
        <div class="insight-card">
            <h3>🏷️ Top Categories</h3>
            <div class="insight-description">
                ${finance.categoryBreakdown.slice(0, 5).map(category => `
                    <div style="margin: 8px 0;">
                        <strong>${category.category}</strong>: $${category.amount.toFixed(2)} (${category.percentage}%)
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${category.percentage}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${finance.budgetAnalysis.length > 0 ? `
        <div class="insight-card">
            <h3>🎯 Budget Performance</h3>
            <div class="insight-description">
                ${finance.budgetAnalysis.map(budget => `
                    <div style="margin: 8px 0;">
                        <strong>${budget.category}</strong>
                        <div class="progress-bar">
                            <div class="progress-fill ${budget.status === 'over' ? 'error' : budget.status === 'warning' ? 'warning' : ''}" 
                                 style="width: ${Math.min(budget.percentage, 100)}%"></div>
                        </div>
                        <small>$${budget.spent.toFixed(2)} of $${budget.budget.toFixed(2)} (${budget.percentage}%)</small>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="insight-card">
            <h3>📈 Monthly Trends</h3>
            <div class="mini-chart">
                ${finance.monthlySpending.slice(-6).map(month => {
                    const maxAmount = Math.max(...finance.monthlySpending.map(m => m.amount));
                    const height = (month.amount / maxAmount) * 100;
                    return `<div class="chart-bar" style="height: ${height}%" title="${month.month}: $${month.amount.toFixed(2)}"></div>`;
                }).join('')}
            </div>
            <div class="insight-description">Last 6 months spending trend</div>
        </div>
    `;
}

function displayCorrelationAnalytics() {
    const container = document.getElementById('correlation-analytics');
    const { correlations } = currentAnalytics;
    
    container.innerHTML = `
        <div class="insight-card">
            <h3>🏃💭 Fitness & Mood</h3>
            ${correlations.fitnessJournalCorrelation.hasData ? `
                <div class="correlation-indicator">
                    <div class="correlation-value ${getCorrelationClass(correlations.fitnessJournalCorrelation.correlation)}">
                        ${(correlations.fitnessJournalCorrelation.correlation * 100).toFixed(0)}%
                    </div>
                    <div class="correlation-strength">
                        ${getCorrelationDescription(correlations.fitnessJournalCorrelation.correlation)} correlation
                    </div>
                </div>
                <div class="insight-description">
                    Based on ${correlations.fitnessJournalCorrelation.dataPoints} days of data
                </div>
            ` : `
                <div class="insight-description">Need more data with both fitness activities and journal entries with moods</div>
            `}
        </div>
        
        <div class="insight-card">
            <h3>⚡ Productivity Patterns</h3>
            <div class="insight-description">
                <strong>Total productive days:</strong> ${correlations.productivityPatterns.totalProductiveDays}
                <br>
                <strong>Most productive day:</strong> ${correlations.productivityPatterns.mostProductiveDay}
                <div style="margin-top: 8px;">
                    ${Object.entries(correlations.productivityPatterns.dayOfWeekPatterns).map(([day, count]) => `
                        <div>${day}: ${count} productive days</div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="insight-card">
            <h3>💰😊 Spending & Mood</h3>
            ${correlations.spendingMoodCorrelation.hasData ? `
                <div class="correlation-indicator">
                    <div class="correlation-value ${getCorrelationClass(correlations.spendingMoodCorrelation.correlation)}">
                        ${(correlations.spendingMoodCorrelation.correlation * 100).toFixed(0)}%
                    </div>
                    <div class="correlation-strength">
                        ${getCorrelationDescription(correlations.spendingMoodCorrelation.correlation)} correlation
                    </div>
                </div>
                <div class="insight-description">
                    Average spending by mood:
                    ${correlations.spendingMoodCorrelation.averageSpendingByMood.map(mood => `
                        <div>${mood.mood}: $${mood.averageSpending}</div>
                    `).join('')}
                </div>
            ` : `
                <div class="insight-description">Need more data with both expenses and journal entries with moods</div>
            `}
        </div>
    `;
}

function displayTrends(timeframe) {
    const container = document.getElementById('trends-analytics');
    const trends = currentAnalytics.trends[timeframe];
    
    container.innerHTML = `
        <div class="insight-card">
            <h3>🏃 Fitness Trends</h3>
            <div class="insight-value">${trends.fitness.total}</div>
            <div class="insight-description">
                Total activities this ${timeframe}
                <div style="margin-top: 8px;">
                    ${Object.entries(trends.fitness.types).map(([type, activities]) => `
                        <div>${type}: ${activities.length} activities</div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="insight-card">
            <h3>📔 Journal Trends</h3>
            <div class="insight-value">${trends.journal.total}</div>
            <div class="insight-description">
                Entries this ${timeframe}
                ${trends.journal.averageMood ? `<br>Average mood: ${trends.journal.averageMood}/5.0` : ''}
            </div>
        </div>
        
        <div class="insight-card">
            <h3>💰 Spending Trends</h3>
            <div class="insight-value">$${trends.finance.total.toFixed(2)}</div>
            <div class="insight-description">
                Total spent this ${timeframe} (${trends.finance.count} transactions)
            </div>
        </div>
    `;
}

function getCorrelationClass(correlation) {
    const abs = Math.abs(correlation);
    if (abs > 0.3) return correlation > 0 ? 'correlation-positive' : 'correlation-negative';
    return 'correlation-neutral';
}

function getCorrelationDescription(correlation) {
    const abs = Math.abs(correlation);
    if (abs > 0.7) return 'Strong';
    if (abs > 0.3) return 'Moderate';
    if (abs > 0.1) return 'Weak';
    return 'No';
}

function setupTrendControls() {
    const buttons = document.querySelectorAll('.trend-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update trends display
            const timeframe = this.dataset.timeframe;
            displayTrends(timeframe);
        });
    });
}

function refreshAnalytics() {
    loadAnalytics();
}

// Export for global use
window.refreshAnalytics = refreshAnalytics;