# BaseApp Refactoring Guide

This document provides a guide for refactoring the remaining LifeOS apps to use the BaseApp class.

## Status

### ✅ Completed
- **Journal App** - Refactored and pushed to GitHub (commit: 0f74c4a)
  - Lines saved: 30 (380 → 350)
  - Eliminated: `init()`, `setupDefaultDate()`, `refresh()`, `formatDate()`
  - Now uses: `createItem()`, `findById()`, `deleteById()`, BaseApp utilities

- **Goals App** - Refactored and pushed to GitHub (commit: 9afb8d0)
  - Lines saved: 21 (320 → 299)
  - Eliminated: `init()`, `setupDefaultDates()`, `refresh()`, `getDaysRemaining()`
  - Now uses: `createItem()`, `findById()`, `deleteById()`, `daysBetween()`

- **Fitness App** - Refactored and pushed to GitHub (commit: e34f411)
  - Lines saved: 41 (463 → 422)
  - Eliminated: `init()`, `setupDefaultDates()`, `refresh()`
  - Now uses: `createItem()`, `deleteById()`, `daysBetween()`, `formatDate()`

- **Finance App** - Refactored and pushed to GitHub (commit: e34f411)
  - Lines saved: 35 (374 → 339)
  - Eliminated: `init()`, `setupDefaultDates()`, `refresh()`
  - Now uses: `createItem()`, `deleteById()`, `formatDate()`, `formatCurrency()`

- **TodoList App** - Refactored and pushed to GitHub (commit: e34f411)
  - Lines saved: 33 (453 → 420)
  - Eliminated: `init()`, `setupDefaultDates()`, `daysBetween()`
  - Now uses: `createItem()`, `findById()`, `deleteById()`, `daysBetween()`

### ⏳ Remaining Apps
- Investments (1,271 lines) - Complex, save for last
- Road to Retirement (791 lines) - Complex, save for last
- Financial Planner (1,648 lines) - Very complex, save for last

**Total savings so far:** 160 lines across 5 apps
**Estimated additional savings:** ~400-600 lines for complex apps

---

## Refactoring Pattern (Based on Journal)

### Step 1: Update Class Declaration

**Before:**
```javascript
class MyApp {
  constructor() {
    this.data = StorageManager.get('my-key') || [];
    this.init();
  }
}
```

**After:**
```javascript
class MyApp extends BaseApp {
  constructor() {
    super('my-key'); // BaseApp handles loading & init
    this.data = this.data; // Already loaded by BaseApp
    // Add app-specific properties here
  }
}
```

### Step 2: Remove Duplicate Methods

Delete these methods (BaseApp provides them):
- `init()` - BaseApp calls setupEventListeners(), setupDefaultDates(), updateDashboard()
- `setupDefaultDates()` - Use data attributes instead (see Step 5)
- `refresh()` - BaseApp provides this, but you can override if needed
- `formatDate()` - Use `this.formatDate()` from BaseApp
- `formatCurrency()` - Use `this.formatCurrency()` from BaseApp

### Step 3: Update Item Creation

**Before:**
```javascript
const item = {
  id: Date.now(),
  name: document.getElementById('name').value,
  createdAt: new Date().toISOString()
};
```

**After:**
```javascript
const item = this.createItem({
  name: document.getElementById('name').value
  // id and createdAt added automatically
});
```

### Step 4: Update Item Operations

**Before:**
```javascript
const item = this.items.find(i => i.id === id);
this.items = this.items.filter(i => i.id !== id);
StorageManager.set('key', this.items);
```

**After:**
```javascript
const item = this.findById(id);
this.deleteById(id); // Automatically saves
// Or use this.save() after manual changes
```

### Step 5: Update HTML Date Inputs

**Before:**
```html
<input type="date" id="my-date">
```

**After:**
```html
<!-- For today's date -->
<input type="date" id="my-date" data-default="today">

<!-- For 30 days from now -->
<input type="date" id="future-date" data-default-days="30">

<!-- For 90 days from now -->
<input type="date" id="goal-date" data-default-days="90">
```

BaseApp automatically sets these on init!

### Step 6: Add base-app.js to HTML

```html
<script src="../shared/storage-utils.js"></script>
<script src="../shared/theme-manager.js"></script>
<script src="../shared/data-manager.js"></script>
<script src="../shared/base-app.js"></script> <!-- ADD THIS -->
<script src="script.js"></script>
```

### Step 7: Override refresh() if Needed

If your app has custom refresh logic:

