// Road to Retirement Module - Main JavaScript

class RetirementPlanner {
    constructor() {
        this.retirement401kData = null;
        this.savingsData = null;
        this.portfolioData = null;
        this.growthChart = null;
        this.breakdownChart = null;
        this.init();
    }

    init() {
        this.loadData();
        this.attachEventListeners();
        this.updateDashboard();
        this.restorePortfolioDisplay();
    }

    loadData() {
        this.retirement401kData = StorageManager.get('retirement-401k');
        this.savingsData = StorageManager.get('retirement-savings');
        this.portfolioData = StorageManager.get('retirement-portfolio');
    }

    saveData() {
        if (this.retirement401kData) {
            StorageManager.set('retirement-401k', this.retirement401kData);
        } else {
            // Remove 401k data from storage
            StorageManager.remove('retirement-401k');
        }
        if (this.savingsData) {
            StorageManager.set('retirement-savings', this.savingsData);
        } else {
            // Remove savings data from storage
            StorageManager.remove('retirement-savings');
        }
        if (this.portfolioData) {
            StorageManager.set('retirement-portfolio', this.portfolioData);
        } else {
            // Remove portfolio data from storage
            StorageManager.remove('retirement-portfolio');
        }
        this.updateDashboard();
    }

    attachEventListeners() {
        // Form submissions handled by inline handlers
        // This ensures event handlers are available
    }

    // ==================== 401K CALCULATOR ====================

    calculatePensionBenefit(finalSalary, pensionPercentage, yearsWorking, vestingYears) {
        // Check if pension is vested
        if (yearsWorking < vestingYears) {
            return 0; // No pension benefit if not vested
        }

        // Annual pension = Final Salary × (Pension Percentage / 100)
        return finalSalary * (pensionPercentage / 100);
    }

