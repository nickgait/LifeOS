# LifeOS API Documentation

Complete reference for shared utilities and module APIs.

## Table of Contents

- [StorageUtils](#storageutils)
- [DataManager](#datamanager)
- [DashboardWidgets](#dashboardwidgets)
- [ThemeManager](#thememanager)
- [ErrorHandler](#errorhandler)
- [ServiceWorkerManager](#serviceworkermanager)
- [Types](#types)

---

## StorageUtils

Abstraction layer for localStorage operations with type safety and error handling.

### Methods

#### `set(key, value)`

Store a value in localStorage.

```javascript
StorageUtils.set('lifeos_todo_tasks', tasks);
```

**Parameters:**
- `key` (string): Storage key
- `value` (any): Value to store (will be JSON stringified)

**Returns:** void

**Throws:** `StorageError` if storage quota exceeded

---

#### `get(key, defaultValue?)`

Retrieve a value from localStorage.

```javascript
const tasks = StorageUtils.get('lifeos_todo_tasks', []);
```

**Parameters:**
- `key` (string): Storage key
- `defaultValue` (any, optional): Value to return if key doesn't exist

**Returns:** Stored value or defaultValue

---

#### `remove(key)`

Remove a key from localStorage.

```javascript
StorageUtils.remove('lifeos_todo_tasks');
```

**Parameters:**
- `key` (string): Storage key to remove

**Returns:** void

---

#### `clear()`

Clear all localStorage data.

```javascript
StorageUtils.clear();
```

**Returns:** void

**⚠️ Warning:** This removes ALL data, including from other apps!

---

#### `getKeysWithPrefix(prefix)`

Get all keys that start with a specific prefix.

```javascript
const todoKeys = StorageUtils.getKeysWithPrefix('lifeos_todo_');
// Returns: ['lifeos_todo_tasks', 'lifeos_todo_settings', ...]
```

**Parameters:**
- `prefix` (string): Prefix to search for

**Returns:** string[] - Array of matching keys

---

#### `formatBytes(bytes)`

Format byte count to human-readable string.

```javascript
StorageUtils.formatBytes(1536);
// Returns: "1.5 KB"
```

**Parameters:**
- `bytes` (number): Number of bytes

**Returns:** string - Formatted size (B, KB, MB, GB)

---

#### `getStorageStats()`

Get storage usage statistics.

```javascript
const stats = StorageUtils.getStorageStats();
// Returns: { used: 123456, available: 4876544, total: 5000000, percentUsed: 2.47 }
```

**Returns:** StorageStats object

```typescript
interface StorageStats {
  used: number;        // Bytes used
  available: number;   // Bytes available
  total: number;       // Total quota
  percentUsed: number; // Usage percentage
}
```

---

## DataManager

Manages data export, import, backup, and restore functionality.

### Methods

#### `exportAllData(format, selectedModules?)`

Export data in specified format.

```javascript
await DataManager.exportAllData('json');
await DataManager.exportAllData('csv', ['todo', 'habits']);
```

**Parameters:**
- `format` ('json' | 'csv' | 'txt'): Export format
- `selectedModules` (string[], optional): Modules to export (defaults to all)

**Returns:** Promise<string> - Exported data string

---

#### `importData(file, overwrite?)`

Import data from file.

```javascript
const result = await DataManager.importData(file, true);
console.log(`Success: ${result.success.length}, Errors: ${result.errors.length}`);
```

**Parameters:**
- `file` (File): File to import
- `overwrite` (boolean, optional): Whether to overwrite existing data (default: false)

**Returns:** Promise<ImportResult>

```typescript
interface ImportResult {
  success: string[];  // Successfully imported keys
  errors: string[];   // Error messages
  skipped: string[];  // Skipped keys (when overwrite=false)
}
```

---

#### `createAutoBackup()`

Create automatic backup in localStorage.

```javascript
const backup = DataManager.createAutoBackup();
```

**Returns:** ExportData object

**Note:** Only keeps last 5 backups automatically

---

#### `getAvailableBackups()`

Get list of available backups.

```javascript
const backups = DataManager.getAvailableBackups();
backups.forEach(backup => {
  console.log(`${backup.date}: ${backup.size} bytes`);
});
```

**Returns:** Backup[]

```typescript
interface Backup {
  key: string;
  timestamp: number;
  date: string;
  size: number;
}
```

---

#### `restoreFromBackup(backupKey)`

Restore data from backup.

```javascript
await DataManager.restoreFromBackup('lifeos_backup_1696012345678');
```

**Parameters:**
- `backupKey` (string): Backup key to restore

**Returns:** Promise<ImportResult>

**⚠️ Warning:** This overwrites current data

---

## DashboardWidgets

Manages dashboard widgets displaying module metrics.

### Methods

#### `init()`

Initialize dashboard widgets.

```javascript
DashboardWidgets.init();
```

---

#### `renderWidgets(containerId)`

Render all widgets into container.

```javascript
DashboardWidgets.renderWidgets('dashboard-container');
```

**Parameters:**
- `containerId` (string): Container element ID

---

#### `addWidgetClickHandlers()`

Attach click handlers to widgets for navigation.

```javascript
DashboardWidgets.addWidgetClickHandlers();
```

---

### Widget Data Structure

Each widget returns:

```typescript
interface WidgetData {
  primary: string | number;      // Main metric
  primaryLabel: string;          // Main metric label
  secondary: string | number;    // Secondary metric
  secondaryLabel: string;        // Secondary metric label
  accent: string;                // Accent text
  trend: 'up' | 'down' | 'stable'; // Trend indicator
}
```

---

## ThemeManager

Manages application themes and customization.

### Methods

#### `addThemeButton()`

Add theme toggle button to UI.

```javascript
ThemeManager.addThemeButton();
```

---

#### `applyTheme(theme)`

Apply a theme to the application.

```javascript
ThemeManager.applyTheme({
  name: 'Ocean',
  colors: {
    primary: '#0077be',
    secondary: '#00b4d8'
  },
  gradient: 'linear-gradient(135deg, #0077be 0%, #00b4d8 100%)'
});
```

**Parameters:**
- `theme` (Theme): Theme object

```typescript
interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
  };
  gradient: string;
}
```

---

#### `getPresetThemes()`

Get available preset themes.

```javascript
const themes = ThemeManager.getPresetThemes();
// Returns: Array of 7 preset themes
```

**Returns:** Theme[]

---

#### `createCustomTheme(colors)`

Create custom theme from colors.

```javascript
const customTheme = ThemeManager.createCustomTheme({
  primary: '#ff0000',
  secondary: '#0000ff'
});
```

**Parameters:**
- `colors` (ThemeColors): Primary and secondary colors

**Returns:** Theme

---

## ErrorHandler

Global error handling and reporting.

### Methods

#### `handleError(error, context?)`

Handle an error with optional context.

```javascript
try {
  // Some operation
} catch (error) {
  ErrorHandler.handleError(error, {
    module: 'todo',
    action: 'saveTask'
  });
}
```

**Parameters:**
- `error` (Error | string): Error to handle
- `context` (object, optional): Additional context

---

#### `init()`

Initialize global error handlers.

```javascript
ErrorHandler.init();
```

Sets up:
- Window error handler
- Unhandled promise rejection handler
- Console error override

---

## ServiceWorkerManager

Manages service worker registration and updates.

### Methods

#### `init()`

Initialize and register service worker.

```javascript
ServiceWorkerManager.init();
```

**Returns:** Promise<void>

---

#### `checkForUpdates()`

Check for service worker updates.

```javascript
await ServiceWorkerManager.checkForUpdates();
```

**Returns:** Promise<boolean> - true if update available

---

#### `skipWaiting()`

Skip waiting and activate new service worker.

```javascript
await ServiceWorkerManager.skipWaiting();
```

**Returns:** Promise<void>

---

## Types

All TypeScript type definitions are in `/types/index.ts`.

### Common Types

```typescript
// Module names
type ModuleName = 'todo' | 'fitness' | 'finance' | 'investments' |
                  'habits' | 'goals' | 'journal' | 'poetry';

// Priority levels
type Priority = 'low' | 'medium' | 'high';

// Goal status
type GoalStatus = 'active' | 'completed' | 'archived' | 'paused';

// Transaction types
type TransactionType = 'income' | 'expense';

// Mood ratings
type Mood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

// Trend direction
type TrendDirection = 'up' | 'down' | 'stable';
```

### Data Structures

See full type definitions in [types/index.ts](../types/index.ts) for:
- Task
- Habit
- Goal
- FitnessGoal
- Transaction
- JournalEntry
- Poem
- And more...

---

## Events

### Custom Events

```javascript
// Data refresh event
window.addEventListener('dataRefresh', () => {
  // Reload data
});

window.dispatchEvent(new CustomEvent('dataRefresh'));
```

```javascript
// Module change event
window.addEventListener('moduleChange', (event) => {
  console.log(`Changed from ${event.detail.from} to ${event.detail.to}`);
});

window.dispatchEvent(new CustomEvent('moduleChange', {
  detail: { from: 'todo', to: 'habits' }
}));
```

---

## Error Handling

### Custom Error Classes

```javascript
// General LifeOS error
throw new LifeOSError('Something went wrong', 'ERROR_CODE', 'todo');

// Storage error
throw new StorageError('Storage quota exceeded', 'QUOTA_EXCEEDED');

// Validation error
throw new DataValidationError('Invalid email', 'email');
```

---

## Best Practices

### 1. Always Use StorageUtils

```javascript
// ✅ Good
StorageUtils.set('lifeos_todo_tasks', tasks);

// ❌ Bad
localStorage.setItem('tasks', JSON.stringify(tasks));
```

### 2. Handle Errors

```javascript
// ✅ Good
try {
  await DataManager.importData(file);
} catch (error) {
  ErrorHandler.handleError(error, { module: 'import' });
}

// ❌ Bad
await DataManager.importData(file); // Unhandled errors
```

### 3. Use Type Definitions

```typescript
// ✅ Good
const task: Task = {
  id: '1',
  text: 'Buy groceries',
  completed: false,
  priority: 'high',
  createdAt: new Date().toISOString()
};

// ❌ Bad
const task = { text: 'Buy groceries' }; // Missing required fields
```

### 4. Standardize Keys

```javascript
// ✅ Good
const key: StorageKey = 'lifeos_todo_tasks';

// ❌ Bad
const key = 'myTasks';
```

---

## Migration Guide

See [DATA_KEY_STANDARDIZATION.md](DATA_KEY_STANDARDIZATION.md) for:
- Key naming conventions
- Migration process
- Rollback procedures

---

*Last updated: October 10, 2025*
