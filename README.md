# LifeOS - Your Personal Life Operating System

![LifeOS](https://img.shields.io/badge/version-1.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-green)
![PWA](https://img.shields.io/badge/PWA-Enabled-purple)
![License](https://img.shields.io/badge/license-MIT-orange)

**LifeOS** is a comprehensive personal life management system built as a Progressive Web App (PWA). It provides a modular, integrated platform for managing different aspects of your personal productivity and life organization.

## ✨ Features

### 🎯 Core Modules

- **📝 To-Do List** - Priority-weighted task management with smart completion tracking
- **💪 Fitness Tracker** - Goal-based workout tracking with progress visualization
- **💰 Finance Manager** - Budget tracking, expense management, and financial insights
- **📊 Investment Dashboard** - Stock analysis, portfolio tracking, and market data
- **🔄 Habit Tracker** - Daily habit formation with streak tracking
- **🎯 Goal Setting** - Milestone-based goal tracking with progress analytics
- **📔 Daily Journal** - Personal reflection with mood tracking
- **🖋️ Poetry Collection** - Creative writing and poetry management

### 🚀 Advanced Features

- **📱 Progressive Web App** - Install as native app on any device
- **💾 Data Management** - Export, import, and backup your data
- **📈 Dashboard Widgets** - Live metrics from all modules at a glance
- **🎨 Theme Customization** - 7 preset themes + custom gradient builder
- **🔍 Global Search** - Search across all modules instantly
- **📊 Progress Charts** - Visualize your progress with Chart.js
- **⚡ Quick Actions** - Fast access to common tasks
- **🌙 Dark Mode** - Eye-friendly theme for night usage
- **📴 Offline Support** - Works without internet connection
- **🔒 Data Privacy** - All data stored locally on your device

## 🛠️ Tech Stack

- **Frontend**: Vanilla TypeScript, HTML5, CSS3
- **Build Tool**: Vite
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Charts**: Chart.js
- **PWA**: Service Worker with caching strategies
- **Storage**: LocalStorage with encryption support
- **Styling**: Custom CSS with modern features (Grid, Flexbox, CSS Variables)

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd LifeOS

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Build for Production

```bash
# Type check
npm run type-check

# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## 📁 Project Structure

```
LifeOS/
├── shared/                    # Shared utilities and components
│   ├── storage-utils.js      # LocalStorage abstraction
│   ├── data-manager.js       # Export/import/backup system
│   ├── dashboard-widgets.js  # Dashboard widget system
│   ├── theme-manager.js      # Theme customization
│   ├── error-handler.js      # Global error handling
│   └── ...
├── ToDoList/                 # Task management module
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── Fitness/                  # Fitness tracking module
├── Finance/                  # Budget & expense module
├── Investments/              # Stock analysis module
├── Habits/                   # Habit tracking module
├── Goals/                    # Goal setting module
├── Journal/                  # Daily journal module
├── Poetry/                   # Poetry collection module
├── types/                    # TypeScript type definitions
│   └── index.ts
├── tests/                    # Test files
│   ├── setup.ts
│   ├── shared/               # Unit tests
│   └── e2e/                  # End-to-end tests
├── index.html                # Main hub/launcher
├── manifest.json             # PWA manifest
├── sw.js                     # Service worker
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── playwright.config.ts      # Playwright configuration
└── package.json              # Dependencies and scripts
```

## 🎨 Module Architecture

Each module follows a consistent pattern:

- **Independent Operation**: Modules work standalone
- **Shared Design**: Common gradient theme (#667eea → #764ba2)
- **LocalStorage**: Module-specific data persistence
- **Responsive**: Mobile-first design
- **Accessible**: ARIA labels and keyboard navigation

### Data Flow

```
User Input → Module Logic → StorageUtils → LocalStorage
                ↓
          Dashboard Widgets ← Data Manager → Export/Backup
```

## 🔑 Key Configuration Files

### TypeScript Configuration (`tsconfig.json`)

Strict type checking enabled for maximum type safety:
- `strict: true`
- `noImplicitAny: true`
- Path aliases for cleaner imports

### Vite Configuration (`vite.config.ts`)

- Multi-page build configuration
- Code splitting for optimal loading
- Asset optimization and minification
- Development server with HMR

### ESLint Configuration (`.eslintrc.json`)

- TypeScript-aware linting
- Prettier integration
- Recommended rules for code quality

## 📊 Performance

### Before Optimizations
- Initial Load: ~1.3s (with artificial delays)
- Module Switch: 300ms (artificial delay)

### After Optimizations
- Initial Load: ~300ms ⚡ **70% faster**
- Module Switch: Instant ⚡ **100% faster**
- Build Size: < 500KB (gzipped)

## 🔐 Security & Privacy

- **Local-First**: All data stored on your device
- **No Tracking**: Zero analytics or tracking
- **Encryption Ready**: Support for data encryption
- **Export Security**: Password-protected backups available

## 🌐 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 PWA Features

- **Installable**: Add to home screen
- **Offline**: Works without internet
- **Fast**: Cached assets for instant loading
- **Responsive**: Adapts to any screen size
- **App-like**: Native app experience

## 🔧 Development

### Code Style

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Adding a New Module

1. Create module directory: `mkdir NewModule`
2. Add `index.html`, `script.js`, `styles.css`
3. Follow existing module patterns
4. Update `script.js` module registry
5. Add to navigation in `index.html`
6. Update service worker cache list

### Data Storage Best Practices

- Use `StorageUtils` for all localStorage operations
- Prefix keys with `lifeos_modulename_`
- Validate data before storing
- Handle storage quota errors gracefully

## 🐛 Known Issues & Limitations

- LocalStorage has ~5-10MB limit per domain
- No real-time sync across devices (local-only)
- Stocks API requires API key (free tier available)
- Service worker requires HTTPS in production

## 🗺️ Roadmap

### v1.1 (Q1 2026)
- [ ] Cloud sync with Firebase/Supabase
- [ ] Notification system for reminders
- [ ] Calendar integration
- [ ] Global keyboard shortcuts

### v1.2 (Q2 2026)
- [ ] Collaboration features
- [ ] Advanced analytics dashboard
- [ ] Mobile native app (Capacitor)
- [ ] Data encryption

### v2.0 (Q3 2026)
- [ ] AI-powered insights
- [ ] Voice commands
- [ ] Widget system for customization
- [ ] Plugin architecture

## 📖 Documentation

- [CLAUDE.md](CLAUDE.md) - Project architecture and guidelines
- [IMPROVEMENTS_SUMMARY.md](IMPROVEMENTS_SUMMARY.md) - Detailed improvement analysis
- [tasks.md](tasks.md) - Development task tracking
- Module-specific CLAUDE.md files in each module directory

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting
6. Commit with conventional commits format
7. Push to your fork
8. Open a Pull Request

### Commit Convention

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting)
refactor: Code refactoring
test: Adding or updating tests
chore: Maintenance tasks
```

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Chart.js for data visualization
- Service Worker API for offline functionality
- The open-source community

## 📧 Support

For questions, issues, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review [IMPROVEMENTS_SUMMARY.md](IMPROVEMENTS_SUMMARY.md) for known issues

## 🎯 Project Goals

1. **Privacy-First**: Your data stays on your device
2. **Simplicity**: No complex setup or configuration
3. **Modularity**: Use only the modules you need
4. **Extensibility**: Easy to add new modules
5. **Performance**: Fast, responsive, and efficient
6. **Accessibility**: Usable by everyone

---

**Built with ❤️ for better life organization**

*Last updated: October 10, 2025*
