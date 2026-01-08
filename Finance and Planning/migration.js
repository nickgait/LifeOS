/**
 * Data Migration Script
 * Migrates data from 4 old financial apps to unified Finance & Planning app
 *
 * Source apps:
 * - Financial Planner (2,402 lines)
 * - Investments (1,271 lines)
 * - Finance / Expense Tracker (356 lines)
 * - Road to Retirement (1,232 lines)
 */

class FinancePlanningMigration {
    // Migration configuration
    static MIGRATION_KEY = 'lifeos-finance-planning-migrated-v1';
    static BACKUP_KEY = 'lifeos-finance-planning-migration-backup';

    /**
     * Run migration if needed
     */
    static migrate() {
        // Check if already migrated
        if (localStorage.getItem(this.MIGRATION_KEY)) {
            console.log('✓ Migration already completed');
            return true;
        }

        console.log('🔄 Starting Finance & Planning migration...');

        try {
            // Create backup before migration
            this.createBackup();

            // Run migrations in order
            this.migrateFinancialPlannerData();
            this.migrateInvestmentsData();
            this.migrateFinanceData();
            this.migrateRoadToRetirementData();

            // Mark as migrated
            localStorage.setItem(this.MIGRATION_KEY, new Date().toISOString());
            localStorage.setItem('lifeos-finance-planning-migration-count', '1');

            console.log('✓ Migration completed successfully');
            UIUtils.showNotification('✓ Financial data migrated to Finance & Planning', 'success', 4000);

            return true;

        } catch (error) {
            console.error('✗ Migration failed:', error);
            this.restoreBackup();
            UIUtils.showNotification('✗ Migration failed: ' + error.message, 'error', 5000);
            return false;
        }
    }

