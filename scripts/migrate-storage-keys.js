/**
 * LocalStorage Key Migration Script
 * Migrates from inconsistent key naming to standardized format
 *
 * Usage:
 *   Include this script in index.html before other scripts
 *   Migration runs automatically on page load
 */

class StorageKeyMigration {
  constructor() {
    this.migrationVersion = '1.0.0';
    this.migrationKey = 'lifeos_migration_status';
    this.backupKey = 'lifeos_migration_backup';

    // Migration map: old key -> new key
    this.keyMappings = {
      // ToDo List
      'myEnhancedTodos': 'lifeos_todo_tasks',

      // Habits
      'lifeos-habits': 'lifeos_habits_list',

      // Goals
      'lifeos-goals': 'lifeos_goals_list',

      // Fitness
      'fitnessGoals': 'lifeos_fitness_goals',
      'fitness_workouts': 'lifeos_fitness_workouts',

      // Finance
      'finance_transactions': 'lifeos_finance_transactions',
      'finance_budgets': 'lifeos_finance_budgets',

      // Journal
      'lifeos-journal': 'lifeos_journal_entries',

      // Poetry
      'lifeos_poems': 'lifeos_poetry_collection',
    };
  }

  /**
   * Check if migration has already been completed
   */
  isMigrated() {
    const status = localStorage.getItem(this.migrationKey);
    if (!status) return false;

    try {
      const parsed = JSON.parse(status);
      return parsed.version === this.migrationVersion && parsed.completed;
    } catch {
      return false;
    }
  }

  /**
   * Create backup of all data before migration
   */
  createBackup() {
    const backup = {};
    const timestamp = new Date().toISOString();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith('lifeos_migration_')) {
        backup[key] = localStorage.getItem(key);
      }
    }

    const backupData = {
      timestamp,
      version: this.migrationVersion,
      data: backup,
    };

    localStorage.setItem(this.backupKey, JSON.stringify(backupData));
    console.log('✅ Backup created successfully');
    return backupData;
  }

  /**
   * Migrate a single key
   */
  migrateKey(oldKey, newKey) {
    try {
      const value = localStorage.getItem(oldKey);
      if (value === null) {
        console.warn(`⚠️ Old key "${oldKey}" not found, skipping`);
        return { success: true, skipped: true };
      }

      // Check if new key already exists
      const existing = localStorage.getItem(newKey);
      if (existing !== null) {
        console.warn(`⚠️ New key "${newKey}" already exists, keeping newer data`);

        // Compare timestamps if possible
        try {
          const oldData = JSON.parse(value);
          const newData = JSON.parse(existing);

          // If both have timestamps, keep the newer one
          if (oldData.timestamp && newData.timestamp) {
            if (new Date(oldData.timestamp) > new Date(newData.timestamp)) {
              localStorage.setItem(newKey, value);
              console.log(`📝 Updated "${newKey}" with newer data from "${oldKey}"`);
            }
          }
        } catch {
          // Not JSON or no timestamps, keep existing
        }

        return { success: true, existed: true };
      }

      // Copy old data to new key
      localStorage.setItem(newKey, value);
      console.log(`✅ Migrated "${oldKey}" → "${newKey}"`);

      return { success: true, migrated: true };

    } catch (error) {
      console.error(`❌ Failed to migrate "${oldKey}":`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform the migration
   */
  async migrate(options = {}) {
    const {
      createBackup = true,
      removeOldKeys = false,
      dryRun = false,
    } = options;

    console.log('🚀 Starting storage key migration...');
    console.log(`Version: ${this.migrationVersion}`);
    console.log(`Dry run: ${dryRun}`);

    if (dryRun) {
      console.log('📋 DRY RUN MODE - No changes will be made');
    }

    // Check if already migrated
    if (this.isMigrated()) {
      console.log('✅ Migration already completed');
      return { alreadyMigrated: true };
    }

    const results = {
      success: true,
      migrated: 0,
      skipped: 0,
      existed: 0,
      errors: [],
      backup: null,
    };

    try {
      // Create backup
      if (createBackup && !dryRun) {
        results.backup = this.createBackup();
      }

      // Migrate each key
      for (const [oldKey, newKey] of Object.entries(this.keyMappings)) {
        if (dryRun) {
          const exists = localStorage.getItem(oldKey) !== null;
          console.log(`📋 Would migrate: "${oldKey}" → "${newKey}" (${exists ? 'exists' : 'not found'})`);
          continue;
        }

        const result = this.migrateKey(oldKey, newKey);

        if (result.success) {
          if (result.migrated) results.migrated++;
          if (result.skipped) results.skipped++;
          if (result.existed) results.existed++;
        } else {
          results.errors.push({ oldKey, newKey, error: result.error });
        }
      }

      // Remove old keys if requested
      if (removeOldKeys && !dryRun) {
        console.log('🗑️ Removing old keys...');
        for (const oldKey of Object.keys(this.keyMappings)) {
          localStorage.removeItem(oldKey);
        }
        console.log('✅ Old keys removed');
      }

      // Mark migration as complete
      if (!dryRun) {
        const status = {
          version: this.migrationVersion,
          completed: true,
          timestamp: new Date().toISOString(),
          results,
        };
        localStorage.setItem(this.migrationKey, JSON.stringify(status));
      }

      // Log results
      console.log('\n📊 Migration Results:');
      console.log(`   Migrated: ${results.migrated}`);
      console.log(`   Skipped: ${results.skipped}`);
      console.log(`   Existed: ${results.existed}`);
      console.log(`   Errors: ${results.errors.length}`);

      if (results.errors.length > 0) {
        console.error('\n❌ Migration errors:');
        results.errors.forEach(err => {
          console.error(`   ${err.oldKey}: ${err.error}`);
        });
        results.success = false;
      } else {
        console.log('\n✅ Migration completed successfully!');
      }

      return results;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      results.success = false;
      results.errors.push({ error: error.message });
      return results;
    }
  }

  /**
   * Rollback migration using backup
   */
  async rollback() {
    console.log('⏮️ Rolling back migration...');

    try {
      const backupData = localStorage.getItem(this.backupKey);
      if (!backupData) {
        throw new Error('No backup found');
      }

      const backup = JSON.parse(backupData);

      // Restore all backed up keys
      for (const [key, value] of Object.entries(backup.data)) {
        localStorage.setItem(key, value);
      }

      // Remove migration status
      localStorage.removeItem(this.migrationKey);

      console.log('✅ Rollback completed successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get migration status
   */
  getStatus() {
    const statusStr = localStorage.getItem(this.migrationKey);
    if (!statusStr) return null;

    try {
      return JSON.parse(statusStr);
    } catch {
      return null;
    }
  }

  /**
   * Clean up backup after successful migration
   */
  cleanupBackup() {
    localStorage.removeItem(this.backupKey);
    console.log('✅ Backup cleaned up');
  }
}

// Auto-run migration on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    const migration = new StorageKeyMigration();

    // Run migration automatically if not completed
    if (!migration.isMigrated()) {
      await migration.migrate({
        createBackup: true,
        removeOldKeys: false, // Keep old keys for 30 days as backup
        dryRun: false,
      });

      // Optional: Show user-friendly notification
      const results = migration.getStatus();
      if (results && results.completed) {
        // Could show a toast notification here
        console.log('💾 Your data has been migrated to the new format');
      }
    }
  });

  // Expose to global scope for manual operations
  window.StorageKeyMigration = StorageKeyMigration;
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageKeyMigration;
}