    calculate401k(formData) {
        const primaryAge = parseInt(formData.primaryAge);
        const retirementAge = parseInt(formData.retirementAge);
        const yearsToRetirement = retirementAge - primaryAge;

        if (yearsToRetirement <= 0) {
            alert('Retirement age must be greater than current age');
            return null;
        }

        const projections = [];
        let primaryBalance = parseFloat(formData.current401k) || 0;
        let spouseBalance = formData.includeSpouse ? (parseFloat(formData.spouse401k) || 0) : 0;

        const primaryIncome = parseFloat(formData.primaryIncome);
        const spouseIncome = formData.includeSpouse ? parseFloat(formData.spouseIncome) : 0;
        const raisePercentage = parseFloat(formData.raisePercentage) / 100;
        let primaryContribution = parseFloat(formData.primaryContribution) / 100;
        const primaryMatch = parseFloat(formData.primaryMatch) / 100;
        const primaryContributionIncrease = parseFloat(formData.primaryContributionIncrease) / 100 || 0;
        let spouseContribution = formData.includeSpouse ? parseFloat(formData.spouseContribution) / 100 : 0;
        const spouseMatch = formData.includeSpouse ? parseFloat(formData.spouseMatch) / 100 : 0;
        const spouseContributionIncrease = formData.includeSpouse ? (parseFloat(formData.spouseContributionIncrease) / 100 || 0) : 0;
        const annualReturn = parseFloat(formData.annualReturn) / 100;

        // 401k Limit configuration
        const enforceLimits = formData.enforceLimits === true || formData.enforceLimits === 'on';
        const baseLimitAmount = parseFloat(formData.annualContributionLimit) || 23500;
        const catchUpAmount = parseFloat(formData.catchUpContributionLimit) || 7500;

        // Pension data
        const primaryHasPension = formData.primaryHasPension;
        const primaryPensionPercentage = primaryHasPension ? parseFloat(formData.primaryPensionPercentage) : 0;
        const primaryPensionVesting = primaryHasPension ? parseInt(formData.primaryPensionVesting) : 0;
        const primaryPensionYearsService = primaryHasPension ? parseInt(formData.primaryPensionYearsService) : 0;

        const spouseHasPension = formData.includeSpouse && formData.spouseHasPension;
        const spousePensionPercentage = spouseHasPension ? parseFloat(formData.spousePensionPercentage) : 0;
        const spousePensionVesting = spouseHasPension ? parseInt(formData.spousePensionVesting) : 0;
        const spousePensionYearsService = spouseHasPension ? parseInt(formData.spousePensionYearsService) : 0;

        let currentPrimaryIncome = primaryIncome;
        let currentSpouseIncome = spouseIncome;
        let currentPrimaryContributionRate = primaryContribution;
        let currentSpouseContributionRate = spouseContribution;

        for (let year = 1; year <= yearsToRetirement; year++) {
            const currentAge = primaryAge + year - 1;

            // Calculate applicable 401k limit for this year (with catch-up if applicable)
            let primaryLimit = baseLimitAmount;
            let spouseLimit = baseLimitAmount;
            if (enforceLimits && currentAge >= 50) {
                primaryLimit = baseLimitAmount + catchUpAmount;
            }
            if (enforceLimits && formData.includeSpouse) {
                const spouseAge = parseInt(formData.spouseAge) + year - 1;
                if (spouseAge >= 50) {
                    spouseLimit = baseLimitAmount + catchUpAmount;
                }
            }

            // Primary person contributions (before limit caps)
            let primaryEmployeeContribution = currentPrimaryIncome * currentPrimaryContributionRate;
            let primaryEmployerMatch = currentPrimaryIncome * primaryMatch;
            let primaryTotalContribution = primaryEmployeeContribution + primaryEmployerMatch;

            // Apply limit if enforced
            if (enforceLimits && primaryTotalContribution > primaryLimit) {
                // Cap the contribution at the limit (prioritize employer match)
                primaryTotalContribution = primaryLimit;
                // Adjust employee contribution if necessary
                primaryEmployeeContribution = Math.max(0, primaryLimit - primaryEmployerMatch);
            }

            // Spouse contributions (if applicable)
            let spouseEmployeeContribution = 0;
            let spouseEmployerMatch = 0;
            let spouseTotalContribution = 0;

            if (formData.includeSpouse) {
                spouseEmployeeContribution = currentSpouseIncome * currentSpouseContributionRate;
                spouseEmployerMatch = currentSpouseIncome * spouseMatch;
                spouseTotalContribution = spouseEmployeeContribution + spouseEmployerMatch;

                // Apply limit if enforced
                if (enforceLimits && spouseTotalContribution > spouseLimit) {
                    spouseTotalContribution = spouseLimit;
                    spouseEmployeeContribution = Math.max(0, spouseLimit - spouseEmployerMatch);
                }
            }

            const totalAnnualContribution = primaryTotalContribution + spouseTotalContribution;

            // Calculate growth with contributions added mid-year (simplified)
            primaryBalance = (primaryBalance + primaryTotalContribution) * (1 + annualReturn);
            if (formData.includeSpouse) {
                spouseBalance = (spouseBalance + spouseTotalContribution) * (1 + annualReturn);
            }

            const combinedBalance = primaryBalance + spouseBalance;

            // Calculate pension benefits at retirement
            let primaryPensionIncome = 0;
            let spousePensionIncome = 0;

            if (year === yearsToRetirement) {
                // At retirement, calculate pension income
                if (primaryHasPension) {
                    primaryPensionIncome = this.calculatePensionBenefit(
                        currentPrimaryIncome,
                        primaryPensionPercentage,
                        primaryPensionYearsService + yearsToRetirement,
                        primaryPensionVesting
                    );
                }

                if (spouseHasPension) {
                    spousePensionIncome = this.calculatePensionBenefit(
                        currentSpouseIncome,
                        spousePensionPercentage,
                        spousePensionYearsService + yearsToRetirement,
                        spousePensionVesting
                    );
                }
            }

            const totalPensionIncome = primaryPensionIncome + spousePensionIncome;

            projections.push({
                year: year,
                age: currentAge,
                primaryIncome: currentPrimaryIncome,
                spouseIncome: currentSpouseIncome,
                totalIncome: currentPrimaryIncome + currentSpouseIncome,
                totalContribution: totalAnnualContribution,
                primaryBalance: primaryBalance,
                spouseBalance: spouseBalance,
                combinedBalance: combinedBalance,
                primaryPensionIncome: primaryPensionIncome,
                spousePensionIncome: spousePensionIncome,
                totalPensionIncome: totalPensionIncome,
                primaryContributionRate: currentPrimaryContributionRate * 100,
                spouseContributionRate: currentSpouseContributionRate * 100
            });

            // Apply raise for next year
            currentPrimaryIncome *= (1 + raisePercentage);
            if (formData.includeSpouse) {
                currentSpouseIncome *= (1 + raisePercentage);
            }

            // Increase contribution rates for next year if specified
            if (primaryContributionIncrease > 0) {
                currentPrimaryContributionRate += primaryContributionIncrease;
            }
            if (formData.includeSpouse && spouseContributionIncrease > 0) {
                currentSpouseContributionRate += spouseContributionIncrease;
            }
        }

        // Calculate totals
        const totalContributions = projections.reduce((sum, p) => sum + p.totalContribution, 0);
        const finalBalance = projections[projections.length - 1].combinedBalance;
        const finalAnnualPensionIncome = projections[projections.length - 1].totalPensionIncome;
        const investmentGrowth = finalBalance - projections[0].primaryBalance - projections[0].spouseBalance - totalContributions;

        return {
            projections: projections,
            finalBalance: finalBalance,
            finalAnnualPensionIncome: finalAnnualPensionIncome,
            totalContributions: totalContributions,
            investmentGrowth: investmentGrowth,
            yearsToRetirement: yearsToRetirement,
            formData: formData
        };
    }

