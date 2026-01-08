# Road to Retirement Module

## Overview

The Road to Retirement module provides comprehensive retirement planning tools integrated into LifeOS. It combines two powerful calculators to help you visualize your path to financial freedom.

## Features

### 1. 401k Retirement Calculator

Plan your retirement savings with realistic projections based on:

- **Personal Income Management**
  - Current age and target retirement age
  - Annual gross income
  - Annual raise percentage (applies to both person and spouse)
  - Current 401k balance

- **Retirement Contributions**
  - Employee contribution percentage
  - Employer/company match percentage
  - Support for both individual and spouse contributions

- **Spouse Support (Optional)**
  - Add spouse income to retirement plan
  - Separate 401k accounts and contribution rates
  - Individual company match percentages
  - Can set to 0% for either person

- **Pension Plan Support**
  - Optional pension income for primary person and spouse
  - Configure pension percentage of final salary
  - Set vesting requirements (years of service)
  - Track current years of service
  - Annual pension income calculated and displayed at retirement

- **Investment Details**
  - Federal tax rate (manual input)
  - Projected annual return percentage
  - Inflation considerations

- **Results Dashboard**
  - Year-by-year projection table showing:
    - Annual income
    - Annual contributions
    - 401k balance at each year
    - Annual pension income (if applicable)
    - Age at each milestone
  - Summary cards showing:
    - Total balance at retirement
    - Total contributions made
    - Investment growth earned
  - Dashboard stat card showing annual pension income at retirement (if applicable)

### 2. Savings Account Calculator

Build emergency and retirement savings with no compound interest:

- **Savings Details**
  - Current savings balance
  - One-time deposit option
  - Years until retirement
  - Regular contribution frequency (weekly, bi-weekly, monthly)
  - Regular contribution amount

- **Results Dashboard**
  - Year-by-year projection table showing:
    - Annual contribution amounts
    - Running balance at each year
  - Summary cards showing:
    - Total savings at retirement
    - Total amount contributed
    - Initial balance

### 3. Dashboard Overview

Central dashboard showing:

- **Stat Cards**
  - Projected 401k balance
  - Projected savings balance
  - Total combined retirement funds
  - Years to retirement

- **Visualizations**
  - **Growth Chart**: Line graph showing 401k and/or savings growth over time
  - **Breakdown Chart**: Pie chart showing proportion of 401k vs savings at retirement

## How to Use

### 401k Calculator

1. **Enter Personal Information**
   - Input your current age and desired retirement age
   - Enter annual gross income
   - Input expected annual raise percentage

2. **Configure 401k Details**
   - Set your contribution percentage (e.g., 10%)
   - Set company match percentage (e.g., 3%)
   - Enter current 401k balance

3. **Configure Pension (Optional)**
   - Check "Has a Pension Plan" if applicable
   - Enter pension percentage of final salary (e.g., 2% per year of service)
   - Set vesting requirement (years of service required, e.g., 5 years)
   - Enter current years of service with the employer
   - The calculator will compute annual pension income at retirement if vesting is met

4. **Add Spouse (Optional)**
   - Check "Include Spouse in Retirement Plan"
   - Enter spouse age, income, and contribution details
   - Can set spouse company match to 0% if not applicable
   - Optionally add spouse pension details

5. **Tax & Investment Settings**
   - Enter your federal tax rate
   - Enter projected annual return percentage (historically 7% is reasonable)

6. **Calculate**
   - Click "Calculate 401k Projection"
   - Results appear with year-by-year table

### Savings Calculator

1. **Enter Savings Timeline**
   - Input years until retirement
   - Enter current savings balance
   - Optionally add a one-time deposit

2. **Set Contribution Schedule**
   - Choose contribution frequency (weekly, bi-weekly, or monthly)
   - Enter contribution amount for your chosen frequency

3. **Calculate**
   - Click "Calculate Savings Growth"
   - Results appear with year-by-year table

## Data Storage

- All retirement plans are saved automatically to browser storage
- Data persists between sessions using StorageManager
- Dashboard updates in real-time as you create or modify plans

## Calculation Details

### 401k Future Value

```
Year Balance = (Previous Balance + Annual Contributions) × (1 + Annual Return)
```

- Annual contributions include both employee and employer match
- Contributions are added before annual growth calculation
- Annual income increases by the raise percentage each year

### Savings Account Growth

```
Year Balance = Previous Balance + (Annual Contributions)
```

- No compound interest applied (simple addition)
- Contributions are converted to annual based on frequency:
  - Weekly: × 52
  - Bi-weekly: × 26
  - Monthly: × 12

## Future Enhancements

- Integration with Investments module to pull current portfolio balance
- Integration with Finance module expense data for realistic retirement budgets
- Multiple scenario comparison (conservative, moderate, aggressive)
- Withdrawal strategy planning
- Tax optimization strategies
- Social Security integration

## Technical Details

- **Storage Keys**:
  - `lifeos-retirement-401k`
  - `lifeos-retirement-savings`
- **Browser Compatibility**: All modern browsers with localStorage support
- **Dependencies**: Chart.js for visualizations
- **Data Format**: JSON objects stored in browser localStorage

## Tips for Accurate Planning

1. **Tax Rate**: Look up your current federal tax bracket for accuracy
2. **Annual Return**: Historical stock market average is ~10%, bonds ~5%, consider 7% as middle ground
3. **Contributions**: Check your latest pay stub for actual 401k and match amounts
4. **Inflation**: For long-term planning, actual returns may vary significantly
5. **Raise Percentage**: Use conservative estimates for long-term planning

## Examples

### Pension Plans

Many government and public sector employees have defined benefit pension plans. Here are common examples:

**Example 1: Government Employee (PERS-style)**
- Pension Percentage: 2.5% per year of service
- Vesting Requirement: 5 years
- Current Years of Service: 8 years
- Final Salary at Retirement: $75,000
- **Annual Pension Income: $75,000 × (2.5% × 13 years) = $24,375/year**

**Example 2: Military Retirement**
- Pension Percentage: 2.5% per year of service
- Vesting Requirement: 20 years
- Current Years of Service: 5 years
- Final Salary at Retirement: $85,000
- **Annual Pension Income: $85,000 × (2.5% × 25 years) = $53,125/year** (at 25 years service)

### Conservative Planning
- Annual Return: 5%
- Raise Percentage: 2%
- Contribution: 10%
- Match: 3%

### Moderate Planning
- Annual Return: 7%
- Raise Percentage: 3%
- Contribution: 15%
- Match: 4%

### Aggressive Planning
- Annual Return: 9%
- Raise Percentage: 4%
- Contribution: 20%
- Match: 5%
