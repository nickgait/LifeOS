// Financial Planner Module - Main JavaScript
// Comprehensive retirement planning with optional Sharia-compliance mode

class FinancialPlanner {
    constructor() {
        this.shariaMode = false;
        this.profile = null;
        this.holdings = {
            brokerage: [],
            retirement: []
        };
        this.projectionScenario = 'moderate';
        this.charts = {};

        // No default holdings - app starts blank
        this.defaultBrokerageHoldings = [];
        this.defaultRetirementHoldings = [];

        // Sharia-compliant fund data
        this.shariaFunds = {
            equity: [
                { ticker: 'SPUS', name: 'SP Funds S&P 500 Sharia ETF', expense: '0.49%', type: 'Large Cap US' },
                { ticker: 'HLAL', name: 'Wahed FTSE USA Shariah ETF', expense: '0.50%', type: 'Large Cap US' },
                { ticker: 'SPRE', name: 'SP Funds S&P Global REIT Sharia ETF', expense: '0.55%', type: 'Real Estate' },
                { ticker: 'SPTE', name: 'SP Funds S&P Technology Sharia ETF', expense: '0.55%', type: 'Technology' }
            ],
            fixedIncome: [
                { ticker: 'SPSK', name: 'SP Funds DJ Global Sukuk ETF', expense: '0.55%', yield: '4.0-5.0%', type: 'Global Sukuk' }
            ]
        };

        this.init();
    }

    init() {
        this.loadData();
        this.attachEventListeners();
        this.initializeHoldings();
        this.updateShariaVisibility();
    }

    loadData() {
        const savedProfile = StorageManager.get('financial-planner-profile');
        const savedHoldings = StorageManager.get('financial-planner-holdings');
        const savedShariaMode = StorageManager.get('financial-planner-sharia-mode');

        if (savedProfile) {
            this.profile = savedProfile;
            this.populateProfileForm();
        }

        if (savedHoldings) {
            this.holdings = savedHoldings;
        } else {
            // Load defaults
            this.holdings.brokerage = [...this.defaultBrokerageHoldings];
            this.holdings.retirement = [...this.defaultRetirementHoldings];
        }

        if (savedShariaMode !== null) {
            this.shariaMode = savedShariaMode;
            document.getElementById('sharia-mode').checked = this.shariaMode;
        }
    }

    saveData() {
        StorageManager.set('financial-planner-profile', this.profile);
        StorageManager.set('financial-planner-holdings', this.holdings);
        StorageManager.set('financial-planner-sharia-mode', this.shariaMode);
    }

    attachEventListeners() {
        // Profile form is handled by inline onsubmit
    }

    initializeHoldings() {
        this.renderHoldings('brokerage');
        this.renderHoldings('retirement');
    }

    // ==================== SHARIA MODE ====================

    toggleShariaMode() {
        this.shariaMode = document.getElementById('sharia-mode').checked;
        this.updateShariaVisibility();
        this.saveData();

        // Update labels
        if (this.shariaMode) {
            document.getElementById('fixed-income-title').textContent = 'Islamic Finance & Sukuk Options';
            document.getElementById('savings-title').textContent = 'Sharia-Compliant Savings Options';
            document.getElementById('fixed-income-label').textContent = 'Sukuk/Islamic Bonds';
        } else {
            document.getElementById('fixed-income-title').textContent = 'Fixed Income & Savings Options';
            document.getElementById('savings-title').textContent = 'Savings Account Options';
            document.getElementById('fixed-income-label').textContent = 'Fixed Income';
        }

        // Refresh analysis if profile exists
        if (this.profile) {
            this.runFullAnalysis();
        }
    }

    updateShariaVisibility() {
        const shariaElements = document.querySelectorAll('.sharia-only');
        const conventionalElements = document.querySelectorAll('.conventional-only');

        shariaElements.forEach(el => {
            el.style.display = this.shariaMode ? 'block' : 'none';
        });

        conventionalElements.forEach(el => {
            el.style.display = this.shariaMode ? 'none' : 'block';
        });
    }

    // ==================== PROFILE MANAGEMENT ====================

    handleProfileSubmit(event) {
        event.preventDefault();

        const form = document.getElementById('profile-form');
        const formData = new FormData(form);

        this.profile = {
            currentAge: parseInt(formData.get('current-age')),
            retirementAge: parseInt(formData.get('retirement-age')),
            state: formData.get('state'),
            taxBracket: parseFloat(formData.get('tax-bracket')),
            riskTolerance: formData.get('risk-tolerance'),
            brokerageBalance: parseFloat(formData.get('brokerage-balance')),
            retirementBalance: parseFloat(formData.get('retirement-balance')),
            cashReserves: parseFloat(formData.get('cash-reserves')),
            employeeContribution: parseFloat(formData.get('employee-contribution')),
            employerMatch: parseFloat(formData.get('employer-match')),
            employeeIncrease: parseFloat(formData.get('employee-increase')) / 100,
            employerIncrease: parseFloat(formData.get('employer-increase')) / 100,
            socialSecurity: parseFloat(formData.get('social-security')),
            monthlySpending: parseFloat(formData.get('monthly-spending')),

            // Primary Pension
            hasPension: formData.get('has-pension') === 'on',
            pensionAmount: parseFloat(formData.get('pension-amount')) || 0,
            pensionStartAge: parseInt(formData.get('pension-start-age')) || 65,
            pensionCola: parseFloat(formData.get('pension-cola')) / 100 || 0,
            pensionSurvivor: parseFloat(formData.get('pension-survivor')) / 100 || 0.5,

            // Spouse
            includeSpouse: formData.get('include-spouse') === 'on',
            spouseAge: parseInt(formData.get('spouse-age')) || 0,
            spouseRetirementAge: parseInt(formData.get('spouse-retirement-age')) || 65,
            spouse401kBalance: parseFloat(formData.get('spouse-401k-balance')) || 0,
            spouseEmployeeContribution: parseFloat(formData.get('spouse-employee-contribution')) || 0,
            spouseEmployerMatch: parseFloat(formData.get('spouse-employer-match')) || 0,
            spouseContributionIncrease: parseFloat(formData.get('spouse-contribution-increase')) / 100 || 0.02,

            // Spouse Pension
            spouseHasPension: formData.get('spouse-has-pension') === 'on',
            spousePensionAmount: parseFloat(formData.get('spouse-pension-amount')) || 0,
            spousePensionStartAge: parseInt(formData.get('spouse-pension-start-age')) || 65,
            spousePensionCola: parseFloat(formData.get('spouse-pension-cola')) / 100 || 0,
            spousePensionSurvivor: parseFloat(formData.get('spouse-pension-survivor')) / 100 || 0.5,

            // Spouse Social Security
            spouseSocialSecurity: parseFloat(formData.get('spouse-social-security')) || 0,
            spouseSsStartAge: parseInt(formData.get('spouse-ss-start-age')) || 65
        };

        this.profile.yearsToRetirement = this.profile.retirementAge - this.profile.currentAge;

        // Total assets includes spouse 401(k) if applicable
        this.profile.totalAssets = this.profile.brokerageBalance + this.profile.retirementBalance + this.profile.cashReserves;
        if (this.profile.includeSpouse) {
            this.profile.totalAssets += this.profile.spouse401kBalance;
            this.profile.spouseYearsToRetirement = this.profile.spouseRetirementAge - this.profile.spouseAge;
        }

        this.profile.annualContribution = this.profile.employeeContribution + this.profile.employerMatch;
        this.profile.annualSpending = this.profile.monthlySpending * 12;

        // Calculate total pension income at retirement
        this.profile.totalPensionIncome = 0;
        if (this.profile.hasPension) {
            this.profile.totalPensionIncome += this.profile.pensionAmount;
        }
        if (this.profile.includeSpouse && this.profile.spouseHasPension) {
            this.profile.totalPensionIncome += this.profile.spousePensionAmount;
        }

        // Combined Social Security
        this.profile.totalSocialSecurity = this.profile.socialSecurity;
        if (this.profile.includeSpouse) {
            this.profile.totalSocialSecurity += this.profile.spouseSocialSecurity;
        }

        this.saveData();
        this.runFullAnalysis();
    }