    renderRetirement401kResults(result) {
        // Show results section
        const resultsDiv = document.getElementById('retirement401k-results');
        resultsDiv.style.display = 'block';

        // Update summary values
        document.getElementById('result-total-401k').textContent = this.formatCurrency(result.finalBalance);
        document.getElementById('result-total-contributions').textContent = this.formatCurrency(result.totalContributions);
        document.getElementById('result-investment-growth').textContent = this.formatCurrency(result.investmentGrowth);

        // Populate table
        const tbody = document.querySelector('#retirement401k-table tbody');
        tbody.innerHTML = '';

        result.projections.forEach(projection => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${projection.year}</td>
                <td>${projection.age}</td>
                <td>${this.formatCurrency(projection.totalIncome)}</td>
                <td>${this.formatCurrency(projection.totalContribution)}</td>
                <td>${projection.primaryContributionRate.toFixed(1)}%</td>
                <td>${this.formatCurrency(projection.combinedBalance)}</td>
                <td>${this.formatCurrency(projection.totalPensionIncome)}</td>
            `;
            tbody.appendChild(row);
        });

        // Store data
        this.retirement401kData = result;
        this.saveData();

        // Update dashboard
        this.updateDashboard();

        // Scroll to results
        setTimeout(() => {
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    // ==================== PORTFOLIO TRACKER ====================

    async fetchSP500Performance(updateDate) {
        try {
            const yearStart = '2026-01-01';
            const apiKey = 'demo'; // Using demo key - users can add their own Alpha Vantage key if needed

            // Fetch S&P 500 data using ^GSPC (S&P 500 index symbol)
            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&apikey=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data['Time Series (Daily)']) {
                const timeSeries = data['Time Series (Daily)'];

                // Get price on Jan 1, 2026 (or closest available date)
                const startPrice = this.getClosestPrice(timeSeries, yearStart);

                // Get price on update date (or closest available date)
                const endPrice = this.getClosestPrice(timeSeries, updateDate);

                if (startPrice && endPrice) {
                    const sp500Return = ((endPrice - startPrice) / startPrice) * 100;
                    return {
                        startPrice,
                        endPrice,
                        return: sp500Return,
                        available: true
                    };
                }
            }

            // If API fails or data unavailable, return null
            return { available: false };
        } catch (error) {
            console.log('S&P 500 data fetch failed:', error);
            return { available: false };
        }
    }

    getClosestPrice(timeSeries, targetDate) {
        // Try exact date first
        if (timeSeries[targetDate]) {
            return parseFloat(timeSeries[targetDate]['4. close']);
        }

        // Find closest available date (within 7 days)
        const target = new Date(targetDate);
        for (let i = 0; i <= 7; i++) {
            const checkDate = new Date(target);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            if (timeSeries[dateStr]) {
                return parseFloat(timeSeries[dateStr]['4. close']);
            }
        }

        return null;
    }

    getFinancialPlannerTotal() {
        // Fetch holdings from Financial Planner
        const holdings = StorageManager.get('financial-planner-holdings');
        const cashHoldings = StorageManager.get('financial-planner-cash');

        if (!holdings) {
            return null;
        }

        let total = 0;

        // Calculate brokerage total
        if (holdings.brokerage) {
            const brokerageValue = holdings.brokerage.reduce((sum, h) => sum + ((h.shares || 0) * (h.price || 0)), 0);
            const brokerageCash = cashHoldings?.brokerage || 0;
            total += brokerageValue + brokerageCash;
        }

        // Calculate retirement total
        if (holdings.retirement) {
            const retirementValue = holdings.retirement.reduce((sum, h) => sum + ((h.shares || 0) * (h.price || 0)), 0);
            const retirementCash = cashHoldings?.retirement || 0;
            total += retirementValue + retirementCash;
        }

        return total;
    }

    async calculatePortfolio(formData) {
        const startingBalance = parseFloat(formData.startingBalance);

        // Get current balance from Financial Planner
        const currentBalance = this.getFinancialPlannerTotal();

        if (currentBalance === null) {
            alert('No portfolio data found in Financial Planner. Please add your holdings in the Financial Planner app first.');
            return null;
        }

        const updateDate = new Date(formData.updateDate);

        // Fetch S&P 500 performance for comparison
        const sp500Data = await this.fetchSP500Performance(formData.updateDate);

        // Year start: January 1, 2026
        const yearStart = new Date('2026-01-01');

        // Calculate quarter start (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
        const currentMonth = updateDate.getMonth(); // 0-11
        const currentQuarter = Math.floor(currentMonth / 3); // 0-3
        const quarterStartMonth = currentQuarter * 3;
        const quarterStart = new Date(2026, quarterStartMonth, 1);

        // Calculate month start
        const monthStart = new Date(updateDate.getFullYear(), updateDate.getMonth(), 1);

        // Get stored historical balances or initialize
        let history = this.portfolioData?.history || [];

        // Add current update to history if it's a new entry
        const existingEntry = history.find(h => h.date === formData.updateDate);
        if (!existingEntry) {
            history.push({
                date: formData.updateDate,
                balance: currentBalance,
                timestamp: updateDate.getTime()
            });
            // Sort by date
            history.sort((a, b) => a.timestamp - b.timestamp);
        } else {
            existingEntry.balance = currentBalance;
        }

        // Find balances for different periods
        const monthStartBalance = this.findClosestBalance(history, monthStart) || startingBalance;
        const quarterStartBalance = this.findClosestBalance(history, quarterStart) || startingBalance;
        const yearStartBalance = startingBalance;

        // Calculate gains
        const ytdGain = currentBalance - yearStartBalance;
        const ytdGainPercent = (ytdGain / yearStartBalance) * 100;

        const qtdGain = currentBalance - quarterStartBalance;
        const qtdGainPercent = (qtdGain / quarterStartBalance) * 100;

        const mtdGain = currentBalance - monthStartBalance;
        const mtdGainPercent = (mtdGain / monthStartBalance) * 100;

        return {
            startingBalance: startingBalance,
            currentBalance: currentBalance,
            updateDate: formData.updateDate,
            updateDateObj: updateDate,
            monthStartBalance: monthStartBalance,
            quarterStartBalance: quarterStartBalance,
            yearStartBalance: yearStartBalance,
            ytdGain: ytdGain,
            ytdGainPercent: ytdGainPercent,
            qtdGain: qtdGain,
            qtdGainPercent: qtdGainPercent,
            mtdGain: mtdGain,
            mtdGainPercent: mtdGainPercent,
            sp500Data: sp500Data,
            history: history,
            formData: formData
        };
    }

    findClosestBalance(history, targetDate) {
        if (!history || history.length === 0) return null;

        const targetTime = targetDate.getTime();

        // Find the entry closest to but not after the target date
        let closestEntry = null;
        for (let entry of history) {
            if (entry.timestamp <= targetTime) {
                if (!closestEntry || entry.timestamp > closestEntry.timestamp) {
                    closestEntry = entry;
                }
            }
        }

        return closestEntry ? closestEntry.balance : null;
    }

    renderPortfolioResults(result) {
        // Show results section
        const resultsDiv = document.getElementById('portfolio-results');
        resultsDiv.style.display = 'block';

        // Update current balance
        document.getElementById('portfolio-current').textContent = this.formatCurrency(result.currentBalance);
        const currentGainClass = result.ytdGain >= 0 ? 'positive' : 'negative';
        document.getElementById('portfolio-current-gain').innerHTML =
            `<span class="${currentGainClass}">${this.formatGain(result.ytdGain)} (${this.formatPercent(result.ytdGainPercent)})</span>`;

        // Update MTD
        document.getElementById('portfolio-mtd-amount').textContent = this.formatCurrency(result.currentBalance);
        const mtdClass = result.mtdGain >= 0 ? 'positive' : 'negative';
        document.getElementById('portfolio-mtd-gain').innerHTML =
            `<span class="${mtdClass}">${this.formatGain(result.mtdGain)} (${this.formatPercent(result.mtdGainPercent)})</span>`;

        // Update QTD
        document.getElementById('portfolio-qtd-amount').textContent = this.formatCurrency(result.currentBalance);
        const qtdClass = result.qtdGain >= 0 ? 'positive' : 'negative';
        document.getElementById('portfolio-qtd-gain').innerHTML =
            `<span class="${qtdClass}">${this.formatGain(result.qtdGain)} (${this.formatPercent(result.qtdGainPercent)})</span>`;

        // Update YTD
        document.getElementById('portfolio-ytd-amount').textContent = this.formatCurrency(result.currentBalance);
        const ytdClass = result.ytdGain >= 0 ? 'positive' : 'negative';
        document.getElementById('portfolio-ytd-gain').innerHTML =
            `<span class="${ytdClass}">${this.formatGain(result.ytdGain)} (${this.formatPercent(result.ytdGainPercent)})</span>`;

        // Populate table
        const tbody = document.querySelector('#portfolio-table tbody');
        tbody.innerHTML = '';

        const periods = [
            { name: 'Year-to-Date (2026)', start: result.yearStartBalance, gain: result.ytdGain, percent: result.ytdGainPercent },
            { name: 'Quarter-to-Date', start: result.quarterStartBalance, gain: result.qtdGain, percent: result.qtdGainPercent },
            { name: 'Month-to-Date', start: result.monthStartBalance, gain: result.mtdGain, percent: result.mtdGainPercent }
        ];

        periods.forEach(period => {
            const gainClass = period.gain >= 0 ? 'positive' : 'negative';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${period.name}</strong></td>
                <td>${this.formatCurrency(period.start)}</td>
                <td>${this.formatCurrency(result.currentBalance)}</td>
                <td class="${gainClass}">${this.formatGain(period.gain)}</td>
                <td class="${gainClass}">${this.formatPercent(period.percent)}</td>
            `;
            tbody.appendChild(row);
        });

