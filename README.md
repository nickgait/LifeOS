# LifeOS - Personal Life Operating System

A modular, integrated productivity suite built with vanilla HTML, CSS, and JavaScript. LifeOS provides a unified platform to manage fitness, goals, finances, and journaling with seamless data sharing across all apps.

## 🎯 Overview

LifeOS is designed to help you organize all aspects of your personal life in one place. Each app is fully modular, sharing a centralized data layer while maintaining its own specialized functionality.

### Features

- **📱 Modular Architecture** - Each app runs independently but shares data seamlessly
- **💾 Centralized Storage** - All data stored in localStorage with a unified namespace
- **📊 Cross-App Analytics** - View aggregate data from all apps on the main dashboard
- **🎨 Unified Theme** - Consistent purple/blue gradient design across all apps
- **📱 Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- **⚡ Real-time Sync** - Event-based system for instant data updates across apps
- **📤 Export/Import** - Backup and restore all your data

## 🚀 Quick Start

Open `index.html` in your browser to launch LifeOS. You'll see the main dashboard with access to all five apps.

## 📱 Apps

### 1. **Fitness Tracker** 🏃
Track your fitness journey and achieve your health goals.

**Features:**
- Create and track fitness goals with target dates
- Log various activities (push-ups, jogging, weight lifting, etc.)
- Badge system with achievement milestones
- Progress visualization with goal pacing
- Activity history with notes
- Dashboard with stats and recent activities

**Files:**
- `Fitness/index.html`
- `Fitness/script.js`
- `Fitness/styles.css`

---

### 2. **Goals Tracker** 🎯
Set and track personal, professional, and financial goals across multiple categories.

**Features:**
- Multi-category goal tracking (Health, Career, Personal, Financial, Education, Other)
- Set target dates and track progress
- Filter goals by category
- Mark goals as complete
- Dashboard with progress by category
- Goal statistics and insights

**Files:**
- `Goals/index.html`
- `Goals/script.js`
- `Goals/styles.css`

---

### 3. **Finance Tracker** 💰
Manage expenses and create budgets to take control of your spending.

**Features:**
- Log expenses with categories and descriptions
- 8 expense categories with icons
- Create monthly budgets with spending limits
- Visual progress indicators for budget status
- Monthly and all-time expense analytics
- Category-based spending breakdown
- Budget warnings when approaching limits

**Files:**
- `Finance/index.html`
- `Finance/script.js`
- `Finance/styles.css`

---

### 4. **Journal** 📔
Write daily entries, track your mood, and reflect on your personal journey.

**Features:**
- Daily journal entries with mood tracking (5 mood levels)
- Optional titles and tags for organization
- Search functionality across entries
- Word count statistics
- Mood pattern analytics and visualization
- Recent entries quick access
- Entry details view

**Files:**
- `Journal/index.html`
- `Journal/script.js`
- `Journal/styles.css`

---

### 5. **Investments** 📈
Track your investment portfolio, record dividends, and research stocks and ETFs.

**Features:**
- Portfolio tracking (stocks, ETFs, funds, bonds, crypto)
- Automatic gain/loss calculation
- Return percentage tracking
- Portfolio allocation visualization
- Dividend payment recording and history
- Investment research database with ratings
- Sector and type filtering
- Google search links for research

**Files:**
- `Investments/index.html`
- `Investments/script.js`
- `Investments/styles.css`
- `Investments/README.md` (Detailed guide)

---

## 🏗️ Architecture

### Directory Structure

```
LifeOS/
├── index.html                 # Main launcher & dashboard
├── shared/                    # Shared utilities
│   ├── storage-utils.js      # Centralized data storage
│   ├── data-manager.js       # Cross-app data coordination
│   ├── theme-manager.js      # Unified styling system
│   └── styles.css            # Shared CSS components
├── Fitness/                   # Fitness app
├── Goals/                     # Goals app
├── Finance/                   # Finance app
├── Journal/                   # Journal app
└── Investments/               # Investments app
```

### Data Flow

```
┌─────────────────────────────────────────────┐
│        LifeOS Main Launcher (index.html)   │
│         Dashboard & App Navigation          │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    ┌───▼──┐   ┌──▼───┐   ┌─▼────┐
    │Fitness│  │ Goals │  │Finance│  etc.
    └───┬──┘   └──┬───┘   └─┬────┘
        │         │         │
        └─────────┼─────────┘
                  │
        ┌─────────▼──────────┐
        │  StorageManager    │ (centralized storage with events)
        │   DataManager      │ (cross-app coordination)
        │  ThemeManager      │ (unified styling)
        └────────────────────┘
                  │
        ┌─────────▼──────────┐
        │  localStorage      │
        │  (namespaced)      │
        └────────────────────┘
```

