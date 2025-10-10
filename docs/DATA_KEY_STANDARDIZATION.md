# Data Key Standardization Guide

## Current State (Before Standardization)

The application currently uses inconsistent localStorage key naming:

| Module | Current Keys | Convention |
|--------|-------------|------------|
| ToDo | `myEnhancedTodos` | camelCase |
| Habits | `lifeos-habits` | kebab-case with prefix |
| Goals | `lifeos-goals` | kebab-case with prefix |
| Fitness | `fitnessGoals` | camelCase |
| Finance | `finance_transactions`, `finance_budgets` | snake_case with prefix |
| Journal | `lifeos-journal` | kebab-case with prefix |
| Poetry | `lifeos_poems` | snake_case with prefix |

## New Standard (Target State)

All localStorage keys will follow this pattern:

```
lifeos_<module>_<datatype>
```

### Rules

1. **Prefix**: Always start with `lifeos_`
2. **Module Name**: Lowercase, no spaces (e.g., `todo`, `fitness`, `finance`)
3. **Data Type**: Lowercase, descriptive (e.g., `tasks`, `goals`, `transactions`)
4. **Separator**: Underscore (`_`)
5. **Case**: All lowercase (snake_case)

### Examples

```javascript
// ✅ Correct
'lifeos_todo_tasks'
'lifeos_fitness_goals'
'lifeos_finance_transactions'
'lifeos_habits_list'
'lifeos_journal_entries'

// ❌ Incorrect
'myEnhancedTodos'          // No prefix, wrong case
'lifeos-habits'            // Wrong separator
'fitnessGoals'             // No prefix, wrong case
'LIFEOS_TODO_TASKS'        // Wrong case
```

## Migration Map

| Old Key | New Key | Module |
|---------|---------|--------|
| `myEnhancedTodos` | `lifeos_todo_tasks` | ToDo |
| `lifeos-habits` | `lifeos_habits_list` | Habits |
| `lifeos-goals` | `lifeos_goals_list` | Goals |
| `fitnessGoals` | `lifeos_fitness_goals` | Fitness |
| `fitness_workouts` | `lifeos_fitness_workouts` | Fitness |
| `finance_transactions` | `lifeos_finance_transactions` | Finance |
| `finance_budgets` | `lifeos_finance_budgets` | Finance |
| `lifeos-journal` | `lifeos_journal_entries` | Journal |
| `lifeos_poems` | `lifeos_poetry_collection` | Poetry |

## Implementation Plan

### Phase 1: Create Migration Script ✅

Create `scripts/migrate-storage-keys.js` to:
1. Read all old keys
2. Copy data to new keys
3. Verify data integrity
4. Optionally remove old keys

### Phase 2: Update Code

Update all modules to use new keys:
- [ ] ToDoList
- [ ] Fitness
- [ ] Finance
- [ ] Habits
- [ ] Goals
- [ ] Journal
- [ ] Poetry

### Phase 3: Testing

- [ ] Test migration script
- [ ] Verify all data preserved
- [ ] Test each module independently
- [ ] Test data export/import

### Phase 4: Deployment

- [ ] Run migration on user's first visit
- [ ] Show migration success message
- [ ] Keep old keys for 30 days (backup)
- [ ] Remove old keys after grace period

## Migration Script Usage

```javascript
// Run migration
await migrateStorageKeys();

// Check migration status
const status = getMigrationStatus();

// Rollback if needed (within grace period)
await rollbackMigration();
```

## Benefits

1. **Consistency**: All keys follow same pattern
2. **Discoverability**: Easy to find all keys for a module
3. **Namespace**: Prevents conflicts with other apps
4. **Professionalism**: Clean, maintainable codebase
5. **Future-Proof**: Easy to add new modules

## TypeScript Types

```typescript
type ModuleName = 'todo' | 'fitness' | 'finance' | 'habits' |
                  'goals' | 'journal' | 'poetry' | 'investments';

type DataType = 'tasks' | 'goals' | 'transactions' | 'entries' |
                'collection' | 'list' | 'settings' | 'backups';

type StorageKey = `lifeos_${ModuleName}_${DataType}`;

// Example usage
const todoKey: StorageKey = 'lifeos_todo_tasks'; // ✅ Type-safe
const invalid: StorageKey = 'myTodos'; // ❌ Type error
```

## Verification Checklist

After migration, verify:
- [ ] All data accessible in modules
- [ ] Dashboard widgets show correct data
- [ ] Export functionality works
- [ ] Import functionality works
- [ ] No data loss
- [ ] Performance unchanged
- [ ] No console errors

---

*This document should be updated as migration progresses.*