    populateProfileForm() {
        if (!this.profile) return;

        document.getElementById('current-age').value = this.profile.currentAge;
        document.getElementById('retirement-age').value = this.profile.retirementAge;
        document.getElementById('state').value = this.profile.state;
        document.getElementById('tax-bracket').value = this.profile.taxBracket;
        document.getElementById('risk-tolerance').value = this.profile.riskTolerance;
        document.getElementById('brokerage-balance').value = this.profile.brokerageBalance;
        document.getElementById('retirement-balance').value = this.profile.retirementBalance;
        document.getElementById('cash-reserves').value = this.profile.cashReserves;
        document.getElementById('employee-contribution').value = this.profile.employeeContribution;
        document.getElementById('employer-match').value = this.profile.employerMatch;
        document.getElementById('employee-increase').value = this.profile.employeeIncrease * 100;
        document.getElementById('employer-increase').value = this.profile.employerIncrease * 100;
        document.getElementById('social-security').value = this.profile.socialSecurity;
        document.getElementById('monthly-spending').value = this.profile.monthlySpending;
    }

    runFullAnalysis() {
        this.updateSummaryDashboard();
        this.calculateProjections();
        this.calculateRetirementReadiness();
        this.runStressTests();
        this.generateRebalancingPlan();
        this.runSensitivityAnalysis();
    }

    // ==================== SUMMARY DASHBOARD ====================

    updateSummaryDashboard() {
        if (!this.profile) return;

        document.getElementById('summary-dashboard').style.display = 'block';

        // Update stats
        document.getElementById('total-assets').textContent = this.formatCurrency(this.profile.totalAssets);
        document.getElementById('years-to-retire').textContent = this.profile.yearsToRetirement;

        // Calculate moderate projection (primary)
        const projection = this.calculateFutureValue(0.075);

        // Calculate spouse projection if applicable
        let spouseProjection = 0;
        if (this.profile.includeSpouse && this.profile.spouse401kBalance > 0) {
            spouseProjection = this.calculateSpouseFutureValue(0.075);
        }

        const totalProjected = projection.finalValue + spouseProjection;
        document.getElementById('projected-total').textContent = this.formatCurrency(totalProjected);

        // Calculate retirement income (4% withdrawal + SS + Pension)
        const withdrawalAmount = totalProjected * 0.04;
        const totalIncome = withdrawalAmount + this.profile.totalSocialSecurity + this.profile.totalPensionIncome;
        document.getElementById('retirement-income').textContent = this.formatCurrency(totalIncome);

        // Show/hide pension stat card
        const pensionCard = document.getElementById('pension-stat-card');
        if (this.profile.totalPensionIncome > 0) {
            pensionCard.style.display = 'block';
            document.getElementById('total-pension').textContent = this.formatCurrency(this.profile.totalPensionIncome);
        } else {
            pensionCard.style.display = 'none';
        }

        // Show/hide spouse stat card
        const spouseCard = document.getElementById('spouse-stat-card');
        if (this.profile.includeSpouse && this.profile.spouse401kBalance > 0) {
            spouseCard.style.display = 'block';
            document.getElementById('spouse-projected').textContent = this.formatCurrency(spouseProjection);
        } else {
            spouseCard.style.display = 'none';
        }

        this.drawAllocationChart();
        this.drawSummaryGrowthChart();
    }

    calculateSpouseFutureValue(annualReturn) {
        if (!this.profile.includeSpouse) return 0;

        const years = this.profile.spouseYearsToRetirement;
        let balance = this.profile.spouse401kBalance;
        let employeeContrib = this.profile.spouseEmployeeContribution;
        let employerContrib = this.profile.spouseEmployerMatch;

        for (let year = 1; year <= years; year++) {
            const annualContribution = employeeContrib + employerContrib;
            balance = (balance + annualContribution) * (1 + annualReturn);

            // Increase contributions for next year
            employeeContrib *= (1 + this.profile.spouseContributionIncrease);
            employerContrib *= (1 + this.profile.spouseContributionIncrease);
        }

        return balance;
    }

    // ==================== HOLDINGS MANAGEMENT ====================

    renderHoldings(type) {
        const container = document.getElementById(`${type}-holdings-container`);
        const holdings = this.holdings[type];

        container.innerHTML = holdings.map((holding, index) => `
            <div class="holding-row" data-index="${index}">
                <input type="text" class="holding-ticker" value="${holding.ticker}"
                       placeholder="Ticker" onchange="planner.updateHolding('${type}', ${index}, 'ticker', this.value)">
                <input type="text" class="holding-name" value="${holding.name}"
                       placeholder="Name" onchange="planner.updateHolding('${type}', ${index}, 'name', this.value)">
                <input type="number" class="holding-value" value="${holding.value}"
                       placeholder="Value" onchange="planner.updateHolding('${type}', ${index}, 'value', parseFloat(this.value))">
                <select class="holding-sector" onchange="planner.updateHolding('${type}', ${index}, 'sector', this.value)">
                    <option value="Technology" ${holding.sector === 'Technology' ? 'selected' : ''}>Technology</option>
                    <option value="Healthcare" ${holding.sector === 'Healthcare' ? 'selected' : ''}>Healthcare</option>
                    <option value="Financial" ${holding.sector === 'Financial' ? 'selected' : ''}>Financial</option>
                    <option value="Consumer Staples" ${holding.sector === 'Consumer Staples' ? 'selected' : ''}>Consumer Staples</option>
                    <option value="Consumer Discretionary" ${holding.sector === 'Consumer Discretionary' ? 'selected' : ''}>Consumer Discretionary</option>
                    <option value="Energy" ${holding.sector === 'Energy' ? 'selected' : ''}>Energy</option>
                    <option value="Industrial" ${holding.sector === 'Industrial' ? 'selected' : ''}>Industrial</option>
                    <option value="Materials" ${holding.sector === 'Materials' ? 'selected' : ''}>Materials</option>
                    <option value="Utilities" ${holding.sector === 'Utilities' ? 'selected' : ''}>Utilities</option>
                    <option value="Real Estate" ${holding.sector === 'Real Estate' ? 'selected' : ''}>Real Estate</option>
                    <option value="Communication" ${holding.sector === 'Communication' ? 'selected' : ''}>Communication</option>
                    <option value="Fixed Income" ${holding.sector === 'Fixed Income' ? 'selected' : ''}>Fixed Income</option>
                    <option value="Diversified" ${holding.sector === 'Diversified' ? 'selected' : ''}>Diversified</option>
                </select>
                <label class="holding-compliant sharia-only">
                    <input type="checkbox" ${holding.compliant ? 'checked' : ''}
                           onchange="planner.updateHolding('${type}', ${index}, 'compliant', this.checked)">
                    <span>Compliant</span>
                </label>
                <button type="button" class="btn-remove" onclick="planner.removeHolding('${type}', ${index})">X</button>
            </div>
        `).join('');

        this.updateShariaVisibility();
    }