```javascript
refresh() {
  super.refresh(); // Call BaseApp's refresh first
  this.data = this.data; // Update any aliases
  this.renderCustomStuff(); // Your custom logic
}
```

---

## App-Specific Notes

### Goals App
- Has fitness goals sync (keep this in `init()` or move to `setupEventListeners()`)
- Has category filtering (keep as-is)
- Target date should be `data-default-days="90"`

### Fitness App
- Has multiple default dates (activity: today, goal: +30 days)
- Update both date inputs with appropriate data attributes
- Complex badge system (keep as-is)

### Finance App
- Has category filtering (similar to Goals)
- Date should be `data-default="today"`
- Keep budget warning logic

### TodoList App
- Has recurring tasks (complex, keep as-is)
- Has subtasks (keep as-is)
- Due date handling (may benefit from BaseApp's date utilities)

---

## Testing Checklist

After refactoring each app:

- [ ] App loads without errors
- [ ] Date inputs auto-populate correctly
- [ ] Creating new items works
- [ ] Editing items works
- [ ] Deleting items works
- [ ] Dashboard updates correctly
- [ ] Storage onChange events work
- [ ] Tab switching works
- [ ] Existing data loads properly

---

## Quick Reference: BaseApp Methods

### Provided by BaseApp (Don't Reimplement)

```javascript
// Initialization
constructor(storageKey)      // Pass your storage key
init()                       // Sets up listeners, dates, dashboard
setupDefaultDates()          // Auto-handles data-default attributes

// Data Management
save()                       // Saves this.data to storage
refresh()                    // Reloads this.data from storage
createItem(obj)              // Creates item with id & createdAt
findById(id)                 // Finds item by ID
deleteById(id)               // Deletes item and saves

// Utilities
formatDate(dateStr)          // Smart formatting (Today/Yesterday/Date)
formatCurrency(amount)       // USD formatting
daysBetween(date1, date2)    // Calculate days between dates
isPast(dateStr)              // Check if date is in past
isToday(dateStr)             // Check if date is today
```

### Must Implement in Your App

```javascript
setupEventListeners()        // Your form submissions, buttons, etc.
updateDashboard()            // Your stats and dashboard rendering
```

---

## Example: Goals App Refactor

**Before (56 lines of boilerplate):**
```javascript
class GoalsApp {
  constructor() {
    this.goals = StorageManager.get('goals-all') || [];
    this.categories = [...];
    this.selectedCategory = 'all';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDefaultDates();
    this.updateDashboard();
    StorageManager.onChange('goals-*', () => this.refresh());
    StorageManager.onChange('fitness-goals', () => {
      this.renderGoals();
      this.updateDashboard();
    });
  }

  setupDefaultDates() {
    const targetDate = document.getElementById('goal-target-date');
    if (targetDate) {
      targetDate.value = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  }

  refresh() {
    this.goals = StorageManager.get('goals-all') || [];
    this.updateDashboard();
  }

  // ... 250 more lines
}
```

**After (20 lines of boilerplate):**
```javascript
class GoalsApp extends BaseApp {
  constructor() {
    super('goals-all');
    this.goals = this.data;
    this.categories = [...];
    this.selectedCategory = 'all';

    // Fitness goals sync (app-specific)
    StorageManager.onChange('fitness-goals', () => {
      this.renderGoals();
      this.updateDashboard();
    });
  }

  setupEventListeners() {
    // Your event listeners here
  }

  refresh() {
    super.refresh();
    this.goals = this.data;
  }

  // ... 250 more lines (same app logic)
}
```

HTML change:
```html
<input type="date" id="goal-target-date" data-default-days="90">
```

**Lines saved:** ~36 lines

---

## Benefits Recap

1. **Less Code** - ~30-50 lines saved per app
2. **Consistency** - All apps initialize the same way
3. **Bug Fixes** - Fix date formatting once, all apps benefit
4. **Faster Development** - New apps start with 20 lines instead of 200
5. **Easier Testing** - Test BaseApp once thoroughly
6. **Better Readability** - Less boilerplate, more business logic visible

---

## Next Steps

1. Refactor Goals app (easiest remaining)
2. Refactor Fitness app
3. Refactor Finance app
4. Refactor TodoList app
5. Test all 5 refactored apps together
6. Commit and push
7. Consider Investments, Road to Retirement, Financial Planner (complex apps)

---

**Last Updated:** December 29, 2025
**Status:** 5 simple apps complete (Journal, Goals, Fitness, Finance, TodoList), 3 complex apps remaining
