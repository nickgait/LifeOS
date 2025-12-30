// Road to Retirement Module - Main JavaScript

class RetirementPlanner {
    constructor() {
        this.retirement401kData = null;
        this.savingsData = null;
        this.growthChart = null;
        this.breakdownChart = null;
        this.init();
    }

    init() {
        this.loadData();
        this.attachEventListeners();
        this.updateDashboard();
    }

    loadData() {
        this.retirement401kData = StorageManager.get('retirement-401k');
        this.savingsData = StorageManager.get('retirement-savings');
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
        const dashboardEmpty = document.getElementById('dashboard-empty');

        if (!this.retirement401kData && !this.savingsData) {
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