    addHolding(type) {
        this.holdings[type].push({
            ticker: '',
            name: '',
            value: 0,
            sector: 'Diversified',
            compliant: true
        });
        this.renderHoldings(type);
        this.saveData();
    }

    removeHolding(type, index) {
        this.holdings[type].splice(index, 1);
        this.renderHoldings(type);
        this.saveData();
    }

    updateHolding(type, index, field, value) {
        this.holdings[type][index][field] = value;
        this.saveData();
    }

    // ==================== PORTFOLIO ANALYSIS ====================

    analyzePortfolio() {
        this.analyzeBrokerageHoldings();
        this.analyzeRetirementHoldings();

        document.getElementById('brokerage-analysis').style.display = 'block';
        document.getElementById('retirement-analysis').style.display = 'block';
    }

    analyzeBrokerageHoldings() {
        const holdings = this.holdings.brokerage;
        const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

        // Concentration Risk Analysis
        const concentrationHtml = this.analyzeConcentration(holdings, totalValue);
        document.getElementById('concentration-risk').innerHTML = concentrationHtml;

        // Sector Breakdown
        const sectorData = this.calculateSectorBreakdown(holdings, totalValue);
        const sectorHtml = this.renderSectorBreakdown(sectorData);
        document.getElementById('sector-breakdown').innerHTML = sectorHtml;

        // Compliance Status (Sharia mode only)
        if (this.shariaMode) {
            const complianceHtml = this.analyzeCompliance(holdings, totalValue);
            document.getElementById('compliance-status').innerHTML = complianceHtml;
        }

        // Draw sector chart
        this.drawSectorChart(sectorData);
    }

    analyzeConcentration(holdings, totalValue) {
        const sortedHoldings = [...holdings].sort((a, b) => b.value - a.value);
        const top5 = sortedHoldings.slice(0, 5);
        const top5Value = top5.reduce((sum, h) => sum + h.value, 0);
        const top5Pct = (top5Value / totalValue * 100).toFixed(1);

        let riskLevel = 'Low';
        let riskClass = 'low-risk';

        // Check for individual concentration > 10%
        const highConcentration = holdings.filter(h => (h.value / totalValue) > 0.10);

        if (highConcentration.length > 0 || top5Pct > 60) {
            riskLevel = 'High';
            riskClass = 'high-risk';
        } else if (top5Pct > 40) {
            riskLevel = 'Moderate';
            riskClass = 'moderate-risk';
        }

        let html = `<div class="risk-indicator ${riskClass}">${riskLevel} Concentration Risk</div>`;
        html += `<p>Top 5 holdings: ${top5Pct}% of portfolio</p>`;

        if (highConcentration.length > 0) {
            html += '<div class="concentration-warnings">';
            html += '<strong>High Concentration Positions (>10%):</strong><ul>';
            highConcentration.forEach(h => {
                const pct = (h.value / totalValue * 100).toFixed(1);
                html += `<li>${h.ticker}: ${pct}% (${this.formatCurrency(h.value)})</li>`;
            });
            html += '</ul></div>';
        }

        return html;
    }

    calculateSectorBreakdown(holdings, totalValue) {
        const sectors = {};
        holdings.forEach(h => {
            if (!sectors[h.sector]) {
                sectors[h.sector] = 0;
            }
            sectors[h.sector] += h.value;
        });

        return Object.entries(sectors).map(([name, value]) => ({
            name,
            value,
            percentage: (value / totalValue * 100).toFixed(1)
        })).sort((a, b) => b.value - a.value);
    }

    renderSectorBreakdown(sectorData) {
        return sectorData.map(s => `
            <div class="sector-item">
                <span class="sector-name">${s.name}</span>
                <span class="sector-value">${s.percentage}%</span>
                <div class="sector-bar" style="width: ${s.percentage}%"></div>
            </div>
        `).join('');
    }

    analyzeCompliance(holdings, totalValue) {
        const compliant = holdings.filter(h => h.compliant);
        const nonCompliant = holdings.filter(h => !h.compliant);

        const compliantValue = compliant.reduce((sum, h) => sum + h.value, 0);
        const nonCompliantValue = nonCompliant.reduce((sum, h) => sum + h.value, 0);

        const compliantPct = (compliantValue / totalValue * 100).toFixed(1);

        let html = `<div class="compliance-score">${compliantPct}% Sharia Compliant</div>`;

        if (nonCompliant.length > 0) {
            html += '<div class="non-compliant-list">';
            html += '<strong>Positions to Review:</strong><ul>';
            nonCompliant.forEach(h => {
                html += `<li>${h.ticker} - ${h.name} (${this.formatCurrency(h.value)})</li>`;
            });
            html += '</ul></div>';
        } else {
            html += '<p class="success-text">All holdings are Sharia-compliant!</p>';
        }

        return html;
    }