        // Display S&P 500 comparison if available
        if (result.sp500Data && result.sp500Data.available) {
            this.renderSP500Comparison(result.ytdGainPercent, result.sp500Data);
        } else {
            document.getElementById('sp500-comparison').style.display = 'none';
        }

        // Store data
        this.portfolioData = result;
        this.saveData();

        // Scroll to results
        setTimeout(() => {
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    renderSP500Comparison(portfolioReturn, sp500Data) {
        const comparisonDiv = document.getElementById('sp500-comparison');
        const yourReturnEl = document.getElementById('sp500-your-return');
        const benchmarkReturnEl = document.getElementById('sp500-benchmark-return');
        const differenceEl = document.getElementById('sp500-difference');
        const messageEl = document.getElementById('sp500-message');

        comparisonDiv.style.display = 'block';

        // Display returns
        yourReturnEl.textContent = this.formatPercent(portfolioReturn);
        yourReturnEl.className = portfolioReturn >= 0 ? 'positive' : 'negative';

        benchmarkReturnEl.textContent = this.formatPercent(sp500Data.return);
        benchmarkReturnEl.className = sp500Data.return >= 0 ? 'positive' : 'negative';

        // Calculate and display difference
        const difference = portfolioReturn - sp500Data.return;
        differenceEl.textContent = this.formatPercent(difference);
        differenceEl.className = difference >= 0 ? 'positive' : 'negative';

        // Display message
        let message = '';
        let messageClass = '';

        if (difference > 0) {
            messageClass = 'positive';
            message = `🎉 Great job! Your portfolio is outperforming the S&P 500 by ${Math.abs(difference).toFixed(2)}%.`;
        } else if (difference < 0) {
            messageClass = 'negative';
            message = `📊 Your portfolio is underperforming the S&P 500 by ${Math.abs(difference).toFixed(2)}%. Consider reviewing your holdings.`;
        } else {
            messageClass = 'neutral';
            message = `📊 Your portfolio is tracking the S&P 500 exactly.`;
        }

        messageEl.textContent = message;
        messageEl.style.background = difference > 0 ? '#d1fae5' : (difference < 0 ? '#fee2e2' : '#f3f4f6');
        messageEl.style.color = difference > 0 ? '#065f46' : (difference < 0 ? '#991b1b' : '#374151');
        messageEl.style.borderLeft = `4px solid ${difference > 0 ? '#10b981' : (difference < 0 ? '#ef4444' : '#9ca3af')}`;
    }

    formatGain(amount) {
        const formatted = this.formatCurrency(Math.abs(amount));
        return amount >= 0 ? `+${formatted}` : `-${formatted}`;
    }

    formatPercent(percent) {
        const sign = percent >= 0 ? '+' : '-';
        return `${sign}${Math.abs(percent).toFixed(2)}%`;
    }

    restorePortfolioDisplay() {
        // Show Financial Planner total if available
        this.updateFinancialPlannerStatus();

        if (this.portfolioData) {
            // Pre-fill the form
            document.getElementById('starting-balance').value = this.portfolioData.startingBalance;
            document.getElementById('update-date').value = this.portfolioData.updateDate;

            // Show the results
            this.renderPortfolioResults(this.portfolioData);
        }
    }

    updateFinancialPlannerStatus() {
        const total = this.getFinancialPlannerTotal();
        const statusElement = document.getElementById('financial-planner-status');
        const totalElement = document.getElementById('fp-current-total');

        if (total !== null && total > 0) {
            statusElement.style.display = 'block';
            totalElement.textContent = this.formatCurrency(total);
        } else {
            statusElement.style.display = 'none';
        }
    }

    // ==================== SAVINGS CALCULATOR ====================

    calculateSavings(formData) {
        const yearsToRetirement = parseInt(formData.yearsToRetirement);
        const currentSavings = parseFloat(formData.currentSavings);
        const oneTimeDeposit = parseFloat(formData.oneTimeDeposit);
        const contributionFrequency = formData.contributionFrequency;
        const contributionAmount = parseFloat(formData.contributionAmount);
        const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
        const annualExpenses = monthlyExpenses * 12;
        const annualInterestRate = parseFloat(formData.savingsInterest) || 0;
        const interestRate = annualInterestRate / 100;

        // Convert contribution to annual amount
        let annualContribution;
        switch (contributionFrequency) {
            case 'weekly':
                annualContribution = contributionAmount * 52;
                break;
            case 'biweekly':
                annualContribution = contributionAmount * 26;
                break;
            case 'monthly':
                annualContribution = contributionAmount * 12;
                break;
            default:
                annualContribution = 0;
        }

        const projections = [];
        let balance = currentSavings + oneTimeDeposit;
        let totalContributed = oneTimeDeposit;
        let totalInterestEarned = 0;

        for (let year = 1; year <= yearsToRetirement; year++) {
            const netSavings = annualContribution - annualExpenses;
            balance += netSavings;
            totalContributed += annualContribution;

            // Calculate interest earned on the balance
            const interestEarned = balance * interestRate;
            balance += interestEarned;
            totalInterestEarned += interestEarned;

            projections.push({
                year: year,
                annualContribution: annualContribution,
                annualExpenses: annualExpenses,
                netSavings: netSavings,
                interestEarned: interestEarned,
                balance: balance
            });
        }

        return {
            projections: projections,
            finalBalance: balance,
            totalContributed: totalContributed,
            totalExpenses: annualExpenses * yearsToRetirement,
            totalInterestEarned: totalInterestEarned,
            initialBalance: currentSavings,
            oneTimeDeposit: oneTimeDeposit,
            monthlyExpenses: monthlyExpenses,
            savingsInterest: annualInterestRate,
            yearsToRetirement: yearsToRetirement,
            formData: formData
        };
    }

    renderSavingsResults(result) {
        // Show results section
        const resultsDiv = document.getElementById('savings-results');
        resultsDiv.style.display = 'block';

        // Update summary values
        document.getElementById('result-total-savings').textContent = this.formatCurrency(result.finalBalance);
        document.getElementById('result-total-saved').textContent = this.formatCurrency(result.totalContributed);
        document.getElementById('result-initial-savings').textContent = this.formatCurrency(result.initialBalance + result.oneTimeDeposit);

        // Show/hide expense net info based on whether expenses are entered
        const expenseNetInfo = document.getElementById('expense-net-info');
        if (result.monthlyExpenses > 0) {
            expenseNetInfo.style.display = 'block';
            const monthlyNetSavings = (result.projections[0].netSavings / 12);
            document.getElementById('net-savings-amount').textContent = this.formatCurrency(monthlyNetSavings);
        } else {
            expenseNetInfo.style.display = 'none';
        }

        // Populate table
        const tbody = document.querySelector('#savings-table tbody');
        tbody.innerHTML = '';

        result.projections.forEach(projection => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${projection.year}</td>
                <td>${this.formatCurrency(projection.annualContribution)}</td>
                <td>${this.formatCurrency(projection.annualExpenses)}</td>
                <td><strong>${this.formatCurrency(projection.netSavings)}</strong></td>
                <td>${this.formatCurrency(projection.interestEarned)}</td>
                <td>${this.formatCurrency(projection.balance)}</td>
            `;
            tbody.appendChild(row);
        });

        // Store data
        this.savingsData = result;
        this.saveData();

        // Update dashboard
        this.updateDashboard();

        // Scroll to results
        setTimeout(() => {
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    // ==================== DASHBOARD ====================

    updateDashboard() {
        const dashboard401k = document.getElementById('dashboard-401k');
        const dashboardSavings = document.getElementById('dashboard-savings');
        const dashboardTotal = document.getElementById('dashboard-total');
        const dashboardYears = document.getElementById('dashboard-years');
        const dashboardPensionCard = document.getElementById('dashboard-pension-card');
        const dashboardPension = document.getElementById('dashboard-pension');
        const dashboardPortfolioCard = document.getElementById('dashboard-portfolio-card');
        const dashboardPortfolio = document.getElementById('dashboard-portfolio');
        const dashboardPortfolioGain = document.getElementById('dashboard-portfolio-gain');
        const dashboardEmpty = document.getElementById('dashboard-empty');

        if (!this.retirement401kData && !this.savingsData && !this.portfolioData) {
            dashboardEmpty.style.display = 'block';
            document.querySelector('.retirement-dashboard').style.display = 'none';
            return;
        }

        document.querySelector('.retirement-dashboard').style.display = 'block';
        dashboardEmpty.style.display = 'none';

        let total401k = 0;
        let totalSavings = 0;
        let yearsToRetirement = 0;
        let annualPensionIncome = 0;

        if (this.retirement401kData) {
            total401k = this.retirement401kData.finalBalance;
            yearsToRetirement = this.retirement401kData.yearsToRetirement;
            annualPensionIncome = this.retirement401kData.finalAnnualPensionIncome || 0;
        }

        if (this.savingsData) {
            totalSavings = this.savingsData.finalBalance;
            yearsToRetirement = this.savingsData.yearsToRetirement;
        }

        // Show portfolio card if there's portfolio data
        if (this.portfolioData) {
            dashboardPortfolioCard.style.display = 'block';
            dashboardPortfolio.textContent = this.formatCurrency(this.portfolioData.currentBalance);
            const gainClass = this.portfolioData.ytdGain >= 0 ? 'positive' : 'negative';
            dashboardPortfolioGain.innerHTML = `<span class="${gainClass}">${this.formatGain(this.portfolioData.ytdGain)} (${this.formatPercent(this.portfolioData.ytdGainPercent)})</span>`;
        } else {
            dashboardPortfolioCard.style.display = 'none';
        }

        const combinedTotal = total401k + totalSavings;

        dashboard401k.textContent = this.formatCurrency(total401k);
        dashboardSavings.textContent = this.formatCurrency(totalSavings);
        dashboardTotal.textContent = this.formatCurrency(combinedTotal);
        dashboardYears.textContent = yearsToRetirement;

        // Show pension card if there's pension income
        if (annualPensionIncome > 0) {
            dashboardPensionCard.style.display = 'block';
            dashboardPension.textContent = this.formatCurrency(annualPensionIncome);
            const monthlyPensionIncome = annualPensionIncome / 12;
            document.getElementById('dashboard-pension-monthly').textContent = this.formatCurrency(monthlyPensionIncome) + '/month';
        } else {
            dashboardPensionCard.style.display = 'none';
        }

        this.drawCharts();
    }

    drawCharts() {
        this.drawGrowthChart();
        this.drawBreakdownChart();
    }

    drawGrowthChart() {
        const ctx = document.getElementById('growthChart');
        if (!ctx) return;

        // Prepare data
        const labels = [];
        const retirementData = [];
        const savingsData = [];

        if (this.retirement401kData) {
            this.retirement401kData.projections.forEach(p => {
                labels.push(`Year ${p.year}`);
                retirementData.push(Math.round(p.combinedBalance));
            });
        } else if (this.savingsData) {
            this.savingsData.projections.forEach(p => {
                labels.push(`Year ${p.year}`);
                savingsData.push(Math.round(p.balance));
            });
        }

        if (this.savingsData && this.retirement401kData) {
            // Both datasets
            savingsData.length = 0;
            this.savingsData.projections.forEach(p => {
                savingsData.push(Math.round(p.balance));
            });
        }

        // Destroy existing chart if it exists
        if (this.growthChart) {
            this.growthChart.destroy();
        }

        const datasets = [];
        if (this.retirement401kData) {
            datasets.push({
                label: '401k Balance',
                data: retirementData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            });
        }

        if (this.savingsData) {
            datasets.push({
                label: 'Savings Balance',
                data: savingsData,
                borderColor: '#f5576c',
                backgroundColor: 'rgba(245, 87, 108, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            });
        }

        this.growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    drawBreakdownChart() {
        const ctx = document.getElementById('breakdownChart');
        if (!ctx) return;

        let data401k = 0;
        let dataSavings = 0;

        if (this.retirement401kData) {
            data401k = this.retirement401kData.finalBalance;
        }

        if (this.savingsData) {
            dataSavings = this.savingsData.finalBalance;
        }

        // Destroy existing chart if it exists
        if (this.breakdownChart) {
            this.breakdownChart.destroy();
        }

        this.breakdownChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['401k', 'Savings'],
                datasets: [{
                    data: [data401k, dataSavings],
                    backgroundColor: [
                        '#667eea',
                        '#f5576c'
                    ],
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '$' + context.parsed.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // ==================== UTILITY FUNCTIONS ====================

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}

// Initialize the planner
let planner;
window.addEventListener('DOMContentLoaded', () => {
    planner = new RetirementPlanner();
});

// ==================== TAB SWITCHING ====================

function switchTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all nav tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked nav tab
    event.target.classList.add('active');

    // Auto-refresh Financial Planner data when switching to portfolio tab
    if (tabName === 'portfolio') {
        planner.updateFinancialPlannerStatus();
    }
}

// ==================== 401K CALCULATOR HANDLERS ====================

function autoFillYearsToRetirement() {
    const primaryAge = parseInt(document.getElementById('primary-age').value);
    const retirementAge = parseInt(document.getElementById('retirement-age').value);

    if (primaryAge && retirementAge && retirementAge > primaryAge) {
        const yearsToRetirement = retirementAge - primaryAge;
        document.getElementById('savings-years').value = yearsToRetirement;
    }
}

function toggleSpouseFields() {
    const checkbox = document.getElementById('include-spouse');
    const fields = document.getElementById('spouse-fields');

    if (checkbox.checked) {
        fields.style.display = 'block';
        // Make spouse fields required
        document.getElementById('spouse-age').required = true;
        document.getElementById('spouse-income').required = true;
    } else {
        fields.style.display = 'none';
        // Remove required from spouse fields
        document.getElementById('spouse-age').required = false;
        document.getElementById('spouse-income').required = false;
    }
}

function togglePrimaryPensionFields() {
    const checkbox = document.getElementById('primary-has-pension');
    const fields = document.getElementById('primary-pension-fields');

    if (checkbox.checked) {
        fields.style.display = 'block';
    } else {
        fields.style.display = 'none';
    }
}

function toggleSpousePensionFields() {
    const checkbox = document.getElementById('spouse-has-pension');
    const fields = document.getElementById('spouse-pension-fields');

    if (checkbox.checked) {
        fields.style.display = 'block';
    } else {
        fields.style.display = 'none';
    }
}

function handleRetirement401kSubmit(event) {
    event.preventDefault();

    const form = document.getElementById('retirement401k-form');
    const formData = new FormData(form);

    const data = {
        primaryAge: formData.get('primary-age'),
        retirementAge: formData.get('retirement-age'),
        primaryIncome: formData.get('primary-income'),
        raisePercentage: formData.get('raise-percentage'),
        primaryContribution: formData.get('primary-contribution'),
        primaryContributionIncrease: formData.get('primary-contribution-increase'),
        primaryMatch: formData.get('primary-match'),
        current401k: formData.get('current-401k'),
        primaryHasPension: formData.get('primary-has-pension') ? true : false,
        primaryPensionPercentage: formData.get('primary-pension-percentage'),
        primaryPensionVesting: formData.get('primary-pension-vesting'),
        primaryPensionYearsService: formData.get('primary-pension-years-service'),
        includeSpouse: formData.get('include-spouse') ? true : false,
        spouseAge: formData.get('spouse-age'),
        spouseIncome: formData.get('spouse-income'),
        spouseContribution: formData.get('spouse-contribution'),
        spouseContributionIncrease: formData.get('spouse-contribution-increase'),
        spouseMatch: formData.get('spouse-match'),
        spouse401k: formData.get('spouse-401k'),
        spouseHasPension: formData.get('spouse-has-pension') ? true : false,
        spousePensionPercentage: formData.get('spouse-pension-percentage'),
        spousePensionVesting: formData.get('spouse-pension-vesting'),
        spousePensionYearsService: formData.get('spouse-pension-years-service'),
        taxRate: formData.get('tax-rate'),
        annualReturn: formData.get('annual-return'),
        enforceLimits: formData.get('enforce-401k-limits'),
        annualContributionLimit: formData.get('annual-contribution-limit'),
        catchUpContributionLimit: formData.get('catch-up-contribution-limit')
    };

    const result = planner.calculate401k(data);
    if (result) {
        planner.renderRetirement401kResults(result);
    }
}

function clearRetirement401k() {
    document.getElementById('retirement401k-results').style.display = 'none';
    document.getElementById('retirement401k-form').reset();
    document.getElementById('include-spouse').checked = false;
    document.getElementById('spouse-fields').style.display = 'none';
    document.getElementById('primary-has-pension').checked = false;
    document.getElementById('primary-pension-fields').style.display = 'none';
    document.getElementById('spouse-has-pension').checked = false;
    document.getElementById('spouse-pension-fields').style.display = 'none';
    planner.retirement401kData = null;
    planner.saveData();
    planner.updateDashboard();
    // Scroll back to top of form
    document.getElementById('retirement401k-form').scrollIntoView({ behavior: 'smooth' });
}

// ==================== SAVINGS CALCULATOR HANDLERS ====================

function updateContributionLabel() {
    const frequency = document.getElementById('contribution-frequency').value;
    const label = document.getElementById('contribution-label');

    const frequencyLabels = {
        'weekly': 'Weekly Contribution Amount',
        'biweekly': 'Bi-Weekly Contribution Amount',
        'monthly': 'Monthly Contribution Amount'
    };

    label.textContent = frequencyLabels[frequency];
}

function handleSavingsSubmit(event) {
    event.preventDefault();

    const form = document.getElementById('savings-form');
    const formData = new FormData(form);

    const data = {
        yearsToRetirement: formData.get('savings-years'),
        currentSavings: formData.get('current-savings'),
        oneTimeDeposit: formData.get('one-time-deposit'),
        contributionFrequency: formData.get('contribution-frequency'),
        contributionAmount: formData.get('contribution-amount'),
        monthlyExpenses: formData.get('monthly-expenses'),
        savingsInterest: formData.get('savings-interest')
    };

    const result = planner.calculateSavings(data);
    if (result) {
        planner.renderSavingsResults(result);
    }
}

function clearSavings() {
    document.getElementById('savings-results').style.display = 'none';
    document.getElementById('savings-form').reset();
    document.getElementById('contribution-frequency').value = 'weekly';
    updateContributionLabel();
    planner.savingsData = null;
    planner.saveData();
    planner.updateDashboard();
    // Scroll back to top of form
    document.getElementById('savings-form').scrollIntoView({ behavior: 'smooth' });
}

// ==================== PORTFOLIO TRACKER HANDLERS ====================

async function handlePortfolioSubmit(event) {
    event.preventDefault();

    const form = document.getElementById('portfolio-form');
    const formData = new FormData(form);

    const data = {
        startingBalance: formData.get('starting-balance'),
        updateDate: formData.get('update-date')
    };

    // Show loading indicator
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Calculating...';
    submitButton.disabled = true;

    try {
        const result = await planner.calculatePortfolio(data);
        if (result) {
            planner.renderPortfolioResults(result);
        }
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

function updatePortfolio() {
    // Refresh the Financial Planner status
    planner.updateFinancialPlannerStatus();

    // Show the form again by scrolling to it
    document.getElementById('portfolio-form').scrollIntoView({ behavior: 'smooth' });

    // Pre-fill the starting balance from saved data if it exists
    if (planner.portfolioData) {
        document.getElementById('starting-balance').value = planner.portfolioData.startingBalance;
    }

    // Set today's date as default for update date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('update-date').value = today;

    // Focus on date field
    setTimeout(() => {
        document.getElementById('update-date').focus();
    }, 500);
}

function clearPortfolio() {
    if (confirm('Are you sure you want to clear all portfolio tracking data? This cannot be undone.')) {
        document.getElementById('portfolio-results').style.display = 'none';
        document.getElementById('portfolio-form').reset();
        planner.portfolioData = null;
        planner.saveData();
        // Scroll back to top of form
        document.getElementById('portfolio-form').scrollIntoView({ behavior: 'smooth' });
    }
}

function refreshFinancialPlannerData() {
    planner.updateFinancialPlannerStatus();

    // Show a brief feedback
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '✓ Refreshed';
    button.style.background = '#10b981';

    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '#667eea';
    }, 1500);
}