### Core Modules

#### **storage-utils.js**
- `StorageManager.get(key)` - Retrieve data
- `StorageManager.set(key, value)` - Store data
- `StorageManager.onChange(key, callback)` - Listen for changes
- Namespaced localStorage with event broadcasting

#### **data-manager.js**
- `DataManager.init()` - Initialize all app data
- `DataManager.getDashboardStats()` - Get aggregate stats
- `DataManager.getRecentActivity()` - Get cross-app activity
- `DataManager.exportData()` - Export all data
- `DataManager.importData()` - Import data

#### **theme-manager.js**
- Unified color palette
- Button/card/input styling helpers
- CSS variables management
- Gradient definitions

## 💾 Data Storage

All data is stored in localStorage using namespaced keys:

```javascript
// Fitness
lifeos-fitness-goals
lifeos-fitness-activities
lifeos-fitness-badges

// Goals
lifeos-goals-all

// Finance
lifeos-finance-expenses
lifeos-finance-budgets
lifeos-finance-categories

// Journal
lifeos-journal-entries

// Metadata
lifeos-app-metadata
lifeos-app-launch-history
```

## 🎨 Design

- **Primary Color:** #667eea (Purple)
- **Secondary Color:** #764ba2 (Dark Purple)
- **Gradient:** linear-gradient(135deg, #667eea, #764ba2)
- **Font:** System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Max Width:** 1200px centered layout

## 📱 Responsive Design

All apps are fully responsive:
- **Desktop:** 2-column grid layouts
- **Tablet:** 1-2 column adaptive layouts
- **Mobile:** Single column, touch-friendly interfaces

## 🔄 Cross-App Integration

Apps can access data from other apps:

```javascript
// From any app, access:
const stats = DataManager.getDashboardStats();
const recent = DataManager.getRecentActivity(5);
const allGoals = DataManager.getAllActiveGoals();
```

Real-time sync via events:

```javascript
// Listen to any data changes
StorageManager.onChange('*', (data) => {
  // Handle updates
});
```

## 🚀 How to Use

### Opening an App
1. Open `index.html` in a web browser
2. Click on an app card to launch it
3. Or use the Quick Actions buttons

### Fitness App
1. Create fitness goals with targets and deadlines
2. Log activities as you complete them
3. Watch goals auto-complete when targets are met
4. Earn badges for milestones

### Goals App
1. Switch between categories using filters
2. Create goals across any category
3. Mark goals complete when finished
4. Track progress by category

### Finance App
1. Log expenses with categories
2. Create budgets for monthly limits
3. Watch budget progress with visual indicators
4. Review spending by category

### Journal App
1. Select your mood for the day
2. Write your entry
3. Add tags for organization
4. Search past entries by content or tags

## 📊 Dashboard

The main dashboard shows:
- Total active goals across all apps
- Total fitness activities logged
- Total expense transactions
- Total journal entries
- Recent activity feed from all apps
- Quick launch buttons for each app

## 🛠️ Development

Each app follows the same pattern:

```
AppName/
├── index.html      # HTML structure
├── script.js       # App logic
└── styles.css      # App-specific styles
```

To add a new app:
1. Create a new folder with the app name
2. Create `index.html`, `script.js`, `styles.css`
3. Import shared modules in HTML
4. Follow the existing class-based structure
5. Use StorageManager for data persistence

## 📝 Example: Adding a New Feature

```javascript
// In app script.js
class MyApp {
  constructor() {
    // Get data from shared storage
    this.data = StorageManager.get('myapp-data') || [];
  }

  saveData() {
    StorageManager.set('myapp-data', this.data);
  }

  init() {
    // Listen for changes from other apps
    StorageManager.onChange('fitness-*', () => {
      this.updateStats();
    });
  }
}
```

## 🔒 Privacy & Security

- All data stored locally in browser (localStorage)
- No data sent to servers
- No external API calls
- Data persists between sessions
- Browser developer tools can access/modify data

## ⚠️ Limitations

- Data limited to localStorage size (~5-10MB)
- Not synced across devices
- No real-time collaboration
- No encryption (data stored as plain text in localStorage)

## 🎓 Learning Resources

- **JavaScript:** Vanilla JS (no frameworks)
- **Storage:** localStorage API
- **Styling:** CSS Grid, Flexbox, CSS Variables
- **Architecture:** Event-driven modular design

## 📄 License

Feel free to use, modify, and distribute as needed.

## 🤝 Contributing

This is a personal project, but improvements are welcome! Some ideas:
- Add more app categories
- Enhance analytics and reporting
- Implement data backup/sync
- Add dark mode
- Add more badge types
- Create goal dependencies

---

**Made with ❤️ for personal productivity and self-improvement**