    analyzeRetirementHoldings() {
        const holdings = this.holdings.retirement;
        const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

        // Fund Allocation
        const allocationHtml = holdings.map(h => `
            <div class="fund-item">
                <span class="fund-name">${h.name}</span>
                <span class="fund-value">${this.formatCurrency(h.value)} (${(h.value / totalValue * 100).toFixed(1)}%)</span>
            </div>
        `).join('');
        document.getElementById('fund-allocation').innerHTML = allocationHtml;

        if (this.shariaMode) {
            // Compliance Concerns
            const nonCompliant = holdings.filter(h => !h.compliant);
            let complianceHtml = '';

            if (nonCompliant.length > 0) {
                const nonCompliantValue = nonCompliant.reduce((sum, h) => sum + h.value, 0);
                complianceHtml = `
                    <div class="warning-box">
                        <strong>Compliance Issue:</strong> ${this.formatCurrency(nonCompliantValue)}
                        (${(nonCompliantValue / totalValue * 100).toFixed(1)}%) in non-compliant funds.
                    </div>
                    <p>Traditional index funds typically include financial services companies (banks, insurance)
                    and other non-compliant holdings. Consider transferring to SDBA for compliant alternatives.</p>
                `;
            }
            document.getElementById('retirement-compliance').innerHTML = complianceHtml;

            // SDBA Recommendation
            const sdbaHtml = `
                <div class="recommendation-box">
                    <strong>Recommended Action:</strong>
                    <p>Transfer ${this.formatCurrency(totalValue)} to a Self-Directed Brokerage Account (SDBA)
                    and invest in Sharia-compliant ETFs:</p>
                    <ul>
                        <li>SPUS - SP Funds S&P 500 Sharia ETF (0.49% expense)</li>
                        <li>HLAL - Wahed FTSE USA Shariah ETF (0.50% expense)</li>
                        <li>SPSK - SP Funds DJ Global Sukuk ETF (0.55% expense) - for fixed income</li>
                    </ul>
                </div>
            `;
            document.getElementById('sdba-recommendation').innerHTML = sdbaHtml;
        }
    }

    // ==================== GROWTH PROJECTIONS ====================

    calculateProjections() {
        if (!this.profile) return;

        const rates = {
            conservative: 0.06,
            moderate: 0.075,
            optimistic: 0.09
        };

        const rate = rates[this.projectionScenario];
        const projection = this.calculateFutureValue(rate);

        this.renderProjectionResults(projection);
        this.drawProjectionChart(projection);
    }

    calculateFutureValue(annualReturn) {
        const years = this.profile.yearsToRetirement;
        let balance = this.profile.totalAssets;
        let employeeContrib = this.profile.employeeContribution;
        let employerContrib = this.profile.employerMatch;
        let totalContributions = 0;

        const yearlyData = [];

        for (let year = 1; year <= years; year++) {
            const startBalance = balance;
            const annualContribution = employeeContrib + employerContrib;
            totalContributions += annualContribution;

            // Add contributions and growth
            balance = (balance + annualContribution) * (1 + annualReturn);
            const growth = balance - startBalance - annualContribution;

            yearlyData.push({
                year: year,
                age: this.profile.currentAge + year,
                startBalance: startBalance,
                contribution: annualContribution,
                growth: growth,
                endBalance: balance
            });

            // Increase contributions for next year
            employeeContrib *= (1 + this.profile.employeeIncrease);
            employerContrib *= (1 + this.profile.employerIncrease);
        }

        return {
            finalValue: balance,
            totalContributions: totalContributions,
            totalGrowth: balance - this.profile.totalAssets - totalContributions,
            yearlyData: yearlyData
        };
    }

    renderProjectionResults(projection) {
        document.getElementById('projection-final').textContent = this.formatCurrency(projection.finalValue);
        document.getElementById('projection-contributions').textContent = this.formatCurrency(projection.totalContributions);
        document.getElementById('projection-growth').textContent = this.formatCurrency(projection.totalGrowth);

        // Populate table
        const tbody = document.getElementById('projection-tbody');
        tbody.innerHTML = projection.yearlyData.map(data => `
            <tr>
                <td>${data.year}</td>
                <td>${data.age}</td>
                <td>${this.formatCurrency(data.startBalance)}</td>
                <td>${this.formatCurrency(data.contribution)}</td>
                <td>${this.formatCurrency(data.growth)}</td>
                <td><strong>${this.formatCurrency(data.endBalance)}</strong></td>
            </tr>
        `).join('');
    }