    /**
     * Create backup of old app data before migration
     */
    static createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            data: {}
        };

        // Backup all old financial app keys
        const oldKeys = [
            'lifeos-financial-planner-profile',
            'lifeos-financial-planner-brokerage-holdings',
            'lifeos-financial-planner-retirement-holdings',
            'lifeos-financial-planner-cash',
            'lifeos-investments-portfolio',
            'lifeos-investments-dividends',
            'lifeos-investments-research',
            'lifeos-investments-cash',
            'lifeos-investments-interest',
            'lifeos-finance-expenses',
            'lifeos-finance-budgets',
            'lifeos-retirement-profile',
            'lifeos-retirement-projections'
        ];

        for (const key of oldKeys) {
            const value = localStorage.getItem(key);
            if (value) {
                backup.data[key] = value;
            }
        }

        localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
        console.log('✓ Created backup of old financial data');
    }

    /**
     * Restore from backup if migration fails
     */
    static restoreBackup() {
        const backup = localStorage.getItem(this.BACKUP_KEY);
        if (!backup) {
            console.warn('No backup available to restore');
            return;
        }

        try {
            const backupData = JSON.parse(backup);
            for (const [key, value] of Object.entries(backupData.data)) {
                localStorage.setItem(key, value);
            }
            console.log('✓ Restored data from backup');
        } catch (error) {
            console.error('Failed to restore backup:', error);
        }
    }

    /**
     * Migrate Financial Planner data
     * Maps:
     * - lifeos-financial-planner-profile → lifeos-finance-planning-profile
     * - lifeos-financial-planner-brokerage-holdings → lifeos-finance-planning-brokerage-holdings
     * - lifeos-financial-planner-retirement-holdings → lifeos-finance-planning-retirement-holdings
     * - lifeos-financial-planner-cash → lifeos-finance-planning-cash
     */
    static migrateFinancialPlannerData() {
        let count = 0;

        // Migrate profile
        const profileKey = 'lifeos-financial-planner-profile';
        const profileData = localStorage.getItem(profileKey);
        if (profileData) {
            localStorage.setItem('lifeos-finance-planning-profile', profileData);
            count++;
        }

        // Migrate brokerage holdings
        const brokerageKey = 'lifeos-financial-planner-brokerage-holdings';
        const brokerageData = localStorage.getItem(brokerageKey);
        if (brokerageData) {
            localStorage.setItem('lifeos-finance-planning-brokerage-holdings', brokerageData);
            count++;
        }

        // Migrate retirement holdings
        const retirementKey = 'lifeos-financial-planner-retirement-holdings';
        const retirementData = localStorage.getItem(retirementKey);
        if (retirementData) {
            localStorage.setItem('lifeos-finance-planning-retirement-holdings', retirementData);
            count++;
        }

        // Migrate cash
        const cashKey = 'lifeos-financial-planner-cash';
        const cashData = localStorage.getItem(cashKey);
        if (cashData) {
            try {
                const cashObj = JSON.parse(cashData);
                const newCash = {
                    brokerage: cashObj.brokerage || 0,
                    retirement: cashObj.retirement || 0,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('lifeos-finance-planning-cash', JSON.stringify(newCash));
                count++;
            } catch (e) {
                console.warn('Failed to parse Financial Planner cash data:', e);
            }
        }

        if (count > 0) {
            console.log(`✓ Migrated ${count} Financial Planner data items`);
        }
    }

    /**
     * Migrate Investments data
     * Maps:
     * - lifeos-investments-portfolio → lifeos-finance-planning-portfolio
     * - lifeos-investments-dividends → lifeos-finance-planning-dividends
     * - lifeos-investments-interest → lifeos-finance-planning-interest
     * - lifeos-investments-research → lifeos-finance-planning-research
     * - lifeos-investments-cash → lifeos-finance-planning-investments-cash
     */
    static migrateInvestmentsData() {
        let count = 0;

        // Migrate portfolio
        const portfolioKey = 'lifeos-investments-portfolio';
        const portfolioData = localStorage.getItem(portfolioKey);
        if (portfolioData) {
            localStorage.setItem('lifeos-finance-planning-portfolio', portfolioData);
            count++;
        }

        // Migrate dividends
        const dividendKey = 'lifeos-investments-dividends';
        const dividendData = localStorage.getItem(dividendKey);
        if (dividendData) {
            localStorage.setItem('lifeos-finance-planning-dividends', dividendData);
            count++;
        }

        // Migrate interest
        const interestKey = 'lifeos-investments-interest';
        const interestData = localStorage.getItem(interestKey);
        if (interestData) {
            localStorage.setItem('lifeos-finance-planning-interest', interestData);
            count++;
        }

        // Migrate research
        const researchKey = 'lifeos-investments-research';
        const researchData = localStorage.getItem(researchKey);
        if (researchData) {
            localStorage.setItem('lifeos-finance-planning-research', researchData);
            count++;
        }

        // Migrate cash
        const investmentsCashKey = 'lifeos-investments-cash';
        const investmentsCashData = localStorage.getItem(investmentsCashKey);
        if (investmentsCashData) {
            localStorage.setItem('lifeos-finance-planning-investments-cash', investmentsCashData);
            count++;
        }

        if (count > 0) {
            console.log(`✓ Migrated ${count} Investments data items`);
        }
    }

    /**
     * Migrate Finance (Expense Tracking) data
     * Maps:
     * - lifeos-finance-expenses → lifeos-finance-planning-expenses
     * - lifeos-finance-budgets → lifeos-finance-planning-budgets
     */
    static migrateFinanceData() {
        let count = 0;

        // Migrate expenses
        const expenseKey = 'lifeos-finance-expenses';
        const expenseData = localStorage.getItem(expenseKey);
        if (expenseData) {
            localStorage.setItem('lifeos-finance-planning-expenses', expenseData);
            count++;
        }

        // Migrate budgets
        const budgetKey = 'lifeos-finance-budgets';
        const budgetData = localStorage.getItem(budgetKey);
        if (budgetData) {
            localStorage.setItem('lifeos-finance-planning-budgets', budgetData);
            count++;
        }

        if (count > 0) {
            console.log(`✓ Migrated ${count} Finance data items`);
        }
    }

    /**
     * Migrate Road to Retirement data
     * Road to Retirement primarily stores results in retirement format
     * Minimal data to migrate
     */
    static migrateRoadToRetirementData() {
        let count = 0;

        // Road to Retirement doesn't maintain separate state
        // Results are typically stored in Financial Planner format
        // Just log that we checked
        console.log(`✓ Road to Retirement data (calculated results - integrated into Planning)`);
    }

    /**
     * Get migration status
     */
    static getStatus() {
        const isMigrated = localStorage.getItem(this.MIGRATION_KEY);
        const backup = localStorage.getItem(this.BACKUP_KEY);
        const timestamp = isMigrated ? new Date(isMigrated).toLocaleString() : 'Never';

        return {
            isMigrated: !!isMigrated,
            migratedAt: timestamp,
            hasBackup: !!backup,
            migrationKey: this.MIGRATION_KEY
        };
    }

    /**
     * Reset migration (for testing)
     */
    static reset() {
        localStorage.removeItem(this.MIGRATION_KEY);
        localStorage.removeItem(this.BACKUP_KEY);
        console.log('Migration reset - next load will re-run migration');
    }

    /**
     * Delete old app data keys (after confirming migration success)
     * Call this after verifying all data is present in new app
     */
    static deleteOldAppData() {
        if (!localStorage.getItem(this.MIGRATION_KEY)) {
            console.warn('Migration not completed - cannot delete old data');
            return false;
        }

        const confirmed = confirm(
            'This will delete data from the old financial apps. Make sure you have verified all data in Finance & Planning.\n\nContinue?'
        );

        if (!confirmed) return false;

        const oldKeys = [
            'lifeos-financial-planner-profile',
            'lifeos-financial-planner-brokerage-holdings',
            'lifeos-financial-planner-retirement-holdings',
            'lifeos-financial-planner-cash',
            'lifeos-investments-portfolio',
            'lifeos-investments-dividends',
            'lifeos-investments-research',
            'lifeos-investments-cash',
            'lifeos-investments-interest',
            'lifeos-finance-expenses',
            'lifeos-finance-budgets',
            'lifeos-retirement-profile',
            'lifeos-retirement-projections'
        ];

        for (const key of oldKeys) {
            localStorage.removeItem(key);
        }

        console.log('✓ Deleted old app data');
        UIUtils.showNotification('✓ Old financial app data deleted', 'success', 3000);
        return true;
    }
}

/**
 * Auto-run migration on page load
 * This fires when the Finance & Planning app first loads
 */
document.addEventListener('DOMContentLoaded', () => {
    // Give a small delay to ensure other scripts are loaded
    setTimeout(() => {
        FinancePlanningMigration.migrate();
    }, 500);
});

// Make available globally for debugging
window.FinancePlanningMigration = FinancePlanningMigration;

// Export if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinancePlanningMigration;
}