    setScenario(scenario) {
        this.projectionScenario = scenario;

        // Update button states
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.scenario === scenario) {
                btn.classList.add('active');
            }
        });

        this.calculateProjections();
    }

    // ==================== RETIREMENT READINESS ====================

    calculateRetirementReadiness() {
        if (!this.profile) return;

        const projection = this.calculateFutureValue(0.075);
        let portfolioAtRetirement = projection.finalValue;

        // Add spouse 401(k) if applicable
        if (this.profile.includeSpouse && this.profile.spouse401kBalance > 0) {
            portfolioAtRetirement += this.calculateSpouseFutureValue(0.075);
        }

        const annualWithdrawal = portfolioAtRetirement * 0.04;
        const totalIncome = annualWithdrawal + this.profile.totalSocialSecurity + this.profile.totalPensionIncome;
        const annualNeed = this.profile.annualSpending;
        const surplus = totalIncome - annualNeed;

        // Calculate readiness score (0-100%)
        const readinessScore = Math.min(100, (totalIncome / annualNeed) * 100);

        // Update UI
        document.getElementById('annual-need').textContent = this.formatCurrency(annualNeed);
        document.getElementById('ss-income').textContent = this.formatCurrency(this.profile.totalSocialSecurity);
        document.getElementById('withdrawal-amount').textContent = this.formatCurrency(annualWithdrawal);
        document.getElementById('annual-surplus').textContent = this.formatCurrency(surplus);
        document.getElementById('annual-surplus').className = surplus >= 0 ? 'detail-value positive' : 'detail-value negative';

        // Readiness score
        const scoreElement = document.getElementById('readiness-score');
        scoreElement.textContent = readinessScore.toFixed(0) + '%';
        scoreElement.className = 'readiness-score ' + (readinessScore >= 100 ? 'excellent' : readinessScore >= 80 ? 'good' : 'needs-work');

        // Cash flow projection
        this.generateCashFlowProjection(portfolioAtRetirement);
    }

    generateCashFlowProjection(startingPortfolio) {
        const retirementAge = this.profile.retirementAge;
        const endAge = 90;
        const annualSpending = this.profile.annualSpending;
        const inflationRate = 0.025; // 2.5% inflation
        const withdrawalGrowth = 0.03; // 3% conservative growth in retirement

        let portfolio = startingPortfolio;
        const cashFlowData = [];

        for (let age = retirementAge; age <= endAge; age++) {
            const yearsInRetirement = age - retirementAge;
            const inflatedSpending = annualSpending * Math.pow(1 + inflationRate, yearsInRetirement);

            // Calculate Social Security (may start at different ages)
            let ssIncome = this.profile.socialSecurity;
            if (this.profile.includeSpouse && age >= this.profile.spouseSsStartAge) {
                ssIncome += this.profile.spouseSocialSecurity;
            }

            // Calculate pension income with COLA
            let pensionIncome = 0;
            if (this.profile.hasPension && age >= this.profile.pensionStartAge) {
                pensionIncome += this.profile.pensionAmount * Math.pow(1 + this.profile.pensionCola, yearsInRetirement);
            }
            if (this.profile.includeSpouse && this.profile.spouseHasPension && age >= this.profile.spousePensionStartAge) {
                pensionIncome += this.profile.spousePensionAmount * Math.pow(1 + this.profile.spousePensionCola, yearsInRetirement);
            }

            const guaranteedIncome = ssIncome + pensionIncome;
            const neededFromPortfolio = Math.max(0, inflatedSpending - guaranteedIncome);
            const withdrawal = Math.min(portfolio * 0.04, neededFromPortfolio);
            const totalIncome = withdrawal + guaranteedIncome;
            const surplus = totalIncome - inflatedSpending;

            cashFlowData.push({
                age: age,
                year: new Date().getFullYear() + (age - this.profile.currentAge),
                portfolio: portfolio,
                withdrawal: withdrawal,
                socialSecurity: ssIncome,
                pension: pensionIncome,
                totalIncome: totalIncome,
                spending: inflatedSpending,
                surplus: surplus
            });

            // Update portfolio for next year
            portfolio = Math.max(0, (portfolio - withdrawal) * (1 + withdrawalGrowth));
        }

        // Render cash flow table
        const tbody = document.getElementById('cashflow-tbody');
        tbody.innerHTML = cashFlowData.map(data => `
            <tr class="${data.surplus < 0 ? 'deficit-row' : ''}">
                <td>${data.age}</td>
                <td>${data.year}</td>
                <td>${this.formatCurrency(data.portfolio)}</td>
                <td>${this.formatCurrency(data.withdrawal)}</td>
                <td>${this.formatCurrency(data.socialSecurity)}</td>
                <td>${this.formatCurrency(data.pension)}</td>
                <td>${this.formatCurrency(data.totalIncome)}</td>
                <td>${this.formatCurrency(data.spending)}</td>
                <td class="${data.surplus >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(data.surplus)}</td>
            </tr>
        `).join('');

        this.drawCashFlowChart(cashFlowData);
    }

    // ==================== STRESS TESTS ====================

    runStressTests() {
        if (!this.profile) return;

        const scenarios = [20, 30, 40];
        const currentTotal = this.profile.totalAssets;
        const years = this.profile.yearsToRetirement;
        const returnRate = 0.075;

        scenarios.forEach(decline => {
            const loss = currentTotal * (decline / 100);
            const newBalance = currentTotal - loss;

            // Calculate recovery time
            const recoveryYears = Math.log(currentTotal / newBalance) / Math.log(1 + returnRate);

            // Calculate value at retirement with crash
            const yearsRemaining = years;
            const projection = this.calculateFutureValueFromBalance(newBalance, returnRate, yearsRemaining);

            document.getElementById(`loss-${decline}`).textContent = this.formatCurrency(loss);
            document.getElementById(`balance-${decline}`).textContent = this.formatCurrency(newBalance);
            document.getElementById(`recovery-${decline}`).textContent = `${recoveryYears.toFixed(1)} years`;
            document.getElementById(`retirement-${decline}`).textContent = this.formatCurrency(projection);
        });

        // Risk assessment
        const normalProjection = this.calculateFutureValue(0.075).finalValue;
        const worstCase = this.calculateFutureValueFromBalance(currentTotal * 0.6, 0.075, years);

        let assessment = '';
        if (years >= 10) {
            assessment = `
                <div class="assessment-positive">
                    <strong>Recovery Outlook: Favorable</strong>
                    <p>With ${years} years until retirement, you have sufficient time to recover from even severe market downturns.
                    Historical data shows markets typically recover within 3-5 years from major corrections.</p>
                </div>
            `;
        } else if (years >= 5) {
            assessment = `
                <div class="assessment-moderate">
                    <strong>Recovery Outlook: Moderate Concern</strong>
                    <p>With ${years} years until retirement, a severe crash could impact your retirement timeline.
                    Consider gradually shifting to more conservative allocations to protect against sequence-of-returns risk.</p>
                </div>
            `;
        } else {
            assessment = `
                <div class="assessment-concern">
                    <strong>Recovery Outlook: Heightened Risk</strong>
                    <p>With only ${years} years until retirement, market volatility poses significant risk.
                    Consider increasing fixed income allocation and maintaining larger cash reserves.</p>
                </div>
            `;
        }

        assessment += `
            <div class="assessment-stats">
                <p><strong>Baseline projection:</strong> ${this.formatCurrency(normalProjection)}</p>
                <p><strong>After 40% crash:</strong> ${this.formatCurrency(worstCase)}</p>
                <p><strong>Potential shortfall:</strong> ${this.formatCurrency(normalProjection - worstCase)}</p>
            </div>
        `;

        document.getElementById('risk-assessment').innerHTML = assessment;
    }

    calculateFutureValueFromBalance(startBalance, rate, years) {
        let balance = startBalance;
        let employeeContrib = this.profile.employeeContribution;
        let employerContrib = this.profile.employerMatch;

        for (let year = 1; year <= years; year++) {
            const annualContribution = employeeContrib + employerContrib;
            balance = (balance + annualContribution) * (1 + rate);
            employeeContrib *= (1 + this.profile.employeeIncrease);
            employerContrib *= (1 + this.profile.employerIncrease);
        }

        return balance;
    }

    // ==================== REBALANCING PLAN ====================

    generateRebalancingPlan() {
        if (!this.profile) return;

        // Calculate target allocation based on age and risk tolerance
        let equityTarget, fixedTarget, cashTarget;

        const age = this.profile.currentAge;
        const baseEquity = 110 - age; // Rule of 110

        switch (this.profile.riskTolerance) {
            case 'conservative':
                equityTarget = Math.max(40, baseEquity - 15);
                break;
            case 'aggressive':
                equityTarget = Math.min(90, baseEquity + 10);
                break;
            default:
                equityTarget = baseEquity;
        }

        fixedTarget = Math.min(30, 100 - equityTarget - 10);
        cashTarget = 100 - equityTarget - fixedTarget;

        // Update UI
        document.getElementById('equity-target').textContent = equityTarget + '%';
        document.getElementById('fixed-target').textContent = fixedTarget + '%';
        document.getElementById('cash-target').textContent = cashTarget + '%';
        document.getElementById('equity-bar').style.width = equityTarget + '%';
        document.getElementById('fixed-bar').style.width = fixedTarget + '%';
        document.getElementById('cash-bar').style.width = cashTarget + '%';

        // SDBA allocation (Sharia mode)
        if (this.shariaMode) {
            const retirementBalance = this.profile.retirementBalance;
            const equityAmount = retirementBalance * (equityTarget / 100);
            const fixedAmount = retirementBalance * (fixedTarget / 100);

            document.getElementById('transfer-amount').textContent =
                `Transfer ${this.formatCurrency(retirementBalance)} from index funds to SDBA for Sharia-compliant reinvestment.`;

            document.getElementById('sdba-allocation').innerHTML = `
                <div class="allocation-row">
                    <span>SPUS (S&P 500 Sharia)</span>
                    <span>${this.formatCurrency(equityAmount * 0.5)} (${(equityTarget * 0.5).toFixed(0)}%)</span>
                </div>
                <div class="allocation-row">
                    <span>HLAL (Wahed FTSE USA Shariah)</span>
                    <span>${this.formatCurrency(equityAmount * 0.5)} (${(equityTarget * 0.5).toFixed(0)}%)</span>
                </div>
                <div class="allocation-row">
                    <span>SPSK (DJ Global Sukuk)</span>
                    <span>${this.formatCurrency(fixedAmount)} (${fixedTarget}%)</span>
                </div>
            `;
        }

        // Action checklists
        this.generateActionChecklists();
        this.generateTradeRecommendations(equityTarget, fixedTarget, cashTarget);
    }

    generateActionChecklists() {
        // Immediate actions
        let immediateHtml = '';
        if (this.shariaMode) {
            immediateHtml = `
                <div class="checklist-item">
                    <input type="checkbox" id="check-1">
                    <label for="check-1">Contact Empower to confirm SDBA availability</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check-2">
                    <label for="check-2">Open SDBA account if not already active</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check-3">
                    <label for="check-3">Review and verify Zoya screening for all brokerage holdings</label>
                </div>
            `;
        }
        immediateHtml += `
            <div class="checklist-item">
                <input type="checkbox" id="check-4">
                <label for="check-4">Review high-concentration positions (NVDA at 17%)</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-5">
                <label for="check-5">Confirm beneficiary designations are current</label>
            </div>
        `;
        document.getElementById('immediate-actions').innerHTML = immediateHtml;

        // Short-term actions
        let shortTermHtml = '';
        if (this.shariaMode) {
            shortTermHtml = `
                <div class="checklist-item">
                    <input type="checkbox" id="check-st-1">
                    <label for="check-st-1">Transfer 401(k) balance to SDBA</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check-st-2">
                    <label for="check-st-2">Purchase SPUS, HLAL, SPSK in SDBA</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check-st-3">
                    <label for="check-st-3">Set up automatic contributions to SDBA</label>
                </div>
            `;
        }
        shortTermHtml += `
            <div class="checklist-item">
                <input type="checkbox" id="check-st-4">
                <label for="check-st-4">Trim NVDA position to reduce concentration risk</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-st-5">
                <label for="check-st-5">Increase ${this.shariaMode ? 'sukuk' : 'fixed income'} allocation</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-st-6">
                <label for="check-st-6">Consider ${this.shariaMode ? 'Islamic savings account' : 'high-yield savings'} for cash reserves</label>
            </div>
        `;
        document.getElementById('short-term-actions').innerHTML = shortTermHtml;

        // Ongoing actions
        const ongoingHtml = `
            <div class="checklist-item">
                <input type="checkbox" id="check-on-1">
                <label for="check-on-1">Rebalance portfolio quarterly</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-on-2">
                <label for="check-on-2">Review and adjust contributions annually</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-on-3">
                <label for="check-on-3">${this.shariaMode ? 'Re-screen holdings through Zoya quarterly' : 'Review fund performance quarterly'}</label>
            </div>
            <div class="checklist-item">
                <input type="checkbox" id="check-on-4">
                <label for="check-on-4">Adjust risk allocation as retirement approaches</label>
            </div>
        `;
        document.getElementById('ongoing-actions').innerHTML = ongoingHtml;
    }

    generateTradeRecommendations(equityTarget, fixedTarget, cashTarget) {
        const totalAssets = this.profile.totalAssets;
        const brokerageHoldings = this.holdings.brokerage;
        const totalBrokerage = brokerageHoldings.reduce((sum, h) => sum + h.value, 0);

        // Find high concentration positions
        let sellHtml = '';
        const highConcentration = brokerageHoldings.filter(h => (h.value / totalBrokerage) > 0.10);

        highConcentration.forEach(h => {
            const currentPct = (h.value / totalBrokerage * 100);
            const targetValue = totalBrokerage * 0.05; // Target 5% max
            const trimAmount = h.value - targetValue;

            sellHtml += `
                <div class="trade-item sell">
                    <span class="trade-ticker">${h.ticker}</span>
                    <span class="trade-action">Trim ${this.formatCurrency(trimAmount)}</span>
                    <span class="trade-reason">Reduce from ${currentPct.toFixed(1)}% to 5%</span>
                </div>
            `;
        });

        if (!sellHtml) {
            sellHtml = '<p>No immediate sells recommended. Portfolio is reasonably balanced.</p>';
        }
        document.getElementById('sell-recommendations').innerHTML = sellHtml;

        // Buy recommendations
        let buyHtml = '';

        if (this.shariaMode) {
            buyHtml = `
                <div class="trade-item buy">
                    <span class="trade-ticker">SPSK</span>
                    <span class="trade-action">Add ${this.formatCurrency(totalAssets * 0.05)}</span>
                    <span class="trade-reason">Increase sukuk allocation for stability</span>
                </div>
                <div class="trade-item buy">
                    <span class="trade-ticker">HLAL</span>
                    <span class="trade-action">Add ${this.formatCurrency(totalAssets * 0.03)}</span>
                    <span class="trade-reason">Diversify compliant equity exposure</span>
                </div>
            `;
        } else {
            buyHtml = `
                <div class="trade-item buy">
                    <span class="trade-ticker">BND</span>
                    <span class="trade-action">Add ${this.formatCurrency(totalAssets * 0.05)}</span>
                    <span class="trade-reason">Increase fixed income allocation</span>
                </div>
                <div class="trade-item buy">
                    <span class="trade-ticker">VTI</span>
                    <span class="trade-action">Add ${this.formatCurrency(totalAssets * 0.03)}</span>
                    <span class="trade-reason">Diversify equity exposure</span>
                </div>
            `;
        }

        document.getElementById('buy-recommendations').innerHTML = buyHtml;
    }

    // ==================== SENSITIVITY ANALYSIS ====================

    runSensitivityAnalysis() {
        if (!this.profile) return;

        this.calculateEarlyRetirement();
        this.calculateLowerReturns();
        this.calculateHigherSpending();
        this.calculateSafeRetirementAge();
    }

    calculateEarlyRetirement() {
        const earlyAge = parseInt(document.getElementById('early-retire-age').value) || 63;
        const yearsLost = this.profile.retirementAge - earlyAge;
        const yearsToEarly = earlyAge - this.profile.currentAge;

        const earlyProjection = this.calculateFutureValueFromBalance(
            this.profile.totalAssets, 0.075, yearsToEarly
        );

        const normalProjection = this.calculateFutureValue(0.075).finalValue;
        const opportunityCost = normalProjection - earlyProjection;

        const earlyWithdrawal = earlyProjection * 0.04;
        const sustainable = (earlyWithdrawal + this.profile.socialSecurity) >= this.profile.annualSpending;

        document.getElementById('early-portfolio').textContent = this.formatCurrency(earlyProjection);
        document.getElementById('early-years-lost').textContent = `${yearsLost} years`;
        document.getElementById('early-cost').textContent = this.formatCurrency(opportunityCost);
        document.getElementById('early-sustainable').textContent = sustainable ? 'Sustainable' : 'May require adjustments';
        document.getElementById('early-sustainable').className = 'result-value ' + (sustainable ? 'positive' : 'negative');
    }

    calculateLowerReturns() {
        const lowerRate = (parseFloat(document.getElementById('lower-return-rate').value) || 5) / 100;

        const lowerProjection = this.calculateFutureValueFromBalance(
            this.profile.totalAssets, lowerRate, this.profile.yearsToRetirement
        );

        const normalProjection = this.calculateFutureValue(0.075).finalValue;
        const difference = normalProjection - lowerProjection;

        const lowerWithdrawal = lowerProjection * 0.04;
        const normalWithdrawal = normalProjection * 0.04;
        const incomeGap = normalWithdrawal - lowerWithdrawal;

        document.getElementById('lower-portfolio').textContent = this.formatCurrency(lowerProjection);
        document.getElementById('lower-difference').textContent = '-' + this.formatCurrency(difference);
        document.getElementById('lower-withdrawal').textContent = this.formatCurrency(lowerWithdrawal);
        document.getElementById('lower-gap').textContent = '-' + this.formatCurrency(incomeGap) + '/year';
    }

    calculateHigherSpending() {
        const higherMonthly = parseFloat(document.getElementById('higher-spending').value) || 5000;
        const higherAnnual = higherMonthly * 12;

        const projection = this.calculateFutureValue(0.075).finalValue;
        const neededAfterSS = higherAnnual - this.profile.socialSecurity;
        const requiredPortfolio = neededAfterSS / 0.04;
        const shortfall = requiredPortfolio - projection;

        // Calculate how long portfolio lasts
        let portfolio = projection;
        let years = 0;
        const growthInRetirement = 0.03;

        while (portfolio > 0 && years < 50) {
            portfolio = (portfolio - higherAnnual + this.profile.socialSecurity) * (1 + growthInRetirement);
            years++;
        }

        document.getElementById('higher-annual').textContent = this.formatCurrency(higherAnnual);
        document.getElementById('higher-required').textContent = this.formatCurrency(requiredPortfolio);
        document.getElementById('higher-shortfall').textContent = shortfall > 0 ?
            this.formatCurrency(shortfall) : this.formatCurrency(0) + ' (surplus)';
        document.getElementById('higher-shortfall').className = 'result-value ' + (shortfall > 0 ? 'negative' : 'positive');
        document.getElementById('higher-years').textContent = years >= 50 ? '50+ years' : `${years} years`;
    }

    calculateSafeRetirementAge() {
        const annualNeed = this.profile.annualSpending;
        const socialSecurity = this.profile.socialSecurity;
        const requiredFromPortfolio = annualNeed - socialSecurity;
        const requiredPortfolio = requiredFromPortfolio / 0.04;

        // Find earliest age where portfolio >= required
        let safeAge = this.profile.currentAge;

        for (let targetAge = this.profile.currentAge + 1; targetAge <= 75; targetAge++) {
            const years = targetAge - this.profile.currentAge;
            const projection = this.calculateFutureValueFromBalance(
                this.profile.totalAssets, 0.075, years
            );

            if (projection >= requiredPortfolio) {
                safeAge = targetAge;
                break;
            }
        }

        document.getElementById('safe-retire-age').textContent = safeAge;
        document.getElementById('safe-retire-details').textContent =
            `Based on ${this.formatCurrency(annualNeed)}/year spending and 4% withdrawal rule`;

        // Generate timeline
        this.generateRetireTimeline(requiredPortfolio);
    }

    generateRetireTimeline(requiredPortfolio) {
        const ages = [60, 62, 63, 65, 67, 70];
        const currentAge = this.profile.currentAge;

        let timelineHtml = '';

        ages.filter(age => age > currentAge).forEach(age => {
            const years = age - currentAge;
            const projection = this.calculateFutureValueFromBalance(
                this.profile.totalAssets, 0.075, years
            );
            const withdrawal = projection * 0.04;
            const totalIncome = withdrawal + this.profile.socialSecurity;
            const sustainable = projection >= requiredPortfolio;

            timelineHtml += `
                <div class="timeline-item ${sustainable ? 'sustainable' : 'not-sustainable'}">
                    <div class="timeline-age">Age ${age}</div>
                    <div class="timeline-details">
                        <span>Portfolio: ${this.formatCurrency(projection)}</span>
                        <span>Annual Income: ${this.formatCurrency(totalIncome)}</span>
                        <span class="timeline-status">${sustainable ? 'Sustainable' : 'Shortfall'}</span>
                    </div>
                </div>
            `;
        });

        document.getElementById('retire-timeline').innerHTML = timelineHtml;
    }

    // ==================== CHARTS ====================

    drawAllocationChart() {
        const ctx = document.getElementById('allocationChart');
        if (!ctx) return;

        if (this.charts.allocation) {
            this.charts.allocation.destroy();
        }

        this.charts.allocation = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Brokerage', '401(k)', 'Cash'],
                datasets: [{
                    data: [
                        this.profile.brokerageBalance,
                        this.profile.retirementBalance,
                        this.profile.cashReserves
                    ],
                    backgroundColor: ['#667eea', '#f5576c', '#10b981'],
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${this.formatCurrency(value)} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    drawSummaryGrowthChart() {
        const ctx = document.getElementById('growthChart');
        if (!ctx) return;

        if (this.charts.growth) {
            this.charts.growth.destroy();
        }

        const projection = this.calculateFutureValue(0.075);
        const labels = projection.yearlyData.map(d => `Age ${d.age}`);
        const values = projection.yearlyData.map(d => d.endBalance);

        this.charts.growth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
                        }
                    }
                }
            }
        });
    }

    drawSectorChart(sectorData) {
        const ctx = document.getElementById('sectorChart');
        if (!ctx) return;

        if (this.charts.sector) {
            this.charts.sector.destroy();
        }

        const colors = [
            '#667eea', '#f5576c', '#10b981', '#f59e0b', '#3b82f6',
            '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
        ];

        this.charts.sector = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: sectorData.map(s => s.name),
                datasets: [{
                    data: sectorData.map(s => s.value),
                    backgroundColor: colors.slice(0, sectorData.length),
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.label}: ${context.parsed}% (${this.formatCurrency(sectorData[context.dataIndex].value)})`;
                            }
                        }
                    }
                }
            }
        });
    }

    drawProjectionChart(projection) {
        const ctx = document.getElementById('projectionChart');
        if (!ctx) return;

        if (this.charts.projection) {
            this.charts.projection.destroy();
        }

        const labels = projection.yearlyData.map(d => `Year ${d.year}`);
        const balances = projection.yearlyData.map(d => d.endBalance);
        const contributions = projection.yearlyData.map(d => d.contribution);

        this.charts.projection = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Portfolio Balance',
                        data: balances,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        type: 'line',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Annual Contribution',
                        data: contributions,
                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: {
                            callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
                        }
                    }
                }
            }
        });
    }

    drawCashFlowChart(cashFlowData) {
        const ctx = document.getElementById('cashflowChart');
        if (!ctx) return;

        if (this.charts.cashflow) {
            this.charts.cashflow.destroy();
        }

        const labels = cashFlowData.map(d => `Age ${d.age}`);
        const portfolios = cashFlowData.map(d => d.portfolio);
        const incomes = cashFlowData.map(d => d.totalIncome);
        const spendings = cashFlowData.map(d => d.spending);

        this.charts.cashflow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Portfolio Value',
                        data: portfolios,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Total Income',
                        data: incomes,
                        borderColor: '#10b981',
                        borderDash: [5, 5],
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Annual Spending',
                        data: spendings,
                        borderColor: '#f5576c',
                        borderDash: [5, 5],
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Portfolio Value' },
                        ticks: {
                            callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Annual Income/Spending' },
                        grid: { drawOnChartArea: false },
                        ticks: {
                            callback: (value) => '$' + (value / 1000).toFixed(0) + 'K'
                        }
                    }
                }
            }
        });
    }

    // ==================== UTILITIES ====================

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Initialize planner
let planner;
window.addEventListener('DOMContentLoaded', () => {
    planner = new FinancialPlanner();
});

// ==================== TAB SWITCHING ====================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active to clicked nav tab
    event.target.classList.add('active');
}

// ==================== GLOBAL HANDLERS ====================

function toggleShariaMode() {
    planner.toggleShariaMode();
}

function handleProfileSubmit(event) {
    planner.handleProfileSubmit(event);
}

function addHolding(type) {
    planner.addHolding(type);
}

function analyzePortfolio() {
    planner.analyzePortfolio();
}

function setScenario(scenario) {
    planner.setScenario(scenario);
}

function calculateEarlyRetirement() {
    planner.calculateEarlyRetirement();
}

function calculateLowerReturns() {
    planner.calculateLowerReturns();
}

function calculateHigherSpending() {
    planner.calculateHigherSpending();
}

function clearProjectionTable() {
    // Clear the table body
    document.getElementById('projection-tbody').innerHTML = '';

    // Clear the summary values
    document.getElementById('projection-final').textContent = '$0';
    document.getElementById('projection-contributions').textContent = '$0';
    document.getElementById('projection-growth').textContent = '$0';

    // Destroy the chart if it exists
    if (planner.charts.projection) {
        planner.charts.projection.destroy();
        planner.charts.projection = null;
    }
}

function toggleSpouseFields() {
    const checkbox = document.getElementById('include-spouse');
    const fields = document.getElementById('spouse-fields');
    fields.style.display = checkbox.checked ? 'block' : 'none';
}

function toggleSpousePension() {
    const checkbox = document.getElementById('spouse-has-pension');
    const fields = document.getElementById('spouse-pension-fields');
    fields.style.display = checkbox.checked ? 'block' : 'none';
}

function togglePrimaryPension() {
    const checkbox = document.getElementById('has-pension');
    const fields = document.getElementById('pension-fields');
    fields.style.display = checkbox.checked ? 'block' : 'none';
}

function resetProfileForm() {
    // Set all form fields to zero/empty
    document.getElementById('current-age').value = '';
    document.getElementById('retirement-age').value = '';
    document.getElementById('state').value = 'VA';
    document.getElementById('tax-bracket').value = '';
    document.getElementById('risk-tolerance').value = 'moderate';
    document.getElementById('brokerage-balance').value = '0';
    document.getElementById('retirement-balance').value = '0';
    document.getElementById('cash-reserves').value = '0';
    document.getElementById('employee-contribution').value = '0';
    document.getElementById('employer-match').value = '0';
    document.getElementById('employee-increase').value = '0';
    document.getElementById('employer-increase').value = '0';
    document.getElementById('social-security').value = '0';
    document.getElementById('monthly-spending').value = '0';

    // Reset pension fields
    document.getElementById('has-pension').checked = false;
    document.getElementById('pension-amount').value = '0';
    document.getElementById('pension-start-age').value = '65';
    document.getElementById('pension-cola').value = '0';
    document.getElementById('pension-survivor').value = '50';

    // Reset spouse fields
    document.getElementById('include-spouse').checked = false;
    document.getElementById('spouse-age').value = '';
    document.getElementById('spouse-retirement-age').value = '65';
    document.getElementById('spouse-401k-balance').value = '0';
    document.getElementById('spouse-employee-contribution').value = '0';
    document.getElementById('spouse-employer-match').value = '0';
    document.getElementById('spouse-contribution-increase').value = '2';
    document.getElementById('spouse-has-pension').checked = false;
    document.getElementById('spouse-pension-amount').value = '0';
    document.getElementById('spouse-pension-start-age').value = '65';
    document.getElementById('spouse-pension-cola').value = '0';
    document.getElementById('spouse-pension-survivor').value = '50';
    document.getElementById('spouse-social-security').value = '0';
    document.getElementById('spouse-ss-start-age').value = '65';

    // Hide optional sections
    document.getElementById('spouse-fields').style.display = 'none';
    document.getElementById('spouse-pension-fields').style.display = 'none';
    document.getElementById('pension-fields').style.display = 'none';

    // Hide the summary dashboard
    document.getElementById('summary-dashboard').style.display = 'none';

    // Clear stored profile data
    planner.profile = null;
    StorageManager.remove('financial-planner-profile');

    // Destroy charts if they exist
    if (planner.charts.allocation) {
        planner.charts.allocation.destroy();
        planner.charts.allocation = null;
    }
    if (planner.charts.growth) {
        planner.charts.growth.destroy();
        planner.charts.growth = null;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetPortfolioHoldings() {
    // Clear all holdings to empty
    planner.holdings.brokerage = [];
    planner.holdings.retirement = [];

    // Re-render holdings (will show empty)
    planner.renderHoldings('brokerage');
    planner.renderHoldings('retirement');

    // Hide analysis results
    document.getElementById('brokerage-analysis').style.display = 'none';
    document.getElementById('retirement-analysis').style.display = 'none';

    // Destroy sector chart if exists
    if (planner.charts.sector) {
        planner.charts.sector.destroy();
        planner.charts.sector = null;
    }

    // Save updated holdings
    planner.saveData();

    // Scroll to top of section
    document.querySelector('#portfolio-tab .planner-content').scrollIntoView({ behavior: 'smooth' });
}
